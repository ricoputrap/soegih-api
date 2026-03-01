import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
} from 'class-validator';

/**
 * DTO for creating a category
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Groceries',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Category type',
    enum: ['income', 'expense'],
    example: 'expense',
  })
  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiPropertyOptional({
    description: 'Optional category description',
    example: 'Food and groceries',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/**
 * DTO for updating a category (all fields optional)
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Updated Category',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Category type',
    enum: ['income', 'expense'],
    example: 'expense',
  })
  @IsOptional()
  @IsEnum(['income', 'expense'])
  type?: 'income' | 'expense';

  @ApiPropertyOptional({
    description: 'Category description (null to clear)',
    example: 'Updated description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

/**
 * DTO for category response (single category)
 */
export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category ID',
    example: 'cat-123abc',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Groceries',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Food and groceries',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Category type',
    enum: ['income', 'expense'],
    example: 'expense',
  })
  type: 'income' | 'expense';

  @ApiProperty({
    description: 'Creation timestamp (unix epoch)',
    example: 1709299445,
  })
  created_at: number;

  @ApiProperty({
    description: 'Last update timestamp (unix epoch)',
    example: 1709299445,
  })
  updated_at: number;

  @ApiPropertyOptional({
    description: 'Deletion timestamp (unix epoch, null if not deleted)',
    example: 1709299445,
    nullable: true,
  })
  deleted_at: number | null;
}

/**
 * DTO for list response with pagination
 */
export class CategoryListResponseDto {
  @ApiProperty({
    type: [CategoryResponseDto],
    description: 'Array of categories',
  })
  data: CategoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      limit: 10,
      offset: 0,
      total: 42,
      has_next: true,
      has_previous: false,
    },
  })
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };

  @ApiProperty({
    description: 'Response metadata',
    example: {
      timestamp: 1709299445,
      version: '1.0',
    },
  })
  meta: {
    timestamp: number;
    version: string;
  };
}

/**
 * DTO for delete response
 */
export class DeleteResponseDto {
  @ApiProperty({
    enum: ['DELETED'],
  })
  status: 'DELETED';

  @ApiProperty({
    description: 'Deleted category data',
  })
  data: {
    id: string;
    name: string;
    deleted_at: number;
    transaction_count_archived?: number;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

/**
 * DTO for bulk delete response
 */
export class BulkDeleteResponseDto {
  @ApiProperty({
    enum: ['DELETED'],
  })
  status: 'DELETED';

  @ApiProperty()
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

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

/**
 * DTO for confirmation required response
 */
export class ConfirmationRequiredResponseDto {
  @ApiProperty({
    enum: ['CONFIRMATION_REQUIRED'],
  })
  status: 'CONFIRMATION_REQUIRED';

  @ApiProperty({
    description: 'Category data with transaction count',
  })
  data: {
    id: string;
    name: string;
    transaction_count: number;
    message: string;
  };

  @ApiProperty({
    enum: [true],
  })
  confirmation_required: true;

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
