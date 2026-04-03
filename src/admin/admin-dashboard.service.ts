import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { Parser } from 'json2csv';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      revenueData,
      orderCount,
      pendingPayments,
      lowStockProducts,
      overallRevenueData,
      overallOrderCount,
      totalUsers,
      totalProducts,
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
      // 5. Overall Revenue
      this.prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.confirmed, OrderStatus.preparing, OrderStatus.ready, OrderStatus.out_for_delivery, OrderStatus.delivered] },
        },
        _sum: { totalAmount: true },
      }),
      // 6. Overall Order Count
      this.prisma.order.count(),
      // 7. Total Users (Customers)
      this.prisma.user.count({
        where: { role: Role.customer },
      }),
      // 8. Total Products
      this.prisma.product.count({
        where: { isDeleted: false },
      }),
    ]);

    return {
      todayRevenue: revenueData._sum.totalAmount || 0,
      todayOrders: orderCount,
      pendingPayments,
      lowStockAlerts: lowStockProducts,
      overallRevenue: overallRevenueData._sum.totalAmount || 0,
      overallOrders: overallOrderCount,
      totalUsers,
      totalProducts,
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

  async getRevenueReports(period: 'day' | 'week' | 'month') {
    const validPeriods = ['day', 'week', 'month'];
    const sqlPeriod = validPeriods.includes(period) ? period : 'day';

    const result: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT 
        DATE_TRUNC('${sqlPeriod}', created_at) AS period,
        SUM(total_amount) AS revenue,
        COUNT(id) AS "orderCount"
      FROM orders
      WHERE status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `);

    return result.map(item => ({
      period: item.period,
      revenue: Number(item.revenue),
      orderCount: Number(item.orderCount),
    }));
  }

  async exportRevenueToCsv() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.confirmed, OrderStatus.preparing, OrderStatus.ready, OrderStatus.out_for_delivery, OrderStatus.delivered] },
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const fields = [
      { label: 'Order Number', value: 'orderNumber' },
      { label: 'Date', value: 'createdAt' },
      { label: 'Customer', value: 'user.fullName' },
      { label: 'Email', value: 'user.email' },
      { label: 'Fulfillment', value: 'fulfillmentType' },
      { label: 'Total Amount (MMK)', value: 'totalAmount' },
      { label: 'Status', value: 'status' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(orders);
  }
}
