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

```
/setup-db @docs/PHASE3_DESIGN.md
/setup-db path/to/schema-spec.md
```

- **Required**: Path to design document or schema specification file (e.g., `@docs/PHASE3_DESIGN.md`)
- This file should contain:
  - All database models and entities to create
  - Field names, types, and relationships
  - Indexes and constraints needed
  - Any enums or custom types

## Example Usage

```
/setup-db @docs/PHASE3_DESIGN.md
/setup-db docs/my-database-design.md
/setup-db @docs/PHASE4_SWAGGER.md
```

## Implementation

When user invokes this skill with a design file path (e.g., `/setup-db @docs/PHASE3_DESIGN.md`):

1. **Read the design specification file**:
   - Extract all database models, entities, and fields from the document
   - Identify all relationships between models (one-to-many, many-to-many, etc.)
   - Extract indexes, unique constraints, and special field types
   - Identify enums and custom types needed

2. **Create complete Prisma schema**:
   - Create `prisma/schema.prisma` with all models from the design doc
   - Include proper field types (String, Int, DateTime, etc.)
   - Add all relationships with proper foreign keys
   - Add indexes and constraints as specified
   - Add enums if needed
   - Ensure `datasource db` points to PostgreSQL
   - Ensure proper timestamp fields (@default, @updatedAt if applicable)

3. **Write the Prisma schema file**:
   - Write complete schema to `prisma/schema.prisma`
   - Display the generated schema for user review
   - Ask user to confirm it looks correct

4. **Generate Prisma client**:

   ```bash
   source ~/.nvm/nvm.sh && nvm use 24
   pnpm prisma:generate
   ```

   - Generates client from the schema
   - If error: debug schema syntax issues

5. **Push schema to empty database**:

   ```bash
   pnpm prisma:push
   ```

   - Creates all tables from schema
   - Creates indexes and constraints
   - No migration files created (direct schema sync)
   - If push fails: troubleshoot connection

6. **Verify all tables created**:

   ```bash
   pnpm prisma:studio
   ```

   - Opens Prisma Studio at localhost:5555
   - User inspects all tables visually
   - Verify structure matches schema expectations
   - Check all expected tables are present

7. **Display summary**:
   - ✅ Prisma schema created from design document
   - ✅ Schema written to `prisma/schema.prisma`
   - ✅ Prisma client generated
   - ✅ All tables created from schema in empty database
   - ✅ Database connection verified
   - ✅ Ready for `/write-tests-module` TDD workflow

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

- Does not create application code (only database setup)
- Does not seed data (that's a separate step after setup)
- Does not create environment variables (user must set DATABASE_URL)
- Does not run application tests (that's Phase 5+)
- Does not deploy to production (that's Phase 7)
