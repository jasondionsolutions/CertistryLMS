// tests/helpers/auth.helper.ts
import { Page } from "@playwright/test";

/**
 * Authentication helper for Playwright tests
 *
 * Handles Cognito authentication flow for testing protected routes
 */

export interface TestUser {
  username: string;
  email: string;
  password: string;
  role: "admin" | "instructor" | "user";
}

/**
 * Test users for different roles
 * Note: These should match actual users in your Cognito User Pool
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    username: process.env.TEST_ADMIN_USERNAME || "admin",
    email: process.env.TEST_ADMIN_EMAIL || "admin@test.com",
    password: process.env.TEST_ADMIN_PASSWORD || "TestPassword123!",
    role: "admin",
  },
  instructor: {
    username: process.env.TEST_INSTRUCTOR_USERNAME || "instructor",
    email: process.env.TEST_INSTRUCTOR_EMAIL || "instructor@test.com",
    password: process.env.TEST_INSTRUCTOR_PASSWORD || "TestPassword123!",
    role: "instructor",
  },
  user: {
    username: process.env.TEST_USER_USERNAME || "user",
    email: process.env.TEST_USER_EMAIL || "user@test.com",
    password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
    role: "user",
  },
};

/**
 * Login as a specific user through Cognito
 *
 * @param page - Playwright page object
 * @param user - User credentials to login with
 */
export async function loginAs(page: Page, user: TestUser) {
  console.log(`🔐 Logging in as ${user.role} (${user.username})...`);

  // Navigate to NextAuth sign-in page
  await page.goto("/api/auth/signin");
  await page.waitForLoadState("networkidle");

  // Click "Sign in with Cognito" button
  const signInButton = page.getByRole("button", { name: /Sign in with Cognito/i });
  await signInButton.click();

  // Wait for redirect to Cognito Hosted UI
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Give Cognito UI time to load

  console.log("📝 Filling in username...");

  // Fill in username
  const usernameInput = page.locator('input[name="username"], input[id="signInFormUsername"]');
  await usernameInput.waitFor({ state: "visible", timeout: 5000 });
  await usernameInput.fill(user.username);

  console.log("🔘 Clicking submit button...");

  // Look for various possible submit button selectors
  const submitButton = page.locator(
    'input[type="submit"], button[type="submit"], input[name="signInSubmitButton"], button:has-text("Sign in"), button:has-text("Next")'
  ).first();

  await submitButton.click();

  // Wait for password field to appear (Cognito might show it after username)
  console.log("🔑 Waiting for password field...");
  const passwordInput = page.locator('input[name="password"], input[id="signInFormPassword"], input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });

  console.log("📝 Filling in password...");
  await passwordInput.fill(user.password);

  // Click final submit button
  console.log("🔘 Clicking final submit...");
  const finalSubmitButton = page.locator(
    'input[type="submit"], button[type="submit"], input[name="signInSubmitButton"], button:has-text("Sign in")'
  ).first();

  await finalSubmitButton.click();

  // Wait for redirect back to app after successful login
  console.log("⏳ Waiting for redirect back to app...");
  await page.waitForURL(/localhost:3000/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  console.log(`✅ Successfully logged in as ${user.role}`);
}

/**
 * Login as admin user
 *
 * @param page - Playwright page object
 */
export async function loginAsAdmin(page: Page) {
  await loginAs(page, TEST_USERS.admin);
}

/**
 * Login as instructor user
 *
 * @param page - Playwright page object
 */
export async function loginAsInstructor(page: Page) {
  await loginAs(page, TEST_USERS.instructor);
}

/**
 * Login as regular user
 *
 * @param page - Playwright page object
 */
export async function loginAsUser(page: Page) {
  await loginAs(page, TEST_USERS.user);
}

/**
 * Logout current user
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  await page.goto("/api/auth/signout");
  await page.waitForLoadState("networkidle");

  // Confirm signout if there's a confirmation page
  const signoutButton = page.locator('button:has-text("Sign out")');
  if (await signoutButton.isVisible()) {
    await signoutButton.click();
    await page.waitForNavigation();
  }
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright page object
 * @returns true if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for session by looking for user-specific elements
  const signOutButton = page.locator('button:has-text("Sign Out")');
  return await signOutButton.isVisible({ timeout: 1000 }).catch(() => false);
}
