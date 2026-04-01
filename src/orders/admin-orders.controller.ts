import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, Role } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssignRiderDto } from './dto/assign-rider.dto';

@Controller('admin/orders')
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.admin)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAllAdmin();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/assign-rider')
  async assignRider(
    @Param('id') id: string,
    @Body() dto: AssignRiderDto,
  ) {
    return this.ordersService.assignRider(id, dto.riderId);
  }

  @Patch(':id/dispatch')
  async dispatchOrder(@Param('id') id: string) {
    return this.ordersService.dispatchOrder(id);
  }
}
