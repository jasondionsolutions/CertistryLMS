# Testing Guide

## Overview

This project uses **Playwright** for end-to-end testing. All tests are located in the `tests/` directory.

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Test Environment

Copy the test environment template:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and fill in your test user credentials.

### 3. Create Test Users in Cognito

You need to create test users in your AWS Cognito User Pool with the following roles:

**Admin User:**
- Email: (set in `.env.test` as `TEST_ADMIN_EMAIL`)
- Password: (set in `.env.test` as `TEST_ADMIN_PASSWORD`)
- Cognito Group: `admin`

**Instructor User:**
- Email: (set in `.env.test` as `TEST_INSTRUCTOR_EMAIL`)
- Password: (set in `.env.test` as `TEST_INSTRUCTOR_PASSWORD`)
- Cognito Group: `instructor`

**Regular User:**
- Email: (set in `.env.test` as `TEST_USER_EMAIL`)
- Password: (set in `.env.test` as `TEST_USER_PASSWORD`)
- Cognito Group: `user`

#### Creating Test Users via AWS CLI:

```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@test.com \
  --user-attributes Name=email,Value=admin@test.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@test.com \
  --password YourSecureTestPassword123! \
  --permanent

# Add to admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@test.com \
  --group-name admin
```

### 4. Start Development Server

Tests run against your local development server:

```bash
yarn dev
```

Keep this running in a separate terminal window.

## Running Tests

### Run All Tests (Headless)

```bash
yarn test
```

### Run Tests with UI

```bash
yarn test:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run tests individually
- Watch tests execute in real-time
- Debug failures with time-travel

### Run Specific Test File

```bash
npx playwright test tests/certifications.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

## Test Structure

### Test Files

- `tests/home.spec.ts` - Homepage tests (unauthenticated)
- `tests/certifications.spec.ts` - Certification CRUD tests (requires admin auth)
- `tests/helpers/auth.helper.ts` - Authentication utilities

### Test Helpers

#### Authentication

```typescript
import { loginAsAdmin, loginAsInstructor, loginAsUser } from "./helpers/auth.helper";

// Login as admin
await loginAsAdmin(page);

// Login as instructor
await loginAsInstructor(page);

// Login as regular user
await loginAsUser(page);
```

## Writing New Tests

### Template for Authenticated Tests

```typescript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.helper";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Navigate to your page
    await page.goto("/your-page");
    await page.waitForLoadState("networkidle");
  });

  test("should do something", async ({ page }) => {
    // Your test code
  });
});
```

### Template for Public Tests

```typescript
import { test, expect } from "@playwright/test";

test.describe("Public Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/your-public-page");
    await page.waitForLoadState("networkidle");
  });

  test("should load successfully", async ({ page }) => {
    // Your test code
  });
});
```

## Best Practices

1. **Always authenticate** before testing protected routes
2. **Use descriptive test names** that explain what is being tested
3. **Wait for elements** to be visible before interacting with them
4. **Use data-testid attributes** for stable selectors
5. **Clean up test data** after tests (if creating database records)
6. **Take screenshots** on failures for debugging
7. **Organize tests** into logical describe blocks
8. **Test happy paths AND edge cases** (errors, validation, empty states)

## Troubleshooting

### Tests Failing Due to Authentication

**Problem:** Tests timeout or can't find elements on protected pages

**Solution:** Ensure:
1. Test users exist in Cognito
2. Test users have correct group memberships
3. `.env.test` has correct credentials
4. Development server is running

### Selectors Not Finding Elements

**Problem:** `locator.click: Test timeout`

**Solution:**
1. Check the element exists on the page
2. Use `--headed` mode to see what's happening
3. Use `--debug` mode to step through
4. Check for authentication issues

### Slow Tests

**Problem:** Tests take too long to run

**Solution:**
1. Reduce unnecessary `waitForTimeout()` calls
2. Use `waitForLoadState("networkidle")` instead of arbitrary timeouts
3. Run tests in parallel (Playwright does this by default)

## CI/CD

For GitHub Actions or other CI/CD:

```yaml
- name: Install dependencies
  run: yarn install

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: yarn test
  env:
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
