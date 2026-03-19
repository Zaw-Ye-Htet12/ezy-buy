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
}
