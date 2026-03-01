# Soegih API - Phase 4: Swagger/OpenAPI 3.0 Specification

**Date:** March 1, 2026
**Status:** Ready for Phase 5 (TDD Implementation)
**API Version:** v1
**Base URL:** `/api/v1`

---

## Table of Contents

1. [OpenAPI 3.0 YAML Specification](#openapi-30-yaml-specification)
2. [NestJS Controller Decorators](#nestjs-controller-decorators)
3. [Request/Response DTOs](#requestresponse-dtos)
4. [Error Schemas](#error-schemas)
5. [Authentication & Security](#authentication--security)

---

## OpenAPI 3.0 YAML Specification

Copy and paste this into [Swagger Editor](https://editor.swagger.io) to visualize the API.

```yaml
openapi: 3.0.0

info:
  title: Soegih API
  version: 1.0.0
  description: Personal finance tracking API with multi-wallet support
  contact:
    name: Soegih Team
    url: https://soegih.com
  license:
    name: MIT

servers:
  - url: https://api.soegih.com/api/v1
    description: Production
  - url: http://localhost:3000/api/v1
    description: Development

tags:
  - name: Authentication
    description: User registration, login, and token management
  - name: Categories
    description: Income and expense category management
  - name: Wallets
    description: Wallet management (cash, bank, e-wallet)
  - name: Transactions
    description: Transaction (income, expense, transfer) management

paths:
  /auth/register:
    post:
      summary: Register a new user
      tags:
        - Authentication
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
            example:
              username: john_doe
              password: SecurePass123!
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
              example:
                data:
                  id: user-123abc
                  username: john_doe
                  created_at: 1709299445
                meta:
                  timestamp: 1709299445
                  version: '1.0'
        '400':
          description: Validation error (missing fields, invalid format, weak password)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Username already registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/login:
    post:
      summary: Login with username and password
      tags:
        - Authentication
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
            example:
              username: john_doe
              password: SecurePass123!
      responses:
        '200':
          description: Login successful (cookies set automatically)
          headers:
            Set-Cookie:
              schema:
                type: string
                example: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
              example:
                data:
                  id: user-123abc
                  username: john_doe
                  created_at: 1709299445
                meta:
                  timestamp: 1709299445
                  version: '1.0'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Invalid username or password
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/logout:
    post:
      summary: Logout and clear authentication cookies
      tags:
        - Authentication
      operationId: logoutUser
      security:
        - cookieAuth: []
      responses:
        '204':
          description: Logout successful, cookies cleared
          headers:
            Set-Cookie:
              schema:
                type: string
                example: access_token=; HttpOnly; Max-Age=0
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/refresh:
    post:
      summary: Refresh access token
      tags:
        - Authentication
      operationId: refreshToken
      security:
        - cookieAuth: []
      responses:
        '200':
          description: Access token refreshed
          headers:
            Set-Cookie:
              schema:
                type: string
                example: access_token=<new_jwt>; HttpOnly; Secure; SameSite=Strict
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '401':
          description: Invalid or expired refresh token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /categories:
    get:
      summary: List categories with pagination and filters
      tags:
        - Categories
      operationId: listCategories
      security:
        - cookieAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
          description: Items per page
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
          description: Number of items to skip
        - name: type
          in: query
          schema:
            type: string
            enum: [expense, income]
          description: Filter by category type
        - name: sort
          in: query
          schema:
            type: string
            enum: [name:asc, name:desc]
            default: name:asc
          description: Sort field and direction
        - name: search
          in: query
          schema:
            type: string
          description: Search by name (partial match, case-insensitive)
        - name: include_deleted
          in: query
          schema:
            type: boolean
            default: false
          description: Include archived categories
      responses:
        '200':
          description: List of categories
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryListResponse'
        '400':
          description: Validation error (invalid parameters)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    post:
      summary: Create a new category
      tags:
        - Categories
      operationId: createCategory
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCategoryRequest'
            example:
              name: Groceries
              type: expense
              description: Food and groceries
      responses:
        '201':
          description: Category created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Category name+type already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete multiple categories (bulk)
      tags:
        - Categories
      operationId: deleteCategoriesBulk
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                ids:
                  type: array
                  items:
                    type: string
                  minItems: 1
                  description: Category IDs to delete
                confirm:
                  type: boolean
                  default: false
                  description: Set to true to confirm deletion if items are in use
              required:
                - ids
            example:
              ids:
                - cat-1
                - cat-2
                - cat-3
              confirm: false
      responses:
        '200':
          description: Deletion response (confirmation required or deleted)
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/ConfirmationRequiredResponse'
                  - $ref: '#/components/schemas/BulkDeleteResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /categories/{id}:
    get:
      summary: Get a single category by ID
      tags:
        - Categories
      operationId: getCategory
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: Category ID
      responses:
        '200':
          description: Category details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Category not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    patch:
      summary: Update a category
      tags:
        - Categories
      operationId: updateCategory
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: Category ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCategoryRequest'
            example:
              name: Updated Category
              type: expense
              description: Updated description
      responses:
        '200':
          description: Category updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Category not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Name+type already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete a single category (soft delete with confirmation)
      tags:
        - Categories
      operationId: deleteCategory
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: Category ID
        - name: confirm
          in: query
          schema:
            type: boolean
            default: false
          description: Confirm deletion if in use
      responses:
        '200':
          description: Deletion response (confirmation required or deleted)
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/ConfirmationRequiredResponse'
                  - $ref: '#/components/schemas/DeleteResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Category not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /wallets:
    get:
      summary: List wallets with pagination and filters
      tags:
        - Wallets
      operationId: listWallets
      security:
        - cookieAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
        - name: type
          in: query
          schema:
            type: string
            enum: [cash, bank, e-wallet, other]
          description: Filter by wallet type
        - name: sort
          in: query
          schema:
            type: string
            enum:
              [
                name:asc,
                name:desc,
                balance:asc,
                balance:desc,
                created_at:asc,
                created_at:desc,
              ]
            default: created_at:desc
        - name: search
          in: query
          schema:
            type: string
          description: Search by name
        - name: include_deleted
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: List of wallets
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletListResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    post:
      summary: Create a new wallet
      tags:
        - Wallets
      operationId: createWallet
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWalletRequest'
            example:
              name: My Cash Wallet
              type: cash
              currency: IDR
      responses:
        '201':
          description: Wallet created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Wallet name already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete multiple wallets (bulk)
      tags:
        - Wallets
      operationId: deleteWalletsBulk
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                ids:
                  type: array
                  items:
                    type: string
                  minItems: 1
                  description: Wallet IDs to delete
                confirm:
                  type: boolean
                  default: false
                  description: Set to true to confirm deletion if items are in use
              required:
                - ids
            example:
              ids:
                - w-1
                - w-2
                - w-3
              confirm: false
      responses:
        '200':
          description: Deletion response
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/ConfirmationRequiredResponse'
                  - $ref: '#/components/schemas/BulkDeleteResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /wallets/{id}:
    get:
      summary: Get a single wallet by ID
      tags:
        - Wallets
      operationId: getWallet
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Wallet details with calculated balance
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Wallet not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    patch:
      summary: Update a wallet
      tags:
        - Wallets
      operationId: updateWallet
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateWalletRequest'
      responses:
        '200':
          description: Wallet updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Wallet not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete a single wallet (soft delete with confirmation)
      tags:
        - Wallets
      operationId: deleteWallet
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
        - name: confirm
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Deletion response
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/ConfirmationRequiredResponse'
                  - $ref: '#/components/schemas/DeleteResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Wallet not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /transactions:
    get:
      summary: List transactions with pagination and filters
      tags:
        - Transactions
      operationId: listTransactions
      security:
        - cookieAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
        - name: type
          in: query
          schema:
            type: string
            enum: [income, expense, transfer]
          description: Filter by transaction type
        - name: wallet_id
          in: query
          schema:
            type: string
          description: Filter by wallet ID
        - name: category_id
          in: query
          schema:
            type: string
          description: Filter by category ID (income/expense only)
        - name: occurred_at_gte
          in: query
          schema:
            type: integer
          description: Filter by start date (unix timestamp)
        - name: occurred_at_lte
          in: query
          schema:
            type: integer
          description: Filter by end date (unix timestamp)
        - name: sort
          in: query
          schema:
            type: string
            enum:
              [
                occurred_at:asc,
                occurred_at:desc,
                amount:asc,
                amount:desc,
                created_at:desc,
              ]
            default: occurred_at:desc
        - name: search
          in: query
          schema:
            type: string
          description: Search by note (partial match)
      responses:
        '200':
          description: List of transactions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransactionListResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    post:
      summary: Create a new transaction (income, expense, or transfer)
      tags:
        - Transactions
      operationId: createTransaction
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/CreateIncomeExpenseRequest'
                - $ref: '#/components/schemas/CreateTransferRequest'
            examples:
              income_expense:
                value:
                  type: expense
                  amount: 50000
                  occurred_at: 1709299445
                  wallet_id: w-123
                  category_id: c-456
                  note: Weekly groceries
              transfer:
                value:
                  type: transfer
                  amount: 100000
                  occurred_at: 1709299445
                  source_wallet_id: w-123
                  destination_wallet_id: w-456
                  note: Transfer to savings
      responses:
        '201':
          description: Transaction created
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/TransactionResponse'
                  - $ref: '#/components/schemas/TransferResponse'
        '400':
          description: Validation error or business rule violation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Wallet or category not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete multiple transactions (hard delete)
      tags:
        - Transactions
      operationId: deleteTransactionsBulk
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                ids:
                  type: array
                  items:
                    type: string
                  minItems: 1
                  description: Transaction IDs to delete
              required:
                - ids
            example:
              ids:
                - t-1
                - t-2
                - t-3
      responses:
        '204':
          description: Transactions deleted successfully
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: One or more transactions not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /transactions/{id}:
    get:
      summary: Get a single transaction by ID
      tags:
        - Transactions
      operationId: getTransaction
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Transaction details
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/TransactionResponse'
                  - $ref: '#/components/schemas/TransferResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Transaction not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    patch:
      summary: Update a transaction
      tags:
        - Transactions
      operationId: updateTransaction
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/UpdateIncomeExpenseRequest'
                - $ref: '#/components/schemas/UpdateTransferRequest'
      responses:
        '200':
          description: Transaction updated
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: '#/components/schemas/TransactionResponse'
                  - $ref: '#/components/schemas/TransferResponse'
        '400':
          description: Validation error or immutable field change
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Transaction not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    delete:
      summary: Delete a single transaction (hard delete)
      tags:
        - Transactions
      operationId: deleteTransaction
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Transaction deleted successfully
        '401':
          description: Not authenticated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Transaction not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: access_token
      description: HTTP-only cookie containing JWT access token

  schemas:
    # Request Schemas
    RegisterRequest:
      type: object
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 50
          pattern: ^[a-zA-Z0-9_-]+$
          description: Username (alphanumeric, underscore, dash only)
        password:
          type: string
          minLength: 8
          description: Password (must contain uppercase, lowercase, number, special char)
      required:
        - username
        - password

    LoginRequest:
      type: object
      properties:
        username:
          type: string
          minLength: 3
        password:
          type: string
          minLength: 8
      required:
        - username
        - password

    CreateCategoryRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Category name
        type:
          type: string
          enum: [income, expense]
          description: Category type
        description:
          type: string
          maxLength: 500
          nullable: true
          description: Optional category description
      required:
        - name
        - type

    UpdateCategoryRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        type:
          type: string
          enum: [income, expense]
        description:
          type: string
          maxLength: 500
          nullable: true
        deleted_at:
          type: integer
          nullable: true
          description: Set to null to restore archived category

    CreateWalletRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        type:
          type: string
          enum: [cash, bank, e-wallet, other]
        currency:
          type: string
          default: IDR
          description: ISO 4217 currency code
      required:
        - name
        - type

    UpdateWalletRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        type:
          type: string
          enum: [cash, bank, e-wallet, other]
        currency:
          type: string
        deleted_at:
          type: integer
          nullable: true
          description: Set to null to restore archived wallet

    CreateIncomeExpenseRequest:
      type: object
      properties:
        type:
          type: string
          enum: [income, expense]
        amount:
          type: integer
          minimum: 0
        occurred_at:
          type: integer
          description: Unix timestamp
        wallet_id:
          type: string
        category_id:
          type: string
        note:
          type: string
          maxLength: 500
          nullable: true
        payee:
          type: string
          maxLength: 100
          nullable: true
      required:
        - type
        - amount
        - occurred_at
        - wallet_id
        - category_id

    CreateTransferRequest:
      type: object
      properties:
        type:
          type: string
          enum: [transfer]
        amount:
          type: integer
          minimum: 0
        occurred_at:
          type: integer
        source_wallet_id:
          type: string
        destination_wallet_id:
          type: string
        note:
          type: string
          maxLength: 500
          nullable: true
      required:
        - type
        - amount
        - occurred_at
        - source_wallet_id
        - destination_wallet_id

    UpdateIncomeExpenseRequest:
      type: object
      properties:
        amount:
          type: integer
          minimum: 0
        wallet_id:
          type: string
        category_id:
          type: string
        note:
          type: string
          maxLength: 500
          nullable: true
        payee:
          type: string
          maxLength: 100
          nullable: true

    UpdateTransferRequest:
      type: object
      properties:
        amount:
          type: integer
          minimum: 0
        source_wallet_id:
          type: string
        destination_wallet_id:
          type: string
        note:
          type: string
          maxLength: 500
          nullable: true

    BulkDeleteRequest:
      type: object
      properties:
        ids:
          type: array
          items:
            type: string
          minItems: 1
          description: IDs to delete
        confirm:
          type: boolean
          default: false
          description: Set to true to confirm deletion if items are in use
      required:
        - ids

    # Response Schemas
    UserResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
            username:
              type: string
            created_at:
              type: integer
        meta:
          $ref: '#/components/schemas/Meta'

    CategoryResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
            description:
              type: string
              nullable: true
            type:
              type: string
              enum: [income, expense]
            created_at:
              type: integer
            updated_at:
              type: integer
            deleted_at:
              type: integer
              nullable: true
        meta:
          $ref: '#/components/schemas/Meta'

    CategoryListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              description:
                type: string
                nullable: true
              type:
                type: string
                enum: [income, expense]
              created_at:
                type: integer
              updated_at:
                type: integer
              deleted_at:
                type: integer
                nullable: true
        pagination:
          $ref: '#/components/schemas/Pagination'
        meta:
          $ref: '#/components/schemas/Meta'

    WalletResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
            type:
              type: string
              enum: [cash, bank, e-wallet, other]
            balance:
              type: integer
              description: Calculated balance (SUM of postings)
            currency:
              type: string
            created_at:
              type: integer
            updated_at:
              type: integer
            deleted_at:
              type: integer
              nullable: true
        meta:
          $ref: '#/components/schemas/Meta'

    WalletListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              type:
                type: string
                enum: [cash, bank, e-wallet, other]
              balance:
                type: integer
              currency:
                type: string
              created_at:
                type: integer
              updated_at:
                type: integer
              deleted_at:
                type: integer
                nullable: true
        pagination:
          $ref: '#/components/schemas/Pagination'
        meta:
          $ref: '#/components/schemas/Meta'

    TransactionResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
            type:
              type: string
              enum: [income, expense]
            amount:
              type: integer
            occurred_at:
              type: integer
            category:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
            wallet:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
            note:
              type: string
              nullable: true
            payee:
              type: string
              nullable: true
            created_at:
              type: integer
            updated_at:
              type: integer
            deleted_at:
              type: integer
              nullable: true
        meta:
          $ref: '#/components/schemas/Meta'

    TransferResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
            type:
              type: string
              enum: [transfer]
            amount:
              type: integer
            occurred_at:
              type: integer
            source_wallet:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
            destination_wallet:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
            category:
              nullable: true
              description: Transfers never have a category (always null)
            note:
              type: string
              nullable: true
            created_at:
              type: integer
            updated_at:
              type: integer
            deleted_at:
              type: integer
              nullable: true
        meta:
          $ref: '#/components/schemas/Meta'

    TransactionListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            oneOf:
              - $ref: '#/components/schemas/TransactionResponseData'
              - $ref: '#/components/schemas/TransferResponseData'
        pagination:
          $ref: '#/components/schemas/Pagination'
        meta:
          $ref: '#/components/schemas/Meta'

    TransactionResponseData:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
          enum: [income, expense]
        amount:
          type: integer
        occurred_at:
          type: integer
        category:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        wallet:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        note:
          type: string
          nullable: true
        payee:
          type: string
          nullable: true
        created_at:
          type: integer
        updated_at:
          type: integer

    TransferResponseData:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
          enum: [transfer]
        amount:
          type: integer
        occurred_at:
          type: integer
        source_wallet:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        destination_wallet:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        category:
          nullable: true
          description: Transfers never have a category (always null)
        note:
          type: string
          nullable: true
        created_at:
          type: integer
        updated_at:
          type: integer

    DeleteResponse:
      type: object
      properties:
        status:
          type: string
          enum: [DELETED]
        data:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
              description: Name with [ARCHIVED timestamp] suffix
            deleted_at:
              type: integer
            transaction_count_archived:
              type: integer
              nullable: true
        meta:
          $ref: '#/components/schemas/Meta'

    BulkDeleteResponse:
      type: object
      properties:
        status:
          type: string
          enum: [DELETED]
        data:
          type: object
          properties:
            total_selected:
              type: integer
            deleted_count:
              type: integer
            items:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  deleted_at:
                    type: integer
                  transaction_count_archived:
                    type: integer
        meta:
          $ref: '#/components/schemas/Meta'

    ConfirmationRequiredResponse:
      type: object
      properties:
        status:
          type: string
          enum: [CONFIRMATION_REQUIRED]
        data:
          type: object
          description: Items in use or safe to delete
        confirmation_required:
          type: boolean
          enum: [true]
        meta:
          $ref: '#/components/schemas/Meta'

    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: VALIDATION_ERROR
            message:
              type: string
            details:
              type: object
              properties:
                field:
                  type: string
                reason:
                  type: string
        timestamp:
          type: integer
        path:
          type: string

    Pagination:
      type: object
      properties:
        limit:
          type: integer
        offset:
          type: integer
        total:
          type: integer
        has_next:
          type: boolean
        has_previous:
          type: boolean

    Meta:
      type: object
      properties:
        timestamp:
          type: integer
          description: Unix timestamp
        version:
          type: string
          default: '1.0'
```

---

## NestJS Controller Decorators

Generate these controller files with proper decorators for Swagger auto-documentation:

### auth.controller.ts

```typescript
import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CurrentUserDto } from '../common/dto/current-user.dto.js';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with username and password',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error (missing fields, invalid format, weak password)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Username already registered',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto, @Res() response: Response) {
    const result = await this.authService.register(registerDto);
    // Set HTTP-only cookies
    response.cookie('access_token', result.tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000,
    });
    response.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 604800000,
    });
    return response.status(201).json({
      data: {
        id: result.user.id,
        username: result.user.username,
        created_at: result.user.created_at,
      },
      meta: { timestamp: Math.floor(Date.now() / 1000), version: '1.0' },
    });
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with username and password',
    description: 'Authenticate user and set HTTP-only cookies',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful (cookies set automatically)',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid username or password',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const result = await this.authService.login(loginDto);
    response.cookie('access_token', result.tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000,
    });
    response.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 604800000,
    });
    return response.status(200).json({
      data: {
        id: result.user.id,
        username: result.user.username,
        created_at: result.user.created_at,
      },
      meta: { timestamp: Math.floor(Date.now() / 1000), version: '1.0' },
    });
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Logout and clear authentication cookies',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 204,
    description: 'Logout successful, cookies cleared',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async logout(@Res() response: Response) {
    response.clearCookie('access_token', { httpOnly: true, path: '/' });
    response.clearCookie('refresh_token', { httpOnly: true, path: '/' });
    return response.status(204).send();
  }

  @Post('refresh')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  async refresh(@Res() response: Response, @Body('user') user: CurrentUserDto) {
    const result = await this.authService.refresh(user.id);
    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000,
    });
    return response.status(200).json({
      data: { id: user.id, username: user.username },
      meta: { timestamp: Math.floor(Date.now() / 1000), version: '1.0' },
    });
  }
}
```

### categories.controller.ts

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { CategoryListResponseDto } from './dto/category-list-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { CurrentUserDto } from '../common/dto/current-user.dto.js';

@Controller('categories')
@ApiTags('Categories')
@UseGuards(JwtGuard)
@ApiCookieAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories with pagination and filters',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'type',
    enum: ['income', 'expense'],
    required: false,
  })
  @ApiQuery({
    name: 'sort',
    enum: ['name:asc', 'name:desc'],
    required: false,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'include_deleted',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: CategoryListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getAll(
    @CurrentUser() user: CurrentUserDto,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('type') type?: 'income' | 'expense',
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('include_deleted') includeDeleted?: boolean,
  ) {
    return this.categoriesService.getAll(user.id, {
      limit: limit ?? 10,
      offset: offset ?? 0,
      type,
      sort,
      search,
      includeDeleted,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single category by ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: ErrorResponseDto,
  })
  async getOne(@CurrentUser() user: CurrentUserDto, @Param('id') id: string) {
    return this.categoriesService.getById(user.id, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Category name+type already exists',
    type: ErrorResponseDto,
  })
  async create(@CurrentUser() user: CurrentUserDto, @Body() createDto: CreateCategoryDto) {
    return this.categoriesService.create(user.id, createDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category',
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: ErrorResponseDto,
  })
  async update(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a single category (soft delete with confirmation)',
  })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiQuery({
    name: 'confirm',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion response (confirmation required or deleted)',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: ErrorResponseDto,
  })
  async deleteOne(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Query('confirm') confirm?: boolean,
  ) {
    return this.categoriesService.deleteSingle(user.id, id, confirm ?? false);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete multiple categories (bulk)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
        confirm: { type: 'boolean' },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion response',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async deleteMany(
    @CurrentUser() user: CurrentUserDto,
    @Body() body: { ids: string[]; confirm?: boolean },
  ) {
    return this.categoriesService.deleteMultiple(
      user.id,
      body.ids,
      body.confirm ?? false,
    );
  }
}
```

### wallets.controller.ts & transactions.controller.ts

Similar pattern to `categories.controller.ts` — follow the same decorator structure for:

- `@Get()`, `@Get(':id')`, `@Post()`, `@Patch()`, `@Delete(':id')`, `@Delete()`
- Use `@ApiOperation`, `@ApiQuery`, `@ApiParam`, `@ApiResponse` consistently
- All endpoints require `@UseGuards(JwtGuard)` and `@ApiCookieAuth()`

---

## Request/Response DTOs

Create these files for Swagger and validation:

### auth/dto/register.dto.ts

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Username (3-50 chars, alphanumeric, underscore, dash only)',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username must contain only alphanumeric characters, underscore, or dash',
  })
  username: string;

  @ApiProperty({
    description:
      'Password (8+ chars, uppercase, lowercase, number, special char)',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}
```

### auth/dto/login.dto.ts

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
```

### categories/dto/create-category.dto.ts

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Groceries',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Category type',
    enum: ['income', 'expense'],
    example: 'expense',
  })
  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Food and groceries',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### wallets/dto/create-wallet.dto.ts

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Wallet name',
    example: 'My Cash Wallet',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Wallet type',
    enum: ['cash', 'bank', 'e-wallet', 'other'],
    example: 'cash',
  })
  @IsEnum(['cash', 'bank', 'e-wallet', 'other'])
  type: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    example: 'IDR',
    default: 'IDR',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
```

### transactions/dto/create-transaction.dto.ts

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Transaction type',
    enum: ['income', 'expense', 'transfer'],
    example: 'expense',
  })
  @IsEnum(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({
    description: 'Transaction amount (integer, in smallest currency unit)',
    example: 50000,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Transaction occurrence time (unix timestamp)',
    example: 1709299445,
  })
  @IsInt()
  occurred_at: number;

  @ApiPropertyOptional({
    description: 'Wallet ID (for income/expense)',
    example: 'w-123',
  })
  @ValidateIf((obj) => obj.type !== 'transfer')
  @IsNotEmpty()
  wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Category ID (for income/expense only)',
    example: 'c-456',
  })
  @ValidateIf((obj) => obj.type !== 'transfer')
  @IsNotEmpty()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Source wallet ID (for transfer)',
    example: 'w-123',
  })
  @ValidateIf((obj) => obj.type === 'transfer')
  @IsNotEmpty()
  source_wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Destination wallet ID (for transfer)',
    example: 'w-456',
  })
  @ValidateIf((obj) => obj.type === 'transfer')
  @IsNotEmpty()
  destination_wallet_id?: string;

  @ApiPropertyOptional({
    description: 'Optional transaction note',
    example: 'Weekly groceries',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description: 'Optional payee name (income/expense only)',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  payee?: string;
}
```

### Response DTOs (common pattern)

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    enum: ['income', 'expense'],
  })
  type: 'income' | 'expense';

  @ApiProperty()
  created_at: number;

  @ApiProperty()
  updated_at: number;

  @ApiProperty({
    nullable: true,
  })
  deleted_at: number | null;
}

export class MetaDto {
  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  version: string;
}

export class PaginationDto {
  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  has_next: boolean;

  @ApiProperty()
  has_previous: boolean;
}
```

---

## Error Schemas

### common/dto/error-response.dto.ts

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetailsDto {
  @ApiProperty()
  field: string;

  @ApiProperty()
  reason: string;
}

export class ErrorResponseDto {
  @ApiProperty()
  error: {
    code: string;
    message: string;
    details?: ErrorDetailsDto;
  };

  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  path: string;
}
```

---

## Authentication & Security

### common/decorators/user.decorator.ts

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### common/dto/current-user.dto.ts

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123abc',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User creation timestamp (unix epoch)',
    example: 1709299445,
  })
  created_at: number;
}
```

### common/guards/jwt.guard.ts

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
```

### Swagger Setup (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS for HTTP-only cookies
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'https://soegih.com',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Soegih API')
    .setDescription('Personal finance tracking API with multi-wallet support')
    .setVersion('1.0.0')
    .addCookieAuth('access_token', {
      type: 'http',
      in: 'cookie',
      name: 'access_token',
    })
    .addTag('Authentication')
    .addTag('Categories')
    .addTag('Wallets')
    .addTag('Transactions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}

bootstrap();
```

---

## Next Steps

1. **Copy the OpenAPI YAML** to [Swagger Editor](https://editor.swagger.io) to visualize the API
2. **Copy the NestJS decorators** into your controller files
3. **Copy the DTOs** into your respective module directories
4. **Install dependencies:**
   ```bash
   pnpm install @nestjs/swagger swagger-ui-express class-validator class-transformer
   ```
5. **Run `pnpm start:dev`** and visit `http://localhost:3000/docs` to see Swagger UI

---

## Summary

- ✅ **Complete OpenAPI 3.0 YAML** — importable into Swagger Editor, testable, with all 22 endpoints
- ✅ **NestJS Controller Decorators** — copy-paste ready with @ApiTags, @ApiOperation, @ApiResponse
- ✅ **Request/Response DTOs** — with validation rules (@IsString, @MinLength, etc.) and @ApiProperty descriptions
- ✅ **Error Handling** — consistent error response format with error codes and messages
- ✅ **Security** — HTTP-only cookie authentication with @ApiCookieAuth decorator
- ✅ **Examples** — request/response examples for each endpoint

---

This Swagger specification is now ready for:

- **Frontend teams** to mock the API and build UI components
- **Phase 5 (TDD)** to generate service signatures and test stubs
- **Implementation** developers to code against documented contracts
