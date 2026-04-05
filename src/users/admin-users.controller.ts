import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    return this.usersService.updateUser(id, adminUpdateUserDto);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
