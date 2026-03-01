# Category API Specification

**Date**: 19 FEB 2026
**API Version**: v1
**Status**: MVP

## Overview

The Category API provides endpoints for managing income and expense categories. Categories are used to organize and classify financial transactions. Each category has a type (income or expense) and a unique name+type combination across the system.

## Functional Requirements

### B.1. Category Management

1. **View All Categories**: Users can view their complete list of categories with filtering, sorting, and search capabilities
   - Sort by category name (ascending/descending)
   - Filter by type (income or expense)
   - Search by name (partial match, case-insensitive)
   - Paginate through results with configurable page size

2. **Create Category**: Users can create new categories with name, type, and optional description
   - Name is required and must be unique per type
   - Type is required (either `income` or `expense`)
   - Description is optional for additional context

3. **Update Category**: Users can modify existing category properties
   - Update name and/or description
   - Restore archived/deleted categories

4. **Delete Single Category**: Users can delete individual categories with confirmation
   - Two-phase deletion with confirmation if category is in use
   - Soft delete preserves transaction history
   - Archived category names include timestamp for audit trail

5. **Delete Multiple Categories**: Users can bulk delete categories with confirmation
   - Two-phase deletion with partial confirmation
   - List which categories are in use vs. safe to delete
   - Atomic operation (all succeed or all fail)

## Data Model

### Category Entity

| Field         | Type     | Required | Constraints           | Notes                                     |
| ------------- | -------- | -------- | --------------------- | ----------------------------------------- |
| `id`          | string   | Yes      | UUID                  | Auto-generated                            |
| `name`        | string   | Yes      | Max 100 chars         | Unique per type (name + type combination) |
| `description` | string   | No       | Max 500 chars         | Optional field for additional context     |
| `type`        | enum     | Yes      | `expense` \| `income` | Immutable                                 |
| `created_at`  | DateTime | Yes      | ISO 8601              | Auto-set on creation                      |
| `updated_at`  | DateTime | Yes      | ISO 8601              | Auto-updated on changes                   |
| `deleted_at`  | DateTime | No       | ISO 8601              | Null if active, set on soft delete        |

### Constraints & Business Rules (E.2)

- **Uniqueness**: The combination of `name + type` must be unique
  - Example: "Groceries (expense)" and "Groceries (income)" can coexist
  - Example: Two categories named "Groceries (expense)" cannot coexist

- **Immutability**: Type cannot be changed after creation
  - Attempting to change type should result in 409 CONFLICT

- **Soft Delete**: Categories are soft-deleted, not permanently removed
  - `deleted_at` timestamp is set to current time
  - Category name is updated with `[ARCHIVED ISO-8601-timestamp]` suffix
  - Example: "Groceries" → "Groceries [ARCHIVED 2026-02-19T12:00:30Z]"

- **Two-Phase Deletion**: Prevents accidental deletion of categories with transactions
  - Phase 1: Check if category is in use (has transactions)
  - Phase 2: Confirm deletion if user agrees

- **Transaction Preservation**: Deleted categories keep transaction references intact
  - Wallet balances remain accurate
  - Transaction history is preserved for audit and reporting
  - Users can restore deleted categories within retention period

---

## API Endpoints

### Base URL

```
GET /api/v1/categories
POST /api/v1/categories
PATCH /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
DELETE /api/v1/categories
```

---

## Endpoint Details

### 1. Get All Categories

**`GET /api/v1/categories`**

Retrieves a paginated list of categories with optional filtering, sorting, and search.

#### Query Parameters

| Parameter         | Type    | Required | Default | Constraints               | Description                    |
| ----------------- | ------- | -------- | ------- | ------------------------- | ------------------------------ |
| `limit`           | number  | No       | 10      | min: 1, max: 100          | Items per page                 |
| `offset`          | number  | No       | 0       | min: 0                    | Items to skip                  |
| `sortKey`         | string  | No       | `name`  | enum: `name`              | Field to sort by               |
| `sortOrder`       | string  | No       | `asc`   | enum: `asc`, `desc`       | Sort direction                 |
| `type`            | string  | No       | -       | enum: `expense`, `income` | Filter by type                 |
| `search`          | string  | No       | -       | -                         | Search by name (partial match) |
| `include_deleted` | boolean | No       | false   | -                         | Include archived categories    |

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "c1",
      "name": "Groceries",
      "description": "Food and groceries",
      "type": "expense",
      "created_at": "2026-02-19T12:00:00Z",
      "updated_at": "2026-02-19T12:00:00Z",
      "deleted_at": null
    },
    {
      "id": "c2",
      "name": "Salary",
      "description": "Monthly salary income",
      "type": "income",
      "created_at": "2026-02-19T12:00:00Z",
      "updated_at": "2026-02-19T12:00:00Z",
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
    "timestamp": "2026-02-19T12:00:10Z",
    "version": "1.0"
  }
}
```

#### Example Requests

```bash
# Get all active categories, sorted by name ascending
GET /api/v1/categories?limit=10&offset=0

# Get expense categories with search
GET /api/v1/categories?type=expense&search=food

# Get all categories including archived ones
GET /api/v1/categories?include_deleted=true

# Get income categories, sorted descending
GET /api/v1/categories?type=income&sortOrder=desc
```

---

### 1.1. Get Single Category

**`GET /api/v1/categories/{id}`**

Retrieves a single category by ID.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Category ID |

#### Response (200 OK)

```json
{
  "data": {
    "id": "c1",
    "name": "Groceries",
    "description": "Food and groceries",
    "type": "expense",
    "created_at": "2026-02-19T12:00:00Z",
    "updated_at": "2026-02-19T12:00:00Z",
    "deleted_at": null
  },
  "meta": {
    "timestamp": "2026-02-19T12:00:10Z",
    "version": "1.0"
  }
}
```

#### Error Responses

**404 Not Found**: Category does not exist

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  },
  "timestamp": "2026-02-19T12:00:10Z",
  "path": "/api/v1/categories/c1"
}
```

---

### 2. Create Category

**`POST /api/v1/categories`**

Creates a new category.

#### Request Body

```json
{
  "name": "Utilities",
  "description": "Electricity, water, gas",
  "type": "expense"
}
```

#### Request Parameters

| Parameter     | Type   | Required | Constraints               | Description        |
| ------------- | ------ | -------- | ------------------------- | ------------------ |
| `name`        | string | Yes      | Max 100 chars             | Category name      |
| `description` | string | No       | Max 500 chars             | Additional context |
| `type`        | string | Yes      | enum: `expense`, `income` | Category type      |

#### Response (201 Created)

```json
{
  "data": {
    "id": "c2",
    "name": "Utilities",
    "description": "Electricity, water, gas",
    "type": "expense",
    "created_at": "2026-02-19T12:00:10Z",
    "updated_at": "2026-02-19T12:00:10Z",
    "deleted_at": null
  },
  "meta": {
    "timestamp": "2026-02-19T12:00:10Z",
    "version": "1.0"
  }
}
```

#### Error Responses

**400 Bad Request**: Validation error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "name",
      "reason": "name must be a string"
    }
  },
  "timestamp": "2026-02-19T12:00:10Z",
  "path": "/api/v1/categories"
}
```

**409 Conflict**: Duplicate name+type combination

```json
{
  "error": {
    "code": "DUPLICATE_CATEGORY_NAME",
    "message": "Category with name 'Utilities' and type 'expense' already exists",
    "details": {
      "field": "name",
      "reason": "Name + type combination must be unique"
    }
  },
  "timestamp": "2026-02-19T12:00:10Z",
  "path": "/api/v1/categories"
}
```

---

### 3. Update Category

**`PATCH /api/v1/categories/{id}`**

Updates an existing category.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Category ID |

#### Request Body (Update fields)

```json
{
  "name": "Updated Utilities",
  "description": "Updated description"
}
```

#### Request Body (Restore archived category)

```json
{
  "deleted_at": null
}
```

#### Request Parameters

| Parameter     | Type   | Required | Constraints   | Description                              |
| ------------- | ------ | -------- | ------------- | ---------------------------------------- |
| `name`        | string | No       | Max 100 chars | New category name                        |
| `description` | string | No       | Max 500 chars | New description                          |
| `deleted_at`  | null   | No       | -             | Set to null to restore archived category |

#### Response (200 OK)

```json
{
  "data": {
    "id": "c2",
    "name": "Updated Utilities",
    "description": "Updated description",
    "type": "expense",
    "created_at": "2026-02-19T12:00:10Z",
    "updated_at": "2026-02-19T12:00:20Z",
    "deleted_at": null
  },
  "meta": {
    "timestamp": "2026-02-19T12:00:20Z",
    "version": "1.0"
  }
}
```

#### Error Responses

**404 Not Found**: Category does not exist

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  },
  "timestamp": "2026-02-19T12:00:20Z",
  "path": "/api/v1/categories/c2"
}
```

**409 Conflict**: Name+type combination already exists

```json
{
  "error": {
    "code": "DUPLICATE_CATEGORY_NAME",
    "message": "Another category with name 'Utilities' and type 'expense' already exists",
    "details": {
      "field": "name",
      "reason": "Name + type combination must be unique"
    }
  },
  "timestamp": "2026-02-19T12:00:20Z",
  "path": "/api/v1/categories/c2"
}
```

---

### 4. Delete Single Category

**`DELETE /api/v1/categories/{id}`**

Deletes a single category using two-phase confirmation pattern.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Category ID |

#### Query Parameters

| Parameter | Type    | Required | Default | Description                         |
| --------- | ------- | -------- | ------- | ----------------------------------- |
| `confirm` | boolean | No       | false   | Force deletion without confirmation |

#### Phase 1 Response (200 OK - Confirmation Required)

When category is in use and `confirm` is false or not provided:

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
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Phase 1 Response (200 OK - Safe to Delete)

When category is NOT in use and `confirm` is false or not provided:

```json
{
  "status": "DELETED",
  "data": {
    "id": "c2",
    "name": "Groceries [ARCHIVED 2026-02-19T12:00:30Z]",
    "deleted_at": "2026-02-19T12:00:30Z"
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Phase 2 Response (200 OK - Confirmed Deletion)

When `confirm=true`:

```json
{
  "status": "DELETED",
  "data": {
    "id": "c2",
    "name": "Groceries [ARCHIVED 2026-02-19T12:00:30Z]",
    "deleted_at": "2026-02-19T12:00:30Z",
    "transaction_count_archived": 42
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Error Responses

**404 Not Found**: Category does not exist

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  },
  "timestamp": "2026-02-19T12:00:30Z",
  "path": "/api/v1/categories/c2"
}
```

#### Client Flow Example

```
1. User clicks "Delete Category"
2. Client calls: DELETE /api/v1/categories/c2 (no confirm param)
3. Server returns confirmation_required = true + transaction_count
4. UI shows: "This category has 42 transactions. Delete anyway?"
5. User confirms "Yes, delete"
6. Client calls: DELETE /api/v1/categories/c2?confirm=true
7. Category is archived successfully
```

---

### 5. Delete Multiple Categories

**`DELETE /api/v1/categories`**

Deletes multiple categories using two-phase confirmation pattern.

#### Request Body

```json
{
  "ids": ["c1", "c2", "c3"],
  "confirm": false
}
```

#### Request Parameters

| Parameter | Type     | Required | Description                                          |
| --------- | -------- | -------- | ---------------------------------------------------- |
| `ids`     | string[] | Yes      | Array of category IDs to delete                      |
| `confirm` | boolean  | No       | Force deletion without confirmation (default: false) |

#### Phase 1 Response (200 OK - Confirmation Required)

When any categories are in use and `confirm` is false:

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
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Phase 1 Response (200 OK - All Safe to Delete)

When no categories are in use and `confirm` is false:

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
        "deleted_at": "2026-02-19T12:00:30Z"
      },
      {
        "id": "c2",
        "name": "Transport [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": "2026-02-19T12:00:30Z"
      },
      {
        "id": "c3",
        "name": "Entertainment [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": "2026-02-19T12:00:30Z"
      }
    ]
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Phase 2 Response (200 OK - Confirmed Deletion)

When `confirm=true`:

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
        "deleted_at": "2026-02-19T12:00:30Z",
        "transaction_count_archived": 42
      },
      {
        "id": "c2",
        "name": "Transport [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": "2026-02-19T12:00:30Z",
        "transaction_count_archived": 15
      },
      {
        "id": "c3",
        "name": "Entertainment [ARCHIVED 2026-02-19T12:00:30Z]",
        "deleted_at": "2026-02-19T12:00:30Z",
        "transaction_count_archived": 0
      }
    ]
  },
  "confirmation_required": false,
  "meta": {
    "timestamp": "2026-02-19T12:00:30Z",
    "version": "1.0"
  }
}
```

#### Error Responses

**400 Bad Request**: Invalid request body

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "ids",
      "reason": "ids must be an array of strings"
    }
  },
  "timestamp": "2026-02-19T12:00:30Z",
  "path": "/api/v1/categories"
}
```

#### Client Flow Example

```
1. User selects 3 categories to delete
2. Client calls: DELETE /api/v1/categories (body: {ids: [...], confirm: false})
3. Server returns items_in_use (2 items) + items_safe_to_delete (1 item)
4. UI shows dialog: "2 categories have transactions. Delete all anyway?"
5. User confirms "Yes, delete all"
6. Client calls: DELETE /api/v1/categories (body: {ids: [...], confirm: true})
7. All 3 categories are archived successfully
```

---

## HTTP Status Codes & Error Handling

### Success Codes

| Code            | Scenario                                  |
| --------------- | ----------------------------------------- |
| **200 OK**      | Get, update, delete operations successful |
| **201 Created** | Category created successfully             |

### Client Error Codes

| Code    | Error Code                | Scenario                                               |
| ------- | ------------------------- | ------------------------------------------------------ |
| **400** | `VALIDATION_ERROR`        | Invalid input (missing required field, format invalid) |
| **400** | `BUSINESS_RULE_VIOLATION` | Violates business logic                                |
| **404** | `CATEGORY_NOT_FOUND`      | Category does not exist or is deleted                  |
| **409** | `DUPLICATE_CATEGORY_NAME` | Category name+type combination already exists          |

### Server Error Codes

| Code    | Error Code              | Scenario                |
| ------- | ----------------------- | ----------------------- |
| **500** | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Validation Rules (F.1.2)

| Field         | Type   | Required | Constraints           | Notes                              |
| ------------- | ------ | -------- | --------------------- | ---------------------------------- |
| `name`        | string | Yes      | Max 100 characters    | Unique per type (case-insensitive) |
| `type`        | enum   | Yes      | `expense` or `income` | Immutable, cannot be changed       |
| `description` | string | No       | Max 500 characters    | Optional field                     |

---

## Soft Delete Behavior (E.4)

When a category is deleted:

1. **Soft Delete Applied**: Category is marked as deleted via `deleted_at` timestamp
2. **Name Archival**: Category name is updated with `[ARCHIVED ISO-8601-timestamp]` suffix
   - Example: "Groceries" → "Groceries [ARCHIVED 2026-02-19T12:00:30Z]"
3. **Transaction Preservation**: All transactions referencing the category remain intact
4. **Balance Accuracy**: Transaction calculations unaffected (deleted categories counted normally)
5. **Audit Trail**: Deleted timestamp provides when category was archived
6. **Restoration**: Users can restore deleted categories by setting `deleted_at: null` via PATCH

---

## Deleted/Archived Resource Queries (E.7)

By default, all list endpoints return only active (non-deleted) categories.

### Include Archived Categories

Use the `include_deleted=true` query parameter to show archived items:

```bash
GET /api/v1/categories?include_deleted=true
```

### Restore Archived Category

To restore an archived category, use PATCH with `deleted_at: null`:

```bash
PATCH /api/v1/categories/{id}
Content-Type: application/json

{
  "deleted_at": null
}
```

The restored category name will have the `[ARCHIVED ...]` suffix removed automatically.

---

## Implementation Notes

- **Repository Pattern**: Service layer uses repository interface, not direct database access
- **Transaction Counting**: Used to determine if confirmation dialog is needed on deletion
- **Pagination**: Offset-based (limit + offset) per spec
- **Sorting**: Currently supports sorting by name field
- **Search**: Case-insensitive partial match on name field
- **Timestamps**: All timestamps in ISO 8601 format (UTC timezone)
- **Response Format**: Consistent `{data, pagination, meta}` structure for list endpoints
- **Soft Delete**: All categories soft-deleted; use `deleted_at IS NULL` filter in queries
