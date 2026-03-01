export const CATEGORIES_REPOSITORY_TOKEN = Symbol('CATEGORIES_REPOSITORY');

/**
 * Category domain type - ORM-agnostic
 * Used by service layer and tests
 */
export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  description: string | null;
  created_at: number; // Unix epoch
  updated_at: number; // Unix epoch
  deleted_at: number | null; // Unix epoch, null if not deleted
}

/**
 * Filter parameters for finding categories
 */
export interface CategoryFilters {
  type?: 'income' | 'expense';
  search?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name:asc' | 'name:desc';
}

/**
 * Input type for creating a category
 */
export interface CreateCategoryInput {
  name: string;
  type: 'income' | 'expense';
  description?: string;
}

/**
 * Input type for updating a category
 */
export interface UpdateCategoryInput {
  name?: string;
  type?: 'income' | 'expense';
  description?: string | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * ORM-agnostic repository interface
 * Services depend on this, not on Prisma
 */
export interface ICategoriesRepository {
  /**
   * Find many categories with filters and pagination
   */
  findMany(
    userId: string,
    filters?: CategoryFilters,
  ): Promise<{ items: Category[]; total: number }>;

  /**
   * Find a single category by ID
   * Returns null if not found or deleted
   */
  findById(id: string, userId: string): Promise<Category | null>;

  /**
   * Check if category with given name+type exists for user
   * Needed for uniqueness validation
   */
  findByNameAndType(
    userId: string,
    name: string,
    type: 'income' | 'expense',
  ): Promise<Category | null>;

  /**
   * Create a new category
   * Throws ConflictException if name+type already exists
   */
  create(userId: string, data: CreateCategoryInput): Promise<Category>;

  /**
   * Update category fields
   * Throws NotFoundException if not found
   * Throws ConflictException if name+type becomes duplicate
   */
  update(
    id: string,
    userId: string,
    data: UpdateCategoryInput,
  ): Promise<Category>;

  /**
   * Soft delete a category (set deleted_at timestamp)
   * Archives the name with timestamp suffix to preserve uniqueness for deletion
   * Throws NotFoundException if not found
   */
  softDelete(
    id: string,
    userId: string,
    archivedName: string,
  ): Promise<Category>;

  /**
   * Count categories for a user (with optional filters)
   */
  count(userId: string, filters?: CategoryFilters): Promise<number>;

  /**
   * Count transactions using this category
   * Used to determine if deletion confirmation is needed
   */
  countTransactions(categoryId: string): Promise<number>;
}
