import {
  Controller,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Profile Management (Authenticated User Only)
  @UseGuards(AtGuard)
  @Patch('profile')
  async updateProfile(
    @GetCurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateUser(userId, updateProfileDto);
  }
}
