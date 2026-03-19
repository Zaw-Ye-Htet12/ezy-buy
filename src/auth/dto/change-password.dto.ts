import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
