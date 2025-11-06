# Testing Guide

This project uses Vitest for unit tests and Playwright for E2E tests.

## Unit Tests (Vitest)

### Running Tests

```bash
# Run all unit tests once
npm run test:unit

# Run tests in watch mode (recommended for development)
npm run test:unit:watch

# Run tests with UI mode
npm run test:unit:ui

# Run tests with coverage report
npm run test:unit:coverage
```

### Writing Unit Tests

- Place test files next to the code they test with `.test.ts` or `.spec.ts` extension
- Or place them in `tests/unit/` directory
- Use React Testing Library for component tests
- Follow the Arrange-Act-Assert pattern
- Use `vi` object for mocks and spies

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/helpers/react-testing-helpers';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## E2E Tests (Playwright)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Generate tests using codegen tool
npm run test:e2e:codegen

# Debug tests
npm run test:e2e:debug
```

### Writing E2E Tests

- Place test files in `tests/e2e/` directory
- Use Page Object Model pattern for maintainability
- Use locators for element selection
- Implement visual comparison with screenshots when needed
- Use browser contexts for test isolation

### Example Test

```typescript
import { test, expect } from '@/tests/helpers/playwright-helpers';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## Test Structure

```
tests/
├── unit/           # Unit tests
├── e2e/            # E2E tests
├── setup/          # Setup files
│   └── vitest.setup.ts
└── helpers/        # Test utilities
    ├── react-testing-helpers.tsx
    └── playwright-helpers.ts
```

