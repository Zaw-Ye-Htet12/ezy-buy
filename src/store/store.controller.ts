import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { UpdateStoreSettingDto } from './dto/update-store-setting.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // Public Endpoint
  @Get('store/info')
  async getInfo() {
    const settings = await this.storeService.getSettings();
    // Return only public fields
    return {
      storeName: settings.storeName,
      isAcceptingOrders: settings.isAcceptingOrders,
      openingHours: settings.openingHours,
      deliveryRadiusKm: settings.deliveryRadiusKm,
      minDeliveryFee: settings.minDeliveryFee,
      deliveryFeePerKm: settings.deliveryFeePerKm,
      slots: settings.slots,
    };
  }

  // Admin Endpoints
  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get('admin/store')
  async getSettingsAdmin() {
    return this.storeService.getSettings();
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch('admin/store')
  async updateSettings(@Body() updateDto: UpdateStoreSettingDto) {
    return this.storeService.updateSettings(updateDto);
  }
}
