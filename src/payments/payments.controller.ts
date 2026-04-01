import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from '../common/utils/file-upload.util';
import { PaymentsService } from './payments.service';
import { SubmitPaymentDto } from './dto/payment-workflow.dto';
import { AtGuard } from '../auth/guards/at.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('accounts')
  async findAllAccountsPublic() {
    return this.paymentsService.findAllAccountsPublic();
  }

  @UseGuards(AtGuard)
  @Post('submit')
  @UseInterceptors(
    FileInterceptor('slip', {
      storage: diskStorage({
        destination: './public/slips',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async submitPayment(
    @Req() req: any,
    @Body() dto: SubmitPaymentDto,
    @UploadedFile() file?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Payment slip image is required');
    }
    const userId = req.user.sub;
    const slipUrl = `/slips/${file.filename}`;
    return this.paymentsService.submitPayment(userId, slipUrl, dto);
  }
}
