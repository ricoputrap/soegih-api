---
name: write-tests-module
description: Generate test stub files for a specific module (auth, categories, wallets, transactions) in RED phase (failing tests)
---

# Write Tests Module

Extract and generate test files for a specific Soegih API module from PHASE5_TDD specifications.

## Behavior

This skill:
1. Accepts a module name (auth, categories, wallets, transactions)
2. Extracts test stubs from `docs/PHASE5_TDD.md`
3. Creates `.spec.ts` test file with complete test suite
4. Tests are in RED phase (intentionally failing - no implementation yet)
5. Provides clear test names and assertions for TDD workflow

## What It Does

**Generates test files** that define the contract for service implementations:
- ✅ Test stubs with Arrange-Act-Assert structure
- ✅ Happy path tests (main success scenarios)
- ✅ Error case tests (validation, not found, conflicts)
- ✅ Edge case tests (boundary conditions, permissions)
- ✅ All tests will FAIL until services are implemented
- ✅ Tests mock services/repositories (no DB access)
- ✅ Jest/TypeScript format with proper imports

## Supported Arguments

```
/write-tests-module {module-name}
```

**Module names:**
- `auth` - Authentication service tests
- `categories` - Categories service tests
- `wallets` - Wallets service tests
- `transactions` - Transactions service tests

## Example Usage

```
/write-tests-module auth
/write-tests-module categories
/write-tests-module wallets
/write-tests-module transactions
```

## Implementation

When user invokes with module name (e.g., `auth`):

1. **Validate module name** - Must be one of: auth, categories, wallets, transactions

2. **Read PHASE5_TDD.md** - Extract the test suite for the module
   - Auth: Tests for register, login, refresh
   - Categories: Tests for CRUD, filters, soft delete
   - Wallets: Tests for CRUD, balance calculation, soft delete
   - Transactions: Tests for income/expense/transfer, atomic operations

3. **Extract test stubs** from PHASE5_TDD.md for the module

4. **Generate `.spec.ts` file** with:
   - Proper imports (Test, TestingModule, expect, etc.)
   - **MOCK service setup using jest.Mock (not real implementation)**
   - beforeEach creates mock service with jest.fn() for each method
   - Mock service injected via `useValue: mockService` provider
   - Describe blocks grouped by operation (create, getAll, getById, update, delete)
   - Each test with Arrange-Act-Assert structure:
     - **Arrange:** Set up mock return values with `mockService.method.mockResolvedValue()` or `mockRejectedValue()`
     - **Act:** Call service method
     - **Assert:** Verify return value AND verify mock was called correctly with `expect(mockService.method).toHaveBeenCalledWith()`
   - All tests intentionally failing (RED phase) until real implementation added

5. **Create file** at appropriate location:
   - `src/auth/auth.service.spec.ts`
   - `src/categories/categories.service.spec.ts`
   - `src/wallets/wallets.service.spec.ts`
   - `src/transactions/transactions.service.spec.ts`

6. **Display generated file** for review

7. **Confirm** before writing to disk

8. **Output summary:**
   - ✅ Test file created: `src/{module}/{module}.service.spec.ts`
   - ✅ Total tests: {count}
   - ✅ All tests in RED phase (will fail until implementation)
   - ✅ Ready for `/write-implementation-module {module}`

## Test Structure Example (WITH MOCKS)

```typescript
describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockCategoriesService: {
    create: jest.Mock;
    getAll: jest.Mock;
    getById: jest.Mock;
    update: jest.Mock;
    deleteSingle: jest.Mock;
    deleteMultiple: jest.Mock;
  };
  const userId = 'user-123';

  beforeEach(async () => {
    // Create mock service with jest.fn() for each method
    mockCategoriesService = {
      create: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      deleteSingle: jest.fn(),
      deleteMultiple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,  // ← Mock the service
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
        data: { id: 'cat-123', name: 'Groceries', type: 'expense', created_at: 1709299445, deleted_at: null },
        meta: { timestamp: 1709299445, version: '1.0' },
      };
      mockCategoriesService.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe('Groceries');
      expect(mockCategoriesService.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should throw ConflictException if name+type already exists', async () => {
      // Arrange
      const createDto: CreateCategoryDto = { name: 'Groceries', type: 'expense' };
      mockCategoriesService.create.mockRejectedValue(
        new ConflictException('Category already exists'),
      );

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCategoriesService.create).toHaveBeenCalledWith(userId, createDto);
    });
  });
});
```

## Notes

- **Tests use MOCKED services (not real implementation)** - critical for unit testing
  - Mock created with `jest.fn()` for each method
  - Mock injected via `useValue: mockService` in TestingModule
  - No actual database access
  - No dependencies on real implementation
  - Tests verify behavior through mock assertions
- Each test is **independent** - order doesn't matter
- Tests follow **Arrange-Act-Assert** pattern:
  1. **Arrange:** Set up mock return values with `.mockResolvedValue()` or `.mockRejectedValue()`
  2. **Act:** Call the service method being tested
  3. **Assert:** Verify return value AND verify mock was called correctly
- Test names are **descriptive** - explain what is being tested
- RED phase: Tests will **fail** - this is correct and expected
- No need to run tests yet - that's the next step with `/write-implementation-module`

## Workflow

This skill is step 2 of the TDD workflow:

```
1. /setup-db                          ← Database setup
2. /write-tests-module {module}       ← You are here (RED phase)
3. /write-implementation-module {m}   ← Implement to pass tests (GREEN phase)
4. /run-tests-module {module}         ← Run tests to verify
5. Repeat 2-4 for next module
```

## Related Skills

- `/setup-db` - Initialize database (must run first)
- `/write-implementation-module` - Implement service code to pass tests
- `/test-module` - Run tests for a module (provided skill)

## Success Criteria

Test file is complete when:
- ✅ File created at `src/{module}/{module}.service.spec.ts`
- ✅ All test stubs from PHASE5_TDD.md included
- ✅ Tests are in RED phase (will fail)
- ✅ Proper Jest/TypeScript syntax
- ✅ Ready for `/write-implementation-module {module}`
