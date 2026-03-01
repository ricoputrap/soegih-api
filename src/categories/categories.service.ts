import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  ICategoriesRepository,
  Category,
  CategoryFilters,
} from './repositories/categories.repository.interface.js';
import { CATEGORIES_REPOSITORY_TOKEN } from './repositories/categories.repository.interface.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import type {
  DeleteResponse,
  BulkDeleteResponse,
  ConfirmationRequiredResponse,
} from './categories.types.js';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY_TOKEN)
    private readonly repository: ICategoriesRepository,
  ) {}

  /**
   * Create a new category
   */
  async create(userId: string, createDto: CreateCategoryDto): Promise<Category> {
    return this.repository.create(userId, createDto);
  }

  /**
   * Get all categories for user with filters and pagination
   */
  async getAll(userId: string, filters?: CategoryFilters): Promise<Category[]> {
    const { items } = await this.repository.findMany(userId, filters ?? {});
    return items;
  }

  /**
   * Get single category by ID
   */
  async getById(userId: string, categoryId: string): Promise<Category> {
    const category = await this.repository.findById(categoryId, userId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  /**
   * Update category
   */
  async update(
    userId: string,
    categoryId: string,
    updateDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.repository.update(categoryId, userId, updateDto);
  }

  /**
   * Soft delete single category with transaction awareness
   */
  async deleteSingle(
    userId: string,
    categoryId: string,
    confirm: boolean,
  ): Promise<DeleteResponse | ConfirmationRequiredResponse> {
    // Count transactions using this category
    const transactionCount = await this.repository.countTransactions(categoryId);

    // If has transactions and no confirmation, ask for confirmation
    if (transactionCount > 0 && !confirm) {
      return {
        status: 'CONFIRMATION_REQUIRED',
        data: {
          id: categoryId,
          name: categoryId, // Placeholder - name would be fetched if needed
          transaction_count: transactionCount,
          message: `This category has ${transactionCount} transaction(s)`,
        },
        confirmation_required: true,
      };
    }

    // Proceed with soft delete
    // Create a timestamp-based archived name
    const timestamp = Math.floor(Date.now() / 1000);
    const archivedName = `[ARCHIVED ${timestamp}]`;

    const deletedCategory = await this.repository.softDelete(
      categoryId,
      userId,
      archivedName,
    );

    return {
      status: 'DELETED',
      data: {
        id: deletedCategory.id,
        name: deletedCategory.name,
        deleted_at: deletedCategory.deleted_at!,
        ...(transactionCount > 0 && { transaction_count_archived: transactionCount }),
      },
    };
  }

  /**
   * Soft delete multiple categories with transaction awareness
   */
  async deleteMultiple(
    userId: string,
    ids: string[],
    confirm: boolean,
  ): Promise<BulkDeleteResponse | ConfirmationRequiredResponse> {
    if (!ids || ids.length === 0) {
      throw new Error('At least one category ID is required');
    }

    // Count transactions for each category
    const transactionCounts: Map<string, number> = new Map();

    for (const id of ids) {
      const count = await this.repository.countTransactions(id);
      transactionCounts.set(id, count);
    }

    // Check if any have transactions
    const itemsWithTransactions = ids.filter(
      (id) => (transactionCounts.get(id) ?? 0) > 0,
    );

    // If any have transactions and no confirmation, ask for confirmation
    if (itemsWithTransactions.length > 0 && !confirm) {
      return {
        status: 'CONFIRMATION_REQUIRED',
        data: {
          items_in_use: itemsWithTransactions.map((id) => ({
            id,
            transaction_count: transactionCounts.get(id) ?? 0,
          })),
          items_safe_to_delete: ids
            .filter((id) => !itemsWithTransactions.includes(id))
            .map((id) => ({
              id,
              transaction_count: 0,
            })),
        },
        confirmation_required: true,
      };
    }

    // Proceed with bulk soft delete
    const timestamp = Math.floor(Date.now() / 1000);
    const deletedItems = [];
    for (const id of ids) {
      const archivedName = `[ARCHIVED ${timestamp}]`;
      const deletedCategory = await this.repository.softDelete(id, userId, archivedName);
      const transactionCount = transactionCounts.get(id) ?? 0;

      deletedItems.push({
        id: deletedCategory.id,
        name: deletedCategory.name,
        deleted_at: deletedCategory.deleted_at!,
        transaction_count_archived: transactionCount,
      });
    }

    return {
      status: 'DELETED',
      data: {
        total_selected: ids.length,
        deleted_count: deletedItems.length,
        items: deletedItems,
      },
    };
  }

  /**
   * Generate archived name with timestamp suffix
   */
  archiveName(category: Category): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `${category.name} [ARCHIVED ${timestamp}]`;
  }

  /**
   * Count transactions using a category
   */
  async countTransactions(categoryId: string): Promise<number> {
    return this.repository.countTransactions(categoryId);
  }
}
