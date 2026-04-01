import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
  async findAll(@Req() req: any) {
    const userId = req.user.sub;
    return this.ordersService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.ordersService.findOne(userId, id);
  }
}
