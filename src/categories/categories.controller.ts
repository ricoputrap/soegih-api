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
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetAllCategoriesDto } from './dto/get-category.dto';
import {
  GetAllCategoriesResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteSingleCategoryResponse,
  EnumCategorySortKey,
  EnumCategorySortOrder,
  EnumCategoryType,
} from './categories.types';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with filtering and pagination' })
  @ApiQuery({ name: 'sortKey', required: false, enum: EnumCategorySortKey })
  @ApiQuery({ name: 'sortOrder', required: false, enum: EnumCategorySortOrder })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: EnumCategoryType })
  @ApiQuery({ name: 'include_deleted', required: false, type: Boolean })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a category by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 409,
    description: 'Category with same name and type already exists',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) body: UpdateCategoryDto,
  ): Promise<UpdateCategoryResponse> {
    return this.categoryService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category by ID (two-phase confirmation)' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'confirm', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Category deleted or confirmation required',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteSingle(
    @Param('id') id: string,
    @Query('confirm') confirm?: string,
  ): Promise<DeleteSingleCategoryResponse> {
    const confirmed = confirm === 'true';
    return this.categoryService.deleteSingle(id, confirmed);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteMultiple() {
    // Placeholder for bulk delete (future implementation)
    return { id: 4, name: 'Home & Garden' };
  }
}
