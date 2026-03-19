import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+ ]+$/, { message: 'Invalid phone number format' })
  phone?: string;
}
