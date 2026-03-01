---
name: setup-db
description: Initialize a completely fresh PostgreSQL database and Prisma setup from scratch for any project
---

# Setup DB

Initialize a fresh database and Prisma configuration from scratch for a new project - no schema, no database tables, completely fresh start.

## Behavior

This skill:

1. Checks if `prisma/schema.prisma` exists; if not, creates it from project requirements
2. Generates the Prisma client from the schema
3. Pushes the schema to the empty database to create all tables
4. Verifies database connection and all tables created successfully

## What It Does

**Before:**

- No `prisma/schema.prisma` file or incomplete schema
- No Prisma client generated
- Database is completely empty (all tables manually deleted)
- DATABASE_URL already set in `.env` file

**After:**

- ✅ Complete Prisma schema created/verified
- ✅ All tables created from schema in empty database
- ✅ Prisma client generated and ready to use
- ✅ Database connection verified

## Supported Arguments

None - this skill uses the project's `prisma/schema.prisma` and `.env`.

## Example Usage

```
/setup-db
```

## Implementation

When user invokes this skill:

1. **Verify or create Prisma schema**:
   - Check if `prisma/schema.prisma` exists
   - If it exists: validate it's complete and correct
   - If it doesn't exist: ask user for schema details and create it
   - Schema should include:
     - `datasource db` pointing to PostgreSQL
     - All data models with proper fields, types, relationships
     - Indexes and constraints needed for the project
   - Ensure all models are defined (users, roles, entities, etc.)

2. **Generate Prisma client**:

   ```bash
   source ~/.nvm/nvm.sh && nvm use 24
   pnpm prisma:generate
   ```

   - Generates client from the schema
   - If error: debug schema syntax issues

3. **Push schema to empty database**:

   ```bash
   pnpm prisma:push
   ```

   - Creates all tables from schema
   - Creates indexes and constraints
   - No migration files created (direct schema sync)
   - If push fails: troubleshoot DATABASE_URL and connection

4. **Verify all tables created**:

   ```bash
   pnpm prisma:studio
   ```

   - Opens Prisma Studio at localhost:5555
   - User inspects all tables visually
   - Verify structure matches schema expectations
   - Check all expected tables are present

5. **Display summary**:
   - ✅ Prisma schema created/verified
   - ✅ Prisma client generated
   - ✅ All tables created from schema in empty database
   - ✅ Database connection verified
   - ✅ Ready for next phase (test generation, service implementation, etc.)

## Notes

- **Completely Fresh**: This skill assumes database is completely empty - all existing tables have been manually deleted before running
- **DATABASE_URL**: Assumes `.env` file is already set up correctly with DATABASE_URL (do not modify)
- **PostgreSQL**: Works with Supabase, AWS RDS, local PostgreSQL, Digital Ocean, or any PostgreSQL provider
- **No Migrations**: Uses direct schema push (`db push`), not migration files
- **Prisma Client**: Generated to project's output location (default: `node_modules/.prisma/client/`)
- **Manual Cleanup**: You must manually delete all existing tables from database before running this skill

## Troubleshooting

**Problem**: `Can't connect to database`

- **Solution**:
  - Verify DATABASE_URL connection string is correct
  - Ensure database server is running
  - Check network connectivity and firewall
  - For cloud databases: verify IP whitelist/security groups

**Problem**: `Prisma schema has errors`

- **Solution**:
  - Check Prisma schema syntax
  - Ensure all models are properly defined
  - Run `pnpm prisma validate` to check schema

**Problem**: `Some tables already exist`

- **Solution**: Delete all existing tables first before pushing new schema
- Use database admin console to drop tables manually

**Problem**: `push fails with migration conflict`

- **Solution**: This shouldn't happen with fresh database, but if so:
  - Delete generated Prisma client: `rm -rf node_modules/.prisma/`
  - Run `pnpm install` to regenerate
  - Try push again

## Related Skills

After setup-db completes:

- Next: `/write-tests-module` - Generate test files for a feature
- Or: Follow project's implementation workflow

## Success Criteria

Setup is complete when:

- ✅ `prisma/schema.prisma` exists and is valid
- ✅ `pnpm prisma:generate` runs without errors
- ✅ `pnpm prisma:push` succeeds on empty database
- ✅ Prisma Studio shows all expected tables with correct structure
- ✅ No errors in Prisma client generation
- ✅ Database connection verified and working
- ✅ Ready for service/repository implementation

## What This Skill Does NOT Do

- Does not create application code (only database setup)
- Does not seed data (that's a separate step after setup)
- Does not create environment variables (user must set DATABASE_URL)
- Does not run application tests (that's Phase 5+)
- Does not deploy to production (that's Phase 7)
