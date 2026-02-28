---
name: test-generator
description: Generates test file/files based on functional requirements provided in a reference markdown file.
---

# Test Generator

Generates test files (.spec.ts) based on functional requirements defined in a markdown reference file. This skill helps start development with a TDD (Test-Driven Development) approach by creating comprehensive test cases that drive implementation.

## Behavior

1. Read the functional requirements from a user-provided markdown file
2. Parse requirements to identify test scenarios, edge cases, and expected behaviors
3. Generate one or more `.spec.ts` test files following the project's testing patterns
4. Use the soegih-api project's testing conventions (Jest, mocking patterns, etc.)
5. Display generated test files for review and refinement
6. Allow user to approve before writing to disk

## Supported Arguments/Modules

- `reference-file.md` — Path to markdown file containing functional requirements
- `--module {module-name}` — Optional: specify the feature module (e.g., `categories`, `wallets`)
- `--output {directory}` — Optional: override default output directory (defaults to source module folder)
- `--dry-run` — Show generated tests without writing to disk

## Example Usage

```
/test-generator docs/requirements/categories-feature.md
/test-generator docs/requirements/wallets-api.md --module wallets
/test-generator requirements.md --output src/transactions --dry-run
```

## Implementation

### Step 1: Parse Arguments
- Extract the reference file path (required)
- Parse optional flags: `--module`, `--output`, `--dry-run`
- Validate that the reference file exists and is readable

### Step 2: Read and Analyze Requirements
- Read the markdown file
- Extract test scenarios from requirements (look for numbered lists, acceptance criteria, edge cases)
- Identify key methods/functions to test
- Group related tests by behavior (describe blocks)

### Step 3: Generate Test Files
- Create Jest test structure (.spec.ts files) following the project pattern:
  - Import necessary testing utilities (describe, it, expect, jest.Mock, etc.)
  - Mock services/repositories as per CLAUDE.md conventions
  - Generate test cases for each requirement
  - Include setup (beforeEach) and teardown where needed
  - Use hardcoded test data aligned with project patterns

### Step 4: Match Project Conventions
- Follow NestJS/Jest patterns from existing tests in the project
- Use proper mocking for services (avoid database access)
- Include both success and failure scenarios
- Add comments explaining complex test setup

### Step 5: Display and Confirm
- Show generated test files in preview
- Ask user to confirm before writing to disk
- If --dry-run, skip file writing

### Step 6: Write Files
- Create test file(s) at the appropriate location
- Ensure directory structure exists
- Write with proper formatting and line endings

## Output Summary

Display:
- Number of test files generated
- Total test cases created
- File paths where tests will be written
- Summary of test categories (unit, integration, etc.)
- Any warnings or notes about requirements that were ambiguous
