---
name: setup-db
description: Initialize and configure PostgreSQL database with Prisma schema, generate client, and push schema to Supabase
---

# Setup DB

Initialize and configure the Soegih API database with Prisma schema aligned to PHASE3_DESIGN specifications.

## Behavior

This skill:
1. Updates Prisma schema with User model and corrects timestamp types (unix epoch)
2. Adds all database indexes and constraints from PHASE3_DESIGN
3. Regenerates Prisma client from updated schema
4. Pushes schema changes to Supabase PostgreSQL database
5. Verifies database connection and tables created successfully

## What It Does

**Before:**
- Prisma schema may be incomplete or have wrong types
- Database tables may not exist or be out of sync
- Prisma client may be stale

**After:**
- ✅ Complete schema matching PHASE3_DESIGN
- ✅ Unix epoch timestamps (Int type, not DateTime)
- ✅ User model with FK relationships
- ✅ All indexes for performance
- ✅ Composite unique constraints
- ✅ Cascade delete relationships
- ✅ Tables created in Supabase
- ✅ Prisma client generated and ready

## Supported Arguments

None - this skill runs with default behavior for the soegih-api project.

## Example Usage

```
/setup-db
```

## Implementation

When user invokes this skill:

1. **Read current Prisma schema** from `prisma/schema.prisma`

2. **Update schema** to match PHASE3_DESIGN:
   - Add User model (id, username unique, password, created_at, updated_at)
   - Change all timestamps from DateTime to Int (unix epoch)
   - Add user_id FK to Category, Wallet, TransactionEvent
   - Add composite unique indexes:
     - categories: (user_id, name, type)
     - wallets: (user_id, name)
   - Add performance indexes:
     - categories: user_id, deleted_at
     - wallets: user_id, deleted_at
     - transactions: user_id, category_id, occurred_at, deleted_at
     - postings: wallet_id, event_id, deleted_at
   - Add cascade delete: onDelete: Cascade on all FKs
   - Fix WalletType enum: e_wallet (not e-wallet)

3. **Write updated schema** to `prisma/schema.prisma`

4. **Regenerate Prisma client:**
   ```bash
   source ~/.nvm/nvm.sh && nvm use 24
   pnpm prisma:generate
   ```

5. **Push schema to database:**
   ```bash
   pnpm prisma:push
   ```
   Note: This connects to Supabase and creates/updates tables without migrations

6. **Verify connection:**
   ```bash
   pnpm prisma:studio
   ```
   (Optional - opens Prisma Studio at localhost:5555 to inspect tables)

7. **Display summary:**
   - ✅ Schema updated to match PHASE3_DESIGN
   - ✅ Prisma client regenerated
   - ✅ Tables created in Supabase
   - ✅ Ready for repository and service implementation

## Notes

- **IMPORTANT**: Ensure `prisma/.env` or environment variables have `DATABASE_URL` set to Supabase connection string
- Uses Session Pooler URL (port 5432): `postgresql://user:password@host.pooler.supabase.com:6543/postgres`
- `prisma:push` requires network access to Supabase (no migrations created, direct schema sync)
- If push fails, check:
  - DATABASE_URL is set correctly
  - Supabase project is active
  - Port 6543 (session pooler) is accessible
- Prisma client output: `generated/prisma/` (gitignored, regenerated on install)
- After setup, can run `/write-tests-module` to start TDD workflow

## Related Skills

After setup-db completes:
- `/write-tests-module` - Generate test files for a module
- `/write-implementation-module` - Implement service code
- `/run-tests-module` - Run tests for a module (already exists)

## Success Criteria

Setup is complete when:
- ✅ `prisma/schema.prisma` updated with all models from PHASE3_DESIGN
- ✅ Timestamps are Int type (unix epoch)
- ✅ `pnpm prisma:generate` runs without errors
- ✅ `pnpm prisma:push` succeeds and creates tables
- ✅ Database tables visible in Supabase dashboard: users, categories, wallets, transaction_events, postings
