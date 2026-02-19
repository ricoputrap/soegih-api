# System Design - MVP (19 FEB 2026)

## A. Overview

Soegih API is a backend service that provides a set of APIs for managing and interacting with various resources in Soegih, an application that allows users to manage their personal finances.

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

### D.2. WALLET

- id: string
- name: string
- type: cash | bank | e-wallet | other
- created_at: timestamp
- updated_at: timestamp

### D.3. TRANSACTION_EVENT

- id: string
- occurred_at: timestamp
- type: expense | income
- note: string?
- payee: string?
- category_id: string (FK to CATEGORY.id)
- created_at: timestamp
- updated_at: timestamp

### D.4. Posting

- id: string
- event_id: string (FK to TRANSACTION_EVENT.id)
- wallet_id: string (FK to WALLET.id)
- amount_idr: integer
- created_at: timestamp

## E. API Design

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
