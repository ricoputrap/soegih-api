import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  EnumCategorySortKey,
  EnumCategorySortOrder,
  EnumCategoryType,
  ICategory,
  ICategoryService,
  IGetAllCategoriesParams,
  GetAllCategoriesResponse,
  CreateCategoryResponse,
} from './categories.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(private prisma: PrismaService) {}

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
    const where: Prisma.CategoryWhereInput = {};

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
      this.prisma.category.findMany({
        where,
        take: validLimit,
        skip: validOffset,
        orderBy: {
          [sortKey]: sortOrder === EnumCategorySortOrder.ASC ? 'asc' : 'desc',
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    const timestamp = new Date().toISOString();

    return {
      data: data.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type as EnumCategoryType,
        description: category.description || '',
        created_at: category.created_at,
        updated_at: category.updated_at,
        deleted_at: category.deleted_at,
      })),
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
    try {
      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
        },
      });

      const timestamp = new Date().toISOString();

      return {
        data: {
          id: category.id,
          name: category.name,
          type: category.type as EnumCategoryType,
          description: category.description || '',
          created_at: category.created_at,
          updated_at: category.updated_at,
          deleted_at: category.deleted_at,
        },
        meta: {
          timestamp,
          version: '1.0',
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('DUPLICATE_CATEGORY_NAME');
      }
      throw error;
    }
  }
}
