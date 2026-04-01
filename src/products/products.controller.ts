import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter, hashFileName } from '../common/utils/file-upload.util';
import { join } from 'path';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  // Public Endpoints
  @Get('products')
  async findAllActive(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAllActive(categoryId, search);
  }

  @Get('products/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Admin Endpoints
  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get('admin/products')
  async findAllAdmin() {
    return this.productsService.findAllAdmin();
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Post('admin/products')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: any[],
  ) {
    // Content-hash each uploaded file to detect duplicates
    const uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const hashedName = hashFileName(
          join(process.cwd(), 'public', 'uploads', file.filename),
        );
        uploadedUrls.push(`/uploads/${hashedName}`);
      }
    }

    const allUrls = [...(createProductDto.imageUrls || []), ...uploadedUrls];
    const uniqueUrls = Array.from(new Set(allUrls));

    if (uniqueUrls.length < allUrls.length) {
      throw new BadRequestException(
        'Duplicate images detected. Each image must be unique.',
      );
    }

    return this.productsService.create({
      ...createProductDto,
      imageUrls: uniqueUrls,
    });
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get('admin/products/:id')
  async findOneAdmin(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch('admin/products/:id')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: any[],
  ) {
    const uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const hashedName = hashFileName(
          join(process.cwd(), 'public', 'uploads', file.filename),
        );
        uploadedUrls.push(`/uploads/${hashedName}`);
      }
    }

    // Prepare the update data object
    const updateData: any = { ...updateProductDto };

    // ONLY calculate and include imageUrls if the field was sent in the body OR if files were uploaded
    // This allows for a true partial update (PATCH)
    if (updateProductDto.imageUrls !== undefined || uploadedUrls.length > 0) {
      // If new files were uploaded but NO body URLs sent, we merge with existing images from the DB
      // otherwise we merge with the body URLs (which represents the user's desired state)
      let baseUrls = updateProductDto.imageUrls;

      if (baseUrls === undefined && uploadedUrls.length > 0) {
        const product = await this.productsService.findOne(id);
        baseUrls = product.imageUrls;
      }

      updateData.imageUrls = Array.from(
        new Set([...(baseUrls || []), ...uploadedUrls]),
      );
    }

    return this.productsService.update(id, updateData);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('admin/products/:id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

}
