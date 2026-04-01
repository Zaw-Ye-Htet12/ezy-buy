import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/dashboard')
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.admin)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('top-products')
  async getTopProducts() {
    return this.dashboardService.getTopProducts();
  }

  @Patch('store-status')
  async updateStoreStatus(@Body('isAcceptingOrders') isAcceptingOrders: boolean) {
    return this.dashboardService.updateStoreStatus(isAcceptingOrders);
  }
}
