import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from '../common/utils/file-upload.util';
import { PaymentsService } from './payments.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { ReviewPaymentDto } from './dto/payment-workflow.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/payments')
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.admin)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('accounts')
  async findAllAccountsAdmin() {
    return this.paymentsService.findAllAccountsAdmin();
  }

  /**
   * Limit file upload to exactly 1 image via FileInterceptor('qrCode').
   * Any 'qrCode' string key in the body is stripped to prevent Prisma errors.
   */
  @Post('accounts')
  @UseInterceptors(
    FileInterceptor('qrCode', {
      storage: diskStorage({
        destination: './public/qrcodes',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createAccount(
    @Body() dto: CreatePaymentAccountDto,
    @UploadedFile() file?: any,
  ) {
    // 1. LIMIT: Destructure to strip 'qrCode' field if it arrived as a string in Body
    const { qrCode, ...accountData } = dto as any;

    // 2. Map the 1 uploaded file to the DB field
    if (file) {
      accountData.qrCodeImageUrl = `/qrcodes/${file.filename}`;
    }

    return this.paymentsService.createAccount(accountData);
  }

  /**
   * Limit file upload to 1 image for updates as well. 
   * Strips 'qrCode' from body before Prisma update invocation.
   */
  @Patch('accounts/:id')
  @UseInterceptors(
    FileInterceptor('qrCode', {
      storage: diskStorage({
        destination: './public/qrcodes',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePaymentAccountDto>,
    @UploadedFile() file?: any,
  ) {
    // 1. LIMIT: Ensure only legitimate DB fields are passed to the service
    const { qrCode, ...accountData } = dto as any;

    // 2. Map the 1 uploaded file if provided
    if (file) {
      accountData.qrCodeImageUrl = `/qrcodes/${file.filename}`;
    }

    // Standard safety check for partial updates
    Object.keys(accountData).forEach(
      (key) => accountData[key] === undefined && delete accountData[key],
    );

    return this.paymentsService.updateAccount(id, accountData);
  }

  @Get('pending')
  async findPendingPayments() {
    return this.paymentsService.findPendingPayments();
  }

  @Patch('review/:id')
  async reviewPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    const adminId = req.user.sub;
    return this.paymentsService.reviewPayment(adminId, id, dto);
  }
}
