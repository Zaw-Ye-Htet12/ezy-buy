import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) { }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: './password-reset.html',
      context: {
        email,
        url,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Ezy-Buy!',
      template: './welcome.html',
      context: {
        name,
      },
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email',
      template: './verify-email.html',
      context: {
        name,
        url,
      },
    });
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      template: './order-confirmation.html',
      context: {
        name,
        orderNumber,
        total,
      },
    });
  }

  async sendOrderStatusUpdate(
    email: string,
    name: string,
    orderNumber: string,
    status: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order Update - ${orderNumber}`,
      template: './order-status.html',
      context: {
        name,
        orderNumber,
        status: status.replace(/_/g, ' ').toUpperCase(),
      },
    });
  }

  async sendPaymentUpdate(
    email: string,
    name: string,
    orderNumber: string,
    status: string,
    reason?: string,
  ): Promise<void> {
    const subject =
      status === 'approved' ? 'Payment Approved' : 'Payment Rejected';
    await this.mailerService.sendMail({
      to: email,
      subject: `${subject} - ${orderNumber}`,
      template: './order-status.html',
      context: {
        name,
        orderNumber,
        status: status.toUpperCase(),
        reason: reason || '',
      },
    });
  }
}
