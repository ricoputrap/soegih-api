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
- ✅ Test the REAL service (not mocked)
- ✅ Mock DEPENDENCIES only (repository, utilities, external services)
- ✅ Tests FAIL initially (RED phase) - no implementation yet
- ✅ Test stubs with Arrange-Act-Assert structure
- ✅ Happy path tests (main success scenarios)
- ✅ Error case tests (validation, not found, conflicts)
- ✅ Edge case tests (boundary conditions, permissions)
- ✅ All tests will PASS when real implementation is added (GREEN phase)
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
   - **Create REAL service (NOT mocked)**
   - **Mock DEPENDENCIES ONLY** (repository, utilities, external services)
   - beforeEach setup:
     - Create mock repository with `jest.fn()` for each method
     - Create TestingModule with **real service** + mocked dependencies
     - Inject mocked repository via provider token
   - Describe blocks grouped by operation (create, getAll, getById, update, delete)
   - Each test with Arrange-Act-Assert structure:
     - **Arrange:** Set up mock dependency return values with `.mockResolvedValue()` or `.mockRejectedValue()`
     - **Act:** Call REAL service method (which calls mocked dependencies)
     - **Assert:** Verify service behavior AND verify dependencies were called correctly
   - **All tests FAIL (RED phase)** until real service implementation is added
   - Tests will PASS when implementation is complete (GREEN phase)

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

## Test Structure Example (REAL SERVICE + MOCKED DEPENDENCIES)

```typescript
describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;  // ← Mock dependency
  const userId = 'user-123';

  beforeEach(async () => {
    // Create mock REPOSITORY (dependency), not the service
    mockCategoryRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteSingle: jest.fn(),
      deleteMultiple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,  // ← Real service (NOT mocked)
        {
          provide: CATEGORIES_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,  // ← Mock the dependency
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
        name: 'Groceries',
        type: 'expense',
        created_at: new Date(),
        deleted_at: null,
      };
      // Mock repository return value (dependency behavior)
      mockCategoryRepository.create.mockResolvedValue(mockResponse);

      // Act (call REAL service)
      const result = await service.create(userId, createDto);

      // Assert - verify service behavior
      expect(result.id).toBe('cat-123');
      expect(result.name).toBe('Groceries');
      // Verify repository was called correctly (service integration)
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should throw ConflictException if name+type already exists', async () => {
      // Arrange
      const createDto: CreateCategoryDto = { name: 'Groceries', type: 'expense' };
      // Repository throws error (dependency behavior)
      mockCategoryRepository.create.mockRejectedValue(
        new ConflictException('Category already exists'),
      );

      // Act & Assert - service should propagate error
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
      // Verify service called repository
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(userId, createDto);
    });
  });
});
```

## Notes - TDD Best Practices

### What to Mock vs What to Keep Real
- ✅ **Mock DEPENDENCIES:** Repository, utilities, external services, JWT generation, bcrypt
- ✅ **Keep REAL:** The service being tested (AuthService, CategoriesService, etc.)

### Why?
- Tests verify real service logic
- Tests define how service integrates with dependencies
- Tests FAIL until service is implemented (true TDD RED phase)
- Tests PASS when implementation is added (true TDD GREEN phase)

### Arrange-Act-Assert Pattern with Real Services
1. **Arrange:** Mock dependency return values (`.mockResolvedValue()` / `.mockRejectedValue()`)
2. **Act:** Call REAL service method (which may call mocked dependencies)
3. **Assert:** Verify service behavior AND verify dependencies were called correctly

### Key Differences from Mocking Service Itself
| Pattern | Service | Dependencies | Tests Pass? | Is TDD? |
|---------|---------|--------------|-----------|---------|
| **Correct (Real + Mocked Deps)** | Real ✅ | Mocked ✅ | ❌ FAIL initially | ✅ TRUE TDD |
| **Incorrect (Mocked Service)** | Mocked ❌ | Mocked ❌ | ✅ PASS immediately | ❌ NOT TDD |

- Each test is **independent** - order doesn't matter
- Test names are **descriptive** - explain what is being tested
- **RED phase:** Tests will **FAIL** - this is correct and expected with real services
- Implementation phase: Add business logic to make tests PASS
- Service methods should call mocked dependencies to handle the logic

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
