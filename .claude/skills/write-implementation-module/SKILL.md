---
name: write-implementation-module
description: Generate complete service, DTO, repository, and controller implementations for a module to pass test suite
---

# Write Implementation Module

Implement a complete Soegih API module with DTOs, repositories, services, and controllers to make tests PASS.

## Behavior

This skill:
1. Accepts a module name (auth, categories, wallets, transactions)
2. Generates all DTOs (request/response) with validation
3. Creates repository interface and Prisma implementation
4. Implements service methods with business logic
5. Implements controller with Swagger decorators
6. Updates module configuration (providers, imports, exports)
7. All tests transition to GREEN phase (passing)

## What It Does

**Generates production-ready implementations:**
- ✅ Request DTOs with class-validator decorators
- ✅ Response DTOs with @ApiProperty decorators
- ✅ Repository interface (ORM-agnostic contract)
- ✅ Prisma repository (actual database access)
- ✅ Service implementation (business logic)
- ✅ Controller implementation (HTTP endpoints)
- ✅ Module configuration with proper DI setup
- ✅ All tests should PASS after implementation

## Supported Arguments

```
/write-implementation-module {module-name}
```

**Module names:**
- `auth` - Authentication (register, login, logout, refresh)
- `categories` - Categories (CRUD, filters, soft delete)
- `wallets` - Wallets (CRUD, balance calculation, soft delete)
- `transactions` - Transactions (income/expense/transfer, atomic)

## Example Usage

```
/write-implementation-module auth
/write-implementation-module categories
/write-implementation-module wallets
/write-implementation-module transactions
```

## Implementation

When user invokes with module name (e.g., `categories`):

1. **Validate module name** - Must be one of: auth, categories, wallets, transactions

2. **Generate DTOs** from PHASE4_SWAGGER.md:
   - Create `src/{module}/dto/create-{module}.dto.ts`
   - Create `src/{module}/dto/update-{module}.dto.ts` (if applicable)
   - Create `src/{module}/dto/{module}-response.dto.ts`
   - Add all @ApiProperty, validation decorators (@IsString, @MinLength, etc.)
   - Handle optional fields (@IsOptional)
   - Handle conditional validation (@ValidateIf for transfer vs income/expense)

3. **Generate Repository Interface**:
   - Create `src/{module}/repositories/{module}.repository.interface.ts`
   - Define I{Module}Repository interface with all query/command methods
   - Define {MODULE}_REPOSITORY_TOKEN symbol for DI
   - Define input/output types (avoid database-specific types)

4. **Generate Prisma Repository**:
   - Create `src/{module}/repositories/prisma-{module}.repository.ts`
   - Implement I{Module}Repository with Prisma queries
   - Map Prisma errors to NestJS exceptions:
     - P2002 (unique) → ConflictException (409)
     - P2025 (not found) → NotFoundException (404)
   - Transform Prisma rows to domain types
   - Include all indexes and filters from PHASE3_DESIGN

5. **Generate Service Implementation**:
   - Create `src/{module}/{module}.service.ts`
   - Inject repository interface (not PrismaService directly)
   - Implement all methods from PHASE5_TDD
   - Business logic:
     - User isolation (WHERE user_id filter)
     - Validation logic
     - Soft delete handling
     - Balance calculation (wallets)
     - Atomic transactions (transfers)
   - Error handling with proper exceptions
   - Logging for important operations

6. **Generate Controller Implementation**:
   - Create `src/{module}/{module}.controller.ts`
   - Add all @Api* decorators from PHASE4_SWAGGER
   - Implement all endpoints
   - Extract parameters (@Body, @Param, @Query, @Req)
   - Handle authentication (@UseGuards, @CurrentUser)
   - Call service methods correctly
   - Return proper response format (data + meta + pagination if list)

7. **Update Module Configuration**:
   - Update `src/{module}/{module}.module.ts`
   - Register service in providers
   - Register repository token in providers
   - Add controller to declarations
   - Add imports if needed (PrismaModule already global)
   - Export service if needed by other modules

8. **Create repository test file** (optional):
   - Create `src/{module}/repositories/prisma-{module}.repository.spec.ts`
   - Test Prisma interactions
   - Test error mapping
   - Test data transformation

9. **Display generated files** for review

10. **Output summary:**
    - ✅ DTOs created: {count}
    - ✅ Repository interface created
    - ✅ Repository implementation created
    - ✅ Service implementation created
    - ✅ Controller implementation created
    - ✅ Module configuration updated
    - ✅ Ready for `/test-module {module}` to verify tests pass

## Implementation Details

### Service Method Pattern

```typescript
@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY_TOKEN)
    private readonly repository: ICategoriesRepository,
  ) {}

  async create(userId: string, createDto: CreateCategoryDto): Promise<any> {
    // 1. Validate business rules
    // 2. Check for conflicts (unique constraints)
    // 3. Call repository
    // 4. Handle errors
    // 5. Return response DTO
  }
}
```

### Controller Method Pattern

```typescript
@Controller('categories')
@UseGuards(JwtGuard)
@ApiCookieAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '...' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async create(
    @Body() createDto: CreateCategoryDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(user.id, createDto);
  }
}
```

### Repository Pattern

```typescript
export const CATEGORIES_REPOSITORY_TOKEN = Symbol('CATEGORIES_REPOSITORY');

export interface ICategoriesRepository {
  findMany(userId: string, filters?: any): Promise<Category[]>;
  findById(userId: string, id: string): Promise<Category | null>;
  create(userId: string, data: any): Promise<Category>;
  // ...
}

@Injectable()
export class PrismaCategoriesRepository implements ICategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: { user_id: userId, ...data },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }
}
```

## Notes

- **Repository Pattern**: Services depend on interfaces, not Prisma directly
  - Allows swapping implementations without touching services
  - Easier testing (mock repositories)
  - Better separation of concerns

- **User Isolation**: Every query includes `WHERE user_id = $1`
  - Critical security requirement
  - Prevents cross-user data leakage

- **Error Mapping**: Prisma errors → NestJS exceptions
  - P2002 → ConflictException (409)
  - P2025 → NotFoundException (404)
  - P2003 → BadRequestException (400) if FK missing

- **DTOs with Validation**: Input validation at API boundary
  - Use class-validator decorators
  - DTO validation happens automatically in NestJS
  - Returns 400 Bad Request if invalid

- **Response Format**: Consistent envelope
  - All responses: `{ data: {...}, meta: {...}, pagination: {...} }`
  - Pagination only for list endpoints
  - Meta includes timestamp and version

## Workflow

This skill is step 3 of the TDD workflow:

```
1. /setup-db                          ← Database setup
2. /write-tests-module {module}       ← Generate failing tests (RED)
3. /write-implementation-module {m}   ← Implement to pass tests (GREEN)
4. /test-module {module}              ← Run and verify tests pass
5. Repeat 2-4 for next module
```

## Related Skills

- `/write-tests-module` - Generate test files (RED phase)
- `/test-module` - Run tests for a module (provided skill)

## Success Criteria

Implementation is complete when:
- ✅ All files created (DTOs, repository, service, controller)
- ✅ Module configuration updated with DI setup
- ✅ All methods implemented with full business logic
- ✅ `/test-module {module}` shows all tests passing ✅
- ✅ Ready to move to next module
