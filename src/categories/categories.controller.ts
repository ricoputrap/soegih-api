import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtGuard } from '../common/guards/jwt.guard.js';

interface CurrentUserDto {
  id: string;
  username: string;
  created_at: number;
}

@Controller('api/v1/categories')
@ApiTags('Categories')
@UseGuards(JwtGuard)
@ApiCookieAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories with pagination and filters',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'type',
    enum: ['income', 'expense'],
    required: false,
  })
  @ApiQuery({
    name: 'sort',
    enum: ['name:asc', 'name:desc'],
    required: false,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'include_deleted',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
  })
  async getAll(
    @CurrentUser() user: CurrentUserDto,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('type') type?: 'income' | 'expense',
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('include_deleted') includeDeleted?: boolean,
  ) {
    return this.categoriesService.getAll(user.id, {
      limit: limit ?? 10,
      offset: offset ?? 0,
      ...(type && { type }),
      ...(sort && { sort: sort as 'name:asc' | 'name:desc' }),
      ...(search && { search }),
      ...(includeDeleted && { include_deleted: includeDeleted }),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single category by ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category details',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getOne(@CurrentUser() user: CurrentUserDto, @Param('id') id: string) {
    return this.categoriesService.getById(user.id, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Category name+type already exists',
  })
  async create(
    @CurrentUser() user: CurrentUserDto,
    @Body() createDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, createDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category',
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Name+type already exists',
  })
  async update(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a single category (soft delete with confirmation)',
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiQuery({
    name: 'confirm',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion response (confirmation required or deleted)',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async deleteOne(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Query('confirm') confirm?: boolean,
  ) {
    return this.categoriesService.deleteSingle(user.id, id, confirm ?? false);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete multiple categories (bulk)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
        confirm: { type: 'boolean' },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion response',
  })
  async deleteMany(
    @CurrentUser() user: CurrentUserDto,
    @Body() body: { ids: string[]; confirm?: boolean },
  ) {
    return this.categoriesService.deleteMultiple(
      user.id,
      body.ids,
      body.confirm ?? false,
    );
  }
}
