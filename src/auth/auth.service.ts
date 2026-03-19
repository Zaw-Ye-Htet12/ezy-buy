import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuthResponse, Tokens, UserResponse } from './types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

import { Role, User } from '@prisma/client';
import { z } from 'zod';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) { }

  private readonly uuidSchema = z.string().uuid('Invalid user ID format');
  private readonly tokenSchema = z.string().min(1, 'Token is required');
  private readonly emailSchema = z.string().email('Invalid email format');

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      role: registerDto.role || Role.customer,
      emailVerificationToken,
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, user.fullName, verificationToken);

    return {
      user: this.normalizeUser(user),
      tokens,
      message: 'Registration successful',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return {
      user: this.normalizeUser(user),
      tokens,
      message: 'Login successful',
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    this.uuidSchema.parse(userId);
    await this.usersService.updateUser(userId, {
      refreshTokenHash: null,
    } as any);
    return { message: 'Logout successful' };
  }

  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    this.uuidSchema.parse(userId);
    this.tokenSchema.parse(rt);
    const user: any = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash || !user.isActive) {
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await bcrypt.compare(rt, user.refreshTokenHash);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async getMe(userId: string): Promise<UserResponse> {
    this.uuidSchema.parse(userId);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.normalizeUser(user);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await this.usersService.updateUser(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    // Send reset email
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.usersService.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.usersService.updateUser(user.id, {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshTokenHash: null, // Invalidate all sessions on password change
    } as any);

    return { message: 'Password has been reset successfully.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    this.tokenSchema.parse(token);
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.usersService.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.usersService.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });

    return { message: 'Email verified successfully.' };
  }

  async updateProfile(userId: string, updateProfileDto: any): Promise<UserResponse> {
    this.uuidSchema.parse(userId);
    const user = await this.usersService.updateUser(userId, updateProfileDto);
    return this.normalizeUser(user);
  }

  async changePassword(userId: string, changePasswordDto: any): Promise<{ message: string }> {
    this.uuidSchema.parse(userId);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.usersService.updateUser(userId, {
      passwordHash: hashedPassword,
      refreshTokenHash: null,
    } as any);

    return { message: 'Password changed successfully.' };
  }

  private normalizeUser(user: User): UserResponse {
    const { passwordHash, refreshTokenHash, resetPasswordToken, resetPasswordExpires, emailVerificationToken, ...result } = user as any;
    return result;
  }

  async updateRtHash(userId: string, rt: string): Promise<void> {
    this.uuidSchema.parse(userId);
    this.tokenSchema.parse(rt);
    const hash = await bcrypt.hash(rt, 10);
    await this.usersService.updateUser(userId, {
      refreshTokenHash: hash,
    } as any);
  }

  async getTokens(userId: string, email: string, role: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET')!,
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN')! as any,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')! as any,
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
