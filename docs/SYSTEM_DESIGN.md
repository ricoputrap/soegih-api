# System Design - MVP (19 FEB 2026)

## A. Overview

Soegih API is a backend service that provides a set of APIs for managing and interacting with various resources in Soegih, an application that allows users to manage their personal finances.

### A.1. Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: Supabase
- **API Style**: RESTful JSON APIs
- **API Version**: v1 (prefix: `/api/v1/`)

### A.2. Date/Time Format

- All timestamps are in **ISO 8601** format (UTC timezone)
- Timezone: **UTC** (user timezone handling will be added in next development phase with user authentication)
- Example: `2026-02-19T12:00:00Z` represents February 19, 2026 at 12:00:00 UTC
- Timestamps are automatically managed:
  - `created_at`: Set on record creation, immutable
  - `updated_at`: Automatically updated on every record modification
  - `deleted_at`: Set on soft delete, can be cleared to restore

## B. Functional Requirements

Here is the list of functional requirements for the Soegih application. Some API endpoints should be designed to support these requirements.

### B.1. Category Management

1. As a user, I want to be able to view all categories so that I can see my current list of income & expense categories.
   - As a user, I want to be able to sort the categories by name.
   - As a user, I want to be able to filter the categories by type (income or expense).
   - As a user, I want to be able to search for categories by name.
2. As a user, I want to be able to create a new category for my income & expenses so that I can better track my spending.
3. As a user, I want to be able to update an existing category so that I can modify its name or description.
4. As a user, I want to be able to delete a category so that I can remove it from my list of categories.
5. As a user, I want to be able to delete multiple categories so that I can remove them from my list of categories.

### B.2. Wallet Management

1. As a user, I want to be able to view all wallets so that I can see my current list of wallets.
   - As a user, I want to be able to sort the wallets by name, type, or balance.
   - As a user, I want to be able to filter the wallets by type (bank, cash, e-wallet, other).
   - As a user, I want to be able to search for wallets by name.
2. As a user, I want to be able to create a new wallet so that I can better track my spending.
3. As a user, I want to be able to update an existing wallet so that I can modify its name or description.
4. As a user, I want to be able to delete a wallet so that I can remove it from my list of wallets.
5. As a user, I want to be able to delete multiple wallets so that I can remove them from my list of wallets.

### B.3. Transaction Management

1. As a user, I want to be able to view all transactions so that I can see my current list of transactions.
   - As a user, I want to be able to sort the transactions by date, type (income, expense, transfer), wallet, category, and amount.
   - As a user, I want to be able to filter the transactions by type (income, expense, transfer), wallet, category, or date range.
   - As a user, I want to be able to search for transactions by note.
   - As a user, I want to be able to paginate transactions.
2. As a user, I want to be able to create a new transaction so that I can better track my spending.
3. As a user, I want to be able to update an existing transaction so that I can modify its amount, category, or note.
4. As a user, I want to be able to delete a transaction so that I can remove it from my list of transactions.
5. As a user, I want to be able to delete multiple transactions so that I can remove them from my list of transactions.

## C. Non-Functional Requirements

1. Reliability: The system should be reliable and available 24/7 with 99.9% uptime.
2. Scalability: The system should be able to handle 100 users concurrently.
3. Security: The system should be secure and protect user data from unauthorized access, modification, or deletion.
4. Performance: The system should be fast and responsive, providing a good user experience with p95 of 2 seconds latency.
5. Persistence: The system should persist data for at least 1 year.
6. Backup: The system should have a backup strategy in place to ensure data integrity and availability.
7. UI: The system should be responsive for desktop, mobile, and tablet devices.

## D. Core Entities

### D.1. CATEGORY

- id: string
- name: string
- description: string?
- type: expense | income
- created_at: DateTime (auto-set on creation)
- updated_at: DateTime (auto-updated on changes)
- deleted_at: DateTime? (null if not deleted)

### D.2. WALLET

- id: string
- name: string
- type: cash | bank | e-wallet | other
- balance: integer (derived from sum of postings)
- currency: string (default: IDR)
- created_at: DateTime (auto-set on creation)
- updated_at: DateTime (auto-updated on changes)
- deleted_at: DateTime? (null if not deleted)

### D.3. TRANSACTION_EVENT

- id: string
- occurred_at: DateTime
- type: expense | income | transfer
- note: string?
- payee: string?
- category_id: string? (FK to CATEGORY.id, null for transfer type)
- created_at: DateTime (auto-set on creation)
- updated_at: DateTime (auto-updated on changes)
- deleted_at: DateTime? (null if not deleted)

### D.4. POSTING

- id: string
- event_id: string (FK to TRANSACTION_EVENT.id)
- wallet_id: string (FK to WALLET.id)
- amount: integer (positive for debit, negative for credit)
- created_at: DateTime (auto-set on creation)
- deleted_at: DateTime? (null if not deleted)

### D.5. Transaction & Posting Relationships

#### How Postings Relate to Events

A `TRANSACTION_EVENT` always has at least one `Posting` record:

1. **Income/Expense Transactions**: Single posting
   - Example: Income event with 1 posting to wallet A (+1,000,000 IDR)
   - Example: Expense event with 1 posting from wallet A (-500,000 IDR)
   - Each event is tied to exactly one wallet

2. **Transfer Transactions**: Multiple postings (exactly 2)
   - Example: Transfer from wallet A to wallet B
     - Event type: `transfer`, category_id: null
     - Posting 1: wallet A, amount: -1,000,000 IDR (debit from source)
     - Posting 2: wallet B, amount: +1,000,000 IDR (credit to destination)
   - This ensures atomic transfers: both postings must succeed or both fail

#### Transfer Mechanics

**Transfer Process**:

1. User initiates transfer: from wallet A (source) to wallet B (destination), amount X
2. System creates a `TRANSACTION_EVENT` with:
   - type: `transfer`
   - category_id: null
   - occurred_at: current timestamp
3. System creates two `Posting` records atomically:
   - Posting 1: event_id, wallet_id (A), amount: -X (debit from source)
   - Posting 2: event_id, wallet_id (B), amount: +X (credit to destination)
4. Both postings must succeed or the entire transaction is rolled back (database transaction)

**Key Points**:

- Income/Expense transactions have exactly 1 posting
- Transfer transactions have exactly 2 postings
- Transfers have no category_id (they don't categorize spending, just move money)
- The amount must be identical in both postings for transfers (equal debit/credit)
- Transfer transactions maintain double-entry bookkeeping principles
- Wallet balance is calculated as: SUM(amount) of all postings where wallet_id = wallet.id

## E. Data Constraints & Business Rules

### E.1. Wallet Constraints

- Wallet balance can go negative (allowed)
- Wallet name must be unique per user (when user authentication is added)
- Wallet type is editable (metadata, not transactional data)
- **Deletion Rules**:
  - Wallet can be deleted even if it has existing transactions (soft delete preserves data)
  - Deletion updates wallet name by appending "[ARCHIVED <unix timestamp>]" suffix (see E.4)
    - Example: "My Cash" → "My Cash [ARCHIVED 2026-02-19T12:00:00Z]"
  - If wallet is used in existing transactions, the delete API should return a warning flag to prompt user confirmation before actual deletion
  - This prevents accidental deletion while maintaining data integrity through soft delete

### E.2. Category Constraints

- Category name must be unique globally (no user isolation in MVP, will adjust in next phase)
- Category type is editable (metadata, not transactional data)
- **Deletion Rules**:
  - Category can be deleted even if it has existing transactions (soft delete preserves data)
  - Deletion updates category name by appending "[ARCHIVED <unix timestamp>]" suffix (see E.4)
    - Example: "Groceries" → "Groceries [ARCHIVED 2026-02-19T12:00:00Z]"
  - If category is used in existing transactions, the delete API should return a warning flag to prompt user confirmation before actual deletion
  - This prevents accidental deletion while maintaining data integrity through soft delete

### E.3. Transaction Constraints

- **Type**: Cannot be changed after creation (immutable property)
- **Income/Expense Transactions** can be edited: amount, note, payee, category, wallet
- **Transfer Transactions** can be edited: amount, source wallet, destination wallet
  - Transfers have no category (null) and cannot be assigned one
  - When editing transfer amount or wallets, both postings are atomically updated
- Changing wallet in a transaction updates the associated posting's wallet_id
- Transfer transactions must have exactly 2 postings with equal and opposite amounts
- Amount constraints: Minimum 0, no maximum

#### E.3.1. Transaction Deletion

- When a transaction is deleted, it is **hard-deleted** (completely removed, not soft-deleted)
- Wallet balances are automatically adjusted when a transaction is deleted
- Deleted transactions cannot be recovered (no soft delete for transactions)

### E.4. Soft Delete vs Hard Delete Strategy

#### Context: Personal Finance App

In a personal finance application, historical data is critical for:

- Accurate balance calculations (wallet balance = sum of all postings)
- Tax/audit trails
- Financial reporting and analytics
- User trust (they never lose their data)

#### Trade-offs Analysis

| Aspect                  | Soft Delete                                              | Hard Delete                                             |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| **Balance Calculation** | ✅ Accurate: Deleted postings still count in balance sum | ❌ Wrong: Deleting postings changes historical balances |
| **Audit Trail**         | ✅ Full history preserved                                | ❌ Data loss, no audit trail                            |
| **Tax/Compliance**      | ✅ Safe: Can reproduce historical reports                | ❌ Risky: Cannot reproduce reports                      |
| **Storage**             | ❌ More storage (keeps deleted records)                  | ✅ Efficient: Removes deleted records                   |
| **Query Performance**   | ⚠️ Moderate: Must filter `deleted_at IS NULL`            | ✅ Fast: Only query live records                        |
| **Undo/Recovery**       | ✅ Can restore deleted items                             | ❌ Permanent loss                                       |
| **User Experience**     | ✅ Users feel safe deleting                              | ❌ Users fear deleting                                  |

#### Chosen Strategy: Soft Delete

**Soft Delete Applied to:**

- POSTING records (financial ledger - must never be lost)
- TRANSACTION_EVENT records (parent of postings - must be recoverable)
- WALLET records (deleting wallet invalidates historical reports)
- CATEGORY records (deleting category breaks transaction history)

**Implementation:**

Add `deleted_at: timestamp?` field to all entities. When deleted:

1. Set `deleted_at` to current timestamp (ISO 8601 DateTime)
2. Append entity name with "[ARCHIVED <ISO timestamp>]" suffix
   - For WALLET: Update `name` field
   - For CATEGORY: Update `name` field
   - For TRANSACTION_EVENT & POSTING: No name field to update

**Implications:**

- All queries must include `WHERE deleted_at IS NULL` filter
- Wallet balance calculation includes all postings (deleted or not)
- Deleted names remain visible for audit/reference purposes
- Prevents name reuse (uniqueness constraint still applies to updated names)
- Users can restore deleted items within a retention period (e.g., 30 days)
- After retention period, implement archive job to permanently delete

### E.5. Deletion Confirmation Pattern

**Problem**: Users should not accidentally delete a wallet/category that's actively used in transactions.

**Solution**: Two-phase deletion API with confirmation.

#### Delete Request Flow

**Phase 1: Pre-delete Check**
- Client calls DELETE endpoint with `confirm=false` (or omits the parameter)
- Server checks if wallet/category has existing non-deleted transactions/postings
- If used: Return HTTP 200 with a confirmation prompt (NOT an error)
- If unused: Proceed to Phase 2

**Phase 2: Confirmed Deletion**
- Client calls DELETE endpoint with `confirm=true`
- Server performs soft delete regardless of transaction usage

#### API Design

**DELETE /wallets/{id}**

```
Query Parameter:
  confirm: boolean (optional, default: false)
    - false: Pre-delete check (returns confirmation if needed)
    - true: Force deletion (archives wallet regardless of usage)
```

**Phase 1 Response (used in transactions, needs confirmation):**

```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "id": "w123",
    "name": "My Cash",
    "transaction_count": 42,
    "warning": "This wallet is used in 42 transactions. Deleting it will archive the wallet name but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

**Phase 1 Response (NOT used in transactions, safe to delete):**

```json
{
  "status": "DELETED",
  "data": {
    "id": "w123",
    "name": "My Cash [ARCHIVED 2026-02-19T12:00:00Z]",
    "deleted_at": 2026-02-19T12:00:00Z
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (deletion confirmed):**

```json
{
  "status": "DELETED",
  "data": {
    "id": "w123",
    "name": "My Cash [ARCHIVED 2026-02-19T12:00:00Z]",
    "deleted_at": 2026-02-19T12:00:00Z,
    "transaction_count_archived": 42
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

#### Implementation Notes

- **Single HTTP Status**: Always return 200 (not an error)
- **Confirmation Flag**: `confirmation_required` field tells client whether to show confirmation dialog
- **Transaction Count**: Helps user understand the impact of deletion
- **Safety**: Soft delete guarantees no data loss even if archived wallet is referenced by transactions

#### Client-Side Flow Example

```
1. User clicks "Delete Wallet"
2. Client calls: DELETE /wallets/{id} (no confirm param)
3. Server returns confirmation_required = true + transaction_count
4. UI shows: "This wallet has 42 transactions. Delete anyway?"
5. User confirms "Yes"
6. Client calls: DELETE /wallets/{id}?confirm=true
7. Wallet is archived successfully
```

### E.6. Bulk Deletion with Confirmation Pattern

**Problem**: Users should be able to delete multiple wallets/categories safely with confirmation only if any of them are in use.

**Solution**: Two-phase bulk deletion API similar to single deletion.

#### Bulk Delete Request Flow

**Phase 1: Pre-delete Check**
- Client calls DELETE endpoint with array of IDs and `confirm=false` (or omits the parameter)
- Server checks if ANY of the selected items have existing non-deleted transactions/postings
- If any are used: Return HTTP 200 with list of items in use for confirmation
- If none are used: Proceed to Phase 2 and delete all items

**Phase 2: Confirmed Bulk Deletion**
- Client calls DELETE endpoint with array of IDs and `confirm=true`
- Server soft-deletes ALL selected items regardless of transaction usage
- Returns confirmation with count of deleted items

#### API Design

**DELETE /wallets (or /categories)**

```
Request Body:
  {
    "ids": ["w123", "w456", "w789"],
    "confirm": false  (optional, default: false)
  }
```

**Phase 1 Response (some items in use, needs confirmation):**

```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "total_selected": 3,
    "items_in_use": [
      {
        "id": "w123",
        "name": "My Cash",
        "transaction_count": 42
      },
      {
        "id": "w456",
        "name": "Savings",
        "transaction_count": 15
      }
    ],
    "items_safe_to_delete": [
      {
        "id": "w789",
        "name": "Old Wallet",
        "transaction_count": 0
      }
    ],
    "warning": "2 out of 3 selected wallets are used in transactions. Deleting will archive them but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

**Phase 1 Response (no items in use, safe to delete all):**

```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "w123",
        "name": "Old Wallet 1 [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z
      },
      {
        "id": "w456",
        "name": "Old Wallet 2 [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z
      },
      {
        "id": "w789",
        "name": "Old Wallet 3 [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z
      }
    ]
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (deletion confirmed):**

```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "w123",
        "name": "My Cash [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z,
        "transaction_count_archived": 42
      },
      {
        "id": "w456",
        "name": "Savings [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z,
        "transaction_count_archived": 15
      },
      {
        "id": "w789",
        "name": "Old Wallet [ARCHIVED 2026-02-19T12:00:00Z]",
        "deleted_at": 2026-02-19T12:00:00Z,
        "transaction_count_archived": 0
      }
    ]
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

#### Implementation Notes

- **Atomic Operation**: All selected items are deleted together or not at all
- **Partial Confirmation**: Client shows only items that need confirmation
- **Transaction Count**: Helps user understand impact of each deletion
- **Safety**: Soft delete guarantees no data loss even if archived items are referenced

#### Client-Side Flow Example

```
1. User selects 3 wallets to delete
2. Client calls: DELETE /wallets (body: {ids: [...], confirm: false})
3. Server returns items_in_use (2 items) + items_safe_to_delete (1 item)
4. UI shows dialog: "2 wallets have transactions. Delete all anyway?"
5. User confirms "Yes, delete all"
6. Client calls: DELETE /wallets (body: {ids: [...], confirm: true})
7. All 3 wallets are archived successfully
```

### E.7. Deleted/Archived Resource Queries

**Problem**: Users need to view and potentially unarchive deleted wallets/categories.

**Solution**: Use `include_deleted` query parameter to show archived items.

#### Query Parameter

**GET /wallets?include_deleted=true**

```
Query Parameter:
  include_deleted: boolean (optional, default: false)
    - false: Returns only active items (WHERE deleted_at IS NULL)
    - true: Returns both active and deleted items
```

#### Implementation Notes

- By default, all list endpoints return only active items
- Add `include_deleted=true` to retrieve archived items
- Archived items have non-null `deleted_at` timestamp and name with "[ARCHIVED ...]" suffix
- Can be combined with other filters: `GET /wallets?type=cash&include_deleted=true`

#### Unarchive/Restore Operation

**PATCH /wallets/{id}**

```
Request Body:
{
  "deleted_at": null
}

Response:
{
  "data": {
    "id": "w123",
    "name": "My Cash",
    "type": "cash",
    "balance": 500000,
    "currency": "IDR",
    "created_at": 2026-02-19T12:00:00Z,
    "updated_at": 2026-02-19T12:00:50Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:50Z,
    "version": "1.0"
  }
}
```

#### Restore Validation

- Can only restore archived wallets/categories (`deleted_at IS NOT NULL`)
- Setting `deleted_at: null` removes the archived status
- Restored name should have "[ARCHIVED ...]" suffix removed (cleaned up on restore)
- If original name already exists (created after deletion), return `CONFLICT` error with suggestion to rename first
- Apply same validation rules as create/update operations

### E.8. Naming Conventions

**Database & API Fields**:
- Use `snake_case` for all database columns and API request/response fields
- Use `_id` suffix for foreign key fields (e.g., `wallet_id`, `category_id`, `event_id`)
- Examples:
  - ✅ `wallet_id`, `category_id`, `created_at`, `updated_at`, `deleted_at`
  - ✅ `transaction_count`, `confirmation_required`, `is_safe`
  - ❌ `walletId`, `walletID` (use snake_case, not camelCase)

**Code (Functions, Variables)**:
- Use `camelCase` for TypeScript functions and variable names
- Use `PascalCase` for class and interface names
- Examples:
  - ✅ `getWalletById()`, `calculateWalletBalance()`, `isConfirmationRequired`
  - ✅ `class WalletService`, `interface CreateWalletDto`

---

## F. Error Handling & Validation

### F.1. Validation Rules

#### F.1.1. Wallet Validation

- **name**: Required, max 100 characters, unique per user
- **type**: Required, must be one of: `cash | bank | e-wallet | other`
- **currency**: Optional, must be a valid ISO 4217 code (default: IDR)

#### F.1.2. Category Validation

- **name**: Required, max 100 characters, unique globally
- **type**: Required, must be one of: `expense | income`
- **description**: Optional, max 500 characters

#### F.1.3. Transaction Event Validation

- **type**: Required, immutable, must be one of: `expense | income | transfer`
- **occurred_at**: Required, must not be in the future (or within tolerance, e.g., ±5 minutes), ISO 8601 DateTime format
- **amount**: Required, must be integer >= 0 (minimum 0, no maximum)
- **wallet_id**: Required, wallet must exist and not be deleted (for income/expense; transfer uses postings)
- **category_id**: Required for `expense | income`, must be null for `transfer`
- **note**: Optional, max 500 characters
- **payee**: Optional, max 100 characters (relevant for income/expense only)

#### F.1.4. Posting Validation

- **event_id**: Required, event must exist and not be deleted
- **wallet_id**: Required, wallet must exist and not be deleted
- **amount**: Required, integer (positive or negative), must not be zero
- Transfer transactions must have exactly 2 postings with equal and opposite amounts

#### F.1.5. Business Logic Validation

- When deleting a wallet/category with existing postings/transactions: soft delete with name archival
- When editing a transaction's wallet: the posting's wallet_id must be updated
- When editing a transaction: type cannot change
- When creating a transfer: source and destination wallets must be different
- When creating a transfer: amount must be positive (>= 0)
- When deleting a transaction: hard delete is performed, wallet balances are adjusted
- When bulk deleting: if any item is in use by transactions, return list for confirmation before deletion

### F.2. Error Response Format

All API errors will follow a standard error response format:

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
  "timestamp": 2026-02-19T12:00:00Z,
  "path": "/api/v1/wallets"
}
```

### F.3. HTTP Status Codes & Error Categories

| Status  | Code                      | Scenario                                                                 |
| ------- | ------------------------- | ------------------------------------------------------------------------ |
| **400** | `VALIDATION_ERROR`        | Invalid input (missing required field, format invalid)                   |
| **400** | `BUSINESS_RULE_VIOLATION` | Violates business logic (e.g., transfer to same wallet, negative amount) |
| **404** | `NOT_FOUND`               | Resource does not exist or is deleted                                    |
| **409** | `CONFLICT`                | Duplicate name, immutable field change attempt                           |
| **422** | `UNPROCESSABLE_ENTITY`    | Logical inconsistency (e.g., orphaned posting)                           |
| **500** | `INTERNAL_SERVER_ERROR`   | Unexpected server error                                                  |

### F.4. Common Error Codes

| Code                      | Meaning                              | Example                                              |
| ------------------------- | ------------------------------------ | ---------------------------------------------------- |
| `WALLET_NOT_FOUND`        | Wallet doesn't exist                 | Wallet ID in posting doesn't match any wallet        |
| `CATEGORY_NOT_FOUND`      | Category doesn't exist               | Category ID in transaction doesn't match             |
| `TRANSACTION_NOT_FOUND`   | Transaction doesn't exist            | Trying to update non-existent transaction            |
| `DUPLICATE_WALLET_NAME`   | Wallet name already exists           | Creating wallet with existing name                   |
| `DUPLICATE_CATEGORY_NAME` | Category name already exists         | Creating category with existing name                 |
| `IMMUTABLE_FIELD_CHANGE`  | Attempting to change immutable field | Changing transaction type from `expense` to `income` |
| `INVALID_TRANSFER`        | Transfer validation failed           | Source and destination wallets are the same          |
| `INVALID_POSTING_COUNT`   | Posting count mismatch               | Transfer with only 1 posting                         |
| `AMOUNT_MISMATCH`         | Posting amounts don't balance        | Transfer with unequal debit/credit amounts           |

---

## G. API Response Format

### G.1. Success Response Format

All successful API responses follow this standard format:

```json
{
  "data": {
    "id": "resource_id",
    "name": "resource_name",
    ...other fields...
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

**For list endpoints with pagination:**

```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 42,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:00Z,
    "version": "1.0"
  }
}
```

### G.2. Pagination Strategy

**Chosen: Offset-based pagination** (limit + offset)

#### Rationale & Trade-offs

| Aspect             | Offset-based                          | Cursor-based                         |
| ------------------ | ------------------------------------- | ------------------------------------ |
| **Implementation** | ✅ Simple: Skip N rows, take M        | ⚠️ Complex: Requires cursor encoding |
| **Performance**    | ⚠️ Slower on large offsets            | ✅ Consistent O(1) performance       |
| **Offset Jump**    | ✅ Can jump to any page               | ❌ Must traverse sequentially        |
| **Data Stability** | ❌ Affected by inserts/deletes        | ✅ Stable with concurrent changes    |
| **Use Case Fit**   | ✅ Best for small datasets (<100k)    | ✅ Best for large datasets (>1M)     |
| **URL Simplicity** | ✅ Simple: `?limit=10&offset=20`      | ❌ Complex: `?limit=10&cursor=...`   |
| **Client UX**      | ✅ Page numbers easy (P=offset/limit) | ⚠️ "Next/Prev" only, no page numbers |

**Recommendation for Soegih (MVP):**

- **Use offset-based pagination** (limit + offset)
- Rationale: MVP with small user base (<100 concurrent users), small transaction counts per wallet, simple implementation
- Future: Can migrate to cursor-based if needed for scalability

### G.3. Pagination Parameters

**Query Parameters:**

- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response Fields:**

- `pagination.total`: Total count of items matching filters
- `pagination.has_next`: Boolean indicating if more items exist
- `pagination.has_previous`: Boolean indicating if previous items exist

### G.4. Sorting & Filtering Parameters

**Sorting:**

- Parameter: `sort` (default: creation order)
- Format: `sort=field:asc` or `sort=field:desc`
- Multiple sorts: `sort=field1:asc,field2:desc`
- Example: `GET /wallets?sort=name:asc,balance:desc`

**Filtering:**

- Use query parameters matching field names
- Example: `GET /transactions?type=expense&wallet_id=w123`
- Date ranges: `occurred_at_gte` and `occurred_at_lte` for range queries
- Search: `search=term` for text-based search (searches name, note, payee fields)

### G.5. Field Selection (Response Body Optimization)

**Optional: Implement field projection**

- Parameter: `fields=id,name,balance` (comma-separated)
- Returns only specified fields to reduce payload
- Useful for mobile/bandwidth-constrained clients
- Default: Return all non-sensitive fields

### G.6. Response Examples

**Get Single Wallet (Success):**

```json
{
  "data": {
    "id": "w123",
    "name": "My Cash",
    "type": "cash",
    "balance": 500000,
    "currency": "IDR",
    "created_at": 2026-02-19T12:00:00Z,
    "updated_at": 2026-02-19T12:00:00Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

**Get All Transactions (Success with Pagination):**

```json
{
  "data": [
    {
      "id": "t1",
      "type": "expense",
      "amount": 50000,
      "occurred_at": 2026-02-19T12:00:00Z,
      "category": { "id": "c1", "name": "Groceries" },
      "wallet": { "id": "w1", "name": "My Cash" },
      "note": "Weekly shopping",
      "created_at": 2026-02-19T12:00:00Z,
      "updated_at": 2026-02-19T12:00:00Z
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
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

**Error Response:**

```json
{
  "error": {
    "code": "DUPLICATE_WALLET_NAME",
    "message": "Wallet with name 'My Cash' already exists",
    "details": {
      "field": "name",
      "reason": "Name must be unique per user"
    }
  },
  "timestamp": 2026-02-19T12:00:10Z,
  "path": "/api/v1/wallets"
}
```

---

## H. API Design

### H.1. Category API

#### H.1.1. Get All Categories

**GET /api/v1/categories**

**Query Parameters:**
- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)
- `type`: Filter by type (`expense` | `income`)
- `sort`: Sort by field (e.g., `name:asc`, `created_at:desc`)
- `search`: Search by name (partial match)
- `include_deleted`: Include archived categories (`true` | `false`, default: false)

**Response:**
```json
{
  "data": [
    {
      "id": "c1",
      "name": "Groceries",
      "description": "Food and groceries",
      "type": "expense",
      "created_at": 2026-02-19T12:00:00Z,
      "updated_at": 2026-02-19T12:00:00Z,
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
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

---

#### H.1.1.1. Get Single Category

**GET /api/v1/categories/{id}**

**Response:**
```json
{
  "data": {
    "id": "c1",
    "name": "Groceries",
    "description": "Food and groceries",
    "type": "expense",
    "created_at": 2026-02-19T12:00:00Z,
    "updated_at": 2026-02-19T12:00:00Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

---

#### H.1.2. Create Category

**POST /api/v1/categories**

**Request Body:**
```json
{
  "name": "Utilities",
  "description": "Electricity, water, gas",
  "type": "expense"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "c2",
    "name": "Utilities",
    "description": "Electricity, water, gas",
    "type": "expense",
    "created_at": 2026-02-19T12:00:10Z,
    "updated_at": 2026-02-19T12:00:10Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

---

#### H.1.3. Update Category

**PATCH /api/v1/categories/{id}**

**Request Body (Update fields):**
```json
{
  "name": "Updated Utilities",
  "description": "Updated description",
  "type": "expense"
}
```

**Request Body (Restore archived category):**
```json
{
  "deleted_at": null
}
```

**Response:**
```json
{
  "data": {
    "id": "c2",
    "name": "Updated Utilities",
    "description": "Updated description",
    "type": "expense",
    "created_at": 2026-02-19T12:00:10Z,
    "updated_at": 2026-02-19T12:00:20Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:20Z,
    "version": "1.0"
  }
}
```

---

#### H.1.4. Delete Single Category

**DELETE /api/v1/categories/{id}**

**Query Parameters:**
- `confirm`: Force deletion confirmation (`true` | `false`, default: false)

**Phase 1 Response (Confirmation Required):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "id": "c2",
    "name": "Groceries",
    "transaction_count": 42,
    "warning": "This category is used in 42 transactions. Deleting it will archive the category name but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:30Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (Deleted - confirm=true):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "c2",
    "name": "Groceries [ARCHIVED 2026-02-19T12:00:30Z]",
    "deleted_at": 2026-02-19T12:00:30Z,
    "transaction_count_archived": 42
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:30Z,
    "version": "1.0"
  }
}
```

---

#### H.1.5. Delete Multiple Categories

**DELETE /api/v1/categories**

**Request Body:**
```json
{
  "ids": ["c1", "c2", "c3"],
  "confirm": false
}
```

**Phase 1 Response (Confirmation Required):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "total_selected": 3,
    "items_in_use": [
      {
        "id": "c1",
        "name": "Groceries",
        "transaction_count": 42
      },
      {
        "id": "c2",
        "name": "Transport",
        "transaction_count": 15
      }
    ],
    "items_safe_to_delete": [
      {
        "id": "c3",
        "name": "Entertainment",
        "transaction_count": 0
      }
    ],
    "warning": "2 out of 3 selected categories are used in transactions. Deleting will archive them but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:30Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (Deleted - confirm=true):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "c1",
        "name": "Groceries [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": 2026-02-19T12:00:30Z,
        "transaction_count_archived": 42
      },
      {
        "id": "c2",
        "name": "Transport [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": 2026-02-19T12:00:30Z,
        "transaction_count_archived": 15
      },
      {
        "id": "c3",
        "name": "Entertainment [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": 2026-02-19T12:00:30Z,
        "transaction_count_archived": 0
      }
    ]
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:30Z,
    "version": "1.0"
  }
}
```

---

### H.2. Wallet API

#### H.2.1. Get All Wallets

**GET /api/v1/wallets**

**Query Parameters:**
- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)
- `type`: Filter by type (`cash` | `bank` | `e-wallet` | `other`)
- `sort`: Sort by field (e.g., `name:asc`, `balance:desc`)
- `search`: Search by name (partial match)
- `include_deleted`: Include archived wallets (`true` | `false`, default: false)

**Response:**
```json
{
  "data": [
    {
      "id": "w1",
      "name": "My Cash",
      "type": "cash",
      "balance": 500000,
      "currency": "IDR",
      "created_at": 2026-02-19T12:00:00Z,
      "updated_at": 2026-02-19T12:00:00Z,
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
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

---

#### H.2.1.1. Get Single Wallet

**GET /api/v1/wallets/{id}**

**Response:**
```json
{
  "data": {
    "id": "w1",
    "name": "My Cash",
    "type": "cash",
    "balance": 500000,
    "currency": "IDR",
    "created_at": 2026-02-19T12:00:00Z,
    "updated_at": 2026-02-19T12:00:00Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

---

#### H.2.2. Create Wallet

**POST /api/v1/wallets**

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "bank",
  "currency": "IDR"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "w2",
    "name": "Savings Account",
    "type": "bank",
    "balance": 0,
    "currency": "IDR",
    "created_at": 2026-02-19T12:00:20Z,
    "updated_at": 2026-02-19T12:00:20Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:20Z,
    "version": "1.0"
  }
}
```

---

#### H.2.3. Update Wallet

**PATCH /api/v1/wallets/{id}**

**Request Body (Update fields):**
```json
{
  "name": "Updated Savings",
  "type": "e-wallet"
}
```

**Request Body (Restore archived wallet):**
```json
{
  "deleted_at": null
}
```

**Response:**
```json
{
  "data": {
    "id": "w2",
    "name": "Updated Savings",
    "type": "e-wallet",
    "balance": 500000,
    "currency": "IDR",
    "created_at": 2026-02-19T12:00:20Z,
    "updated_at": 2026-02-19T12:00:30Z,
    "deleted_at": null
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:30Z,
    "version": "1.0"
  }
}
```

---

#### H.2.4. Delete Single Wallet

**DELETE /api/v1/wallets/{id}**

**Query Parameters:**
- `confirm`: Force deletion confirmation (`true` | `false`, default: false)

**Phase 1 Response (Confirmation Required):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "id": "w1",
    "name": "My Cash",
    "transaction_count": 42,
    "warning": "This wallet is used in 42 transactions. Deleting it will archive the wallet name but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:40Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (Deleted - confirm=true):**
```json
{
  "status": "DELETED",
  "data": {
    "id": "w1",
    "name": "My Cash [ARCHIVED 2026-02-19T12:00:40Z]",
    "deleted_at": 2026-02-19T12:00:40Z,
    "transaction_count_archived": 42
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:40Z,
    "version": "1.0"
  }
}
```

---

#### H.2.5. Delete Multiple Wallets

**DELETE /api/v1/wallets**

**Request Body:**
```json
{
  "ids": ["w1", "w2", "w3"],
  "confirm": false
}
```

**Phase 1 Response (Confirmation Required):**
```json
{
  "status": "CONFIRMATION_REQUIRED",
  "data": {
    "total_selected": 3,
    "items_in_use": [
      {
        "id": "w1",
        "name": "My Cash",
        "transaction_count": 42
      }
    ],
    "items_safe_to_delete": [
      {
        "id": "w2",
        "name": "Savings",
        "transaction_count": 0
      },
      {
        "id": "w3",
        "name": "E-wallet",
        "transaction_count": 0
      }
    ],
    "warning": "1 out of 3 selected wallets is used in transactions. Deleting will archive it but keep all transaction data intact."
  },
  "confirmation_required": true,
  "meta": {
    "timestamp": 2026-02-19T12:00:40Z,
    "version": "1.0"
  }
}
```

**Phase 2 Response (Deleted - confirm=true):**
```json
{
  "status": "DELETED",
  "data": {
    "total_selected": 3,
    "deleted_count": 3,
    "items": [
      {
        "id": "w1",
        "name": "My Cash [ARCHIVED 2026-02-19T12:00:40Z]",
        "deleted_at": 2026-02-19T12:00:40Z,
        "transaction_count_archived": 42
      },
      {
        "id": "w2",
        "name": "Savings [ARCHIVED 2026-02-19T12:00:40Z]",
        "deleted_at": 2026-02-19T12:00:40Z,
        "transaction_count_archived": 0
      },
      {
        "id": "w3",
        "name": "E-wallet [ARCHIVED 2026-02-19T12:00:40Z]",
        "deleted_at": 2026-02-19T12:00:40Z,
        "transaction_count_archived": 0
      }
    ]
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:40Z,
    "version": "1.0"
  }
}
```

---

### H.3. Transaction API

#### H.3.1. Get All Transactions

**GET /api/v1/transactions**

**Query Parameters:**
- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)
- `type`: Filter by type (`expense` | `income` | `transfer`)
- `wallet_id`: Filter by wallet ID
- `category_id`: Filter by category ID (for income/expense only)
- `occurred_at_gte`: Filter by start date (unix timestamp)
- `occurred_at_lte`: Filter by end date (unix timestamp)
- `sort`: Sort by field (e.g., `occurred_at:desc`, `amount:asc`)
- `search`: Search by note (partial match)

**Response:**
```json
{
  "data": [
    {
      "id": "t1",
      "type": "expense",
      "amount": 50000,
      "occurred_at": 2026-02-19T12:00:00Z,
      "category": {
        "id": "c1",
        "name": "Groceries"
      },
      "wallet": {
        "id": "w1",
        "name": "My Cash"
      },
      "note": "Weekly shopping",
      "payee": null,
      "created_at": 2026-02-19T12:00:00Z,
      "updated_at": 2026-02-19T12:00:00Z,
      "deleted_at": null
    },
    {
      "id": "t2",
      "type": "transfer",
      "amount": 100000,
      "occurred_at": 2026-02-19T12:01:40Z,
      "source_wallet": {
        "id": "w1",
        "name": "My Cash"
      },
      "destination_wallet": {
        "id": "w2",
        "name": "Savings"
      },
      "note": "Transfer to savings",
      "category": null,
      "created_at": 2026-02-19T12:01:40Z,
      "updated_at": 2026-02-19T12:01:40Z,
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
    "timestamp": 2026-02-19T12:01:50Z,
    "version": "1.0"
  }
}
```

---

#### H.3.1.1. Get Single Transaction

**GET /api/v1/transactions/{id}**

**Response (Income/Expense):**
```json
{
  "data": {
    "id": "t1",
    "type": "expense",
    "amount": 50000,
    "occurred_at": 2026-02-19T12:00:00Z,
    "category": {
      "id": "c1",
      "name": "Groceries"
    },
    "wallet": {
      "id": "w1",
      "name": "My Cash"
    },
    "note": "Weekly shopping",
    "payee": null,
    "created_at": 2026-02-19T12:00:00Z,
    "updated_at": 2026-02-19T12:00:00Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:00:10Z,
    "version": "1.0"
  }
}
```

**Response (Transfer):**
```json
{
  "data": {
    "id": "t2",
    "type": "transfer",
    "amount": 100000,
    "occurred_at": 2026-02-19T12:01:40Z,
    "source_wallet": {
      "id": "w1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w2",
      "name": "Savings"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 2026-02-19T12:01:40Z,
    "updated_at": 2026-02-19T12:01:40Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:01:50Z,
    "version": "1.0"
  }
}
```

---

#### H.3.2. Create Transaction

**POST /api/v1/transactions**

**Request Body (Income/Expense):**
```json
{
  "type": "expense",
  "amount": 50000,
  "occurred_at": 2026-02-19T12:00:00Z,
  "wallet_id": "w1",
  "category_id": "c1",
  "note": "Weekly shopping",
  "payee": null
}
```

**Request Body (Transfer):**
```json
{
  "type": "transfer",
  "amount": 100000,
  "occurred_at": 2026-02-19T12:01:40Z,
  "source_wallet_id": "w1",
  "destination_wallet_id": "w2",
  "note": "Transfer to savings"
}
```

**Response (201 Created - Income/Expense):**
```json
{
  "data": {
    "id": "t3",
    "type": "expense",
    "amount": 50000,
    "occurred_at": 2026-02-19T12:00:00Z,
    "category": {
      "id": "c1",
      "name": "Groceries"
    },
    "wallet": {
      "id": "w1",
      "name": "My Cash"
    },
    "note": "Weekly shopping",
    "payee": null,
    "created_at": 2026-02-19T12:02:00Z,
    "updated_at": 2026-02-19T12:02:00Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:02:00Z,
    "version": "1.0"
  }
}
```

**Response (201 Created - Transfer):**
```json
{
  "data": {
    "id": "t4",
    "type": "transfer",
    "amount": 100000,
    "occurred_at": 2026-02-19T12:01:40Z,
    "source_wallet": {
      "id": "w1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w2",
      "name": "Savings"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 2026-02-19T12:02:00Z,
    "updated_at": 2026-02-19T12:02:00Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:02:00Z,
    "version": "1.0"
  }
}
```

---

#### H.3.3. Update Transaction

**PATCH /api/v1/transactions/{id}**

**Editable Fields:**
- **Income/Expense**: amount, category_id, note, payee, wallet_id (type cannot change)
- **Transfer**: amount, source_wallet_id, destination_wallet_id (type cannot change, no category)

**Request Body (Income/Expense - Update fields):**
```json
{
  "amount": 60000,
  "category_id": "c2",
  "note": "Updated note",
  "payee": "John Doe",
  "wallet_id": "w2"
}
```

**Request Body (Transfer - Update amount and wallets):**
```json
{
  "amount": 150000,
  "source_wallet_id": "w1",
  "destination_wallet_id": "w3"
}
```

**Response (Income/Expense):**
```json
{
  "data": {
    "id": "t3",
    "type": "expense",
    "amount": 60000,
    "occurred_at": 2026-02-19T12:00:00Z,
    "category": {
      "id": "c2",
      "name": "Transport"
    },
    "wallet": {
      "id": "w2",
      "name": "Savings"
    },
    "note": "Updated note",
    "payee": "John Doe",
    "created_at": 2026-02-19T12:02:00Z,
    "updated_at": 2026-02-19T12:02:10Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:02:10Z,
    "version": "1.0"
  }
}
```

**Response (Transfer):**
```json
{
  "data": {
    "id": "t4",
    "type": "transfer",
    "amount": 150000,
    "occurred_at": 2026-02-19T12:01:40Z,
    "source_wallet": {
      "id": "w1",
      "name": "My Cash"
    },
    "destination_wallet": {
      "id": "w3",
      "name": "E-wallet"
    },
    "note": "Transfer to savings",
    "category": null,
    "created_at": 2026-02-19T12:02:00Z,
    "updated_at": 2026-02-19T12:02:10Z
  },
  "meta": {
    "timestamp": 2026-02-19T12:02:10Z,
    "version": "1.0"
  }
}
```

---

#### H.3.4. Delete Single Transaction

**DELETE /api/v1/transactions/{id}**

**Notes:**
- Transaction is **hard-deleted immediately** (not recoverable)
- Wallet balances are automatically adjusted
- No confirmation dialog shown (user must confirm deletion on client side)
- Empty response body with status 204 (No Content)

**Response (204 No Content):**
- Empty body

---

#### H.3.5. Delete Multiple Transactions

**DELETE /api/v1/transactions**

**Request Body:**
```json
{
  "ids": ["t1", "t2", "t3"]
}
```

**Notes:**
- All transactions are **hard-deleted immediately** (not recoverable)
- Wallet balances are automatically adjusted for all affected wallets
- No confirmation dialog shown (user must confirm deletion on client side)
- Atomic operation: all transactions deleted together or request fails
- Empty response body with status 204 (No Content)

**Response (204 No Content):**
- Empty body
