import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/types/paginated-result';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { slug: createProductDto.slug },
    });
    if (existing) {
      throw new ConflictException('Product with this slug already exists');
    }

    const { options, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        options: options && options.length > 0 ? {
          create: options.map(option => ({
            name: option.name,
            values: {
              create: option.values?.map(val => ({
                label: val.label,
                priceDelta: val.priceDelta || 0,
              })) || [],
            },
          })),
        } : undefined,
      },
      include: {
        options: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  async findAllActive(paginationDto: PaginationDto, categoryId?: string, search?: string): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = {
      isAvailable: true,
      isDeleted: false,
      categoryId: categoryId || undefined,
      name: search ? { contains: search, mode: 'insensitive' as any } : undefined,
    };

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          options: {
            include: { values: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findAllAdmin(paginationDto: PaginationDto): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = { isDeleted: false };

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          options: {
            include: { values: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const currentProduct = await this.findOne(id);

    if (updateProductDto.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: updateProductDto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    const { options, ...productData } = updateProductDto;

    // Handle image removal from disk
    if (productData.imageUrls) {
      const currentImages = currentProduct.imageUrls || [];
      const removedImages = currentImages.filter(
        (url) => !productData.imageUrls!.includes(url),
      );

      for (const imageUrl of removedImages) {
        await this.cleanupImageFile(id, imageUrl);
      }
    }

    // If options are provided, delete existing values & options, then recreate
    if (options) {
      // Must delete child values first due to Foreign Key constraints
      await this.prisma.productOptionValue.deleteMany({
        where: { option: { productId: id } },
      });
      await this.prisma.productOption.deleteMany({
        where: { productId: id },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        options: options ? {
          create: options.map(option => ({
            name: option.name,
            values: {
              create: option.values?.map(val => ({
                label: val.label,
                priceDelta: val.priceDelta || 0,
              })) || [],
            },
          })),
        } : undefined,
      },
      include: {
        options: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  /**
   * Safe file deletion: only removes from disk if no other product uses it.
   */
  private async cleanupImageFile(productId: string, imageUrl: string): Promise<void> {
    const otherProductsUsingImage = await this.prisma.product.count({
      where: {
        id: { not: productId },
        imageUrls: { has: imageUrl },
        isDeleted: false,
      },
    });

    if (otherProductsUsingImage === 0) {
      const { join } = require('path');
      const { existsSync, unlinkSync } = require('fs');
      const filePath = join(process.cwd(), 'public', imageUrl);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  }

  async updateImages(id: string, imageUrls: string[]): Promise<Product> {
    const product = await this.findOne(id);
    const existingImages = product.imageUrls || [];

    // Filter out images that already exist on this product
    const newImages = imageUrls.filter((url) => !existingImages.includes(url));

    if (newImages.length === 0) {
      throw new ConflictException(
        'All provided images already exist for this product.',
      );
    }

    const updatedImages = [...existingImages, ...newImages];

    return this.prisma.product.update({
      where: { id },
      data: {
        imageUrls: updatedImages,
      },
    });
  }

  async remove(id: string): Promise<Product> {
    await this.findOne(id);

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true, isAvailable: false },
    });
  }
}
