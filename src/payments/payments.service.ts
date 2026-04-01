import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { SubmitPaymentDto, ReviewPaymentDto } from './dto/payment-workflow.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // --- Store Payment Accounts (Admin) ---

  async createAccount(dto: CreatePaymentAccountDto) {
    return this.prisma.storePaymentAccount.create({
      data: dto,
    });
  }

  async findAllAccountsAdmin() {
    return this.prisma.storePaymentAccount.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAccountsPublic() {
    return this.prisma.storePaymentAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateAccount(id: string, dto: Partial<CreatePaymentAccountDto>) {
    return this.prisma.storePaymentAccount.update({
      where: { id },
      data: dto,
    });
  }

  // --- Payment Workflow ---

  async submitPayment(userId: string, slipImageUrl: string, dto: SubmitPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');

    // Expected amount validation (Optional: can be flexible depending on business logic)
    if (Number(dto.amount) < Number(order.totalAmount)) {
      throw new BadRequestException('Payment amount is less than order total');
    }

    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
        slipImageUrl: slipImageUrl,
        slipUploadedAt: new Date(),
        status: PaymentStatus.pending_review,
        transactionRef: dto.transactionRef,
      },
    });
  }

  async findPendingPayments() {
    return this.prisma.payment.findMany({
      where: { status: PaymentStatus.pending_review },
      include: {
        order: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { slipUploadedAt: 'asc' },
    });
  }

  async reviewPayment(adminId: string, paymentId: string, dto: ReviewPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { user: true } } },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment Status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: dto.status as PaymentStatus,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
      });

      // 2. If approved, advance the order status
      if (dto.status === 'approved') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.confirmed },
        });
      }

      return updatedPayment;
    });

    // 3. Send notification (async)
    if (payment.order.user && payment.order.user.email) {
      this.mailService.sendPaymentUpdate(
        payment.order.user.email,
        payment.order.user.fullName,
        payment.order.orderNumber,
        dto.status,
        dto.rejectionReason,
      );
    }

    return result;
  }
}
