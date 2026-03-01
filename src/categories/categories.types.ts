/**
 * Category type enum - income or expense
 */
export type CategoryType = 'income' | 'expense';

/**
 * Valid category types
 */
export const CATEGORY_TYPES: Record<CategoryType, CategoryType> = {
  income: 'income',
  expense: 'expense',
} as const;

/**
 * Category filter options
 */
export interface CategoryFiltersInput {
  type?: CategoryType;
  search?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name:asc' | 'name:desc';
}

/**
 * Delete response for single category
 */
export interface DeleteResponse {
  status: 'DELETED';
  data: {
    id: string;
    name: string; // With [ARCHIVED timestamp] suffix
    deleted_at: number;
    transaction_count_archived?: number;
  };
}

/**
 * Delete response for bulk categories
 */
export interface BulkDeleteResponse {
  status: 'DELETED';
  data: {
    total_selected: number;
    deleted_count: number;
    items: Array<{
      id: string;
      name: string;
      deleted_at: number;
      transaction_count_archived?: number;
    }>;
  };
}

/**
 * Confirmation required response
 * Returned when user attempts to delete category with transactions
 * and hasn't set confirm=true
 */
export interface ConfirmationRequiredResponse {
  status: 'CONFIRMATION_REQUIRED';
  data: {
    id: string;
    name: string;
    transaction_count: number;
    message: string;
  };
  confirmation_required: true;
}
