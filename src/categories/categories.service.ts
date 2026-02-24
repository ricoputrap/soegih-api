import { Inject, Injectable } from '@nestjs/common';
import {
  EnumCategorySortKey,
  EnumCategorySortOrder,
  ICategoryService,
  IGetAllCategoriesParams,
  GetAllCategoriesResponse,
  CreateCategoryResponse,
} from './categories.types.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import type {
  ICategoryRepository,
  CategoryWhereParams,
} from './repositories/category.repository.interface.js';
import { CATEGORY_REPOSITORY_TOKEN } from './repositories/category.repository.interface.js';

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async getAll(
    params: IGetAllCategoriesParams = {},
  ): Promise<GetAllCategoriesResponse> {
    const {
      sortKey = EnumCategorySortKey.NAME,
      sortOrder = EnumCategorySortOrder.ASC,
      limit = 10,
      offset = 0,
      type,
      search,
      include_deleted = false,
    } = params;
    // Validate and clamp pagination parameters
    const validLimit = Math.min(Math.max(1, limit || 10), 100);
    const validOffset = Math.max(0, offset || 0);

    // Build where clause for filtering
    const where: CategoryWhereParams = {};

    // Filter by soft delete status
    if (!include_deleted) {
      where.deleted_at = null;
    }

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    // Search by name if provided
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      this.categoryRepository.findMany({
        where,
        take: validLimit,
        skip: validOffset,
        orderBy: {
          [sortKey]: sortOrder === EnumCategorySortOrder.ASC ? 'asc' : 'desc',
        },
      }),
      this.categoryRepository.count(where),
    ]);

    const timestamp = new Date().toISOString();

    return {
      data,
      pagination: {
        limit: validLimit,
        offset: validOffset,
        total,
        has_next: validOffset + validLimit < total,
        has_previous: validOffset > 0,
      },
      meta: {
        timestamp,
        version: '1.0',
      },
    };
  }

  async create(data: CreateCategoryDto): Promise<CreateCategoryResponse> {
    const category = await this.categoryRepository.create({
      name: data.name,
      description: data.description,
      type: data.type,
    });

    const timestamp = new Date().toISOString();

    return {
      data: category,
      meta: {
        timestamp,
        version: '1.0',
      },
    };
  }
}
