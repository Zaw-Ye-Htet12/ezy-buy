import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AtGuard } from '../auth/guards/at.guard';

@Controller('orders')
@UseGuards(AtGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateOrderDto) {
    const userId = req.user.sub;
    return this.ordersService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() paginationDto: PaginationDto) {
    const userId = req.user.sub;
    return this.ordersService.findAll(userId, paginationDto);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.ordersService.findOne(userId, id);
  }

  @Get(':id/qr')
  async getQrCode(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    const qrDataUrl = await this.ordersService.generateOrderQrCode(userId, id);
    return { qrDataUrl };
  }
}
