---
name: setup-db
description: Initialize a fresh PostgreSQL database with Prisma from a design specification - zero to schema in one step
---

# Setup DB

Initialize a completely fresh PostgreSQL database and Prisma configuration from a design specification - no schema, no tables, completely fresh start.

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

```
/setup-db {design-file}
```

- **Required**: Path to file containing database design/schema specification
  - Can be: design document, requirements, ER diagram text, Swagger spec, etc.
  - Examples: `docs/design.md`, `@docs/PHASE3_DESIGN.md`, `docs/database-spec.yaml`

**This file should contain:**
- All database models and entities to create
- Field names, types, and relationships
- Indexes and constraints needed
- Any enums or custom types
- Primary keys and foreign keys

## Example Usage

```
/setup-db docs/design.md
/setup-db @docs/PHASE3_DESIGN.md
/setup-db docs/database-spec.yaml
/setup-db docs/requirements.md
```

## Implementation

When user invokes this skill with a design file path (e.g., `/setup-db docs/design.md`):

1. **Read the design specification file**:
   - Extract all database models, entities, and fields from the document
   - Identify all relationships between models (one-to-many, many-to-many, etc.)
   - Extract indexes, unique constraints, and special field types
   - Identify enums and custom types needed
   - Note: User's package manager, Node version, Prisma config (no .env modifications)

2. **Create complete Prisma schema**:
   - Create `prisma/schema.prisma` with all models from the design doc
   - Include proper field types (String, Int, DateTime, Boolean, etc.)
   - Add all relationships with proper foreign keys
   - Add indexes and constraints as specified
   - Add enums if needed
   - Ensure `datasource db` points to PostgreSQL (provider = "postgresql")
   - Ensure proper timestamp fields (@default(now()), @updatedAt if applicable)
   - Note: Do NOT set `url` in datasource (connection string goes in separate config)

3. **Write the Prisma schema file**:
   - Write complete schema to `prisma/schema.prisma`
   - Display the generated schema for user review
   - Ask user to confirm it looks correct

4. **Generate Prisma client**:
   - Runs appropriate command based on project setup (e.g., `pnpm prisma generate`)
   - Generates client from the schema
   - If error: debug schema syntax issues

5. **Push schema to empty database**:
   - Runs `pnpm prisma db push` (or equivalent)
   - Creates all tables from schema
   - Creates indexes and constraints
   - No migration files created (direct schema sync)
   - If push fails: troubleshoot connection or ask user to verify DATABASE_URL

6. **Verify all tables created**:
   - Opens Prisma Studio (if available): `pnpm prisma studio`
   - Or: List tables in database to verify structure
   - Verify structure matches schema expectations
   - Check all expected tables are present

7. **Display summary**:
   - ✅ Prisma schema created from design document
   - ✅ Schema written to `prisma/schema.prisma`
   - ✅ Prisma client generated
   - ✅ All tables created from schema in empty database
   - ✅ Database connection verified
   - ✅ Ready for next steps (TDD tests, implementation, etc.)

## Important Notes

- **Completely Fresh Database**: This skill assumes the database is completely empty
  - All existing tables must be manually deleted before running
  - User is responsible for cleanup
  - Skill does NOT delete tables automatically (safety first)

- **Database Connection**: User must have DATABASE_URL configured
  - In `.env` file (Supabase, AWS RDS, local PostgreSQL, etc.)
  - Skill does NOT create or modify `.env`
  - Skill does NOT verify connection until push step

- **PostgreSQL Required**: Works with any PostgreSQL provider
  - Supabase (recommended for managed service)
  - AWS RDS, Digital Ocean, local PostgreSQL, etc.
  - Connection pooler compatible (adjust port/host as needed)

- **No Migrations**: Uses direct schema push (`db push`), not migration files
  - Faster for fresh projects
  - No migration history to track

- **Prisma Configuration**: Assumes `prisma/schema.prisma` and Prisma config exist
  - For Prisma 7 specifically: No `url` field in datasource
  - Connection string lives in separate config file or environment variable

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

- ✅ Design document read and schema extracted
- ✅ `prisma/schema.prisma` created with all models from design doc
- ✅ Schema reviewed and confirmed correct by user
- ✅ `pnpm prisma:generate` runs without errors
- ✅ `pnpm prisma:push` succeeds on empty database
- ✅ Prisma Studio shows all expected tables with correct structure
- ✅ All models, relationships, and indexes match design document
- ✅ Database connection verified and working
- ✅ Ready for `/write-tests-module` TDD workflow

## What This Skill Does NOT Do

- ❌ Does not create or modify `.env` or environment variables
- ❌ Does not verify DATABASE_URL before running (user responsibility)
- ❌ Does not delete existing tables (user must clean manually)
- ❌ Does not seed data (that's a separate step after setup)
- ❌ Does not run application tests
- ❌ Does not deploy to production
- ❌ Does not create application code (only database setup)
