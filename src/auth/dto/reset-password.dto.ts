import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
