---
name: write-implementation-module
description: Generate complete service, repository, and controller implementations for a NestJS module to pass test suite
---

# Write Implementation Module

Implement a complete NestJS module with services, repositories, and controllers to make RED phase tests PASS (GREEN phase).

## Behavior

This skill:
1. Accepts a module name from your project
2. Reads existing test file to understand contracts
3. Implements service methods with business logic
4. Implements repository with actual data access
5. Implements controller with HTTP endpoints
6. Updates module configuration (providers, imports, exports)
7. All tests transition to GREEN phase (passing)

## What It Does

**Generates production-ready implementations:**
- ✅ Service implementation (business logic matching service tests)
- ✅ Repository implementation (data access matching repository interface)
- ✅ Controller implementation (HTTP endpoints matching controller tests)
- ✅ Module configuration with proper dependency injection setup
- ✅ Error handling and validation
- ✅ All tests transition from RED to GREEN phase ✅

## Supported Arguments

```
/write-implementation-module {module-name}
```

- `{module-name}` - Name of the feature module to implement (e.g., `auth`, `users`, `products`)

## Example Usage

```
/write-implementation-module auth
/write-implementation-module users
/write-implementation-module products
/write-implementation-module payments
```

## Implementation

When user invokes with module name (e.g., `/write-implementation-module auth`):

1. **Validate module name** - Module directory exists at `src/{module}`

2. **Read existing test files** to understand contracts:
   - Read `src/{module}/{module}.service.spec.ts` to understand service interface
   - Read `src/{module}/{module}.controller.spec.ts` to understand controller interface
   - Understand mocked dependencies and their expected behavior
   - Identify what needs to be implemented based on failing tests

3. **Implement Service**:
   - Update `src/{module}/{module}.service.ts` (from test stub)
   - Inject repository interface via constructor
   - Implement each method to make service tests PASS
   - Business logic:
     - Input validation (using injected repository or custom validation)
     - Dependency calls (call mocked repository methods)
     - Error handling (throw appropriate NestJS exceptions)
     - Data transformation (DTOs, response shaping)
   - Methods should match service test expectations exactly

4. **Implement Repository**:
   - Create `src/{module}/repositories/prisma-{module}.repository.ts`
   - Implement repository interface from existing interface file
   - Use Prisma queries for actual data access
   - Map Prisma errors to NestJS exceptions:
     - P2002 (unique constraint) → ConflictException (409)
     - P2025 (not found) → NotFoundException (404)
     - P2003 (FK constraint) → BadRequestException (400)
   - Transform Prisma rows to domain types (if needed)
   - Handle all repository methods from interface

5. **Implement Controller**:
   - Update `src/{module}/{module}.controller.ts` (from test stub)
   - Add HTTP decorators (@Get, @Post, @Put, @Delete)
   - Add Swagger decorators (@ApiOperation, @ApiResponse, etc.)
   - Extract parameters (@Body, @Param, @Query, @Req, @CurrentUser)
   - Call service methods with correct parameters
   - Return responses matching controller test expectations
   - Handle authentication guards if needed

6. **Update Module Configuration**:
   - Update `src/{module}/{module}.module.ts`
   - Register repository implementation as provider:
     ```typescript
     {
       provide: {MODULE}_REPOSITORY_TOKEN,
       useClass: Prisma{Module}Repository,
     }
     ```
   - Import PrismaModule if needed (usually global in NestJS apps)
   - Ensure service is in providers
   - Ensure controller is in controllers
   - Export service if needed by other modules

7. **Create Repository Tests** (optional, but recommended):
   - Create `src/{module}/repositories/prisma-{module}.repository.spec.ts`
   - Test Prisma interactions and error handling
   - Test data transformation (Prisma rows → domain types)
   - Verify error mapping works correctly

8. **Display generated files** for review

9. **Output summary:**
    - ✅ Service implementation updated: `src/{module}/{module}.service.ts`
    - ✅ Repository implementation created: `src/{module}/repositories/prisma-{module}.repository.ts`
    - ✅ Controller implementation updated: `src/{module}/{module}.controller.ts`
    - ✅ Module configuration updated: `src/{module}/{module}.module.ts`
    - ✅ Ready for `pnpm test -- src/{module}` to verify tests pass ✅

## Implementation Examples

### Service Implementation Pattern

```typescript
// src/categories/categories.service.ts
import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import type { ICategoriesRepository, CATEGORIES_REPOSITORY_TOKEN } from './repositories/categories.repository.interface.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY_TOKEN)
    private readonly repository: ICategoriesRepository,
  ) {}

  async create(userId: string, createDto: CreateCategoryDto) {
    // Business logic: Call mocked/real repository
    // Service tests mock repository, so this will use mock return values during testing
    return await this.repository.create(userId, createDto);
  }

  async getAll(userId: string, filters?: any) {
    return await this.repository.findMany(userId, filters);
  }

  async getById(id: string, userId: string) {
    const category = await this.repository.findById(id, userId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, userId: string, updateDto: UpdateCategoryDto) {
    return await this.repository.update(id, userId, updateDto);
  }

  async delete(id: string, userId: string) {
    return await this.repository.deleteSingle(id, userId);
  }
}
```

### Controller Implementation Pattern

```typescript
// src/categories/categories.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './categories.dto.js';

@Controller('categories')
@ApiTags('Categories')
@UseGuards(JwtAuthGuard)  // Adjust based on your auth strategy
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async create(@Body() createDto: CreateCategoryDto, @Req() req: any) {
    return this.categoriesService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async getAll(@Req() req: any) {
    return this.categoriesService.getAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async getById(@Param('id') id: string, @Req() req: any) {
    return this.categoriesService.getById(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto, @Req() req: any) {
    return this.categoriesService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.categoriesService.delete(id, req.user.id);
  }
}
```

### Repository Implementation Pattern

```typescript
// src/categories/repositories/prisma-categories.repository.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ICategoriesRepository, Category } from './categories.repository.interface.js';
import type { CreateCategoryDto, UpdateCategoryDto } from '../categories.dto.js';

@Injectable()
export class PrismaCategoriesRepository implements ICategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: { userId, ...data },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  async findMany(userId: string, filters?: any): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { userId, deletedAt: null, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    return await this.prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async update(id: string, userId: string, data: UpdateCategoryDto): Promise<Category> {
    const exists = await this.findById(id, userId);
    if (!exists) {
      throw new NotFoundException('Category not found');
    }
    return await this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteSingle(id: string, userId: string): Promise<void> {
    const exists = await this.findById(id, userId);
    if (!exists) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },  // Soft delete
    });
  }
}
```

### Module Configuration Pattern

```typescript
// src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaCategoriesRepository } from './repositories/prisma-categories.repository.js';
import { CATEGORIES_REPOSITORY_TOKEN } from './repositories/categories.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORIES_REPOSITORY_TOKEN,
      useClass: PrismaCategoriesRepository,
    },
  ],
  exports: [CategoriesService],  // If other modules need this service
})
export class CategoriesModule {}
```

## Key Principles

### Repository Pattern
- **Services depend on interfaces, not Prisma directly**
  - Inject via `@Inject(TOKEN)` with interface type
  - Repository interface defines ORM-agnostic contract
  - Prisma implementation handles database details
  - Easier testing: service tests mock repository
  - Easier maintenance: swap implementations without touching services

### Read Existing Tests to Understand Contracts
- Service tests tell you:
  - What methods the service must have
  - What parameters they accept
  - What they return or throw
  - How they interact with mocked dependencies
- Controller tests tell you:
  - What HTTP methods and paths
  - What status codes to return
  - What service methods to call
- Repository tests (once written) tell you:
  - What data access methods are needed
  - How to handle errors and constraints

### Error Handling
- Map Prisma errors to NestJS exceptions:
  - `P2002` (unique constraint) → `ConflictException` (409)
  - `P2025` (record not found) → `NotFoundException` (404)
  - `P2003` (foreign key) → `BadRequestException` (400)
- Service layer should throw NestJS exceptions
- Controller layer relies on global exception filter

### User Isolation (Security Critical)
- Every query must filter by user ID
- Prevents one user from accessing another user's data
- Example: `WHERE userId = ? AND deletedAt IS NULL`

## Workflow

Typical TDD workflow using this skill:

```
1. /setup-db {design-file}                      ← Initialize database
2. /write-tests-module {module} {reference}     ← RED phase (tests fail)
3. /write-implementation-module {module}         ← GREEN phase (tests pass)
4. pnpm test -- src/{module}                    ← Verify all tests pass ✅
5. Repeat 2-4 for next module
```

## Related Skills

- `/write-tests-module` - Generate RED phase test files and contracts
- `/setup-db` - Initialize database from design spec
- Use `pnpm test -- src/{module}` to run tests and verify

## Success Criteria

Implementation is complete when:
- ✅ Service implementation created/updated with all methods
- ✅ Repository implementation created with data access logic
- ✅ Controller implementation created/updated with HTTP endpoints
- ✅ Module configuration updated (providers, controllers)
- ✅ Running `pnpm test -- src/{module}` shows all tests passing ✅
- ✅ Ready to move to next module
