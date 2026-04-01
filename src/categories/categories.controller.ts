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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  // Public Endpoint
  @Get('categories')
  async findAllActive() {
    return this.categoriesService.findAllActive();
  }

  // Admin Endpoints
  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get('admin/categories')
  async findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Post('admin/categories')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Get('admin/categories/:id')
  async findOneAdmin(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch('admin/categories/:id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @UseGuards(AtGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('admin/categories/:id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
