# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

**DO NOT COMMIT changes automatically.** Always wait for explicit user approval before committing. Implement features, build, test, and show the changes staged — let the user review and request the commit.

## Node Version

Always activate Node 24 before running any `pnpm` or `node` command:

```bash
source ~/.nvm/nvm.sh && nvm use 24
```

## Commands

```bash
pnpm start:dev        # start with hot reload
pnpm build            # compile TypeScript to dist/
pnpm lint             # ESLint with auto-fix
pnpm test             # run all unit tests
pnpm test:watch       # run tests in watch mode
pnpm test -- --testPathPattern=wallet  # run a single test file

pnpm prisma:generate  # regenerate Prisma client after schema changes
pnpm prisma:push      # push schema changes to the database (no migrations)
pnpm prisma:studio    # open Prisma Studio at localhost:5555
```

Swagger UI is available at **http://localhost:3000/docs** when the server is running.

## Architecture

NestJS v11 REST API backed by Supabase (PostgreSQL) via Prisma 7.

### Module pattern

Every feature follows this structure — create the files, then import the module in `app.module.ts`:

```
src/
  <feature>/
    <feature>.module.ts      # declares controller + service, exports service if needed
    <feature>.controller.ts  # HTTP routes, delegates to service
    <feature>.service.ts     # business logic, injects PrismaService
    <feature>.dto.ts         # request/response shapes (used by Swagger + validation)
```

### Database layer (`src/prisma/`)

`PrismaModule` is `@Global()` — import it once in `AppModule` and `PrismaService` is available everywhere via constructor injection. Never import `PrismaModule` again in feature modules.

`PrismaService` extends `PrismaClient` directly, so all Prisma model accessors (`prisma.wallet`, `prisma.category`, etc.) are available on the injected service instance.

### Prisma 7 specifics

- Schema: `prisma/schema.prisma` — datasource has **no `url`** field; connection URL lives in `prisma.config.ts`
- Generator uses `moduleFormat = "cjs"` — required to avoid `import.meta.url` crash in NestJS's CJS build
- Client output: `generated/prisma/` (gitignored, regenerated via `postinstall`)
- Import path: `../../generated/prisma/client.js`
- `PrismaClient` requires a driver adapter — `PrismaPg` from `@prisma/adapter-pg`
- `prisma:push` uses the **Session pooler URL** (port 5432, `*.pooler.supabase.com`) — the direct connection (`db.*.supabase.co:5432`) is unreachable from this machine

### Data model

- **Category** / **Wallet** / **TransactionEvent** — soft delete via `deleted_at Int?`
- **Posting** — join table between TransactionEvent and Wallet; hard delete only
- Timestamps are Unix epoch as `Int` (no timezone conversion)
- Wallet `balance` is never stored — always computed as `SUM(postings.amount)`
- `WalletType` enum value is `e_wallet` in Prisma/DB; map to `"e-wallet"` in the API layer

### Import convention

All relative imports use `.js` extensions — required by `module: "nodenext"` in `tsconfig.json`:

```ts
import { PrismaService } from './prisma/prisma.service.js';
```

**Note for tests:** In `.spec.ts` files, omit `.js` extensions since Jest runs directly on TypeScript (not compiled code). Jest's `moduleNameMapper` handles the mapping automatically.

```ts
// ✅ In .spec.ts files
import { CategoriesService } from './categories.service';

// ✅ In .ts files
import { CategoriesService } from './categories.service.js';
```

## Testing

### Mocking services in unit tests

When testing controllers, completely mock the service to avoid database access:

```ts
let mockService: {
  getAll: jest.Mock;
  create: jest.Mock;
};

beforeEach(async () => {
  mockService = {
    getAll: jest.fn(),
    create: jest.fn(),
  };

  const module = await Test.createTestingModule({
    controllers: [CategoriesController],
    providers: [{ provide: CategoriesService, useValue: mockService }],
  }).compile();
});

it('should call service method', async () => {
  mockService.getAll.mockResolvedValue({ data: [] });
  const result = await controller.getAll({});
  expect(mockService.getAll).toHaveBeenCalledWith({});
});
```

This ensures **no database writes** during tests — service mocks return hardcoded data.
