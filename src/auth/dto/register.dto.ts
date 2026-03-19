import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { Role } from '@prisma/client';
import { Match } from '../../common/decorators/match.decorator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+ ]+$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsEnum(Role, { message: 'Invalid role' })
  @IsOptional()
  role?: Role;
}
