import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { Role } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+ ]+$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;
}
