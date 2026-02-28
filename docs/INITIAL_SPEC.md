# Soegih API - Initial Spec

**Date:** March 1, 2026
**Status:** Draft - Ready for Phase 2 (Requirements)

---

## Problem Statement

Individuals in Indonesia struggle to track their personal finances effectively. Current solutions are fragmented—bank statements show only transactions from a single account, while spreadsheets are manual and error-prone. Users lack a unified view across multiple wallets (cash, savings, e-wallets) and cannot easily categorize spending or transfer money between accounts with a clear audit trail.

**Impact:** Without proper tracking, users cannot answer critical questions:
- How much did I spend this month?
- Which categories consume most of my budget?
- What's my actual available balance across all accounts?
- Where did a specific transaction go?

This leads to poor financial decisions, overspending, and inability to achieve savings goals.

---

## Project Goals

1. **Enable unified financial visibility**: Provide users with a single dashboard to see all wallets, balances, and transactions in real-time across cash, bank, and e-wallet accounts.

2. **Simplify transaction tracking**: Allow users to categorize income and expenses, search transactions, and understand spending patterns without manual data entry.

3. **Support flexible money management**: Enable transfers between wallets with atomic guarantees, ensuring balances remain consistent even during concurrent transfers.

4. **Ensure data safety**: Implement soft-delete for wallets/categories and hard-delete for transactions, preserving financial history for audits while allowing safe deletion of unused items.

5. **Establish foundation for analytics**: Design the API to support future features like budgets, recurring transactions, and spending insights through clean data modeling.

**Success Criteria (MVP Phase):**
- ✅ API supports CRUD operations for categories, wallets, and transactions
- ✅ At least 1 frontend client successfully integrates the API (mobile or web)
- ✅ 10+ test users actively track expenses for 2+ weeks
- ✅ Zero data loss or balance inconsistencies reported in testing
- ✅ All endpoints documented in Swagger with example requests/responses

---

## Scope

### In-Scope (MVP Phase)

**Core Features:**
- JWT authentication with username & password (login/register, token refresh)
- User isolation (all data scoped to authenticated user)
- Category management (create, read, update, delete; filter by type: income/expense)
- Wallet management (create, read, update, delete; support cash/bank/e-wallet/other)
- Transaction management (income, expense, transfer types with atomic operations)
- Transaction history with filtering, sorting, and search by note/payee
- Soft delete for categories and wallets with archive naming
- Hard delete for transactions (permanent removal)
- Balance calculation (derived from postings, never stored)
- Pagination and query parameters for list endpoints
- Structured logging (technical & business metrics)

**Technical Foundation:**
- RESTful JSON API with `/api/v1/` prefix
- ISO 8601 timestamps (UTC timezone)
- Standard error handling with specific error codes
- Swagger/OpenAPI documentation
- Unit and integration tests (70%+ coverage target)
- Comprehensive logging system for debugging and analytics

### Out-of-Scope (Post-MVP)

- Multi-factor authentication (MFA)
- OAuth integrations (Google, Facebook login)
- Budget creation and tracking
- Recurring transaction templates
- Receipt image uploads or OCR
- Mobile app (frontend only, API can support it later)
- Timezone support per user
- Spending insights and analytics reports
- CSV/PDF export
- Third-party bank account integration
- Webhook notifications
- Advanced filtering (e.g., regex search)
- Transaction tagging or labels
- Audit trail UI (logs are collected but not exposed in UI)

---

## Constraints

### Technical Constraints

**Scale:**
- 100 concurrent users (MVP target)
- ~10,000 transactions per wallet (typical user)
- <100 categories per user (reasonable limit)
- <20 wallets per user (realistic for personal finance)

**Performance:**
- API response time: p95 ≤ 2 seconds (documented in SYSTEM_DESIGN.md)
- No query N+1 problems (eager load related categories/wallets)
- Pagination default: 10 items, max 100

**Tech Stack (Fixed):**
- Framework: NestJS v11 (Node.js)
- Language: TypeScript with `module: "nodenext"`
- Database: Supabase PostgreSQL via Prisma 7
- API Style: REST JSON (not GraphQL)
- ORM: Prisma 7.4.1+ with `@prisma/adapter-pg` driver

**Database:**
- Unix epoch timestamps (Int type, not DateTime)
- Soft delete via nullable `deleted_at` field (Category, Wallet, TransactionEvent)
- Hard delete for Posting records (no soft delete)
- No UUID required—string IDs acceptable (Supabase auto-generates)
- Foreign key constraints enforced at DB level

**Integration Points:**
- Supabase Session Pooler (port 6543) for runtime queries
- No third-party APIs required for MVP

### Business Constraints

**Timeline:**
- MVP launch: 1 day (aggressive sprint)
- Focus: Core APIs (auth, categories, wallets, transactions)
- Testing & docs can be refined post-launch

**Team:**
- 1 backend engineer (primary developer)
- Code reviews and QA happen in parallel
- No dedicated DevOps; Supabase handles hosting

**Budget:**
- Supabase free tier suitable for MVP
- No paid third-party services required
- Open-source stack (NestJS, Prisma, PostgreSQL)

**Deployment:**
- Self-hosted or cloud-agnostic (supports Vercel, Railway, Render, etc.)
- Environment variables for configuration (DB URL, API port)
- Docker-ready (Dockerfile provided)

### Non-Functional Requirements

- **Reliability:** 99.9% uptime (SLA target, achieved via Supabase)
- **Data Retention:** Minimum 1 year of transaction history
- **Backup Strategy:** Supabase automated backups (inherited)
- **Security:** No authentication in MVP; future add RBAC per user
- **Compliance:** No PII encryption required (MVP); GDPR compliance post-auth
- **Database Constraints:**
  - Category name+type must be unique
  - Wallet name must be unique (per user, after auth added)
  - Transfers must have exactly 2 postings with equal/opposite amounts
  - Transaction type is immutable after creation

---

## Key Stakeholders

| Role | Identity | Interests |
|------|----------|-----------|
| **End Users** | Indonesia-based individuals (18-50 years old) | Easy tracking, quick insights, mobile access |
| **Developer** | Primary engineer building the API | Clean architecture, testability, maintainability |
| **Frontend Client** | Mobile/web app consuming the API | Stable endpoints, clear errors, good documentation |
| **Data Owner** | User (individual) storing financial records | Privacy, data safety, accuracy, durability |
| **Product Owner** | Vision/requirements stakeholder | Feature completeness, user adoption, quality |

---

## Key Decisions & Assumptions

1. **JWT Authentication**: Username & password with JWT tokens (short-lived access + refresh tokens).
   - *Rationale:* Simple, stateless auth; no external OAuth needed for MVP.
   - *Security:* Passwords hashed with bcrypt; tokens signed with secret.

2. **Soft Delete Strategy**: Categories and wallets use soft delete to preserve historical data; transactions use hard delete for audit simplicity.
   - *Assumption:* Users don't need to "undelete" transactions; they can adjust via new entries.

3. **Structured Logging**: Comprehensive logging for technical (errors, performance) and business (user actions, financial metrics) insights.
   - *Implementation:* Winston or Pino logger with JSON output; logs include request ID, user ID, duration, amounts.
   - *Perspective:* Technical logs for debugging; business logs for analytics (spending trends, user activity).

4. **Offset-Based Pagination**: Simpler than cursor-based pagination for MVP scale.
   - *Assumption:* <1M records per user; can migrate to cursor-based pagination post-MVP if needed.

5. **Unix Epoch Timestamps**: Simplifies timezone handling; frontend converts to user timezone.
   - *Assumption:* All timestamps are UTC; user timezone handling deferred to Phase 2.

6. **No Ledger/Journal Model**: Postings are a join table, not a formal ledger.
   - *Assumption:* Double-entry bookkeeping achieved through posting pairs; sufficient for personal finance.

7. **Derived Balance**: Wallet balance is calculated (SUM of postings), never stored.
   - *Assumption:* Posting immutability (soft/hard delete only) makes this safe and accurate.

8. **Aggressive 1-Day Timeline**: MVP scope is core APIs only; polish and edge cases handled post-launch.
   - *Trade-off:* Speed over perfection; critical features first (auth, CRUD), refinements follow.

---

## Success Metrics & KPIs

| Metric | Target | Measure |
|--------|--------|---------|
| API Stability | 0 balance inconsistencies | Audit 100% of transfers in testing |
| Test Coverage | ≥70% | Jest coverage report |
| Documentation | 100% endpoint coverage | Swagger auto-generated, manual examples |
| Performance | p95 ≤ 2s | Load test with 100 concurrent users |
| Data Integrity | 0 orphaned postings | Weekly consistency checks |
| Feature Completeness | ✅ All MVPs | All 5 entity groups implemented |

---

## Logging Strategy

### Purpose

Logging serves two perspectives:

1. **Technical Perspective**: Debug issues, monitor performance, track errors
2. **Business Perspective**: Understand user behavior, track financial metrics, analyze trends

### Log Levels & Categories

| Level | Category | Examples |
|-------|----------|----------|
| **ERROR** | Technical | DB connection failures, unhandled exceptions, validation failures |
| **WARN** | Technical & Business | Deletion confirmations, deprecated endpoints, unusual patterns |
| **INFO** | Business | User login/logout, category created, transaction added, balance changes |
| **DEBUG** | Technical | Query execution, cache hits, middleware processing |

### Technical Logs

**What to log:**
- API request/response (method, path, status, duration, user ID)
- Errors with full stack trace (context: user, action, data)
- Database query errors (P2002 duplicate, P2025 not found, etc.)
- Authentication failures (invalid credentials, token expired)
- Data validation failures (missing fields, constraint violations)

**Example:**
```json
{
  "timestamp": "2026-03-01T10:30:45Z",
  "level": "ERROR",
  "service": "soegih-api",
  "requestId": "req-abc123",
  "userId": "user-456",
  "action": "CREATE_TRANSACTION",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Wallet not found",
  "details": { "wallet_id": "w-invalid" },
  "duration_ms": 45
}
```

### Business Logs

**What to log:**
- User authentication (login success/failure, registration)
- CRUD operations on core entities (category, wallet, transaction)
- Financial transactions (transfer amounts, wallet balances)
- Bulk operations (delete multiple items, counts affected)
- Data state changes (balance updates, archival)

**Example:**
```json
{
  "timestamp": "2026-03-01T10:30:45Z",
  "level": "INFO",
  "service": "soegih-api",
  "requestId": "req-abc123",
  "userId": "user-456",
  "action": "CREATE_TRANSACTION",
  "type": "EXPENSE",
  "amount": 50000,
  "currency": "IDR",
  "wallet_id": "w-123",
  "category_id": "c-456",
  "status": 201,
  "duration_ms": 45
}
```

### Implementation

**Logger Setup:**
- Use Winston or Pino for structured JSON logging
- Include request ID in all logs (for tracing)
- Add user ID to context after authentication
- Log request entry/exit (with duration, status)
- Catch unhandled errors at middleware level

**Log Output:**
- **Development**: Pretty-printed console output
- **Production**: Structured JSON to stdout (parsed by cloud provider)

**Retention:**
- Store logs for minimum 30 days
- Archive older logs to storage (S3, GCS)
- Enable search/filter by requestId, userId, action

### Dashboard & Monitoring (Post-MVP)

Future phases can expose logs via:
- Real-time dashboard (errors, transactions/min)
- User activity reports (active users, feature usage)
- Financial summaries (total spending, by category)
- Performance metrics (API latency, error rates)

---

## Next Steps

**Phase 1 (This Spec):** ✅ Problem, goals, scope, constraints defined

**Phase 2 (Requirements):** Generate detailed functional & non-functional requirements
- List all user stories and acceptance criteria
- Define API endpoints with request/response schemas
- Document validation rules and error handling

**Phase 3 (Implementation):** Build the API according to Phase 2 requirements
- Create modules: Category, Wallet, Transaction
- Implement repository pattern with Prisma
- Write unit & integration tests

**Phase 4 (Testing & Docs):** Validate and document the API
- E2E testing across all workflows
- Swagger generation and manual docs
- Performance testing under load

---

## Questions for Refinement

Does this spec accurately capture the Soegih API project? Any adjustments needed?

- Should the MVP include any user authentication, or keep it single-tenant?
- Are there specific Indonesia-centric features (e.g., currency codes, tax categories)?
- Is the 4-6 week timeline realistic, or should we adjust scope?
- Any additional non-functional requirements (e.g., audit logging, rate limiting)?

Let me know if you'd like to refine any section before moving to Phase 2 (Requirements).
