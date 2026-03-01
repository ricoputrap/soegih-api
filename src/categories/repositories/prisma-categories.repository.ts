import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ICategoriesRepository,
  Category,
  CategoryFilters,
  CreateCategoryInput,
  UpdateCategoryInput,
  PaginationMeta,
} from './categories.repository.interface.js';

@Injectable()
export class PrismaCategoriesRepository implements ICategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(
    userId: string,
    filters?: CategoryFilters,
  ): Promise<{ items: Category[]; total: number }> {
    const limit = filters?.limit ?? 10;
    const offset = filters?.offset ?? 0;
    const includeDeleted = filters?.include_deleted ?? false;

    // Build where clause
    const where: Prisma.CategoryWhereInput = {
      user_id: userId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.search && {
        name: { contains: filters.search, mode: 'insensitive' },
      }),
      ...(!includeDeleted && { deleted_at: null }),
    };

    // Build orderBy
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
    if (filters?.sort === 'name:asc') {
      orderBy.name = 'asc';
    } else if (filters?.sort === 'name:desc') {
      orderBy.name = 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: {
        id,
        user_id: userId,
        deleted_at: null,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByNameAndType(
    userId: string,
    name: string,
    type: 'income' | 'expense',
  ): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: {
        user_id: userId,
        name,
        type,
        deleted_at: null,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(userId: string, data: CreateCategoryInput): Promise<Category> {
    try {
      const row = await this.prisma.category.create({
        data: {
          user_id: userId,
          name: data.name,
          type: data.type,
          description: data.description ?? null,
        },
      });
      return this.toDomain(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCategoryInput,
  ): Promise<Category> {
    try {
      // Check if category exists and belongs to user
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      // Prepare update data
      const updateData: Prisma.CategoryUpdateInput = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.type !== undefined) {
        updateData.type = data.type;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      const row = await this.prisma.category.update({
        where: { id },
        data: updateData,
      });
      return this.toDomain(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category already exists');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async softDelete(
    id: string,
    userId: string,
    archivedName: string,
  ): Promise<Category> {
    try {
      // Check if category exists and belongs to user
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          name: archivedName,
          deleted_at: new Date(timestamp * 1000),
        },
      });
      return this.toDomain(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async count(userId: string, filters?: CategoryFilters): Promise<number> {
    const where: Prisma.CategoryWhereInput = {
      user_id: userId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.search && {
        name: { contains: filters.search, mode: 'insensitive' },
      }),
      ...(!(filters?.include_deleted ?? false) && { deleted_at: null }),
    };

    return this.prisma.category.count({ where });
  }

  async countTransactions(categoryId: string): Promise<number> {
    return this.prisma.transactionEvent.count({
      where: {
        category_id: categoryId,
        deleted_at: null,
      },
    });
  }

  /**
   * Transform Prisma Category to domain Category type
   * Converts DateTime to unix epoch
   */
  private toDomain(row: any): Category {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      created_at: Math.floor(row.created_at.getTime() / 1000),
      updated_at: Math.floor(row.updated_at.getTime() / 1000),
      deleted_at: row.deleted_at
        ? Math.floor(row.deleted_at.getTime() / 1000)
        : null,
    };
  }
}
