import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { AtGuard } from '../auth/guards/at.guard';

@Controller('users/addresses')
@UseGuards(AtGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) { }

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateAddressDto) {
    const userId = req.user.sub;
    return this.addressesService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.sub;
    return this.addressesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.addressesService.findOne(userId, id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.addressesService.remove(userId, id);
  }
}
