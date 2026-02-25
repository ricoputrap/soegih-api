import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ICategory } from '../categories.types.js';
import { EnumCategoryType } from '../categories.types.js';
import type {
  ICategoryRepository,
  CategoryFindManyParams,
  CategoryCreateParams,
  CategoryUpdateParams,
  CategoryWhereParams,
  CategorySoftDeleteParams,
} from './category.repository.interface.js';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(params: CategoryFindManyParams): Promise<ICategory[]> {
    const rows = await this.prisma.category.findMany({
      where: params.where as Prisma.CategoryWhereInput,
      take: params.take,
      skip: params.skip,
      orderBy: params.orderBy as Prisma.CategoryOrderByWithRelationInput,
    });

    return rows.map((row) => this.toICategory(row));
  }

  async count(where?: CategoryWhereParams): Promise<number> {
    return this.prisma.category.count({
      where: where as Prisma.CategoryWhereInput,
    });
  }

  async create(data: CategoryCreateParams): Promise<ICategory> {
    try {
      const row = await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type as EnumCategoryType,
        },
      });

      return this.toICategory(row);
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

  async update(id: string, data: CategoryUpdateParams): Promise<ICategory> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data,
      });

      return this.toICategory(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('DUPLICATE_CATEGORY_NAME');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('CATEGORY_NOT_FOUND');
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<ICategory | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    return this.toICategory(row);
  }

  async countTransactions(categoryId: string): Promise<number> {
    return this.prisma.transactionEvent.count({
      where: { category_id: categoryId, deleted_at: null },
    });
  }

  async softDelete(
    id: string,
    data: CategorySoftDeleteParams,
  ): Promise<ICategory> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          deleted_at: data.deleted_at,
        },
      });
      return this.toICategory(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('CATEGORY_NOT_FOUND');
      }
      throw error;
    }
  }

  private toICategory(row: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): ICategory {
    return {
      id: row.id,
      name: row.name,
      type: row.type as EnumCategoryType,
      description: row.description || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    };
  }
}
