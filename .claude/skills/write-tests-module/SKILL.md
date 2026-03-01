---
name: write-tests-module
description: Generate complete test files and contracts (DTOs, types, repository interfaces) for a NestJS module following TDD principles
---

# Write Tests Module

Generate complete test files and module contracts for any NestJS feature module following Test-Driven Development (TDD) principles.

## Behavior

This skill:
1. Accepts a module name from your project
2. Accepts a reference file with specifications (requirements, design docs, swagger, etc.)
3. Generates complete RED phase test files and module contracts:
   - Service tests (`.service.spec.ts`) - unit tests for business logic
   - Repository interface (`.repository.interface.ts`) - ORM-agnostic data access contract
   - DTOs (`.dto.ts`) - request/response shapes with validation
   - Types/Enums (`.types.ts`) - domain types and constants
   - Controller tests (`.controller.spec.ts`) - HTTP endpoint tests
4. All artifacts define contracts for implementation
5. Tests are in RED phase (intentionally failing - no implementation yet)

## What It Does

**Generates complete module contracts** that define the system design:
- ✅ **Service tests:** Test REAL service logic (not mocked), mock ONLY dependencies
- ✅ **Repository interface:** ORM-agnostic contract for data access
- ✅ **DTOs:** Request/response validation with Swagger decorators
- ✅ **Types/Enums:** Domain types and business constants
- ✅ **Controller tests:** HTTP endpoint contracts (mocked service)
- ✅ Tests FAIL initially (RED phase) - no implementation yet
- ✅ Test stubs with Arrange-Act-Assert structure
- ✅ Happy path tests (main success scenarios)
- ✅ Error case tests (validation, not found, conflicts)
- ✅ Edge case tests (boundary conditions, permissions)
- ✅ All tests will PASS when implementations added (GREEN phase)
- ✅ Jest/TypeScript format with proper imports

## Supported Arguments

```
/write-tests-module {module-name} {reference-file}
```

**Arguments:**
- `{module-name}` - Name of the feature module (e.g., `auth`, `users`, `products`)
- `{reference-file}` - Path to file containing test specifications
  - Can be: requirements doc, design doc, swagger spec, existing test stubs, etc.
  - File should contain test scenarios, business rules, and expected behavior
  - Examples: `docs/PHASE5_TDD.md`, `docs/requirements.md`, `docs/swagger.yaml`

## Example Usage

```
/write-tests-module auth docs/PHASE5_TDD.md
/write-tests-module users docs/requirements.md
/write-tests-module products @docs/DESIGN.md
/write-tests-module payments docs/swagger.yaml
```

## Implementation

When user invokes with module name and reference file (e.g., `/write-tests-module auth docs/PHASE5_TDD.md`):

1. **Validate arguments** - Module name and reference file path provided

2. **Read reference file** - Extract specifications for the module
   - Extract test scenarios (happy paths, error cases, edge cases)
   - Identify operations and HTTP endpoints
   - Understand input/output contracts
   - Identify domain types and enums
   - Identify dependencies (repositories, external services)

3. **Generate Repository Interface** (`src/{module}/repositories/{module}.repository.interface.ts`):
   - Define `I{Module}Repository` interface with methods needed
   - Define data types for inputs/outputs (ORM-agnostic)
   - Export `{MODULE}_REPOSITORY_TOKEN = Symbol('{MODULE}_REPOSITORY')`
   - Document each method's purpose and contract
   - Example: `findById()`, `create()`, `update()`, `delete()`, `findMany()`

4. **Generate DTOs** (`src/{module}/{module}.dto.ts`):
   - Create request DTOs: `Create{Module}Dto`, `Update{Module}Dto`
   - Create response DTOs: `{Module}ResponseDto`
   - Add `@ApiProperty()` decorators for Swagger
   - Add `@IsX()` validation decorators (class-validator)
   - Add field descriptions and examples
   - Include all validation rules (length, format, enum, required/optional)

5. **Generate Types/Enums** (`src/{module}/{module}.types.ts`):
   - Define TypeScript interfaces for domain entities
   - Define enums (e.g., status, types, categories)
   - Define constants
   - Keep types ORM-agnostic (use primitives, not Prisma types)

6. **Generate Service Tests** (`src/{module}/{module}.service.spec.ts`):
   - Proper imports (Test, TestingModule, expect, etc.)
   - **Create REAL service (NOT mocked)**
   - **Mock DEPENDENCIES ONLY** (repository, utilities, external services)
   - beforeEach setup:
     - Identify service dependencies from service constructor
     - Create mock objects for each dependency with `jest.fn()`
     - Create TestingModule with **real service** + mocked dependencies
     - Inject mocked dependencies via provider tokens
   - Describe blocks grouped by service method
   - Each test with Arrange-Act-Assert structure:
     - **Arrange:** Set up mock dependency return values
     - **Act:** Call REAL service method (which calls mocked dependencies)
     - **Assert:** Verify service behavior AND dependency calls
   - **All tests FAIL (RED phase)** until service implementation added
   - Tests will PASS when implementation complete (GREEN phase)

7. **Generate Controller Tests** (`src/{module}/{module}.controller.spec.ts`):
   - Test HTTP endpoint contracts (not business logic)
   - **Mock the service completely** (service is not the unit under test here)
   - beforeEach setup:
     - Create mock service with `jest.fn()` for each method
     - Create TestingModule with **mocked service** + controller
   - Describe blocks grouped by HTTP endpoint
   - Each test verifies:
     - Correct HTTP status code
     - Correct service method called with right params
     - Correct response shape returned
     - Parameter extraction (@Body, @Param, @Query)
   - **All tests FAIL (RED phase)** until controller implementation added

8. **Display generated files** for review

9. **Confirm** before writing to disk

10. **Output summary:**
    - ✅ Repository interface: `src/{module}/repositories/{module}.repository.interface.ts`
    - ✅ DTOs: `src/{module}/{module}.dto.ts`
    - ✅ Types: `src/{module}/{module}.types.ts`
    - ✅ Service tests: `src/{module}/{module}.service.spec.ts` ({count} tests)
    - ✅ Controller tests: `src/{module}/{module}.controller.spec.ts` ({count} tests)
    - ✅ All tests in RED phase (will fail until implementation)
    - ✅ Ready for implementing service and controller methods

## NestJS Module Structure

Each feature module needs these files in RED phase (before implementation):

```
src/{module}/
├── repositories/
│   ├── {module}.repository.interface.ts      ← ORM-agnostic data access contract
│   └── prisma-{module}.repository.spec.ts    ← (LATER) Tests for Prisma implementation
├── {module}.types.ts                         ← Domain types, enums, constants
├── {module}.dto.ts                           ← Request/response validation (Swagger decorators)
├── {module}.service.spec.ts                  ← RED phase: Service unit tests (real service, mocked repo)
├── {module}.controller.spec.ts               ← RED phase: Controller endpoint tests (mocked service)
├── {module}.service.ts                       ← (LATER) Service implementation with business logic
├── {module}.controller.ts                    ← (LATER) HTTP endpoints
└── {module}.module.ts                        ← (LATER) NestJS module declaration & DI setup
```

### File Purposes

| File | Purpose | Tests? | Implementation? |
|------|---------|--------|-----------------|
| `repository.interface.ts` | Define ORM-agnostic data access contract | No | No |
| `{module}.types.ts` | Domain types, enums, constants | No | No |
| `{module}.dto.ts` | Request/response validation shapes | No | No |
| `{module}.service.spec.ts` | Unit tests for service business logic | ✅ RED | - |
| `{module}.controller.spec.ts` | HTTP endpoint contract tests | ✅ RED | - |
| `{module}.service.ts` | Service implementation (business logic) | - | ✅ GREEN |
| `{module}.controller.ts` | Controller implementation (HTTP routes) | - | ✅ GREEN |
| `{module}.module.ts` | NestJS module & dependency injection | - | ✅ GREEN |
| `prisma-{module}.repository.ts` | Prisma-specific repository implementation | - | ✅ GREEN |
| `prisma-{module}.repository.spec.ts` | Repository + Prisma integration tests | ✅ Later | - |

## File Examples (RED Phase)

### 1. Repository Interface
```typescript
// src/categories/repositories/categories.repository.interface.ts
export const CATEGORIES_REPOSITORY_TOKEN = Symbol('CATEGORIES_REPOSITORY');

export interface ICategoriesRepository {
  create(userId: string, data: { name: string; type: string }): Promise<Category>;
  findMany(userId: string, filters?: { type?: string }): Promise<Category[]>;
  findById(id: string, userId: string): Promise<Category | null>;
  update(id: string, userId: string, data: Partial<{ name: string; type: string }>): Promise<Category>;
  deleteSingle(id: string, userId: string): Promise<void>;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

### 2. DTOs
```typescript
// src/categories/categories.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, MaxLength, MinLength, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'expense', enum: ['income', 'expense'] })
  @IsEnum(['income', 'expense'])
  @IsNotEmpty()
  type: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Groceries', required: false })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'expense', required: false, enum: ['income', 'expense'] })
  @IsEnum(['income', 'expense'])
  type?: string;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  created_at: number; // Unix epoch

  @ApiProperty()
  updated_at: number;
}
```

### 3. Types/Enums
```typescript
// src/categories/categories.types.ts
export type CategoryType = 'income' | 'expense';

export const CATEGORY_TYPES: Record<CategoryType, CategoryType> = {
  income: 'income',
  expense: 'expense',
} as const;
```

### 4. Service Tests (Real Service + Mocked Repository)
```typescript
// src/categories/categories.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { ICategoriesRepository, CATEGORIES_REPOSITORY_TOKEN } from './repositories/categories.repository.interface.js';
import { CreateCategoryDto } from './categories.dto.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockRepository: jest.Mocked<ICategoriesRepository>;
  const userId = 'user-123';

  beforeEach(async () => {
    // Mock ONLY the repository dependency
    mockRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteSingle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,  // ← Real service (NOT mocked)
        {
          provide: CATEGORIES_REPOSITORY_TOKEN,
          useValue: mockRepository,  // ← Mock the dependency
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('should create a category with valid input', async () => {
      // Arrange
      const createDto: CreateCategoryDto = { name: 'Groceries', type: 'expense' };
      const mockResponse = {
        id: 'cat-123',
        userId,
        name: 'Groceries',
        type: 'expense',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      mockRepository.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.id).toBe('cat-123');
      expect(result.name).toBe('Groceries');
      expect(mockRepository.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should throw ConflictException if category already exists', async () => {
      // Arrange
      const createDto: CreateCategoryDto = { name: 'Groceries', type: 'expense' };
      mockRepository.create.mockRejectedValue(
        new ConflictException('Category already exists'),
      );

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.create).toHaveBeenCalledWith(userId, createDto);
    });
  });

  describe('getAll', () => {
    it('should return all categories for user', async () => {
      // Arrange
      const mockCategories = [
        { id: 'cat-1', userId, name: 'Groceries', type: 'expense', created_at: new Date(), updated_at: new Date(), deleted_at: null },
        { id: 'cat-2', userId, name: 'Salary', type: 'income', created_at: new Date(), updated_at: new Date(), deleted_at: null },
      ];
      mockRepository.findMany.mockResolvedValue(mockCategories);

      // Act
      const result = await service.getAll(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, undefined);
    });
  });
});
```

### 5. Controller Tests (Mocked Service)
```typescript
// src/categories/categories.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './categories.dto.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let mockService: jest.Mocked<CategoriesService>;
  const userId = 'user-123';

  beforeEach(async () => {
    // Mock the SERVICE (controller doesn't test service logic)
    mockService = {
      create: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('POST /categories', () => {
    it('should call service.create and return response', async () => {
      // Arrange
      const createDto: CreateCategoryDto = { name: 'Groceries', type: 'expense' };
      const mockResponse = { id: 'cat-123', name: 'Groceries', type: 'expense', created_at: 1234567890, updated_at: 1234567890 };
      mockService.create.mockResolvedValue(mockResponse);
      const req = { user: { id: userId } };

      // Act
      const result = await controller.create(createDto, req);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockService.create).toHaveBeenCalledWith(userId, createDto);
    });
  });

  describe('GET /categories', () => {
    it('should call service.getAll and return list', async () => {
      // Arrange
      const mockCategories = [
        { id: 'cat-1', name: 'Groceries', type: 'expense', created_at: 1234567890, updated_at: 1234567890 },
      ];
      mockService.getAll.mockResolvedValue(mockCategories);
      const req = { user: { id: userId } };

      // Act
      const result = await controller.getAll(req);

      // Assert
      expect(result).toEqual(mockCategories);
      expect(mockService.getAll).toHaveBeenCalledWith(userId);
    });
  });
});
```

## About Entities

**Entities are NOT created in RED phase for this skill.** Here's why:

- **Entities** are database/ORM-specific (Prisma models in your case)
- **Repository interfaces** define the ORM-agnostic contract
- Services and tests only know about repository types, not Prisma entities
- Entities are generated automatically by Prisma from `prisma/schema.prisma`

Your Prisma schema already exists from `/setup-db`, so:
- Category, Wallet, TransactionEvent, Posting entities exist in `prisma.schema`
- Prisma generates the TypeScript types automatically
- Repository interface types reference what repository returns (not Prisma models)
- Keep types simple and ORM-agnostic in your domain layer

If you need new entities:
1. Update `prisma/schema.prisma`
2. Run `pnpm prisma:generate`
3. Prisma types are ready to use

## Notes - TDD Best Practices

### What to Mock vs What to Keep Real
- ✅ **Mock DEPENDENCIES:** Repository/data access layer, external APIs, utilities, libraries
- ✅ **Keep REAL:** The service being tested (the unit under test)

### Why?
- Tests verify real service logic and business rules
- Tests define how service integrates with its dependencies
- Tests FAIL until service is implemented (true TDD RED phase)
- Tests PASS when implementation is added (true TDD GREEN phase)
- Mocking only dependencies keeps tests fast and isolated

### Arrange-Act-Assert Pattern with Real Services
1. **Arrange:** Mock dependency return values (`.mockResolvedValue()` / `.mockRejectedValue()`)
2. **Act:** Call REAL service method (which calls mocked dependencies internally)
3. **Assert:** Verify service behavior AND verify dependencies were called correctly

### Key Differences: Real Service + Mocked Deps vs Mocking Service Itself
| Pattern | Service | Dependencies | Tests Pass? | Is TDD? |
|---------|---------|--------------|-----------|---------|
| **Correct (Real + Mocked Deps)** | Real ✅ | Mocked ✅ | ❌ FAIL initially | ✅ TRUE TDD |
| **Incorrect (Mocked Service)** | Mocked ❌ | Mocked ❌ | ✅ PASS immediately | ❌ NOT TDD |

When you mock the service itself, tests pass immediately without any implementation — that's not TDD. True TDD requires tests to fail first (RED), then implement (GREEN), then refactor.

### Guidelines
- Each test is **independent** - order doesn't matter
- Test names are **descriptive** - explain what behavior is being tested
- **RED phase:** Tests will **FAIL** - this is correct and expected before implementation
- **Implementation phase:** Add business logic to service to make tests PASS
- Service methods should call mocked dependencies to complete the business logic
- One assertion per test is ideal; 2-3 maximum

## Workflow

Typical workflow when using this skill:

```
1. Design/Requirements defined          ← What should the system do?
2. /write-tests-module {module}         ← RED phase (tests fail)
3. Implement service methods             ← GREEN phase (make tests pass)
4. Run `pnpm test -- src/{module}`      ← Verify all tests pass
5. Refactor code                         ← REFACTOR phase (clean up)
```

## Success Criteria

Test file is complete when:
- ✅ File created at `src/{module}/{module}.service.spec.ts`
- ✅ All test cases from reference file included
- ✅ Tests are in RED phase (all fail initially)
- ✅ Proper Jest/TypeScript syntax
- ✅ Service is real, dependencies are mocked
- ✅ Ready to implement service methods
