import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';

@Module({
  providers: [UsersService, AddressesService],
  controllers: [UsersController, AdminUsersController, AddressesController],
  exports: [UsersService, AddressesService],
})
export class UsersModule {}
