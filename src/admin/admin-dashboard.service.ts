import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      revenueData,
      orderCount,
      pendingPayments,
      lowStockProducts,
    ] = await Promise.all([
      // 1. Today's Revenue (only confirmed/delivered orders)
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { in: [OrderStatus.confirmed, OrderStatus.preparing, OrderStatus.ready, OrderStatus.out_for_delivery, OrderStatus.delivered] },
        },
        _sum: { totalAmount: true },
      }),
      // 2. Today's Order Count
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      // 3. Pending Payment Verifications
      this.prisma.payment.count({
        where: { status: 'pending_review' },
      }),
      // 4. Low Stock Alerts (less than 5)
      this.prisma.product.count({
        where: { stock: { lt: 5 }, isDeleted: false },
      }),
    ]);

    return {
      todayRevenue: revenueData._sum.totalAmount || 0,
      todayOrders: orderCount,
      pendingPayments,
      lowStockAlerts: lowStockProducts,
    };
  }

  async getTopProducts(limit: number = 5) {
    const result = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return result.map(item => ({
      name: item.productName,
      sales: item._sum.quantity,
    }));
  }

  async updateStoreStatus(isAcceptingOrders: boolean) {
    const settings = await this.prisma.storeSetting.findFirst();
    if (!settings) throw new Error('Store settings not found');

    return this.prisma.storeSetting.update({
      where: { id: settings.id },
      data: { isAcceptingOrders },
    });
  }
}
