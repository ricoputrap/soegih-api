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
   - beforeEach/afterEach setup
   - Describe blocks grouped by operation (create, getAll, getById, update, delete)
   - Each test with Arrange-Act-Assert structure
   - Mock service setup (not actual DB calls)
   - All tests intentionally failing (RED phase)

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

## Test Structure Example

```typescript
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
      const createDto: CreateCategoryDto = { ... };

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe('Groceries');
    });

    it('should throw ConflictException if name+type already exists', async () => {
      // Arrange, Act, Assert
      await expect(...).rejects.toThrow(ConflictException);
    });
  });
});
```

## Notes

- Tests use **mocks** (not real database) - safe to run without Supabase
- Each test is **independent** - order doesn't matter
- Tests follow **Arrange-Act-Assert** pattern for clarity
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
