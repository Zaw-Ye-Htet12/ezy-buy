import { Controller, Get, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, Role } from '@prisma/client';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssignRiderDto } from './dto/assign-rider.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('admin/orders')
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.admin)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.ordersService.findAllAdmin(paginationDto);
  }

  @Get('lookup/:orderNumber')
  async lookupByNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
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
