# Soegih API - Phase 5: TDD Implementation

**Date:** March 1, 2026
**Status:** RED Phase - Tests should fail until implementation is complete
**Framework:** NestJS v11 with Jest

---

## Overview

This document provides **test stubs, DTOs, and service method signatures** for Test-Driven Development (TDD).

The TDD cycle:
1. **RED Phase** ← You are here. Tests are written but fail.
2. **GREEN Phase** → Implement services to make tests pass.
3. **REFACTOR** → Improve code without changing behavior.

---

## Table of Contents

1. [Authentication Module](#authentication-module)
2. [Categories Module](#categories-module)
3. [Wallets Module](#wallets-module)
4. [Transactions Module](#transactions-module)

---

## Authentication Module

### File: `src/auth/dto/register.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Username (3-50 chars, alphanumeric, underscore, dash only)',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username must contain only alphanumeric characters, underscore, or dash',
  })
  username: string;

  @ApiProperty({
    description:
      'Password (8+ chars, uppercase, lowercase, number, special char)',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}
```

### File: `src/auth/dto/login.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
```

### File: `src/auth/dto/user-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  data: {
    id: string;
    username: string;
    created_at: number;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
```

### File: `src/auth/auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class AuthService {
  /**
   * Register a new user with username and password
   *
   * TODO:
   * 1. Validate username is unique (not already registered)
   * 2. Hash password with bcrypt (10 salt rounds)
   * 3. Create user in database
   * 4. Generate access_token (1h expiration) and refresh_token (7d)
   * 5. Return user data and tokens
   *
   * Errors:
   * - Throw ConflictException (409) if username already exists
   * - Throw BadRequestException (400) if validation fails
   */
  async register(registerDto: RegisterDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Login user with username and password
   *
   * TODO:
   * 1. Find user by username
   * 2. Compare provided password with hashed password
   * 3. Generate access_token (1h) and refresh_token (7d)
   * 4. Return user data and tokens
   *
   * Errors:
   * - Throw UnauthorizedException (401) if credentials invalid
   */
  async login(loginDto: LoginDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Refresh access token using refresh token
   *
   * TODO:
   * 1. Validate refresh token (decode JWT)
   * 2. Generate new access_token (1h)
   * 3. Return new token
   *
   * Errors:
   * - Throw UnauthorizedException (401) if token invalid or expired
   */
  async refresh(userId: string): Promise<{ accessToken: string }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
```

### File: `src/auth/auth.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.username).toBe('john_doe');
      expect(result.user.created_at).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'existing_user',
        password: 'SecurePass123!',
      };

      // Pre-populate database with existing user
      await service.register({
        username: 'existing_user',
        password: 'SecurePass123!',
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password and not store plaintext', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };

      // Act
      const result = await service.register(registerDto);

      // Assert (password should never be in response)
      expect(result.user).not.toHaveProperty('password');
    });

    it('should generate both access and refresh tokens with correct expiration', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };

      // Act
      const result = await service.register(registerDto);

      // Assert (tokens should be valid JWT-like strings)
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(typeof result.tokens.accessToken).toBe('string');
      expect(typeof result.tokens.refreshToken).toBe('string');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      await service.register(registerDto);

      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.username).toBe('john_doe');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      await service.register(registerDto);

      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'WrongPassword123!',
      };

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with non-existent username', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'non_existent',
        password: 'SecurePass123!',
      };

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      const registered = await service.register(registerDto);
      const userId = registered.user.id;

      // Act
      const result = await service.refresh(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      // Act & Assert
      await expect(service.refresh('invalid-user-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
```

---

## Categories Module

### File: `src/categories/dto/create-category.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

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
    description: 'Optional description',
    example: 'Food and groceries',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### File: `src/categories/dto/update-category.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    enum: ['income', 'expense'],
  })
  @IsOptional()
  @IsEnum(['income', 'expense'])
  type?: 'income' | 'expense';

  @ApiPropertyOptional({
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Set to null to restore archived category',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  deleted_at?: number | null;
}
```

### File: `src/categories/dto/category-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  data: {
    id: string;
    name: string;
    description: string | null;
    type: 'income' | 'expense';
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

export class CategoryListResponseDto {
  @ApiProperty()
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    type: 'income' | 'expense';
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>;

  @ApiProperty()
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

export class DeleteResponseDto {
  @ApiProperty()
  status: 'DELETED';

  @ApiProperty()
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

export class ConfirmationRequiredResponseDto {
  @ApiProperty()
  status: 'CONFIRMATION_REQUIRED';

  @ApiProperty()
  data: object;

  @ApiProperty()
  confirmation_required: boolean;

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
```

### File: `src/categories/categories.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';

@Injectable()
export class CategoriesService {
  /**
   * List all categories for authenticated user
   *
   * TODO:
   * 1. Build query with filters (type, search, include_deleted)
   * 2. Apply sorting (name:asc, name:desc)
   * 3. Apply pagination (limit, offset)
   * 4. Return categories with pagination metadata
   *
   * Filters:
   * - type: 'income' | 'expense' (optional)
   * - search: partial name match (case-insensitive)
   * - include_deleted: boolean (default false, excludes soft-deleted)
   * - sort: 'name:asc' | 'name:desc' (default 'name:asc')
   */
  async getAll(
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
      type?: 'income' | 'expense';
      search?: string;
      include_deleted?: boolean;
      sort?: string;
    },
  ): Promise<{
    data: Array<any>;
    pagination: {
      limit: number;
      offset: number;
      total: number;
      has_next: boolean;
      has_previous: boolean;
    };
    meta: { timestamp: number; version: string };
  }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Get single category by ID
   *
   * TODO:
   * 1. Find category by ID and user_id
   * 2. Verify user owns category (user_id match)
   * 3. Return category data
   *
   * Errors:
   * - Throw NotFoundException (404) if category not found
   */
  async getById(userId: string, categoryId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Create new category
   *
   * TODO:
   * 1. Validate category name+type is unique per user
   * 2. Create category in database
   * 3. Return created category
   *
   * Errors:
   * - Throw ConflictException (409) if name+type already exists
   * - Throw BadRequestException (400) if validation fails
   */
  async create(
    userId: string,
    createDto: CreateCategoryDto,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Update category
   *
   * TODO:
   * 1. Find category by ID and user_id
   * 2. Verify user owns category
   * 3. If updating name+type, verify new combination not already used
   * 4. Update category fields
   * 5. Return updated category
   *
   * Errors:
   * - Throw NotFoundException (404) if category not found
   * - Throw ConflictException (409) if name+type already exists
   */
  async update(
    userId: string,
    categoryId: string,
    updateDto: UpdateCategoryDto,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete single category (soft delete with confirmation)
   *
   * TODO:
   * 1. Find category by ID and user_id
   * 2. Verify user owns category
   * 3. Check if category has associated transactions
   * 4. If transactions exist and confirm=false, return confirmation required
   * 5. If confirm=true or no transactions, soft delete (set deleted_at timestamp)
   * 6. Archive category name with timestamp: "CategoryName [ARCHIVED 1709299445]"
   * 7. Return deletion response
   *
   * Errors:
   * - Throw NotFoundException (404) if category not found
   */
  async deleteSingle(
    userId: string,
    categoryId: string,
    confirm: boolean,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete multiple categories (bulk soft delete)
   *
   * TODO:
   * 1. Find all categories by IDs and user_id
   * 2. Verify user owns all categories
   * 3. Check which have associated transactions
   * 4. If any have transactions and confirm=false, return confirmation required
   * 5. If confirm=true or no transactions, soft delete all
   * 6. Return bulk deletion response with counts
   *
   * Errors:
   * - Throw NotFoundException (404) if any category not found
   */
  async deleteMultiple(
    userId: string,
    categoryIds: string[],
    confirm: boolean,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
```

### File: `src/categories/categories.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const userId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('should create a category with valid input', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
        description: 'Food and groceries',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe('Groceries');
      expect(result.data.type).toBe('expense');
      expect(result.data.description).toBe('Food and groceries');
      expect(result.data.created_at).toBeDefined();
      expect(result.data.deleted_at).toBeNull();
    });

    it('should throw ConflictException if name+type already exists', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
      };
      await service.create(userId, createDto);

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow same name with different type', async () => {
      // Arrange
      const expenseDto: CreateCategoryDto = {
        name: 'Work',
        type: 'expense',
      };
      const incomeDto: CreateCategoryDto = {
        name: 'Work',
        type: 'income',
      };

      // Act
      const expenseResult = await service.create(userId, expenseDto);
      const incomeResult = await service.create(userId, incomeDto);

      // Assert
      expect(expenseResult.data.id).not.toBe(incomeResult.data.id);
      expect(expenseResult.data.type).toBe('expense');
      expect(incomeResult.data.type).toBe('income');
    });

    it('should not allow empty name', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: '',
        type: 'expense',
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow();
    });

    it('should not allow name exceeding 100 characters', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'a'.repeat(101),
        type: 'expense',
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow();
    });
  });

  describe('getAll', () => {
    it('should return paginated list of categories', async () => {
      // Arrange
      const createDto1: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
      };
      const createDto2: CreateCategoryDto = {
        name: 'Salary',
        type: 'income',
      };
      await service.create(userId, createDto1);
      await service.create(userId, createDto2);

      // Act
      const result = await service.getAll(userId, { limit: 10, offset: 0 });

      // Assert
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.has_next).toBe(false);
      expect(result.pagination.has_previous).toBe(false);
    });

    it('should filter categories by type', async () => {
      // Arrange
      await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      await service.create(userId, {
        name: 'Salary',
        type: 'income',
      });

      // Act
      const result = await service.getAll(userId, {
        type: 'expense',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('expense');
    });

    it('should search categories by name (case-insensitive)', async () => {
      // Arrange
      await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      await service.create(userId, {
        name: 'Gas',
        type: 'expense',
      });

      // Act
      const result = await service.getAll(userId, {
        search: 'groc',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toContain('Groceries');
    });

    it('should exclude soft-deleted categories by default', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      await service.deleteSingle(userId, created.data.id, true);

      // Act
      const result = await service.getAll(userId, {
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(0);
    });

    it('should include soft-deleted categories if include_deleted=true', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      await service.deleteSingle(userId, created.data.id, true);

      // Act
      const result = await service.getAll(userId, {
        include_deleted: true,
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].deleted_at).not.toBeNull();
    });

    it('should sort categories by name ascending', async () => {
      // Arrange
      await service.create(userId, {
        name: 'Zebra',
        type: 'expense',
      });
      await service.create(userId, {
        name: 'Apple',
        type: 'expense',
      });

      // Act
      const result = await service.getAll(userId, {
        sort: 'name:asc',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data[0].name).toBe('Apple');
      expect(result.data[1].name).toBe('Zebra');
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      for (let i = 0; i < 15; i++) {
        await service.create(userId, {
          name: `Category ${i}`,
          type: 'expense',
        });
      }

      // Act
      const page1 = await service.getAll(userId, {
        limit: 10,
        offset: 0,
      });
      const page2 = await service.getAll(userId, {
        limit: 10,
        offset: 10,
      });

      // Assert
      expect(page1.data.length).toBe(10);
      expect(page2.data.length).toBe(5);
      expect(page1.pagination.has_next).toBe(true);
      expect(page1.pagination.has_previous).toBe(false);
      expect(page2.pagination.has_next).toBe(false);
      expect(page2.pagination.has_previous).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return category by ID', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });

      // Act
      const result = await service.getById(userId, created.data.id);

      // Assert
      expect(result.data.id).toBe(created.data.id);
      expect(result.data.name).toBe('Groceries');
    });

    it('should throw NotFoundException if category not found', async () => {
      // Act & Assert
      await expect(
        service.getById(userId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category with valid input', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      const updateDto: UpdateCategoryDto = {
        name: 'Food & Groceries',
        description: 'Updated description',
      };

      // Act
      const result = await service.update(userId, created.data.id, updateDto);

      // Assert
      expect(result.data.name).toBe('Food & Groceries');
      expect(result.data.description).toBe('Updated description');
      expect(result.data.id).toBe(created.data.id);
    });

    it('should throw ConflictException if new name+type already exists', async () => {
      // Arrange
      const cat1 = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      const cat2 = await service.create(userId, {
        name: 'Food',
        type: 'expense',
      });

      // Act & Assert
      await expect(
        service.update(userId, cat2.data.id, {
          name: 'Groceries',
          type: 'expense',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if category not found', async () => {
      // Act & Assert
      await expect(
        service.update(userId, 'non-existent-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSingle', () => {
    it('should soft delete category without transactions', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });

      // Act
      const result = await service.deleteSingle(userId, created.data.id, false);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_at).toBeDefined();
      expect(result.data.name).toContain('[ARCHIVED');
    });

    it('should require confirmation if category has transactions', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      // TODO: Create a transaction linked to this category

      // Act
      const result = await service.deleteSingle(userId, created.data.id, false);

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.confirmation_required).toBe(true);
    });

    it('should soft delete category with confirm=true despite transactions', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      // TODO: Create a transaction linked to this category

      // Act
      const result = await service.deleteSingle(userId, created.data.id, true);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_at).toBeDefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      // Act & Assert
      await expect(
        service.deleteSingle(userId, 'non-existent-id', false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMultiple', () => {
    it('should bulk soft delete categories', async () => {
      // Arrange
      const cat1 = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      const cat2 = await service.create(userId, {
        name: 'Gas',
        type: 'expense',
      });

      // Act
      const result = await service.deleteMultiple(
        userId,
        [cat1.data.id, cat2.data.id],
        false,
      );

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_count).toBe(2);
      expect(result.data.total_selected).toBe(2);
    });

    it('should return CONFIRMATION_REQUIRED if any have transactions', async () => {
      // Arrange
      const cat1 = await service.create(userId, {
        name: 'Groceries',
        type: 'expense',
      });
      const cat2 = await service.create(userId, {
        name: 'Gas',
        type: 'expense',
      });
      // TODO: Create transaction for cat1 only

      // Act
      const result = await service.deleteMultiple(
        userId,
        [cat1.data.id, cat2.data.id],
        false,
      );

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
    });
  });
});
```

---

## Wallets Module

### File: `src/wallets/dto/create-wallet.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Wallet name',
    example: 'My Cash Wallet',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Wallet type',
    enum: ['cash', 'bank', 'e-wallet', 'other'],
    example: 'cash',
  })
  @IsEnum(['cash', 'bank', 'e-wallet', 'other'])
  type: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    example: 'IDR',
    default: 'IDR',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
```

### File: `src/wallets/dto/update-wallet.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
} from 'class-validator';

export class UpdateWalletDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    enum: ['cash', 'bank', 'e-wallet', 'other'],
  })
  @IsOptional()
  @IsEnum(['cash', 'bank', 'e-wallet', 'other'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Set to null to restore archived wallet',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  deleted_at?: number | null;
}
```

### File: `src/wallets/dto/wallet-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty()
  data: {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
    balance: number;
    currency: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

export class WalletListResponseDto {
  @ApiProperty()
  data: Array<{
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
    balance: number;
    currency: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>;

  @ApiProperty()
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
```

### File: `src/wallets/wallets.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import { UpdateWalletDto } from './dto/update-wallet.dto.js';

@Injectable()
export class WalletsService {
  /**
   * List all wallets for authenticated user
   *
   * TODO:
   * 1. Build query with filters (type, search, include_deleted)
   * 2. Apply sorting (name:asc, name:desc, balance:asc, balance:desc, created_at:asc, created_at:desc)
   * 3. Calculate balance for each wallet (SUM of postings)
   * 4. Apply pagination (limit, offset)
   * 5. Return wallets with pagination metadata
   */
  async getAll(
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
      type?: string;
      search?: string;
      include_deleted?: boolean;
      sort?: string;
    },
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Get single wallet by ID
   *
   * TODO:
   * 1. Find wallet by ID and user_id
   * 2. Calculate balance (SUM of postings)
   * 3. Return wallet data
   *
   * Errors:
   * - Throw NotFoundException (404) if wallet not found
   */
  async getById(userId: string, walletId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Create new wallet
   *
   * TODO:
   * 1. Validate wallet name is unique per user
   * 2. Create wallet in database
   * 3. Return created wallet with balance=0
   *
   * Errors:
   * - Throw ConflictException (409) if name already exists
   * - Throw BadRequestException (400) if validation fails
   */
  async create(userId: string, createDto: CreateWalletDto): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Update wallet
   *
   * TODO:
   * 1. Find wallet by ID and user_id
   * 2. Verify user owns wallet
   * 3. If updating name, verify new name not already used
   * 4. Update wallet fields
   * 5. Return updated wallet
   *
   * Errors:
   * - Throw NotFoundException (404) if wallet not found
   * - Throw ConflictException (409) if name already exists
   */
  async update(
    userId: string,
    walletId: string,
    updateDto: UpdateWalletDto,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete single wallet (soft delete with confirmation)
   *
   * TODO:
   * 1. Find wallet by ID and user_id
   * 2. Verify user owns wallet
   * 3. Check if wallet has associated transactions/postings
   * 4. If has postings and confirm=false, return confirmation required
   * 5. If confirm=true or no postings, soft delete (set deleted_at timestamp)
   * 6. Archive wallet name with timestamp
   * 7. Return deletion response
   *
   * Errors:
   * - Throw NotFoundException (404) if wallet not found
   */
  async deleteSingle(
    userId: string,
    walletId: string,
    confirm: boolean,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete multiple wallets (bulk soft delete)
   *
   * TODO:
   * 1. Find all wallets by IDs and user_id
   * 2. Verify user owns all wallets
   * 3. Check which have associated postings
   * 4. If any have postings and confirm=false, return confirmation required
   * 5. If confirm=true or no postings, soft delete all
   * 6. Return bulk deletion response
   */
  async deleteMultiple(
    userId: string,
    walletIds: string[],
    confirm: boolean,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
```

### File: `src/wallets/wallets.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import { UpdateWalletDto } from './dto/update-wallet.dto.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  const userId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  describe('create', () => {
    it('should create a wallet with valid input', async () => {
      // Arrange
      const createDto: CreateWalletDto = {
        name: 'My Cash Wallet',
        type: 'cash',
        currency: 'IDR',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe('My Cash Wallet');
      expect(result.data.type).toBe('cash');
      expect(result.data.currency).toBe('IDR');
      expect(result.data.balance).toBe(0);
      expect(result.data.created_at).toBeDefined();
      expect(result.data.deleted_at).toBeNull();
    });

    it('should throw ConflictException if name already exists', async () => {
      // Arrange
      const createDto: CreateWalletDto = {
        name: 'My Cash Wallet',
        type: 'cash',
      };
      await service.create(userId, createDto);

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should use default currency IDR if not provided', async () => {
      // Arrange
      const createDto: CreateWalletDto = {
        name: 'My Wallet',
        type: 'cash',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.currency).toBe('IDR');
    });
  });

  describe('getAll', () => {
    it('should return paginated list of wallets', async () => {
      // Arrange
      await service.create(userId, {
        name: 'Wallet 1',
        type: 'cash',
      });
      await service.create(userId, {
        name: 'Wallet 2',
        type: 'bank',
      });

      // Act
      const result = await service.getAll(userId, { limit: 10, offset: 0 });

      // Assert
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter wallets by type', async () => {
      // Arrange
      await service.create(userId, {
        name: 'Cash',
        type: 'cash',
      });
      await service.create(userId, {
        name: 'Bank',
        type: 'bank',
      });

      // Act
      const result = await service.getAll(userId, {
        type: 'cash',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('cash');
    });

    it('should search wallets by name', async () => {
      // Arrange
      await service.create(userId, {
        name: 'My Cash',
        type: 'cash',
      });
      await service.create(userId, {
        name: 'Your Cash',
        type: 'cash',
      });

      // Act
      const result = await service.getAll(userId, {
        search: 'My',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toContain('My');
    });

    it('should calculate balance from postings', async () => {
      // Arrange
      const wallet = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      // TODO: Create postings for wallet

      // Act
      const result = await service.getById(userId, wallet.data.id);

      // Assert
      expect(result.data.balance).toBeDefined();
      expect(typeof result.data.balance).toBe('number');
    });

    it('should exclude soft-deleted wallets by default', async () => {
      // Arrange
      const wallet = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      await service.deleteSingle(userId, wallet.data.id, true);

      // Act
      const result = await service.getAll(userId, {
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(0);
    });

    it('should include soft-deleted wallets if include_deleted=true', async () => {
      // Arrange
      const wallet = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      await service.deleteSingle(userId, wallet.data.id, true);

      // Act
      const result = await service.getAll(userId, {
        include_deleted: true,
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBe(1);
      expect(result.data[0].deleted_at).not.toBeNull();
    });

    it('should sort wallets by balance descending', async () => {
      // Arrange
      const w1 = await service.create(userId, {
        name: 'Wallet 1',
        type: 'cash',
      });
      const w2 = await service.create(userId, {
        name: 'Wallet 2',
        type: 'cash',
      });
      // TODO: Add postings to w1: 100, w2: 50

      // Act
      const result = await service.getAll(userId, {
        sort: 'balance:desc',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data[0].balance).toBeGreaterThan(result.data[1].balance);
    });
  });

  describe('getById', () => {
    it('should return wallet by ID with calculated balance', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });

      // Act
      const result = await service.getById(userId, created.data.id);

      // Assert
      expect(result.data.id).toBe(created.data.id);
      expect(result.data.balance).toBe(0);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      // Act & Assert
      await expect(
        service.getById(userId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update wallet with valid input', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      const updateDto: UpdateWalletDto = {
        name: 'Updated Wallet',
        type: 'bank',
      };

      // Act
      const result = await service.update(userId, created.data.id, updateDto);

      // Assert
      expect(result.data.name).toBe('Updated Wallet');
      expect(result.data.type).toBe('bank');
    });

    it('should throw ConflictException if new name already exists', async () => {
      // Arrange
      const w1 = await service.create(userId, {
        name: 'Wallet 1',
        type: 'cash',
      });
      const w2 = await service.create(userId, {
        name: 'Wallet 2',
        type: 'cash',
      });

      // Act & Assert
      await expect(
        service.update(userId, w2.data.id, { name: 'Wallet 1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      // Act & Assert
      await expect(
        service.update(userId, 'non-existent-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSingle', () => {
    it('should soft delete wallet without postings', async () => {
      // Arrange
      const created = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });

      // Act
      const result = await service.deleteSingle(userId, created.data.id, false);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_at).toBeDefined();
    });

    it('should require confirmation if wallet has postings', async () => {
      // Arrange
      const wallet = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      // TODO: Create posting for wallet

      // Act
      const result = await service.deleteSingle(userId, wallet.data.id, false);

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
    });

    it('should soft delete with confirm=true despite postings', async () => {
      // Arrange
      const wallet = await service.create(userId, {
        name: 'My Wallet',
        type: 'cash',
      });
      // TODO: Create posting for wallet

      // Act
      const result = await service.deleteSingle(userId, wallet.data.id, true);

      // Assert
      expect(result.status).toBe('DELETED');
    });
  });

  describe('deleteMultiple', () => {
    it('should bulk soft delete wallets', async () => {
      // Arrange
      const w1 = await service.create(userId, {
        name: 'Wallet 1',
        type: 'cash',
      });
      const w2 = await service.create(userId, {
        name: 'Wallet 2',
        type: 'cash',
      });

      // Act
      const result = await service.deleteMultiple(
        userId,
        [w1.data.id, w2.data.id],
        false,
      );

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_count).toBe(2);
    });
  });
});
```

---

## Transactions Module

### File: `src/transactions/dto/create-transaction.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Transaction type',
    enum: ['income', 'expense', 'transfer'],
    example: 'expense',
  })
  @IsEnum(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({
    description: 'Transaction amount (integer, in smallest currency unit)',
    example: 50000,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Transaction occurrence time (unix timestamp)',
    example: 1709299445,
  })
  @IsInt()
  occurred_at: number;

  @ApiPropertyOptional({
    description: 'Wallet ID (for income/expense)',
    example: 'w-123',
  })
  @ValidateIf((obj) => obj.type !== 'transfer')
  @IsNotEmpty()
  @IsString()
  wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Category ID (for income/expense only)',
    example: 'c-456',
  })
  @ValidateIf((obj) => obj.type !== 'transfer')
  @IsNotEmpty()
  @IsString()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Source wallet ID (for transfer)',
    example: 'w-123',
  })
  @ValidateIf((obj) => obj.type === 'transfer')
  @IsNotEmpty()
  @IsString()
  source_wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Destination wallet ID (for transfer)',
    example: 'w-456',
  })
  @ValidateIf((obj) => obj.type === 'transfer')
  @IsNotEmpty()
  @IsString()
  destination_wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Optional transaction note',
    example: 'Weekly groceries',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description: 'Optional payee name (income/expense only)',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  payee?: string;
}
```

### File: `src/transactions/dto/update-transaction.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateIncomeExpenseTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wallet_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  payee?: string;
}

export class UpdateTransferTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_wallet_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destination_wallet_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
```

### File: `src/transactions/dto/transaction-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  data: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    occurred_at: number;
    category: {
      id: string;
      name: string;
    };
    wallet: {
      id: string;
      name: string;
    };
    note: string | null;
    payee: string | null;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

export class TransferResponseDto {
  @ApiProperty()
  data: {
    id: string;
    type: 'transfer';
    amount: number;
    occurred_at: number;
    source_wallet: {
      id: string;
      name: string;
    };
    destination_wallet: {
      id: string;
      name: string;
    };
    category: null;
    note: string | null;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}

export class TransactionListResponseDto {
  @ApiProperty()
  data: Array<any>;

  @ApiProperty()
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
```

### File: `src/transactions/transactions.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import {
  UpdateIncomeExpenseTransactionDto,
  UpdateTransferTransactionDto,
} from './dto/update-transaction.dto.js';

@Injectable()
export class TransactionsService {
  /**
   * List all transactions for authenticated user
   *
   * TODO:
   * 1. Build query with filters (type, wallet_id, category_id, date range)
   * 2. Apply text search (note field)
   * 3. Apply sorting (occurred_at:desc, occurred_at:asc, amount:asc, amount:desc)
   * 4. Apply pagination (limit, offset)
   * 5. Fetch related category and wallet data
   * 6. Return transactions with pagination metadata
   */
  async getAll(
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
      type?: string;
      wallet_id?: string;
      category_id?: string;
      occurred_at_gte?: number;
      occurred_at_lte?: number;
      sort?: string;
      search?: string;
    },
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Get single transaction by ID
   *
   * TODO:
   * 1. Find transaction by ID and verify user_id ownership
   * 2. Fetch related category (if income/expense) and wallet(s)
   * 3. Return transaction with full details
   *
   * Errors:
   * - Throw NotFoundException (404) if transaction not found
   */
  async getById(userId: string, transactionId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Create new transaction (income, expense, or transfer)
   *
   * TODO:
   * 1. Validate transaction type (income/expense/transfer)
   * 2. For income/expense:
   *    - Verify wallet exists and belongs to user
   *    - Verify category exists and belongs to user
   *    - Create TransactionEvent
   *    - Create single Posting (debit for income, credit for expense)
   * 3. For transfer:
   *    - Verify source wallet exists and belongs to user
   *    - Verify destination wallet exists and belongs to user
   *    - Check source wallet has sufficient balance
   *    - Create TransactionEvent (category_id=null)
   *    - Create 2 Postings (credit source, debit destination with opposite amounts)
   *    - ATOMIC: All or nothing (transaction)
   * 4. Return created transaction with related data
   *
   * Errors:
   * - Throw NotFoundException (404) if wallet or category not found
   * - Throw BadRequestException (400) if insufficient balance for transfer
   * - Throw BadRequestException (400) if validation fails
   */
  async create(userId: string, createDto: CreateTransactionDto): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Update transaction
   *
   * TODO:
   * 1. Find transaction by ID and verify user ownership
   * 2. Type is immutable - cannot change income to expense (throw BadRequestException)
   * 3. For income/expense:
   *    - Can update: amount, wallet, category, note, payee
   *    - If amount changed, update posting amount
   *    - If wallet changed, update posting wallet_id
   *    - If category changed, update transaction category_id
   * 4. For transfer:
   *    - Can update: amount, source/destination wallets, note
   *    - If amount changed, update both postings (opposite amounts)
   *    - If wallets changed, update both postings wallet_ids
   *    - Verify new source wallet has sufficient balance for new amount
   * 5. Return updated transaction
   *
   * Errors:
   * - Throw NotFoundException (404) if transaction not found
   * - Throw BadRequestException (400) if trying to change type
   * - Throw BadRequestException (400) if insufficient balance for new transfer amount
   */
  async update(
    userId: string,
    transactionId: string,
    updateDto:
      | UpdateIncomeExpenseTransactionDto
      | UpdateTransferTransactionDto,
  ): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete single transaction (hard delete)
   *
   * TODO:
   * 1. Find transaction by ID and verify user ownership
   * 2. Delete TransactionEvent (cascades to Posting records)
   * 3. No soft delete for transactions - hard delete only
   * 4. Return success response
   *
   * Errors:
   * - Throw NotFoundException (404) if transaction not found
   */
  async deleteSingle(userId: string, transactionId: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete multiple transactions (bulk hard delete)
   *
   * TODO:
   * 1. Find all transactions by IDs and verify user ownership
   * 2. Delete all TransactionEvents (cascades to Postings)
   * 3. Return success response with count
   *
   * Errors:
   * - Throw NotFoundException (404) if any transaction not found
   */
  async deleteMultiple(
    userId: string,
    transactionIds: string[],
  ): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
```

### File: `src/transactions/transactions.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import {
  UpdateIncomeExpenseTransactionDto,
  UpdateTransferTransactionDto,
} from './dto/update-transaction.dto.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  const userId = 'user-123';
  let walletId: string;
  let categoryId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    // TODO: Set up test data (wallets, categories)
  });

  describe('create - Income', () => {
    it('should create income transaction', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'income',
        amount: 1000000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
        note: 'Monthly salary',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.id).toBeDefined();
      expect(result.data.type).toBe('income');
      expect(result.data.amount).toBe(1000000);
      expect(result.data.note).toBe('Monthly salary');
    });

    it('should increase wallet balance for income', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'income',
        amount: 1000000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      };

      // Act
      await service.create(userId, createDto);

      // Assert (wallet balance should increase)
      // TODO: Verify wallet balance = 1000000
    });

    it('should throw NotFoundException if wallet not found', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'income',
        amount: 1000000,
        occurred_at: 1709299445,
        wallet_id: 'non-existent-wallet',
        category_id: categoryId,
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'income',
        amount: 1000000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: 'non-existent-category',
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create - Expense', () => {
    it('should create expense transaction', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
        note: 'Groceries',
        payee: 'Supermarket',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.type).toBe('expense');
      expect(result.data.amount).toBe(50000);
      expect(result.data.payee).toBe('Supermarket');
    });

    it('should decrease wallet balance for expense', async () => {
      // Arrange
      // First create income to have balance
      await service.create(userId, {
        type: 'income',
        amount: 1000000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });

      const expenseDto: CreateTransactionDto = {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      };

      // Act
      await service.create(userId, expenseDto);

      // Assert (wallet balance should be 1000000 - 50000 = 950000)
      // TODO: Verify wallet balance = 950000
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      // Arrange
      const expenseDto: CreateTransactionDto = {
        type: 'expense',
        amount: 5000000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      };

      // Act & Assert
      // TODO: This should depend on business rules (allow negative or not)
      // For now, assume yes
      await expect(service.create(userId, expenseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create - Transfer', () => {
    let sourceWalletId: string;
    let destWalletId: string;

    beforeEach(async () => {
      // TODO: Create two wallets and fund source wallet
      sourceWalletId = walletId; // Use existing
      // TODO: Create destWalletId
    });

    it('should create transfer transaction', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'transfer',
        amount: 100000,
        occurred_at: 1709299445,
        source_wallet_id: sourceWalletId,
        destination_wallet_id: destWalletId,
        note: 'Transfer to savings',
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.type).toBe('transfer');
      expect(result.data.amount).toBe(100000);
      expect(result.data.source_wallet.id).toBe(sourceWalletId);
      expect(result.data.destination_wallet.id).toBe(destWalletId);
      expect(result.data.category).toBeNull();
    });

    it('should create two postings (debit source, credit dest)', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'transfer',
        amount: 100000,
        occurred_at: 1709299445,
        source_wallet_id: sourceWalletId,
        destination_wallet_id: destWalletId,
      };

      // Act
      const result = await service.create(userId, createDto);

      // Assert (should have 2 postings with opposite amounts)
      // TODO: Verify 2 postings created
      // TODO: Verify source posting amount = -100000
      // TODO: Verify dest posting amount = +100000
    });

    it('should transfer balance between wallets atomically', async () => {
      // Arrange
      // TODO: Fund source wallet with 500000
      const createDto: CreateTransactionDto = {
        type: 'transfer',
        amount: 100000,
        occurred_at: 1709299445,
        source_wallet_id: sourceWalletId,
        destination_wallet_id: destWalletId,
      };

      // Act
      await service.create(userId, createDto);

      // Assert
      // TODO: Verify source wallet balance = 400000
      // TODO: Verify dest wallet balance = 100000
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'transfer',
        amount: 5000000,
        occurred_at: 1709299445,
        source_wallet_id: sourceWalletId,
        destination_wallet_id: destWalletId,
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if source wallet not found', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'transfer',
        amount: 100000,
        occurred_at: 1709299445,
        source_wallet_id: 'non-existent',
        destination_wallet_id: destWalletId,
      };

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAll', () => {
    it('should return paginated list of transactions', async () => {
      // Arrange
      // TODO: Create multiple transactions

      // Act
      const result = await service.getAll(userId, { limit: 10, offset: 0 });

      // Assert
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('should filter transactions by type', async () => {
      // Arrange
      // TODO: Create income and expense transactions

      // Act
      const result = await service.getAll(userId, {
        type: 'expense',
        limit: 10,
        offset: 0,
      });

      // Assert
      // TODO: Verify all returned are expense type
      expect(result.data.every((t: any) => t.type === 'expense')).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      // Arrange
      const startDate = 1709299445;
      const endDate = 1709399445;
      // TODO: Create transactions with different dates

      // Act
      const result = await service.getAll(userId, {
        occurred_at_gte: startDate,
        occurred_at_lte: endDate,
        limit: 10,
        offset: 0,
      });

      // Assert
      // TODO: Verify all transactions within date range
    });

    it('should search by note', async () => {
      // Arrange
      // TODO: Create transaction with note 'Groceries'

      // Act
      const result = await service.getAll(userId, {
        search: 'Groceries',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].note).toContain('Groceries');
    });
  });

  describe('update', () => {
    it('should update income/expense transaction', async () => {
      // Arrange
      const created = await service.create(userId, {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });

      const updateDto: UpdateIncomeExpenseTransactionDto = {
        amount: 75000,
        note: 'Updated note',
      };

      // Act
      const result = await service.update(
        userId,
        created.data.id,
        updateDto,
      );

      // Assert
      expect(result.data.amount).toBe(75000);
      expect(result.data.note).toBe('Updated note');
    });

    it('should throw BadRequestException if changing type', async () => {
      // Arrange
      const created = await service.create(userId, {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });

      const updateDto: any = {
        type: 'income', // Trying to change type
        amount: 50000,
      };

      // Act & Assert
      await expect(
        service.update(userId, created.data.id, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update transfer transaction', async () => {
      // Arrange
      // TODO: Create transfer
      // const created = await service.create(userId, {
      //   type: 'transfer',
      //   amount: 100000,
      //   occurred_at: 1709299445,
      //   source_wallet_id: sourceWalletId,
      //   destination_wallet_id: destWalletId,
      // });

      const updateDto: UpdateTransferTransactionDto = {
        amount: 150000,
        note: 'Updated transfer',
      };

      // Act
      // const result = await service.update(userId, created.data.id, updateDto);

      // Assert
      // expect(result.data.amount).toBe(150000);
    });
  });

  describe('deleteSingle', () => {
    it('should hard delete transaction', async () => {
      // Arrange
      const created = await service.create(userId, {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });

      // Act
      await service.deleteSingle(userId, created.data.id);

      // Assert
      await expect(
        service.getById(userId, created.data.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      // Act & Assert
      await expect(
        service.deleteSingle(userId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMultiple', () => {
    it('should hard delete multiple transactions', async () => {
      // Arrange
      const t1 = await service.create(userId, {
        type: 'expense',
        amount: 50000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });
      const t2 = await service.create(userId, {
        type: 'income',
        amount: 100000,
        occurred_at: 1709299445,
        wallet_id: walletId,
        category_id: categoryId,
      });

      // Act
      await service.deleteMultiple(userId, [t1.data.id, t2.data.id]);

      // Assert
      await expect(
        service.getById(userId, t1.data.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getById(userId, t2.data.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Next Steps

### Phase 5 (RED Phase) - You Are Here
1. ✅ Test stubs generated (should FAIL when run)
2. ✅ DTOs generated with validation rules
3. ✅ Service method signatures generated with TODO comments
4. ✅ Ready for implementation

### Phase 5 (GREEN Phase) - Implement Services
1. Copy test files to your project (`.spec.ts`)
2. Run `pnpm test` - all tests should FAIL (RED phase)
3. Implement each service method to make tests PASS
4. Focus on one method at a time
5. Run tests frequently: `pnpm test --watch`

### After Phase 5
- Phase 6: Integration tests (E2E workflows)
- Phase 7: Deployment (Docker, CI/CD)

---

## Key Reminders

- **Tests are RED**: They will fail until you implement the services
- **DTOs enforce contracts**: Use them for validation and response shaping
- **Repository pattern**: Services should depend on repository interfaces, not PrismaService
- **User isolation**: All queries must filter by `userId` (WHERE user_id = $1)
- **Soft vs Hard delete**: Categories/Wallets soft delete, Transactions hard delete
- **Balance calculation**: Always SUM postings, never store balance
- **Transfers are atomic**: 2 postings with opposite amounts in same transaction
- **Tests test behavior**: Not implementation details (e.g., "user can create category" not "database.save called")

---

## Summary

**RED Phase Test Stubs:**
- ✅ `auth.service.spec.ts` - 10 tests (register, login, refresh)
- ✅ `categories.service.spec.ts` - 25+ tests (CRUD, filters, soft delete)
- ✅ `wallets.service.spec.ts` - 20+ tests (CRUD, balance calculation, soft delete)
- ✅ `transactions.service.spec.ts` - 25+ tests (income/expense/transfer, atomic operations)

**Request/Response DTOs:**
- ✅ All request DTOs with validation decorators
- ✅ All response DTOs with @ApiProperty decorators
- ✅ Consistent response envelope (data + meta)
- ✅ Pagination support for list endpoints

**Service Method Signatures:**
- ✅ All methods with clear TODO comments
- ✅ Parameter types and return types defined
- ✅ Error scenarios documented
- ✅ Ready for implementation

---

This is the **RED phase**. Tests will fail. Implement the services in Phase 5 (GREEN phase) to make them pass.

Ready for implementation? 🚀
