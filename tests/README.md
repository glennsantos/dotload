# Dotload Test Suite Documentation

This document provides comprehensive documentation for the Dotload test suite, covering all major functionalities of the digital product marketplace platform.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Test Categories](#test-categories)
6. [Writing New Tests](#writing-new-tests)
7. [Continuous Integration](#continuous-integration)

## Overview

The Dotload test suite is built using:
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - DOM matchers
- **jest-mock-extended** - Advanced mocking capabilities

### Test Statistics

- **Total Test Files**: 20+
- **Test Categories**: 5 (Backend, Frontend, Integration, Utilities, E2E)
- **Coverage Target**: 70% (branches, functions, lines, statements)

## Test Structure

```
tests/
├── __mocks__/              # Mock implementations
│   ├── cloudinary.js       # Cloudinary SDK mock
│   ├── jose.js             # JWT library mock
│   ├── discount-utils.js   # Discount utilities mock
│   └── fileMock.js         # File/asset mock
│
├── backend/                # API route tests
│   ├── auth/               # Authentication endpoints
│   │   └── auth.test.ts
│   ├── products/           # Product management endpoints
│   │   └── products.test.ts
│   ├── purchases/          # Purchase endpoints
│   │   └── purchases.test.ts
│   ├── payments/           # Payment processing endpoints
│   │   └── payments.test.ts
│   ├── payouts/            # Payout endpoints
│   │   └── payouts.test.ts
│   └── discount-codes/     # Discount code endpoints
│       └── discount-codes.test.ts
│
├── frontend/               # Component and UI tests
│   ├── auth/               # Authentication components
│   │   ├── login.test.tsx
│   │   └── registration.test.tsx
│   ├── products/           # Product components
│   │   ├── product-creation.test.tsx
│   │   ├── product-edit.test.tsx
│   │   ├── product-variants.test.tsx
│   │   └── price-validation.test.ts
│   ├── purchases/          # Purchase components
│   │   └── checkout.test.tsx
│   ├── dashboard/          # Dashboard components
│   │   └── payout.test.tsx
│   ├── settings/           # Settings components
│   │   └── settings.test.tsx
│   ├── checkout-ui.test.tsx
│   └── discount-validation.test.ts
│
├── integration/            # End-to-end flow tests
│   ├── purchase-flow.test.ts      # Complete purchase flow
│   └── product-lifecycle.test.ts  # Product creation lifecycle
│
├── lib/                    # Utility library tests
│   ├── file-utils.test.ts         # File management utilities
│   ├── form-validation.test.ts    # Form validation utilities
│   ├── email.test.ts              # Email service
│   ├── download-utils.test.ts     # Download management
│   └── purchase-utils.test.ts     # Purchase utilities
│
├── setup.js                # Jest setup and global mocks
├── setup.ts                # TypeScript setup
└── README.md              # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test category
npm run test:backend
npm run test:frontend
npm run test:integration

# Run specific test file
npm test -- tests/backend/auth/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

### Advanced Test Commands

```bash
# Frontend-specific tests
npm run test:frontend:auth          # Authentication components only
npm run test:frontend:registration  # Registration component only
npm run test:frontend:login         # Login component only
npm run test:frontend:product-edit  # Product edit component only

# CI/CD pipeline tests
npm run test:ci

# Generate test report
npm run test:report
```

## Test Coverage

### Coverage Targets

| Metric     | Target | Current |
|------------|--------|---------|
| Branches   | 70%    | TBD     |
| Functions  | 70%    | TBD     |
| Lines      | 70%    | TBD     |
| Statements | 70%    | TBD     |

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/coverage-final.json` - JSON coverage data
- `coverage/lcov.info` - LCOV format for CI tools

## Test Categories

### 1. Backend Tests (`tests/backend/`)

Tests for all API routes and server-side functionality.

**Authentication Tests** (`auth/auth.test.ts`)
- User login/logout
- Registration
- Email verification
- Password reset
- Session management
- JWT token handling

**Product Tests** (`products/products.test.ts`)
- Product CRUD operations
- File uploads
- Product publishing
- Slug generation
- Product search and filtering

**Purchase Tests** (`purchases/purchases.test.ts`)
- Purchase creation
- Order processing
- Download access
- Purchase history

**Payment Tests** (`payments/payments.test.ts`)
- Payment creation via Xendit
- Payment status checking
- Webhook handling
- Multiple payment methods
- Payment security

**Payout Tests** (`payouts/payouts.test.ts`)
- Payout request creation
- Balance calculations
- Payout status tracking
- Bank account validation

**Discount Code Tests** (`discount-codes/discount-codes.test.ts`)
- Discount code creation
- Code validation
- Usage tracking
- Expiration handling

### 2. Frontend Tests (`tests/frontend/`)

Tests for React components and UI interactions.

**Authentication Components**
- Login form validation
- Registration form validation
- Password strength checking
- Email verification flow

**Product Components**
- Product creation form
- Product editing interface
- Price validation
- File upload UI
- Product variants

**Checkout Components**
- Checkout flow
- Payment method selection
- Discount code application
- Order summary

**Dashboard Components**
- Sales dashboard
- Payout dashboard
- Analytics charts

### 3. Integration Tests (`tests/integration/`)

End-to-end tests covering complete user flows.

**Purchase Flow** (`purchase-flow.test.ts`)
1. Browse product
2. Initiate checkout
3. Create payment
4. Process payment webhook
5. Fulfill order
6. Download digital file

Test scenarios:
- Successful purchase flow
- Purchase with discount code
- Download limit enforcement
- Expired access code handling
- Failed payment handling

**Product Lifecycle** (`product-lifecycle.test.ts`)
1. Create draft product
2. Upload files
3. Update product details
4. Publish product
5. Archive product

Test scenarios:
- Complete product creation
- Publishing validation
- File deletion
- Ownership validation
- Slug uniqueness

### 4. Utility Library Tests (`tests/lib/`)

Tests for core business logic utilities.

**File Utilities** (`file-utils.test.ts`)
- File upload to Cloudinary
- File validation (type, size)
- File deletion
- Security checks

**Form Validation** (`form-validation.test.ts`)
- Price validation
- Discount validation
- Email validation
- Input sanitization
- XSS prevention

**Email Service** (`email.test.ts`)
- Email sending
- Template rendering
- Verification emails
- Password reset emails
- Purchase confirmation emails

**Download Utilities** (`download-utils.test.ts`)
- Download link generation
- Access code validation
- Download limit enforcement
- Link expiration
- Download tracking

**Purchase Utilities** (`purchase-utils.test.ts`)
- Purchase creation
- Order fulfillment
- Payment validation
- Discount application
- Refund processing

## Writing New Tests

### Test File Naming Convention

- Backend tests: `*.test.ts`
- Frontend tests: `*.test.tsx` (for components) or `*.test.ts` (for utilities)
- Integration tests: `*.test.ts`

### Test Structure Template

```typescript
/**
 * ============================================================================
 * [TEST CATEGORY] - [FEATURE NAME]
 * ============================================================================
 *
 * Tests for [feature description]
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/dependency', () => ({
  // Mock implementation
}));

describe('[Feature] Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup test data
  });

  describe('[Functionality Group]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const mockData = { /* test data */ };

      // Act
      const result = await functionUnderTest(mockData);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use "should [action] when [condition]" format
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Isolate unit under test
4. **Test Edge Cases**: Cover error conditions and boundary cases
5. **Avoid Test Interdependence**: Each test should be independent
6. **Use Factories**: Create reusable test data factories
7. **Clean Up**: Reset mocks and state between tests

### Example Test

```typescript
describe('Discount Code Validation', () => {
  it('should validate percentage discounts correctly', async () => {
    // Arrange
    const discount = {
      type: 'percentage',
      value: 20,
    };
    const price = 100;

    // Act
    const result = applyDiscount(price, discount);

    // Assert
    expect(result).toBe(80); // 100 - 20%
  });

  it('should reject invalid percentage values', async () => {
    // Arrange
    const invalidDiscount = {
      type: 'percentage',
      value: 150, // Over 100%
    };

    // Act & Assert
    expect(() => validateDiscount(invalidDiscount)).toThrow('Invalid percentage');
  });
});
```

## Continuous Integration

### CI Pipeline Tests

The `npm run test:ci` command is optimized for CI/CD environments:
- Runs all tests without watch mode
- Generates coverage reports
- Exits with error code on test failure
- Optimized for parallel execution

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Test Environments

### Backend Tests
- Environment: Node.js
- Database: Mocked Prisma client
- External APIs: Mocked (Xendit, Cloudinary, etc.)

### Frontend Tests
- Environment: jsdom
- Browser APIs: Mocked
- React Router: Mocked
- Network requests: Mocked fetch

## Debugging Tests

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Specific Test

```bash
node --inspect-brk node_modules/.bin/jest tests/backend/auth/auth.test.ts
```

## Common Issues and Solutions

### Issue: Tests timing out

**Solution**: Increase timeout in test or jest.config.js
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Module not found errors

**Solution**: Check moduleNameMapper in jest.config.js

### Issue: Async tests not completing

**Solution**: Ensure all promises are awaited or use done callback

### Issue: Mock not working

**Solution**: Ensure mock is declared before import

## Contributing

When adding new features:

1. Write tests BEFORE implementing feature (TDD)
2. Ensure tests pass locally
3. Maintain or improve coverage percentage
4. Update this documentation if adding new test categories
5. Follow existing test patterns and conventions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

Last Updated: 2025-11-18
Maintained by: Development Team
