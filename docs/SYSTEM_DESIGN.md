# System Design - MVP (19 FEB 2026)

## A. Overview

Soegih API is a backend service that provides a set of APIs for managing and interacting with various resources in Soegih, an application that allows users to manage their personal finances.

### A.1. Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: (To be specified)
- **API Style**: RESTful JSON APIs

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
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp? (null if not deleted)

### D.2. WALLET

- id: string
- name: string
- type: cash | bank | e-wallet | other
- balance: integer (derived from sum of postings)
- currency: string (default: IDR)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp? (null if not deleted)

### D.3. TRANSACTION_EVENT

- id: string
- occurred_at: timestamp
- type: expense | income | transfer
- note: string?
- payee: string?
- category_id: string? (FK to CATEGORY.id, null for transfer type)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp? (null if not deleted)

### D.4. POSTING

- id: string
- event_id: string (FK to TRANSACTION_EVENT.id)
- wallet_id: string (FK to WALLET.id)
- amount: integer (positive for debit, negative for credit)
- created_at: timestamp
- deleted_at: timestamp? (null if not deleted)

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
- When deleted, wallet name is appended with "[ARCHIVED <unix timestamp>]" suffix (soft delete used, see E.4)
  - Example: "My Cash" → "My Cash [ARCHIVED 1708425600]"
  - This prevents name reuse and makes deleted wallets identifiable in queries

### E.2. Category Constraints

- Category name must be unique globally (no user isolation in MVP, will adjust in next phase)
- Category type is editable (metadata, not transactional data)
- When deleted, category name is appended with "[ARCHIVED <unix timestamp>]" suffix (soft delete used, see E.4)
  - Example: "Groceries" → "Groceries [ARCHIVED 1708425600]"
  - This prevents name reuse and makes deleted categories identifiable in queries

### E.3. Transaction Constraints

- Transaction type cannot be changed after creation (immutable property)
- Transaction can be edited: amount, note, payee, category, wallet (except type)
- Changing wallet in a transaction updates the associated posting's wallet_id
- Transfer transactions must have exactly 2 postings with equal and opposite amounts
- Transfer cannot be edited (delete and recreate required)
- Transfers cannot be reversed without creating a new transfer transaction

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

1. Set `deleted_at` to current timestamp (unix timestamp)
2. Append entity name with "[ARCHIVED <unix timestamp>]" suffix
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
- **occurred_at**: Required, must not be in the future (or within tolerance, e.g., ±5 minutes)
- **amount**: Required, must be positive integer > 0
- **wallet_id**: Required, wallet must exist and not be deleted
- **category_id**: Required for `expense | income`, must be null for `transfer`
- **note**: Optional, max 500 characters
- **payee**: Optional, max 100 characters (relevant for income/expense)

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
  "timestamp": 1708425600,
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
    "timestamp": 1708425600,
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
    "timestamp": 1708425600,
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
    "created_at": 1708425600,
    "updated_at": 1708425600
  },
  "meta": {
    "timestamp": 1708425610,
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
      "occurred_at": 1708425600,
      "category": { "id": "c1", "name": "Groceries" },
      "wallet": { "id": "w1", "name": "My Cash" },
      "note": "Weekly shopping",
      "created_at": 1708425600,
      "updated_at": 1708425600
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
    "timestamp": 1708425610,
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
  "timestamp": 1708425610,
  "path": "/api/v1/wallets"
}
```

---

## H. API Design

### E.1. Category API

#### E.1.1. Get All Categories

TODO

#### E.1.2. Create Category

TODO

#### E.1.3. Update Category

TODO

#### E.1.4. Delete Single Category

TODO

#### E.1.5. Delete Multiple Categories

TODO

### E.2. Wallet API

#### E.2.1. Get All Wallets

TODO

#### E.2.2. Create Wallet

TODO

#### E.2.3. Update Wallet

TODO

#### E.2.4. Delete Single Wallet

TODO

#### E.2.5. Delete Multiple Wallets

TODO

### E.3. Transaction API

#### E.3.1. Get All Transactions

TODO

#### E.3.2. Create Transaction

TODO

#### E.3.3. Update Transaction

TODO

#### E.3.4. Delete Single Transaction

TODO

#### E.3.5. Delete Multiple Transactions

TODO
