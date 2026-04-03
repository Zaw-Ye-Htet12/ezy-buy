import { Controller, Get, Patch, Body, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminDashboardService } from './admin-dashboard.service';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/dashboard')
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.admin)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) { }

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('top-products')
  async getTopProducts() {
    return this.dashboardService.getTopProducts();
  }

  @Get('reports')
  async getReports(@Query('period') period: 'day' | 'week' | 'month') {
    return this.dashboardService.getRevenueReports(period || 'day');
  }

  @Get('export-csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.dashboardService.exportRevenueToCsv();
    const fileName = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  }
}
