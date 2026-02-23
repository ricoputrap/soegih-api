import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { EnumCategorySortKey, EnumCategorySortOrder } from './categories.types';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';
import { GetAllCategoriesDto } from './dto/get-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'sortKey', enum: EnumCategorySortKey })
  @ApiQuery({ name: 'sortOrder', enum: EnumCategorySortOrder })
  async getAll(@Query(ValidationPipe) query: GetAllCategoriesDto) {
    const { sortKey, sortOrder } = query;
    return this.categoryService.getAll({ sortKey, sortOrder });
  }

  @Post()
  create(@Body(ValidationPipe) body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    console.log('===== EDIT ID:', id);
    return { id: 4, name: 'Home & Garden' };
  }

  @Delete()
  delete() {
    return { id: 4, name: 'Home & Garden' };
  }

  @Delete()
  deleteMultiple() {
    return { id: 4, name: 'Home & Garden' };
  }
}
