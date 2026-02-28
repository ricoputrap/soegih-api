# Soegih API - Phase 3: Architecture Design

**Date:** March 1, 2026
**Status:** Ready for Phase 3.5 (Quantitative Analysis)
**Timeline:** 1-day MVP sprint

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoint Design](#api-endpoint-design)
3. [Authentication Strategy](#authentication-strategy)
4. [Module & Service Architecture](#module--service-architecture)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Security Architecture](#security-architecture)
8. [Performance & Scaling Considerations](#performance--scaling-considerations)

---

## Database Schema

### Entity-Relationship Diagram

```
┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │
│ username (U) │
│ password     │
│ created_at   │
│ updated_at   │
└──┬───────────┘
   │
   ├─────────────────┬──────────────────┬──────────────────┐
   │                 │                  │                  │
   ▼                 ▼                  ▼                  ▼
┌─────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐
│  Category   │ │    Wallet    │ │TransactionEvent
│ ├─────────────┤ ├──────────────┤ ├───────────────┤
│ id (PK)     │ │ id (PK)      │ │ id (PK)       │
│ user_id (FK)│ │ user_id (FK) │ │ user_id (FK)  │
│ name        │ │ name (U)     │ │ type          │
│ type        │ │ type         │ │ occurred_at   │
│ description │ │ currency     │ │ note          │
│ deleted_at  │ │ deleted_at   │ │ payee         │
│ created_at  │ │ created_at   │ │ category_id(FK)
│ updated_at  │ │ updated_at   │ │ deleted_at    │
└─────────────┘ │ deleted_at   │ │ created_at    │
                └──────────────┘ │ updated_at    │
                      │          └───────────────┘
                      │                 │
                      └────────┬────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │    Posting       │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ event_id (FK)    │
                        │ wallet_id (FK)   │
                        │ amount           │
                        │ created_at       │
                        │ deleted_at       │
                        └──────────────────┘
```

### Table Definitions (Prisma Schema)

#### User

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // bcrypt hash
  created_at Int
  updated_at Int

  // Relations
  categories        Category[]
  wallets           Wallet[]
  transactions      TransactionEvent[]
}
```

**Indexes:**

- `username` (unique, for login lookup)
- `created_at` (for sorting/filtering)

---

#### Category

```prisma
model Category {
  id        String   @id @default(cuid())
  user_id   String
  name      String
  description String?
  type      CategoryType // "income" | "expense"
  deleted_at Int?
  created_at Int
  updated_at Int

  // Relations
  user      User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  transactions TransactionEvent[]

  @@unique([user_id, name, type]) // Allow "Groceries (income)" and "Groceries (expense)"
}

enum CategoryType {
  income
  expense
}
```

**Indexes:**

- `user_id` (for filtering by user)
- `user_id + name + type` (composite unique)
- `deleted_at` (for soft delete queries)

---

#### Wallet

```prisma
model Wallet {
  id        String   @id @default(cuid())
  user_id   String
  name      String
  type      WalletType // "cash" | "bank" | "e-wallet" | "other"
  currency  String @default("IDR")
  deleted_at Int?
  created_at Int
  updated_at Int

  // Relations
  user      User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  postings  Posting[]

  @@unique([user_id, name])
}

enum WalletType {
  cash
  bank
  e_wallet
  other
}
```

**Indexes:**

- `user_id` (for filtering by user)
- `user_id + name` (composite unique)
- `deleted_at` (for soft delete queries)

---

#### TransactionEvent

```prisma
model TransactionEvent {
  id        String   @id @default(cuid())
  user_id   String
  type      TransactionType // "income" | "expense" | "transfer"
  occurred_at Int
  note      String?
  payee     String?
  category_id String? // null for transfers
  deleted_at Int?
  created_at Int
  updated_at Int

  // Relations
  user      User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  category  Category? @relation(fields: [category_id], references: [id])
  postings  Posting[] // 1 for income/expense, 2 for transfer

  @@index([user_id])
  @@index([category_id])
  @@index([occurred_at])
}

enum TransactionType {
  income
  expense
  transfer
}
```

**Indexes:**

- `user_id` (for filtering by user)
- `category_id` (for category lookup)
- `occurred_at` (for sorting/filtering by date)
- `deleted_at` (for soft delete queries)

---

#### Posting

```prisma
model Posting {
  id        String   @id @default(cuid())
  event_id  String
  wallet_id String
  amount    Int // positive for debit, negative for credit
  created_at Int
  deleted_at Int? // soft delete only

  // Relations
  event     TransactionEvent @relation(fields: [event_id], references: [id], onDelete: Cascade)
  wallet    Wallet @relation(fields: [wallet_id], references: [id], onDelete: Cascade)

  @@index([event_id])
  @@index([wallet_id])
}
```

**Indexes:**

- `event_id` (for transaction lookup)
- `wallet_id` (for balance calculation)
- `deleted_at` (for soft delete)

---

### Data Constraints & Business Rules

| Constraint                                   | Implementation                                              | Rationale                                  |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| User → Category/Wallet/Transaction isolation | `WHERE user_id = $1` in all queries                         | Security: prevent cross-user data leakage  |
| Category name+type uniqueness per user       | Composite unique index `(user_id, name, type)`              | Allow duplicate names with different types |
| Wallet name uniqueness per user              | Composite unique index `(user_id, name)`                    | Prevent duplicate wallet names             |
| Transaction type immutability                | Application validation (read-only after insert)             | Business rule: type cannot change          |
| Transfer posting pairs                       | Application validation (must have 2 with equal/opposite)    | Double-entry bookkeeping                   |
| Soft delete preservation                     | `deleted_at IS NULL` filter in all queries                  | Keep historical data for audits            |
| Balance calculation                          | SUM(postings.amount) where wallet_id AND deleted_at IS NULL | Never store balance; always derive         |

---

## API Endpoint Design

### Summary Table

| Method | Path                     | Auth | Status | Description                                  |
| ------ | ------------------------ | ---- | ------ | -------------------------------------------- |
| POST   | /api/v1/auth/register    | None | 201    | Register new user                            |
| POST   | /api/v1/auth/login       | None | 200    | Login and get cookie                         |
| POST   | /api/v1/auth/logout      | JWT  | 204    | Logout and clear cookie                      |
| POST   | /api/v1/auth/refresh     | JWT  | 200    | Refresh access token                         |
| GET    | /api/v1/categories       | JWT  | 200    | List categories with filters                 |
| GET    | /api/v1/categories/:id   | JWT  | 200    | Get single category                          |
| POST   | /api/v1/categories       | JWT  | 201    | Create category                              |
| PATCH  | /api/v1/categories/:id   | JWT  | 200    | Update category                              |
| DELETE | /api/v1/categories/:id   | JWT  | 200    | Delete single category (confirm)             |
| DELETE | /api/v1/categories       | JWT  | 200    | Delete multiple categories (bulk)            |
| GET    | /api/v1/wallets          | JWT  | 200    | List wallets with filters                    |
| GET    | /api/v1/wallets/:id      | JWT  | 200    | Get single wallet                            |
| POST   | /api/v1/wallets          | JWT  | 201    | Create wallet                                |
| PATCH  | /api/v1/wallets/:id      | JWT  | 200    | Update wallet                                |
| DELETE | /api/v1/wallets/:id      | JWT  | 200    | Delete single wallet (confirm)               |
| DELETE | /api/v1/wallets          | JWT  | 200    | Delete multiple wallets (bulk)               |
| GET    | /api/v1/transactions     | JWT  | 200    | List transactions with filters               |
| GET    | /api/v1/transactions/:id | JWT  | 200    | Get single transaction                       |
| POST   | /api/v1/transactions     | JWT  | 201    | Create transaction (income/expense/transfer) |
| PATCH  | /api/v1/transactions/:id | JWT  | 200    | Update transaction                           |
| DELETE | /api/v1/transactions/:id | JWT  | 204    | Delete single transaction                    |
| DELETE | /api/v1/transactions     | JWT  | 204    | Delete multiple transactions                 |

---

## Authentication Strategy

### Overview: Hybrid HTTP-Only Cookie + JSON Response

**Architecture Decision:**

This API uses **HTTP-only cookies** as the primary authentication mechanism, with an optional JSON payload to indicate successful authentication. This approach:

- ✅ **Prevents XSS attacks** (token not accessible to JavaScript)
- ✅ **Automatic with every request** (browser sends cookie automatically)
- ✅ **Works cross-domain seamlessly** (same domain: api.soegih.com)
- ✅ **Follows industry best practices** (Auth0, Supabase, NextAuth.js)

---

### Auth Flow Sequence

#### 1. User Registration

```
Client Request:
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

Server:
1. Validate input (username format, password strength)
2. Check if username exists (409 if yes)
3. Hash password with bcrypt (10+ rounds)
4. Create user record in database
5. Generate JWT access token (1 hour expiry)
6. Generate JWT refresh token (7 days expiry)
7. Set access token in HTTP-only cookie
8. Set refresh token in HTTP-only cookie (optional)
9. Return 201 with user metadata (NO token in JSON)

Response:
HTTP/1.1 201 Created
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=3600
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=604800
Content-Type: application/json

{
  "data": {
    "id": "user-123",
    "username": "john_doe",
    "created_at": 1709299445
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Cookies Set:**

- `access_token`: JWT with user_id, username, exp=1h
- `refresh_token`: JWT with user_id, type=refresh, exp=7d
- Both: HttpOnly, Secure, SameSite=Strict

---

#### 2. User Login

```
Client Request:
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

Server:
1. Validate input (username required, password required)
2. Find user by username (404 if not found)
3. Compare password with bcrypt (401 if mismatch)
4. Generate JWT access token (1 hour expiry)
5. Generate JWT refresh token (7 days expiry)
6. Set access token in HTTP-only cookie
7. Set refresh token in HTTP-only cookie
8. Return 200 with user metadata (NO token in JSON)

Response:
HTTP/1.1 200 OK
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=3600
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=604800
Content-Type: application/json

{
  "data": {
    "id": "user-123",
    "username": "john_doe",
    "created_at": 1709299445
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

---

#### 3. Protected Request (Automatic Cookie Sending)

```
Client Request (Browser automatically includes cookie):
GET /api/v1/wallets
Cookie: access_token=<jwt>; refresh_token=<jwt>

Server:
1. Extract access_token from Cookie header
2. Verify JWT signature and expiration
3. If valid: Attach user_id to request context, proceed
4. If invalid/expired: Return 401 Unauthorized
5. Query wallet by user_id
6. Return 200 with wallet data

Response:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [{ ... }],
  "pagination": { ... },
  "meta": { ... }
}
```

---

#### 4. Token Refresh

```
Client Request:
POST /api/v1/auth/refresh
(Browser automatically includes refresh_token cookie)

Server:
1. Extract refresh_token from Cookie header
2. Verify JWT signature and expiration (7 days)
3. If invalid/expired: Return 401 Unauthorized
4. Generate new access_token (1 hour expiry)
5. Set new access_token in HTTP-only cookie
6. Return 200 (no token in JSON)

Response:
HTTP/1.1 200 OK
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=3600
Content-Type: application/json

{
  "data": {
    "id": "user-123",
    "username": "john_doe"
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

---

#### 5. User Logout

```
Client Request:
POST /api/v1/auth/logout
Authorization: Bearer <token> (or Cookie automatically sent)

Server:
1. Clear access_token cookie (set Max-Age=0)
2. Clear refresh_token cookie (set Max-Age=0)
3. Return 204 No Content

Response:
HTTP/1.1 204 No Content
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=0
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=soegih.com; Max-Age=0
```

---

### Cookie Configuration (Security Best Practices)

```typescript
// NestJS Cookie Options
CookieOptions {
  httpOnly: true           // NOT accessible to JavaScript (prevent XSS)
  secure: true             // HTTPS only (production)
  sameSite: 'strict'       // No cross-site cookie sending
  path: '/'                // Cookie sent for all routes
  domain: 'soegih.com'     // Cookie valid for soegih.com and api.soegih.com
  maxAge: 3600000          // 1 hour for access_token (milliseconds)
}
```

**Why This Works for Same-Domain Deployments:**

If your frontend and backend are:

- Frontend: `https://soegih.com`
- Backend: `https://api.soegih.com`

With `domain=soegih.com`, cookies are sent to both domains automatically.

---

### Frontend Integration (Next.js/React Example)

```typescript
// Frontend doesn't need to store token — browser handles it!

// Login
const response = await fetch('https://api.soegih.com/auth/login', {
  method: 'POST',
  credentials: 'include', // IMPORTANT: Send cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});

// Subsequent requests (cookie sent automatically)
const wallets = await fetch('https://api.soegih.com/wallets', {
  credentials: 'include', // IMPORTANT: Send cookies
  headers: { Authorization: 'Bearer ...' }, // OPTIONAL: fallback
});

// Logout
await fetch('https://api.soegih.com/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

---

### Token Payload (JWT Claims)

**Access Token (1 hour):**

```json
{
  "sub": "user-123", // subject (user_id)
  "username": "john_doe",
  "iat": 1709299445, // issued at
  "exp": 1709303045, // expires at (1 hour)
  "type": "access" // token type
}
```

**Refresh Token (7 days):**

```json
{
  "sub": "user-123",
  "iat": 1709299445,
  "exp": 1709904245, // expires at (7 days)
  "type": "refresh" // token type
}
```

---

## Module & Service Architecture

### NestJS Module Structure

```
src/
├── app.module.ts                    # Root module
├── main.ts                          # Bootstrap
│
├── common/                          # Shared utilities
│   ├── decorators/
│   │   ├── user.decorator.ts       # @CurrentUser()
│   │   └── public.decorator.ts     # @Public()
│   ├── filters/
│   │   └── exception.filter.ts     # Global error handler
│   ├── guards/
│   │   ├── jwt.guard.ts            # JWT validation
│   │   └── public.guard.ts         # Public endpoint marker
│   ├── interceptors/
│   │   └── logging.interceptor.ts  # Request/response logging
│   └── utils/
│       ├── logger.ts               # Winston/Pino logger
│       └── timestamp.ts            # Unix epoch helpers
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts          # POST /register, /login, /logout, /refresh
│   ├── auth.service.ts             # Business logic
│   ├── jwt.strategy.ts             # Extract user from JWT
│   ├── local.strategy.ts           # Username/password validation
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └── refresh.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts            # findById, findByUsername, create
│   ├── repositories/
│   │   ├── users.repository.interface.ts
│   │   └── prisma-users.repository.ts
│   └── dto/
│       └── user-response.dto.ts
│
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts    # GET, POST, PATCH, DELETE /categories
│   ├── categories.service.ts       # Business logic
│   ├── repositories/
│   │   ├── categories.repository.interface.ts
│   │   └── prisma-categories.repository.ts
│   └── dto/
│       ├── create-category.dto.ts
│       ├── update-category.dto.ts
│       └── category-response.dto.ts
│
├── wallets/
│   ├── wallets.module.ts
│   ├── wallets.controller.ts       # GET, POST, PATCH, DELETE /wallets
│   ├── wallets.service.ts          # Business logic + balance calculation
│   ├── repositories/
│   │   ├── wallets.repository.interface.ts
│   │   └── prisma-wallets.repository.ts
│   └── dto/
│       ├── create-wallet.dto.ts
│       ├── update-wallet.dto.ts
│       └── wallet-response.dto.ts
│
├── transactions/
│   ├── transactions.module.ts
│   ├── transactions.controller.ts  # GET, POST, PATCH, DELETE /transactions
│   ├── transactions.service.ts     # Business logic + atomic transfers
│   ├── repositories/
│   │   ├── transactions.repository.interface.ts
│   │   └── prisma-transactions.repository.ts
│   └── dto/
│       ├── create-transaction.dto.ts
│       ├── update-transaction.dto.ts
│       └── transaction-response.dto.ts
│
└── prisma/
    ├── prisma.module.ts            # @Global()
    ├── prisma.service.ts           # PrismaClient wrapper
    └── prisma.config.ts            # Connection config
```

---

### Service Responsibilities

#### AuthService

```typescript
class AuthService {
  // Registration
  register(dto: RegisterDto): Promise<UserResponse>;

  // Login
  login(dto: LoginDto): Promise<{ user: UserResponse; tokens: TokenPair }>;

  // Token refresh
  refresh(refreshToken: string): Promise<{ accessToken: string }>;

  // Password validation
  validatePassword(plainPassword: string, hash: string): Promise<boolean>;

  // Token generation
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;

  // Token verification
  validateAccessToken(token: string): Promise<JwtPayload>;
  validateRefreshToken(token: string): Promise<JwtPayload>;
}
```

#### CategoriesService

```typescript
class CategoriesService {
  // Read
  getAll(userId: string, filters: CategoryFilters): Promise<Category[]>;
  getById(userId: string, categoryId: string): Promise<Category>;

  // Write
  create(userId: string, dto: CreateCategoryDto): Promise<Category>;
  update(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category>;

  // Delete
  deleteSingle(
    userId: string,
    categoryId: string,
    confirm: boolean,
  ): Promise<DeleteResponse>;
  deleteMultiple(
    userId: string,
    ids: string[],
    confirm: boolean,
  ): Promise<BulkDeleteResponse>;

  // Helpers
  countTransactions(categoryId: string): Promise<number>;
  archiveName(category: Category): string;
}
```

#### WalletsService

```typescript
class WalletsService {
  // Read
  getAll(userId: string, filters: WalletFilters): Promise<Wallet[]>;
  getById(userId: string, walletId: string): Promise<Wallet>;

  // Calculate balance (always derived)
  calculateBalance(walletId: string): Promise<number>;

  // Write
  create(userId: string, dto: CreateWalletDto): Promise<Wallet>;
  update(
    userId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet>;

  // Delete
  deleteSingle(
    userId: string,
    walletId: string,
    confirm: boolean,
  ): Promise<DeleteResponse>;
  deleteMultiple(
    userId: string,
    ids: string[],
    confirm: boolean,
  ): Promise<BulkDeleteResponse>;

  // Helpers
  countPostings(walletId: string): Promise<number>;
  archiveName(wallet: Wallet): string;
}
```

#### TransactionsService

```typescript
class TransactionsService {
  // Read
  getAll(userId: string, filters: TransactionFilters): Promise<Transaction[]>;
  getById(userId: string, transactionId: string): Promise<Transaction>;

  // Write (Income/Expense)
  createExpenseOrIncome(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction>;

  // Write (Transfer - atomic)
  createTransfer(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction>;

  // Update
  update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction>;

  // Delete
  deleteSingle(userId: string, transactionId: string): Promise<void>;
  deleteMultiple(userId: string, ids: string[]): Promise<void>;

  // Helpers
  createPostings(
    event: TransactionEvent,
    dto: CreateTransactionDto,
  ): Promise<Posting[]>;
  updatePostings(
    event: TransactionEvent,
    dto: UpdateTransactionDto,
  ): Promise<void>;
}
```

---

### Repository Pattern (Interfaces)

Each service depends on a repository interface, NOT PrismaService directly:

```typescript
// categories.repository.interface.ts
export const CATEGORIES_REPOSITORY_TOKEN = Symbol('CATEGORIES_REPOSITORY');

export interface ICategoriesRepository {
  findMany(
    userId: string,
    filters?: CategoryFilters,
    pagination?: PaginationParams,
  ): Promise<Category[]>;

  findById(id: string, userId: string): Promise<Category | null>;
  findByNameAndType(
    userId: string,
    name: string,
    type: CategoryType,
  ): Promise<Category | null>;

  create(userId: string, data: CreateCategoryInput): Promise<Category>;
  update(id: string, data: UpdateCategoryInput): Promise<Category>;
  deleteSoft(id: string, archivedName: string): Promise<Category>;

  count(userId: string, filters?: CategoryFilters): Promise<number>;
  countTransactions(categoryId: string): Promise<number>;
}
```

**Implementation:**

```typescript
// prisma-categories.repository.ts
@Injectable()
export class PrismaCategoriesRepository implements ICategoriesRepository {
  // All Prisma calls here
  // Maps Prisma errors to domain errors
  // Transforms rows to domain types
}
```

**Service Injection:**

```typescript
// categories.service.ts
@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY_TOKEN)
    private readonly repository: ICategoriesRepository,
  ) {}

  // Service uses repository, not Prisma
  async getAll(userId: string, filters: CategoryFilters): Promise<Category[]> {
    return this.repository.findMany(userId, filters);
  }
}
```

**Module Registration:**

```typescript
// categories.module.ts
@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORIES_REPOSITORY_TOKEN,
      useClass: PrismaCategoriesRepository,
    },
  ],
})
export class CategoriesModule {}
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /auth/register
       │ { username, password }
       │
       ▼
┌──────────────────────┐
│  AuthController      │
│  register(dto)       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   AuthService        │
│   1. Validate input  │
│   2. Hash password   │
│   3. Create user     │
│   4. Generate tokens │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  UsersRepository     │
│  create(userData)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Database (User)    │
│   INSERT new user    │
└──────┬───────────────┘
       │ Return user
       ▼
┌──────────────────────┐
│  Set HTTP-only       │
│  cookies:            │
│  - access_token      │
│  - refresh_token     │
└──────┬───────────────┘
       │ 201 + Cookies
       ▼
┌──────────────────────┐
│   Browser Stores     │
│   Cookies Securely   │
│   (HTTP-only)        │
└──────────────────────┘
```

---

### 2. Protected Request Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /api/v1/wallets
       │ Cookie: access_token=<jwt>
       │ (automatic)
       │
       ▼
┌──────────────────────────┐
│  Cookies Middleware      │
│  Parse Cookie header     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  JwtGuard                │
│  1. Extract access_token │
│  2. Verify signature     │
│  3. Check expiration     │
│  4. Attach user to req   │
└──────┬───────────────────┘
       │ Valid: Continue
       │ Invalid: 401
       │
       ▼
┌──────────────────────────┐
│  WalletsController       │
│  getAll(req.user)        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  WalletsService          │
│  Query by user_id        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  WalletsRepository       │
│  findMany(userId)        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Database                │
│  SELECT * FROM wallets   │
│  WHERE user_id = $1      │
└──────┬───────────────────┘
       │ Return wallets
       ▼
┌──────────────────────────┐
│  Calculate Balance       │
│  SUM(postings.amount)    │
│  per wallet              │
└──────┬───────────────────┘
       │ 200 + Data
       ▼
┌──────────────────────────┐
│  Browser Receives Data   │
│  (with auth)             │
└──────────────────────────┘
```

---

### 3. Atomic Transfer Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /transactions
       │ { type: "transfer", source, destination, amount }
       │
       ▼
┌──────────────────────────┐
│  TransactionsController  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  TransactionsService     │
│  createTransfer()        │
│  1. Validate inputs      │
│  2. Start DB transaction │
│  3. Create event         │
│  4. Create 2 postings    │
│  5. Commit or rollback   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Database Transaction (ATOMIC)       │
│                                      │
│  BEGIN;                              │
│  INSERT INTO transaction_events ...  │
│  INSERT INTO postings ...            │
│    (wallet_id=source, amount=-X)     │
│  INSERT INTO postings ...            │
│    (wallet_id=dest, amount=+X)       │
│  COMMIT;                             │
│                                      │
│  OR if any error:                    │
│  ROLLBACK;                           │
└──────┬───────────────────────────────┘
       │ Success: Both postings created
       │ Failure: Neither created (rollback)
       │
       ▼
┌──────────────────────────┐
│  Balances Updated        │
│  (derived on-demand)     │
│  Wallet A: -X            │
│  Wallet B: +X            │
└──────┬───────────────────┘
       │ 201 + Event + Postings
       ▼
┌──────────────────────────┐
│  Business Log            │
│  "TRANSACTION_CREATED"   │
│  amount, wallets, user   │
└──────────────────────────┘
```

---

## Error Handling Strategy

### Global Exception Filter

```typescript
// common/filters/exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details = {};

    // Prisma P2002: Unique constraint violation
    if (exception.code === 'P2002') {
      status = 409;
      code = 'DUPLICATE_' + exception.meta.modelName.toUpperCase();
      message = `${exception.meta.modelName} already exists`;
      details = { field: exception.meta.target[0] };
    }

    // Prisma P2025: Record not found
    if (exception.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    }

    // BadRequestException
    if (exception instanceof BadRequestException) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = exception.getResponse().message;
    }

    // UnauthorizedException
    if (exception instanceof UnauthorizedException) {
      status = 401;
      code = 'UNAUTHORIZED';
      message = 'Invalid credentials or expired token';
    }

    // Custom BusinessRuleViolationException
    if (exception instanceof BusinessRuleViolationException) {
      status = 400;
      code = 'BUSINESS_RULE_VIOLATION';
      message = exception.message;
      details = exception.details;
    }

    // Log error
    this.logger.error({
      timestamp: new Date().toISOString(),
      status,
      code,
      message,
      path: request.url,
      stack: exception.stack,
    });

    // Send response
    response.status(status).json({
      error: {
        code,
        message,
        ...(Object.keys(details).length && { details }),
      },
      timestamp: Math.floor(Date.now() / 1000),
      path: request.url,
    });
  }
}
```

---

### Error Response Format

```json
{
  "error": {
    "code": "DUPLICATE_CATEGORY",
    "message": "Category 'Groceries' with type 'expense' already exists",
    "details": {
      "field": "name+type",
      "reason": "Category name and type combination must be unique per user"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/categories"
}
```

---

### HTTP Status Code Mapping

| Code | Scenario                | Code                      | Message                                 |
| ---- | ----------------------- | ------------------------- | --------------------------------------- |
| 200  | GET/PATCH success       | Varies                    | Resource returned                       |
| 201  | POST success            | Varies                    | Resource created                        |
| 204  | DELETE success          | -                         | Empty response                          |
| 400  | Validation error        | `VALIDATION_ERROR`        | Missing field, invalid format           |
| 400  | Business rule violation | `BUSINESS_RULE_VIOLATION` | Transfer to same wallet                 |
| 401  | Missing/invalid token   | `UNAUTHORIZED`            | Invalid credentials or token            |
| 404  | Resource not found      | `NOT_FOUND`               | Category/wallet/transaction not found   |
| 409  | Duplicate entry         | `DUPLICATE_*`             | Category/wallet/username already exists |
| 409  | Immutable field change  | `IMMUTABLE_FIELD_CHANGE`  | Cannot change transaction type          |
| 500  | Unhandled error         | `INTERNAL_SERVER_ERROR`   | Database/server error                   |

---

## Security Architecture

### 1. Password Security

```typescript
// auth.service.ts
async register(dto: RegisterDto): Promise<User> {
  // Validate password strength
  this.validatePasswordStrength(dto.password);

  // Hash password with bcrypt (10+ rounds)
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // Store hash, never plaintext
  return this.usersRepository.create({
    username: dto.username,
    password: hashedPassword, // ← hash only
  });
}

async validatePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
```

**Password Strength Rules:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&\*)

---

### 2. JWT Token Security

```typescript
// auth.service.ts
generateAccessToken(user: User): string {
  return this.jwtService.sign(
    {
      sub: user.id,           // subject
      username: user.username,
      type: 'access',
    },
    {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
      algorithm: 'HS256',
      issuer: 'soegih-api',
      audience: 'soegih-web',
    }
  );
}

generateRefreshToken(user: User): string {
  return this.jwtService.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
      algorithm: 'HS256',
    }
  );
}
```

**Token Secrets:**

- `JWT_SECRET`: Used for access token signing (kept in env, never exposed)
- `JWT_REFRESH_SECRET`: Separate secret for refresh tokens (better security)
- Both: 32+ character random strings

---

### 3. User Isolation

**Every query includes `WHERE user_id = $1`:**

```typescript
// categories.repository.ts
async findMany(userId: string, filters?: CategoryFilters): Promise<Category[]> {
  return this.prisma.category.findMany({
    where: {
      user_id: userId,  // ← CRITICAL: Filter by authenticated user
      deleted_at: null, // ← Only active (non-deleted)
      ...this.buildFilters(filters),
    },
    orderBy: this.buildSort(filters),
    take: filters.limit,
    skip: filters.offset,
  });
}
```

**Prevents:**

- User A accessing User B's data
- Accessing deleted resources of other users
- Cross-user data leakage

---

### 4. Input Validation

```typescript
// create-category.dto.ts
export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
```

**Validation Happens:**

- DTO validation (class-validator decorators)
- Database constraints (unique indexes)
- Service business logic (custom rules)
- Exception filter (catch and format errors)

---

### 5. Cookie Security

```typescript
// auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto, @Res() response: Response) {
  const { user, tokens } = await this.authService.login(dto);

  // Set HTTP-only cookies
  response.cookie('access_token', tokens.accessToken, {
    httpOnly: true,      // NOT accessible to JavaScript (prevent XSS)
    secure: true,        // HTTPS only (production)
    sameSite: 'strict',  // No cross-site cookie sending (prevent CSRF)
    path: '/',           // Cookie sent for all routes
    domain: 'soegih.com',// Valid for soegih.com and *.soegih.com
    maxAge: 3600 * 1000, // 1 hour (milliseconds)
  });

  response.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    domain: 'soegih.com',
    maxAge: 7 * 24 * 3600 * 1000, // 7 days
  });

  return response.status(200).json({
    data: { id: user.id, username: user.username },
    meta: { timestamp: Math.floor(Date.now() / 1000), version: '1.0' },
  });
}
```

---

### 6. CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://soegih.com',
  credentials: true, // Allow cookies
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  maxAge: 3600,
});
```

---

## Performance & Scaling Considerations

### 1. Database Indexing Strategy

| Table          | Index                        | Reason                    |
| -------------- | ---------------------------- | ------------------------- |
| `users`        | username (unique)            | Fast login lookups        |
| `categories`   | user_id                      | Filter by user            |
| `categories`   | (user_id, name, type) unique | Prevent duplicates        |
| `categories`   | deleted_at                   | Filter active items       |
| `wallets`      | user_id                      | Filter by user            |
| `wallets`      | (user_id, name) unique       | Prevent duplicates        |
| `wallets`      | deleted_at                   | Filter active items       |
| `transactions` | user_id                      | Filter by user            |
| `transactions` | category_id                  | Filter by category        |
| `transactions` | occurred_at                  | Sort/filter by date       |
| `transactions` | deleted_at                   | Filter active items       |
| `postings`     | wallet_id                    | Balance calculation (SUM) |
| `postings`     | event_id                     | Transaction lookup        |
| `postings`     | deleted_at                   | Include soft-deletes      |

---

### 2. Query Optimization

**N+1 Prevention: Eager Load Relations**

```typescript
// wallets.repository.ts
async getAll(userId: string): Promise<Wallet[]> {
  return this.prisma.wallet.findMany({
    where: { user_id: userId, deleted_at: null },
    include: {
      // Don't load postings here (large dataset)
      // Instead: calculate balance on-demand per wallet
    },
  });
}

// Calculate balance separately when needed
async getWalletWithBalance(userId: string, walletId: string): Promise<WalletWithBalance> {
  const wallet = await this.prisma.wallet.findUnique({
    where: { id: walletId },
  });

  const balance = await this.prisma.posting.aggregate({
    where: { wallet_id: walletId, deleted_at: null },
    _sum: { amount: true },
  });

  return { ...wallet, balance: balance._sum.amount || 0 };
}
```

---

### 3. Pagination Performance

**Default Limits:**

- Default limit: 10 items
- Max limit: 100 items
- Offsets capped at reasonable value

```typescript
// categories.controller.ts
@Get()
async getAll(
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
) {
  // Validate
  if (limit > 100) limit = 100;
  if (limit < 1) limit = 1;
  if (offset < 0) offset = 0;

  return this.categoriesService.getAll(req.user.id, { limit, offset });
}
```

---

### 4. Transaction Atomicity

**All Transfer Creates Use Database Transactions:**

```typescript
// transactions.repository.ts
async createTransfer(userId: string, dto: CreateTransactionDto): Promise<TransactionEvent> {
  // Use Prisma transaction to ensure atomicity
  return await this.prisma.$transaction(async (tx) => {
    // Create event
    const event = await tx.transactionEvent.create({
      data: {
        user_id: userId,
        type: 'transfer',
        occurred_at: dto.occurred_at,
        note: dto.note,
      },
    });

    // Create 2 postings atomically
    await tx.posting.create({
      data: {
        event_id: event.id,
        wallet_id: dto.source_wallet_id,
        amount: -dto.amount, // Debit
      },
    });

    await tx.posting.create({
      data: {
        event_id: event.id,
        wallet_id: dto.destination_wallet_id,
        amount: +dto.amount, // Credit
      },
    });

    return event;
    // If any step fails: entire transaction rolls back
  });
}
```

---

### 5. Caching Strategy (Post-MVP)

**Not implemented in MVP, but architecture ready for:**

```typescript
// Post-MVP: Add Redis caching
// Cache user balance (invalidate on transaction)
// Cache category list (invalidate on category change)
// Cache wallet list (invalidate on wallet change)
```

---

### 6. Rate Limiting (Post-MVP)

```typescript
// main.ts (Post-MVP)
import { RateLimitInterceptor } from '@nestjs/throttler';

app.useGlobalInterceptors(new RateLimitInterceptor());

// In module
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),
  ],
})
export class AppModule {}
```

---

### 7. Logging Performance

**Structured JSON Logging:**

```typescript
// common/utils/logger.ts
export class AppLogger {
  private logger: Logger;

  log(action: string, data: object, duration?: number) {
    this.logger.info({
      timestamp: new Date().toISOString(),
      action,
      ...data,
      duration_ms: duration,
    });
  }
}
```

**Logged Events:**

- Auth (login, register, logout)
- CRUD (create, update, delete)
- Financial transactions (amount, wallets)
- Errors (code, message, stack)
- Performance (query duration, API latency)

---

## Summary & Implementation Checklist

### Architecture Decisions Made

- ✅ **HTTP-Only Cookies** for JWT tokens (XSS protection)
- ✅ **Hybrid approach** (cookies + optional JSON metadata)
- ✅ **Repository Pattern** (Prisma isolated from services)
- ✅ **Global Exception Filter** (consistent error format)
- ✅ **Atomic Transfers** (database transactions)
- ✅ **User Isolation** (WHERE user_id filter everywhere)
- ✅ **Derived Balance** (SUM of postings, never stored)
- ✅ **Soft Delete** (categories, wallets, transactions)
- ✅ **Structured Logging** (technical + business metrics)

### Next Phase: Phase 3.5 (Quantitative Analysis)

This design is now ready for:

- Performance capacity planning (QPS, latency targets)
- Infrastructure cost estimation
- Load testing strategy
- Deployment architecture

Would you like me to proceed with **Phase 3.5 (Quantitative Analysis)** to calculate:

- Throughput capacity (requests per second)
- Latency targets (p50, p95, p99)
- Database size estimates
- Infrastructure costs (Supabase, deployment)?

Or would you like to refine the design first?
