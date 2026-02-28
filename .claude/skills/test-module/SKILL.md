---
name: test-module
description: Run tests for a specific feature module in the soegih-api project.
---

# Test Module Skill

Run tests for a specific feature module in the soegih-api project.

## Behavior

1. Parse arguments: extract module name and `--coverage` flag
2. Activate Node 24
3. If `--coverage` flag is present: run `pnpm test:cov -- src/{module}`
4. Otherwise: run `pnpm test -- src/{module}`
5. Display test results and coverage summary
6. Highlight any failures or coverage gaps

## Supported Modules

- categories
- wallet
- transaction
- posting
- prisma

## Example Usage

```
/test-module categories             # without coverage (fast)
/test-module categories --coverage  # with coverage report
/test-module wallet --coverage
```

## Implementation

**IMPORTANT:** Check if `--coverage` flag is present in the arguments.

**If `--coverage` flag is present**, run:

```bash
source ~/.nvm/nvm.sh && nvm use 24 && pnpm test:cov -- src/{module}
```

**If NO `--coverage` flag**, run:

```bash
source ~/.nvm/nvm.sh && nvm use 24 && pnpm test -- src/{module}
```

Always display:

- Pass/fail status
- Test Suites count and total
- Tests count and total
- Execution time
- Coverage summary table (only if `--coverage` was used): % Stmts, % Branch, % Funcs, % Lines
- Highlight any failures or gaps
