import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetAllCategoriesDto } from './dto/get-category.dto';
import {
  GetAllCategoriesResponse,
  CreateCategoryResponse,
} from './categories.types';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of categories retrieved successfully',
  })
  async getAll(
    @Query(ValidationPipe) query: GetAllCategoriesDto,
  ): Promise<GetAllCategoriesResponse> {
    return this.categoryService.getAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Category with same name and type already exists',
  })
  async create(
    @Body(ValidationPipe) body: CreateCategoryDto,
  ): Promise<CreateCategoryResponse> {
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
