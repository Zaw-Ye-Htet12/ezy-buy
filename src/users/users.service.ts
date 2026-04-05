import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import { z } from 'zod';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/types/paginated-result';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  private readonly emailSchema = z.string().email('Invalid email format');
  private readonly uuidSchema = z.string().uuid('Invalid UUID format');
  private readonly tokenSchema = z.string().min(1, 'Token is required');

  async findByEmail(email: string): Promise<User | null> {
    this.emailSchema.parse(email);
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    this.uuidSchema.parse(id);

    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    this.emailSchema.parse(data.email);
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role || Role.customer,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    this.uuidSchema.parse(id);
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    this.tokenSchema.parse(token);
    return this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async deleteUser(id: string): Promise<User> {
    this.uuidSchema.parse(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    this.tokenSchema.parse(token);
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
  }

  async activateUser(id: string): Promise<User> {
    this.uuidSchema.parse(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivateUser(id: string): Promise<User> {
    this.uuidSchema.parse(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        refreshTokenHash: null,
      },
    });
  }
}

