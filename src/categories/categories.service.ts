import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    limit: number = 10,
    offset: number = 0,
    type?: string,
    sort?: string,
    search?: string,
    includeDeleted: boolean = false,
  ) {
    const where: any = {};

    if (!includeDeleted) {
      where.deleted_at = null;
    }

    if (type) {
      where.type = type.toLowerCase();
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: this.parseSortParam(sort) || { created_at: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map(this.formatCategory),
      pagination: {
        limit: Math.min(limit, 100),
        offset,
        total,
        has_next: offset + Math.min(limit, 100) < total,
        has_previous: offset > 0,
      },
      meta: {
        timestamp: Math.floor(Date.now() / 1000),
        version: '1.0',
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.deleted_at !== null) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    return {
      data: this.formatCategory(category),
      meta: {
        timestamp: Math.floor(Date.now() / 1000),
        version: '1.0',
      },
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('DUPLICATE_CATEGORY_NAME');
    }

    const now = Math.floor(Date.now() / 1000);
    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description || null,
        type: createCategoryDto.type as 'expense' | 'income',
        created_at: now,
        updated_at: now,
      },
    });

    return {
      data: this.formatCategory(category),
      meta: {
        timestamp: now,
        version: '1.0',
      },
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    // Check for name uniqueness if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw new ConflictException('DUPLICATE_CATEGORY_NAME');
      }
    }

    const now = Math.floor(Date.now() / 1000);
    let updateData: any = {
      updated_at: now,
    };

    if (updateCategoryDto.name !== undefined) {
      updateData.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.description !== undefined) {
      updateData.description = updateCategoryDto.description;
    }

    if (updateCategoryDto.type !== undefined) {
      updateData.type = updateCategoryDto.type as 'expense' | 'income';
    }

    if (updateCategoryDto.deleted_at !== undefined) {
      updateData.deleted_at = updateCategoryDto.deleted_at;
      // Remove [ARCHIVED] suffix on restore
      if (
        updateCategoryDto.deleted_at === null &&
        updateData.name?.includes('[ARCHIVED')
      ) {
        updateData.name = updateData.name.split('[ARCHIVED')[0].trim();
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });

    return {
      data: this.formatCategory(updated),
      meta: {
        timestamp: now,
        version: '1.0',
      },
    };
  }

  async delete(id: string, confirm: boolean = false) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.deleted_at !== null) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    // Count transactions using this category
    const transactionCount = await this.prisma.transactionEvent.count({
      where: {
        category_id: id,
        deleted_at: null,
      },
    });

    // Phase 1: Check if confirmation needed
    if (!confirm && transactionCount > 0) {
      return {
        status: 'CONFIRMATION_REQUIRED',
        data: {
          id,
          name: category.name,
          transaction_count: transactionCount,
          warning: `This category is used in ${transactionCount} transactions. Deleting it will archive the category name but keep all transaction data intact.`,
        },
        confirmation_required: true,
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          version: '1.0',
        },
      };
    }

    // Phase 2: Perform soft delete
    const now = Math.floor(Date.now() / 1000);
    const archivedName = `${category.name} [ARCHIVED ${now}]`;

    const deleted = await this.prisma.category.update({
      where: { id },
      data: {
        deleted_at: now,
        name: archivedName,
      },
    });

    return {
      status: 'DELETED',
      data: {
        id,
        name: deleted.name,
        deleted_at: deleted.deleted_at,
        transaction_count_archived: transactionCount,
      },
      meta: {
        timestamp: now,
        version: '1.0',
      },
    };
  }

  async deleteMultiple(ids: string[], confirm: boolean = false) {
    // Fetch all categories
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: ids },
        deleted_at: null,
      },
    });

    if (categories.length !== ids.length) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    // Count transactions for each category
    const transactionCounts = await Promise.all(
      ids.map((id) =>
        this.prisma.transactionEvent.count({
          where: { category_id: id, deleted_at: null },
        }),
      ),
    );

    const itemsInUse = categories
      .map((cat, idx) => ({ ...cat, count: transactionCounts[idx] }))
      .filter((cat) => cat.count > 0);

    const itemsSafeToDelete = categories
      .map((cat, idx) => ({ ...cat, count: transactionCounts[idx] }))
      .filter((cat) => cat.count === 0);

    // Phase 1: Check if confirmation needed
    if (!confirm && itemsInUse.length > 0) {
      return {
        status: 'CONFIRMATION_REQUIRED',
        data: {
          total_selected: ids.length,
          items_in_use: itemsInUse.map((cat) => ({
            id: cat.id,
            name: cat.name,
            transaction_count: cat.count,
          })),
          items_safe_to_delete: itemsSafeToDelete.map((cat) => ({
            id: cat.id,
            name: cat.name,
            transaction_count: 0,
          })),
          warning: `${itemsInUse.length} out of ${ids.length} selected categories are used in transactions. Deleting will archive them but keep all transaction data intact.`,
        },
        confirmation_required: true,
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          version: '1.0',
        },
      };
    }

    // Phase 2: Perform bulk soft delete
    const now = Math.floor(Date.now() / 1000);

    const deleted = await Promise.all(
      categories.map((cat) =>
        this.prisma.category.update({
          where: { id: cat.id },
          data: {
            deleted_at: now,
            name: `${cat.name} [ARCHIVED ${now}]`,
          },
        }),
      ),
    );

    return {
      status: 'DELETED',
      data: {
        total_selected: ids.length,
        deleted_count: deleted.length,
        items: deleted.map((cat, idx) => ({
          id: cat.id,
          name: cat.name,
          deleted_at: cat.deleted_at,
          transaction_count_archived: transactionCounts[idx],
        })),
      },
      meta: {
        timestamp: now,
        version: '1.0',
      },
    };
  }

  private formatCategory(category: any) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      type: category.type.toLowerCase(),
      created_at: category.created_at,
      updated_at: category.updated_at,
      deleted_at: category.deleted_at,
    };
  }

  private parseSortParam(
    sort?: string,
  ): Record<string, 'asc' | 'desc'> | undefined {
    if (!sort) return undefined;

    const parsed: Record<string, 'asc' | 'desc'> = {};
    sort.split(',').forEach((field) => {
      const [name, direction] = field.split(':');
      parsed[name.trim()] = (direction?.trim()?.toLowerCase() ||
        'asc') as 'asc' | 'desc';
    });

    return parsed;
  }
}
