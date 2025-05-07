# Authentication Tests

## Overview
These tests cover the authentication functionality for the alaCarte digital product marketplace.

## Test Scenarios
1. User Registration
   - Successful registration
   - Prevent duplicate email registration
   - Validate email format

2. User Login
   - Successful login with correct credentials
   - Reject login with incorrect password
   - Reject login with non-existent email

3. User Profile
   - Retrieve profile with valid token
   - Reject profile retrieval without token
   - Reject profile retrieval with invalid token

## Running Tests
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

## Test Coverage
- Validates input validation
- Checks authentication flow
- Ensures secure token management
- Prevents unauthorized access
