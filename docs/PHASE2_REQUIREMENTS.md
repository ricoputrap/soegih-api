# Soegih API - Phase 2: Detailed Requirements

**Date:** March 1, 2026
**Status:** Ready for Phase 3 (Design & Architecture)
**Timeline:** 1-day MVP sprint

---

## Table of Contents

1. [Functional Requirements (FR)](#functional-requirements)
   - [Authentication & User Management](#authentication--user-management)
   - [Category Management](#category-management)
   - [Wallet Management](#wallet-management)
   - [Transaction Management](#transaction-management)
2. [Non-Functional Requirements (NFR)](#non-functional-requirements)
3. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
4. [Data Constraints & Validation Rules](#data-constraints--validation-rules)
5. [API Response Format](#api-response-format)

---

## Functional Requirements

### Authentication & User Management

#### FR-1.1: User Registration

**Description:** New users can create an account with username and password.

**Request:**
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `username`: Required, 3-50 characters, alphanumeric + underscore/dash only, unique per system
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "user-123abc",
    "username": "john_doe",
    "created_at": 1709299445
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields, invalid format, weak password
- `409 DUPLICATE_USERNAME`: Username already registered
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "USER_REGISTERED",
  "username": "john_doe",
  "status": 201,
  "timestamp": 1709299445
}
```

---

#### FR-1.2: User Login

**Description:** Users authenticate with username/password and receive JWT tokens.

**Request:**
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `username`: Required, must exist in system
- `password`: Required, must match hashed password using bcrypt

**Success Response (200 OK):**
```json
{
  "data": {
    "user_id": "user-123abc",
    "username": "john_doe",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields
- `401 UNAUTHORIZED`: Invalid username or password
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "USER_LOGIN",
  "username": "john_doe",
  "status": 200,
  "timestamp": 1709299445
}
```

---

#### FR-1.3: Token Refresh

**Description:** Users can refresh expired access tokens using their refresh token.

**Request:**
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation Rules:**
- `refresh_token`: Required, must be valid and not expired (7 days expiry)

**Success Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing refresh token
- `401 UNAUTHORIZED`: Invalid or expired refresh token
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-1.4: JWT Token Requirements

**Description:** All authenticated endpoints require a valid JWT token.

**Token Format:**
- Header: `Authorization: Bearer <access_token>`
- Access token expires in: 1 hour (3600 seconds)
- Refresh token expires in: 7 days (604800 seconds)
- Signing algorithm: HS256
- Payload includes: user_id, username, issued_at, expires_at

**Validation Rules:**
- Token must be present in `Authorization` header
- Token must have valid signature (secret from environment variable)
- Token must not be expired (check `exp` claim)
- Invalid/missing token returns `401 UNAUTHORIZED`

---

### Category Management

#### FR-2.1: Get All Categories

**Description:** Authenticated user retrieves list of their categories with filtering, sorting, and pagination.

**Request:**
```
GET /api/v1/categories?limit=10&offset=0&type=expense&sort=name:asc&search=groceries&include_deleted=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Number of items per page (default: 10, min: 1, max: 100)
- `offset`: Number of items to skip (default: 0, min: 0)
- `type`: Filter by type (`expense` or `income`), optional
- `sort`: Sort field and direction (`name:asc` or `name:desc`), optional, default: creation order
- `search`: Search by name (partial match, case-insensitive), optional
- `include_deleted`: Include archived categories (true/false, default: false), optional

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "cat-123",
      "name": "Groceries",
      "description": "Food and groceries",
      "type": "expense",
      "created_at": 1709299445,
      "updated_at": 1709299445,
      "deleted_at": null
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid limit/offset/type values
- `401 UNAUTHORIZED`: Missing or invalid token
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-2.2: Get Single Category

**Description:** Retrieve details of a single category by ID.

**Request:**
```
GET /api/v1/categories/:id
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "cat-123",
    "name": "Groceries",
    "description": "Food and groceries",
    "type": "expense",
    "created_at": 1709299445,
    "updated_at": 1709299445,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Category not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-2.3: Create Category

**Description:** Create a new category for income or expense.

**Request:**
```
POST /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Utilities",
  "description": "Electricity, water, gas",
  "type": "expense"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `type`: Required, must be `expense` or `income`
- `description`: Optional, max 500 characters
- Uniqueness: Combination of (name + type) must be unique per user

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "cat-456",
    "name": "Utilities",
    "description": "Electricity, water, gas",
    "type": "expense",
    "created_at": 1709299445,
    "updated_at": 1709299445,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields, invalid type, description too long
- `401 UNAUTHORIZED`: Missing or invalid token
- `409 CONFLICT`: Category (name + type) already exists for this user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "CATEGORY_CREATED",
  "category_id": "cat-456",
  "name": "Utilities",
  "type": "expense",
  "user_id": "user-123abc",
  "status": 201,
  "timestamp": 1709299445
}
```

---

#### FR-2.4: Update Category

**Description:** Update category name, description, or type. Can also restore archived category.

**Request:**
```
PATCH /api/v1/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Utilities",
  "description": "Updated description",
  "type": "expense"
}
```

**Validation Rules:**
- `name`: Optional, 1-100 characters if provided
- `type`: Optional, must be `expense` or `income` if provided
- `description`: Optional, max 500 characters if provided
- `deleted_at`: Optional, set to `null` to restore archived category
- Uniqueness: Updated (name + type) must be unique per user

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "cat-456",
    "name": "Updated Utilities",
    "description": "Updated description",
    "type": "expense",
    "created_at": 1709299445,
    "updated_at": 1709299500,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299500,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid field values
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Category not found or belongs to different user
- `409 CONFLICT`: Updated (name + type) already exists for this user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "CATEGORY_UPDATED",
  "category_id": "cat-456",
  "fields_changed": ["name", "description"],
  "user_id": "user-123abc",
  "status": 200,
  "timestamp": 1709299500
}
```

---

#### FR-2.5: Delete Single Category

**Description:** Soft-delete a category. Two-phase deletion with confirmation for categories in use.

**Request (Phase 1 - Check):**
```
DELETE /api/v1/categories/:id?confirm=false
Authorization: Bearer <token>
```

**Phase 1 Response - Confirmation Required (200 OK):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "id": "cat-123",
    "name": "Groceries",
    "transaction_count": 42,
    "warning": "This category is used in 42 transactions. Deleting it will archive the category name but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Phase 1 Response - Safe to Delete (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "cat-123",
    "name": "Groceries [ARCHIVED 2026-03-01T10:30:45Z]",
    "deleted_at": 1709299445,
    "transaction_count_archived": 0
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Request (Phase 2 - Confirm):**
```
DELETE /api/v1/categories/:id?confirm=true
Authorization: Bearer <token>
```

**Phase 2 Response - Deleted (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "cat-123",
    "name": "Groceries [ARCHIVED 2026-03-01T10:30:45Z]",
    "deleted_at": 1709299445,
    "transaction_count_archived": 42
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Deletion Rules:**
- Always returns HTTP 200 (not an error)
- Archives category name with timestamp suffix: `{name} [ARCHIVED {iso_timestamp}]`
- Sets `deleted_at` to current timestamp
- If category has existing transactions and `confirm=false`: Returns warning, not deleted
- If `confirm=true`: Always deletes regardless of transaction count
- Transactions referencing deleted category remain intact (referential integrity preserved)

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Category not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log (Phase 2):**
```json
{
  "action": "CATEGORY_DELETED",
  "category_id": "cat-123",
  "category_name": "Groceries [ARCHIVED 2026-03-01T10:30:45Z]",
  "transaction_count_archived": 42,
  "user_id": "user-123abc",
  "status": 200,
  "timestamp": 1709299445
}
```

---

#### FR-2.6: Delete Multiple Categories

**Description:** Bulk soft-delete multiple categories with two-phase confirmation.

**Request (Phase 1 - Check):**
```
DELETE /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["cat-1", "cat-2", "cat-3"],
  "confirm": false
}
```

**Phase 1 Response - Confirmation Required (200 OK):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "total_selected": 3,
    "items_in_use": [
      {
        "id": "cat-1",
        "name": "Groceries",
        "transaction_count": 42
      },
      {
        "id": "cat-2",
        "name": "Transport",
        "transaction_count": 15
      }
    ],
    "items_safe_to_delete": [
      {
        "id": "cat-3",
        "name": "Entertainment",
        "transaction_count": 0
      }
    ],
    "warning": "2 out of 3 selected categories are used in transactions. Deleting will archive them but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Phase 1 Response - Safe to Delete (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "cat-1",
        "name": "Groceries [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      },
      {
        "id": "cat-2",
        "name": "Transport [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      },
      {
        "id": "cat-3",
        "name": "Entertainment [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      }
    ]
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Request (Phase 2 - Confirm):**
```
DELETE /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["cat-1", "cat-2", "cat-3"],
  "confirm": true
}
```

**Phase 2 Response - Deleted (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "cat-1",
        "name": "Groceries [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 42
      },
      {
        "id": "cat-2",
        "name": "Transport [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 15
      },
      {
        "id": "cat-3",
        "name": "Entertainment [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 0
      }
    ]
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Deletion Rules:**
- Always returns HTTP 200
- Atomic operation: All categories deleted together or request fails
- Sets `deleted_at` on all items
- Archives names with timestamp suffix
- If any category in use and `confirm=false`: Returns breakdown, not deleted
- If `confirm=true`: Deletes all regardless of usage

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid IDs or missing confirm field
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: One or more categories not found or belong to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

---

### Wallet Management

#### FR-3.1: Get All Wallets

**Description:** Retrieve list of user's wallets with filtering, sorting, and pagination.

**Request:**
```
GET /api/v1/wallets?limit=10&offset=0&type=cash&sort=balance:desc&search=my&include_deleted=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Number of items per page (default: 10, min: 1, max: 100)
- `offset`: Number of items to skip (default: 0, min: 0)
- `type`: Filter by type (`cash`, `bank`, `e-wallet`, `other`), optional
- `sort`: Sort field and direction (`name:asc`, `balance:desc`, etc.), optional, default: creation order
- `search`: Search by name (partial match, case-insensitive), optional
- `include_deleted`: Include archived wallets (true/false, default: false), optional

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "w-123",
      "name": "My Cash",
      "type": "cash",
      "balance": 500000,
      "currency": "IDR",
      "created_at": 1709299445,
      "updated_at": 1709299445,
      "deleted_at": null
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5,
    "has_next": false,
    "has_previous": false
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid limit/offset/type values
- `401 UNAUTHORIZED`: Missing or invalid token
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-3.2: Get Single Wallet

**Description:** Retrieve details of a single wallet by ID.

**Request:**
```
GET /api/v1/wallets/:id
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "w-123",
    "name": "My Cash",
    "type": "cash",
    "balance": 500000,
    "currency": "IDR",
    "created_at": 1709299445,
    "updated_at": 1709299445,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Balance Calculation:**
- Balance = SUM of all postings where wallet_id = wallet.id (including soft-deleted transactions)
- Updated in real-time, never cached

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Wallet not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-3.3: Create Wallet

**Description:** Create a new wallet for storing money.

**Request:**
```
POST /api/v1/wallets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Savings Account",
  "type": "bank",
  "currency": "IDR"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters, unique per user
- `type`: Required, must be one of: `cash`, `bank`, `e-wallet`, `other`
- `currency`: Optional, must be valid ISO 4217 code (default: IDR)

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "w-456",
    "name": "Savings Account",
    "type": "bank",
    "balance": 0,
    "currency": "IDR",
    "created_at": 1709299445,
    "updated_at": 1709299445,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields, invalid type, invalid currency code
- `401 UNAUTHORIZED`: Missing or invalid token
- `409 CONFLICT`: Wallet name already exists for this user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "WALLET_CREATED",
  "wallet_id": "w-456",
  "name": "Savings Account",
  "type": "bank",
  "currency": "IDR",
  "user_id": "user-123abc",
  "status": 201,
  "timestamp": 1709299445
}
```

---

#### FR-3.4: Update Wallet

**Description:** Update wallet name, type, or currency. Can also restore archived wallet.

**Request:**
```
PATCH /api/v1/wallets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Savings",
  "type": "e-wallet",
  "currency": "USD"
}
```

**Validation Rules:**
- `name`: Optional, 1-100 characters if provided, unique per user
- `type`: Optional, must be `cash`, `bank`, `e-wallet`, `other` if provided
- `currency`: Optional, must be valid ISO 4217 code if provided
- `deleted_at`: Optional, set to `null` to restore archived wallet

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "w-456",
    "name": "Updated Savings",
    "type": "e-wallet",
    "balance": 500000,
    "currency": "USD",
    "created_at": 1709299445,
    "updated_at": 1709299500,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299500,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid field values
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Wallet not found or belongs to different user
- `409 CONFLICT`: Updated name already exists for this user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "WALLET_UPDATED",
  "wallet_id": "w-456",
  "fields_changed": ["name", "type"],
  "user_id": "user-123abc",
  "status": 200,
  "timestamp": 1709299500
}
```

---

#### FR-3.5: Delete Single Wallet

**Description:** Soft-delete a wallet. Two-phase deletion with confirmation for wallets in use.

**Request (Phase 1):**
```
DELETE /api/v1/wallets/:id?confirm=false
Authorization: Bearer <token>
```

**Phase 1 Response - Confirmation Required (200 OK):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "id": "w-123",
    "name": "My Cash",
    "transaction_count": 42,
    "warning": "This wallet is used in 42 transactions. Deleting it will archive the wallet name but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Phase 1 Response - Safe to Delete (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "w-123",
    "name": "My Cash [ARCHIVED 2026-03-01T10:30:45Z]",
    "deleted_at": 1709299445,
    "transaction_count_archived": 0
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Request (Phase 2):**
```
DELETE /api/v1/wallets/:id?confirm=true
Authorization: Bearer <token>
```

**Phase 2 Response - Deleted (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "w-123",
    "name": "My Cash [ARCHIVED 2026-03-01T10:30:45Z]",
    "deleted_at": 1709299445,
    "transaction_count_archived": 42
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Deletion Rules:**
- Always returns HTTP 200
- Archives wallet name with timestamp: `{name} [ARCHIVED {iso_timestamp}]`
- Sets `deleted_at` to current timestamp
- Balance is still calculated including archived wallet's postings
- Transactions referencing deleted wallet remain intact

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Wallet not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-3.6: Delete Multiple Wallets

**Description:** Bulk soft-delete multiple wallets with two-phase confirmation.

**Request (Phase 1):**
```
DELETE /api/v1/wallets
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["w-1", "w-2", "w-3"],
  "confirm": false
}
```

**Phase 1 Response - Confirmation Required (200 OK):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "total_selected": 3,
    "items_in_use": [
      {
        "id": "w-1",
        "name": "My Cash",
        "transaction_count": 42
      }
    ],
    "items_safe_to_delete": [
      {
        "id": "w-2",
        "name": "Savings",
        "transaction_count": 0
      },
      {
        "id": "w-3",
        "name": "E-wallet",
        "transaction_count": 0
      }
    ],
    "warning": "1 out of 3 selected wallets is used in transactions. Deleting will archive it but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Phase 1 Response - Safe to Delete (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "w-1",
        "name": "My Cash [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      },
      {
        "id": "w-2",
        "name": "Savings [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      },
      {
        "id": "w-3",
        "name": "E-wallet [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445
      }
    ]
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Request (Phase 2):**
```
DELETE /api/v1/wallets
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["w-1", "w-2", "w-3"],
  "confirm": true
}
```

**Phase 2 Response - Deleted (200 OK):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "w-1",
        "name": "My Cash [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 42
      },
      {
        "id": "w-2",
        "name": "Savings [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 0
      },
      {
        "id": "w-3",
        "name": "E-wallet [ARCHIVED 2026-03-01T10:30:45Z]",
        "deleted_at": 1709299445,
        "transaction_count_archived": 0
      }
    ]
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Deletion Rules:**
- Atomic operation: All deleted together or request fails
- Always returns HTTP 200
- If any in use and `confirm=false`: Returns breakdown, not deleted
- If `confirm=true`: Deletes all regardless

---

### Transaction Management

#### FR-4.1: Get All Transactions

**Description:** Retrieve list of user's transactions with filtering, sorting, and pagination.

**Request:**
```
GET /api/v1/transactions?limit=10&offset=0&type=expense&wallet_id=w-123&category_id=c-456&occurred_at_gte=1709299445&occurred_at_lte=1709385845&sort=occurred_at:desc&search=groceries
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Number of items per page (default: 10, min: 1, max: 100)
- `offset`: Number of items to skip (default: 0, min: 0)
- `type`: Filter by type (`expense`, `income`, `transfer`), optional
- `wallet_id`: Filter by wallet ID, optional
- `category_id`: Filter by category ID (for income/expense only), optional
- `occurred_at_gte`: Filter by start date (unix timestamp), optional
- `occurred_at_lte`: Filter by end date (unix timestamp), optional
- `sort`: Sort field and direction (`occurred_at:desc`, `amount:asc`, etc.), optional, default: occurred_at desc
- `search`: Search by note (partial match, case-insensitive), optional

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "t-1",
      "type": "expense",
      "amount": 50000,
      "occurred_at": 1709299445,
      "category": {
        "id": "c-1",
        "name": "Groceries"
      },
      "wallet": {
        "id": "w-1",
        "name": "My Cash"
      },
      "note": "Weekly shopping",
      "payee": null,
      "created_at": 1709299445,
      "updated_at": 1709299445,
      "deleted_at": null
    },
    {
      "id": "t-2",
      "type": "transfer",
      "amount": 100000,
      "occurred_at": 1709299500,
      "source_wallet": {
        "id": "w-1",
        "name": "My Cash"
      },
      "destination_wallet": {
        "id": "w-2",
        "name": "Savings"
      },
      "note": "Transfer to savings",
      "category": null,
      "created_at": 1709299500,
      "updated_at": 1709299500,
      "deleted_at": null
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 150,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid filter/sort values
- `401 UNAUTHORIZED`: Missing or invalid token
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-4.2: Get Single Transaction

**Description:** Retrieve details of a single transaction by ID.

**Request:**
```
GET /api/v1/transactions/:id
Authorization: Bearer <token>
```

**Success Response (200 OK - Expense/Income):**
```json
{
  "data": {
    "id": "t-1",
    "type": "expense",
    "amount": 50000,
    "occurred_at": 1709299445,
    "category": {
      "id": "c-1",
      "name": "Groceries"
    },
    "wallet": {
      "id": "w-1",
      "name": "My Cash"
    },
    "note": "Weekly shopping",
    "payee": null,
    "created_at": 1709299445,
    "updated_at": 1709299445,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

**Success Response (200 OK - Transfer):**
```json
{
  "data": {
    "id": "t-2",
    "type": "transfer",
    "amount": 100000,
    "occurred_at": 1709299500,
    "source_wallet": {
      "id": "w-1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w-2",
      "name": "Savings"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 1709299500,
    "updated_at": 1709299500,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299500,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Transaction not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

---

#### FR-4.3: Create Transaction (Expense/Income)

**Description:** Create a new expense or income transaction.

**Request:**
```
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 50000,
  "occurred_at": 1709299445,
  "wallet_id": "w-1",
  "category_id": "c-1",
  "note": "Weekly shopping",
  "payee": null
}
```

**Validation Rules:**
- `type`: Required, must be `expense` or `income`
- `amount`: Required, integer >= 0
- `occurred_at`: Required, unix timestamp, must not be in future (±5 minutes tolerance)
- `wallet_id`: Required, wallet must exist and not be deleted
- `category_id`: Required, category must exist and not be deleted
- `note`: Optional, max 500 characters
- `payee`: Optional, max 100 characters

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "t-3",
    "type": "expense",
    "amount": 50000,
    "occurred_at": 1709299445,
    "category": {
      "id": "c-1",
      "name": "Groceries"
    },
    "wallet": {
      "id": "w-1",
      "name": "My Cash"
    },
    "note": "Weekly shopping",
    "payee": null,
    "created_at": 1709299500,
    "updated_at": 1709299500,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299500,
    "version": "1.0"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields, invalid values
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Wallet or category not found
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "TRANSACTION_CREATED",
  "transaction_id": "t-3",
  "type": "expense",
  "amount": 50000,
  "currency": "IDR",
  "wallet_id": "w-1",
  "category_id": "c-1",
  "user_id": "user-123abc",
  "status": 201,
  "timestamp": 1709299500
}
```

---

#### FR-4.4: Create Transaction (Transfer)

**Description:** Create a transfer between two wallets.

**Request:**
```
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "transfer",
  "amount": 100000,
  "occurred_at": 1709299445,
  "source_wallet_id": "w-1",
  "destination_wallet_id": "w-2",
  "note": "Transfer to savings"
}
```

**Validation Rules:**
- `type`: Required, must be `transfer`
- `amount`: Required, integer >= 0
- `occurred_at`: Required, unix timestamp, must not be in future (±5 minutes tolerance)
- `source_wallet_id`: Required, must exist and not be deleted, must NOT equal destination
- `destination_wallet_id`: Required, must exist and not be deleted, must NOT equal source
- `note`: Optional, max 500 characters
- **Category must NOT be provided for transfers**

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "t-4",
    "type": "transfer",
    "amount": 100000,
    "occurred_at": 1709299445,
    "source_wallet": {
      "id": "w-1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w-2",
      "name": "Savings"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 1709299500,
    "updated_at": 1709299500,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299500,
    "version": "1.0"
  }
}
```

**Transfer Mechanics (Internal):**
- Creates 1 TransactionEvent with type=`transfer`
- Creates 2 Posting records atomically:
  - Posting 1: source wallet, amount: -X (debit)
  - Posting 2: destination wallet, amount: +X (credit)
- Both postings must succeed or entire transaction rolled back
- Ensures double-entry bookkeeping and balance consistency

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing required fields, source=destination, category provided for transfer
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: One or both wallets not found
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "TRANSACTION_CREATED",
  "transaction_id": "t-4",
  "type": "transfer",
  "amount": 100000,
  "currency": "IDR",
  "source_wallet_id": "w-1",
  "destination_wallet_id": "w-2",
  "user_id": "user-123abc",
  "status": 201,
  "timestamp": 1709299500
}
```

---

#### FR-4.5: Update Transaction

**Description:** Update transaction fields. Type is immutable.

**Request (Expense/Income):**
```
PATCH /api/v1/transactions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 60000,
  "category_id": "c-2",
  "note": "Updated note",
  "payee": "John Doe",
  "wallet_id": "w-2"
}
```

**Editable Fields (Expense/Income):**
- `amount`: New amount (integer >= 0)
- `category_id`: New category (must exist and not be deleted)
- `note`: New note (max 500 chars)
- `payee`: New payee (max 100 chars)
- `wallet_id`: New wallet (must exist and not be deleted, updates posting)
- **Type CANNOT be changed**

**Request (Transfer):**
```
PATCH /api/v1/transactions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150000,
  "source_wallet_id": "w-1",
  "destination_wallet_id": "w-3"
}
```

**Editable Fields (Transfer):**
- `amount`: New amount (integer >= 0)
- `source_wallet_id`: New source wallet (must exist, not equal to destination)
- `destination_wallet_id`: New destination wallet (must exist, not equal to source)
- **Type CANNOT be changed, no category field**

**Success Response (200 OK - Expense/Income):**
```json
{
  "data": {
    "id": "t-3",
    "type": "expense",
    "amount": 60000,
    "occurred_at": 1709299445,
    "category": {
      "id": "c-2",
      "name": "Transport"
    },
    "wallet": {
      "id": "w-2",
      "name": "Savings"
    },
    "note": "Updated note",
    "payee": "John Doe",
    "created_at": 1709299500,
    "updated_at": 1709299550,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299550,
    "version": "1.0"
  }
}
```

**Success Response (200 OK - Transfer):**
```json
{
  "data": {
    "id": "t-4",
    "type": "transfer",
    "amount": 150000,
    "occurred_at": 1709299445,
    "source_wallet": {
      "id": "w-1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w-3",
      "name": "E-wallet"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 1709299500,
    "updated_at": 1709299550,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 1709299550,
    "version": "1.0"
  }
}
```

**Update Mechanics:**
- For expense/income: Updates posting's wallet_id and amount if wallet changed
- For transfer: Updates both postings atomically (source -X, destination +X)
- If wallet changes for expense/income: Updates one posting's wallet_id
- If amount changes for transfer: Updates both postings with new equal/opposite amounts
- Wallet balances automatically recalculated

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid field values, attempting to change type
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Transaction, wallet, or category not found
- `409 CONFLICT`: Updated type differs from current type (immutable)
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "TRANSACTION_UPDATED",
  "transaction_id": "t-3",
  "type": "expense",
  "fields_changed": ["amount", "category_id", "wallet_id"],
  "new_amount": 60000,
  "user_id": "user-123abc",
  "status": 200,
  "timestamp": 1709299550
}
```

---

#### FR-4.6: Delete Single Transaction

**Description:** Hard-delete a transaction immediately. No confirmation, no recovery.

**Request:**
```
DELETE /api/v1/transactions/:id
Authorization: Bearer <token>
```

**Success Response (204 No Content):**
```
[Empty body]
```

**Deletion Rules:**
- **Hard delete** (permanent removal, not recoverable)
- Wallet balances automatically adjusted
- No confirmation shown
- Returns HTTP 204 (No Content)
- Empty response body

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: Transaction not found or belongs to different user
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "TRANSACTION_DELETED",
  "transaction_id": "t-3",
  "type": "expense",
  "amount": 50000,
  "affected_wallets": ["w-1"],
  "user_id": "user-123abc",
  "status": 204,
  "timestamp": 1709299600
}
```

---

#### FR-4.7: Delete Multiple Transactions

**Description:** Hard-delete multiple transactions in atomic operation.

**Request:**
```
DELETE /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["t-1", "t-2", "t-3"]
}
```

**Success Response (204 No Content):**
```
[Empty body]
```

**Deletion Rules:**
- **Hard delete** (all transactions permanently removed)
- Atomic operation: All deleted together or request fails
- Wallet balances automatically adjusted for all affected wallets
- Returns HTTP 204 (No Content)
- Empty response body

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid IDs
- `401 UNAUTHORIZED`: Missing or invalid token
- `404 NOT_FOUND`: One or more transactions not found
- `500 INTERNAL_SERVER_ERROR`: Database error

**Business Log:**
```json
{
  "action": "TRANSACTIONS_DELETED_BULK",
  "transaction_ids": ["t-1", "t-2", "t-3"],
  "deleted_count": 3,
  "affected_wallets": ["w-1", "w-2"],
  "user_id": "user-123abc",
  "status": 204,
  "timestamp": 1709299600
}
```

---

## Non-Functional Requirements

### NFR-1: Performance

| Requirement | Target | Notes |
|-------------|--------|-------|
| API Response Time (p95) | ≤ 2 seconds | For all endpoints under normal load |
| Database Query Time (p95) | ≤ 100ms | Per query, excluding network latency |
| Transaction Creation | ≤ 300ms | Including balance recalculation |
| List Endpoint Response | ≤ 500ms | With 10-100 items, pagination included |
| Authentication Latency | ≤ 200ms | Login, token refresh, JWT verification |
| No N+1 Queries | 100% | All category/wallet references eager-loaded |

### NFR-2: Scalability

| Requirement | Target | Notes |
|-------------|--------|-------|
| Concurrent Users | 100 | MVP target, no degradation at this scale |
| Transactions per Wallet | 10,000 | Typical user scenario |
| Categories per User | 100 | Reasonable organizational limit |
| Wallets per User | 20 | Realistic personal finance limit |
| Requests per Second | 100 RPS | Distributed across 100 users |
| Database Connection Pool | 20 connections | For MVP scale |

### NFR-3: Security

| Requirement | Implementation | Notes |
|-------------|-----------------|-------|
| Password Hashing | bcrypt (10+ rounds) | Never store plaintext passwords |
| JWT Tokens | HS256 signature | Signed with environment secret |
| Access Token Expiry | 1 hour | Forces reauthentication |
| Refresh Token Expiry | 7 days | Allows "remember me" capability |
| User Isolation | Query filter by user_id | All queries include `WHERE user_id = $1` |
| HTTPS Only | Required | All API traffic encrypted in production |
| SQL Injection | Parameterized queries | Prisma auto-parameterizes all queries |
| Data Exposure | No sensitive fields in logs | Passwords, tokens never logged |
| CORS | Configurable | Allow frontend origin only |

### NFR-4: Reliability & Data Integrity

| Requirement | Target | Implementation |
|-------------|--------|-----------------|
| Uptime | 99.9% | Supabase SLA (3 nines) |
| Data Loss | 0% | ACID transactions, Supabase backups |
| Balance Accuracy | 100% | Always recalculated from postings |
| Transfer Atomicity | 100% | Both postings succeed or both fail |
| Backup Frequency | Daily | Supabase automated (inherited) |
| Data Retention | 1 year minimum | Business requirement |
| Soft Delete Preservation | 100% | All historical data retained |
| Orphaned Posting Prevention | 0 | Foreign key constraints at DB level |

### NFR-5: Maintainability & Testing

| Requirement | Target | Notes |
|-------------|--------|-------|
| Unit Test Coverage | ≥70% | Services and utilities critical |
| Code Documentation | 100% of public APIs | JSDoc comments on all exports |
| Error Messages | Clear & actionable | Guide user to resolution |
| Logging Coverage | All critical paths | Technical + business metrics |
| Code Review | 100% | Before merge to main |
| Architecture Adherence | Repository Pattern | Service → Repository → Prisma |

### NFR-6: Logging & Monitoring

| Category | Level | Frequency | Retention |
|----------|-------|-----------|-----------|
| Authentication events | INFO | All login/register/refresh | 30 days |
| CRUD operations | INFO | All create/update/delete | 30 days |
| Financial transactions | INFO | All income/expense/transfer | 1 year |
| Errors | ERROR | Unhandled exceptions, validation | 30 days |
| Performance warnings | WARN | Queries >500ms, API >2s p95 | 7 days |
| Debug info | DEBUG | Query execution, middleware | 1 day |

### NFR-7: API Standards

| Requirement | Standard | Notes |
|-------------|----------|-------|
| API Version | v1 | Prefix: `/api/v1/` |
| Content-Type | application/json | JSON request/response bodies |
| Timestamps | Unix Epoch (Int) | Seconds since Jan 1, 1970 UTC |
| HTTP Status Codes | Standard codes | 200, 201, 204, 400, 401, 404, 409, 500 |
| Pagination | Offset-based | limit + offset parameters |
| Sorting | Multiple fields | Field + direction (asc/desc) |
| Error Response | Standard format | code, message, details fields |
| Swagger Documentation | OpenAPI 3.0 | Auto-generated from decorators |

---

## Edge Cases & Error Scenarios

### EC-1: Duplicate Username Registration

**Trigger:** User attempts to register with existing username.

**HTTP Status:** 409 Conflict

**Response:**
```json
{
  "error": {
    "code": "DUPLICATE_USERNAME",
    "message": "Username 'john_doe' is already registered",
    "details": {
      "field": "username",
      "reason": "Username must be unique per system"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/auth/register"
}
```

**Recovery:** User should choose different username and retry.

---

### EC-2: Invalid or Expired JWT Token

**Trigger:** Request includes expired/malformed/revoked token.

**HTTP Status:** 401 Unauthorized

**Response:**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired",
    "details": {
      "field": "Authorization",
      "reason": "Token signature invalid or expired"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/wallets"
}
```

**Recovery:** User should login again to get new token or use refresh token.

---

### EC-3: Duplicate Category Name+Type

**Trigger:** User creates category with same name and type as existing.

**HTTP Status:** 409 Conflict

**Response:**
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

**Recovery:** User should use different name, different type, or update existing category.

---

### EC-4: Duplicate Wallet Name

**Trigger:** User creates wallet with name matching existing wallet.

**HTTP Status:** 409 Conflict

**Response:**
```json
{
  "error": {
    "code": "DUPLICATE_WALLET_NAME",
    "message": "Wallet with name 'My Cash' already exists",
    "details": {
      "field": "name",
      "reason": "Wallet name must be unique per user"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/wallets"
}
```

**Recovery:** User should choose different name or update existing wallet.

---

### EC-5: Reference to Deleted Wallet

**Trigger:** User creates transaction with deleted wallet.

**HTTP Status:** 404 Not Found

**Response:**
```json
{
  "error": {
    "code": "WALLET_NOT_FOUND",
    "message": "Wallet 'w-deleted' not found or has been archived",
    "details": {
      "field": "wallet_id",
      "reason": "Wallet does not exist or is deleted"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should restore wallet via `include_deleted=true` or use different wallet.

---

### EC-6: Reference to Deleted Category

**Trigger:** User creates transaction with deleted category.

**HTTP Status:** 404 Not Found

**Response:**
```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category 'c-deleted' not found or has been archived",
    "details": {
      "field": "category_id",
      "reason": "Category does not exist or is deleted"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should restore category or choose different category.

---

### EC-7: Transfer to Same Wallet

**Trigger:** User creates transfer with source = destination wallet.

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot transfer to the same wallet",
    "details": {
      "field": "source_wallet_id, destination_wallet_id",
      "reason": "Transfer requires different source and destination wallets"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should select different destination wallet.

---

### EC-8: Immutable Transaction Type Change

**Trigger:** User attempts to change transaction type (e.g., expense → income).

**HTTP Status:** 409 Conflict

**Response:**
```json
{
  "error": {
    "code": "IMMUTABLE_FIELD_CHANGE",
    "message": "Transaction type cannot be changed after creation",
    "details": {
      "field": "type",
      "reason": "Type is immutable; delete and recreate with new type"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions/t-123"
}
```

**Recovery:** User should delete transaction and create new one with correct type.

---

### EC-9: Future-Dated Transaction

**Trigger:** User creates transaction with `occurred_at` in future (beyond ±5 min tolerance).

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Transaction cannot be in the future",
    "details": {
      "field": "occurred_at",
      "reason": "Timestamp must not be more than 5 minutes in the future"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should adjust timestamp to current time or recent past.

---

### EC-10: Negative or Zero Transaction Amount

**Trigger:** User creates transaction with amount < 0 or = 0.

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Transaction amount must be greater than 0",
    "details": {
      "field": "amount",
      "reason": "Amount must be integer >= 0"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should enter valid positive amount.

---

### EC-11: Weak Password on Registration

**Trigger:** User registers with password < 8 chars or missing uppercase/number/special char.

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password does not meet security requirements",
    "details": {
      "field": "password",
      "reason": "Password must be 8+ characters with uppercase, lowercase, number, and special character"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/auth/register"
}
```

**Recovery:** User should create stronger password.

---

### EC-12: Missing Required Field

**Trigger:** User submits request missing required field.

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: wallet_id",
    "details": {
      "field": "wallet_id",
      "reason": "wallet_id is required"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should include all required fields.

---

### EC-13: Accessing Other User's Data

**Trigger:** User attempts to access/modify wallet/category/transaction of different user.

**HTTP Status:** 404 Not Found

**Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "reason": "You do not have access to this resource"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/wallets/other-user-wallet"
}
```

**Recovery:** User should only access their own resources.

---

### EC-14: Database Connection Failure

**Trigger:** Database becomes unreachable.

**HTTP Status:** 500 Internal Server Error

**Response:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Database connection failed. Please try again later.",
    "details": {
      "reason": "Service temporarily unavailable"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/wallets"
}
```

**Recovery:** System should retry after delay; user should refresh/retry.

---

### EC-15: Invalid Pagination Parameters

**Trigger:** User provides `limit` > 100 or `offset` < 0.

**HTTP Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid pagination parameters",
    "details": {
      "field": "limit",
      "reason": "limit must be between 1 and 100"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/transactions"
}
```

**Recovery:** User should provide valid limit/offset within allowed ranges.

---

## Data Constraints & Validation Rules

### Authentication

| Field | Constraint | Error |
|-------|-----------|-------|
| `username` | 3-50 chars, alphanumeric + `-_` only, unique | `VALIDATION_ERROR` or `DUPLICATE_USERNAME` |
| `password` | 8+ chars, must contain uppercase, lowercase, number, special char | `VALIDATION_ERROR` |
| `access_token` | Valid HS256 signature, not expired | `INVALID_TOKEN` |
| `refresh_token` | Valid HS256 signature, not expired (7 days) | `INVALID_TOKEN` |

### Category

| Field | Constraint | Error |
|-------|-----------|-------|
| `name` | 1-100 chars, required | `VALIDATION_ERROR` |
| `type` | `expense` or `income`, required | `VALIDATION_ERROR` |
| `description` | 0-500 chars, optional | `VALIDATION_ERROR` |
| `name + type` | Unique per user | `DUPLICATE_CATEGORY` |

### Wallet

| Field | Constraint | Error |
|-------|-----------|-------|
| `name` | 1-100 chars, unique per user, required | `VALIDATION_ERROR` or `DUPLICATE_WALLET_NAME` |
| `type` | `cash`, `bank`, `e-wallet`, `other`, required | `VALIDATION_ERROR` |
| `currency` | Valid ISO 4217 code (default: IDR), optional | `VALIDATION_ERROR` |
| `balance` | Derived from SUM(postings.amount), never stored | N/A |

### Transaction (Expense/Income)

| Field | Constraint | Error |
|-------|-----------|-------|
| `type` | `expense` or `income`, immutable | `VALIDATION_ERROR` or `IMMUTABLE_FIELD_CHANGE` |
| `amount` | Integer >= 0, required | `VALIDATION_ERROR` |
| `occurred_at` | Unix timestamp, not >5min in future, required | `VALIDATION_ERROR` |
| `wallet_id` | FK to Wallet, not deleted, required | `WALLET_NOT_FOUND` |
| `category_id` | FK to Category, not deleted, required | `CATEGORY_NOT_FOUND` |
| `note` | 0-500 chars, optional | `VALIDATION_ERROR` |
| `payee` | 0-100 chars, optional | `VALIDATION_ERROR` |

### Transaction (Transfer)

| Field | Constraint | Error |
|-------|-----------|-------|
| `type` | `transfer`, immutable, required | `VALIDATION_ERROR` |
| `amount` | Integer >= 0, required | `VALIDATION_ERROR` |
| `occurred_at` | Unix timestamp, not >5min in future, required | `VALIDATION_ERROR` |
| `source_wallet_id` | FK to Wallet, not deleted, ≠ destination, required | `WALLET_NOT_FOUND` or `BUSINESS_RULE_VIOLATION` |
| `destination_wallet_id` | FK to Wallet, not deleted, ≠ source, required | `WALLET_NOT_FOUND` or `BUSINESS_RULE_VIOLATION` |
| `category_id` | Must NOT be provided (NULL) | `VALIDATION_ERROR` |
| `note` | 0-500 chars, optional | `VALIDATION_ERROR` |

### Posting (Internal)

| Field | Constraint | Error |
|-------|-----------|-------|
| `event_id` | FK to TransactionEvent, not deleted | `TRANSACTION_NOT_FOUND` |
| `wallet_id` | FK to Wallet, not deleted | `WALLET_NOT_FOUND` |
| `amount` | Integer (positive or negative), != 0 | `VALIDATION_ERROR` |
| **Transfer posting pair** | Must have 2 postings with equal/opposite amounts | `INVALID_POSTING_COUNT` or `AMOUNT_MISMATCH` |

---

## API Response Format

### Standard Success Response

```json
{
  "data": { /* Resource object or array of objects */ },
  "pagination": { /* Only for list endpoints */ },
  "meta": {
    "timestamp": 1709299445,
    "version": "1.0"
  }
}
```

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "reason": "Specific validation reason"
    }
  },
  "timestamp": 1709299445,
  "path": "/api/v1/endpoint"
}
```

### Pagination Object

```json
{
  "limit": 10,
  "offset": 0,
  "total": 100,
  "has_next": true,
  "has_previous": false
}
```

### HTTP Status Codes

| Code | Scenario | Response |
|------|----------|----------|
| 200 | Successful GET, PATCH, or special operations | Resource object |
| 201 | Successful POST (create) | Newly created resource |
| 204 | Successful DELETE | Empty body |
| 400 | Validation error, business rule violation | Error object |
| 401 | Missing or invalid authentication | Error object |
| 404 | Resource not found | Error object |
| 409 | Conflict (duplicate name, immutable field change) | Error object |
| 500 | Unhandled server error | Error object |

---

## Summary

This requirements document specifies:

✅ **13 Functional Requirements** covering auth, categories, wallets, and transactions
✅ **7 Non-Functional Requirements** for performance, scale, security, reliability, testing, logging
✅ **15 Edge Cases & Error Scenarios** with HTTP status codes and recovery paths
✅ **Complete Validation Rules** for all fields and constraints
✅ **Standard Response Format** for success and error responses

**Ready for Phase 3:** Architecture Design with database schema, API contracts, and module structure.

