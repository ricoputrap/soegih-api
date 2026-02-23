import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['expense', 'income'],
  })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'include_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('include_deleted') includeDeleted?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 10;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const includeDeletedBool = includeDeleted === 'true';

    if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    return this.categoriesService.findAll(
      limitNum,
      offsetNum,
      type,
      sort,
      search,
      includeDeletedBool,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Duplicate category name' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Duplicate category name' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete single category' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({
    name: 'confirm',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Category deletion (confirmation may be required)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async delete(
    @Param('id') id: string,
    @Query('confirm') confirm?: string,
  ) {
    const confirmBool = confirm === 'true';
    return this.categoriesService.delete(id, confirmBool);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete multiple categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories deletion (confirmation may be required)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteMultiple(
    @Body() body: { ids: string[]; confirm?: boolean },
  ) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new BadRequestException('VALIDATION_ERROR');
    }

    return this.categoriesService.deleteMultiple(body.ids, body.confirm || false);
  }
}
