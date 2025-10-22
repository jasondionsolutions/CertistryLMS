// tests/helpers/mock-auth.helper.ts
import { Page } from "@playwright/test";

/**
 * Mock Authentication Helper for Tests
 *
 * Uses cookie-based authentication to bypass Cognito UI for testing.
 * This is the recommended approach for E2E tests with NextAuth.
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export const MOCK_USERS = {
  admin: {
    id: "test-admin-id",
    email: "admin@test.com",
    name: "Test Admin",
    roles: ["admin"],
  },
  instructor: {
    id: "test-instructor-id",
    email: "instructor@test.com",
    name: "Test Instructor",
    roles: ["instructor"],
  },
  user: {
    id: "test-user-id",
    email: "user@test.com",
    name: "Test User",
    roles: ["user"],
  },
};

/**
 * Set authentication cookies to simulate logged-in user
 * This bypasses the Cognito UI for testing purposes
 */
export async function setMockAuth(page: Page, user: MockUser) {
  // Create a mock session token
  const sessionToken = {
    name: user.name,
    email: user.email,
    sub: user.id,
    roles: user.roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  };

  // Set NextAuth session cookie
  // Note: This is a simplified version. In production tests, you'd use NextAuth's actual token generation
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: Buffer.from(JSON.stringify(sessionToken)).toString("base64"),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Set a flag to indicate we're using mock auth
  await page.context().addCookies([
    {
      name: "__mock_auth_user",
      value: JSON.stringify(user),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Mock login as admin user
 */
export async function mockLoginAsAdmin(page: Page) {
  await setMockAuth(page, MOCK_USERS.admin);
}

/**
 * Mock login as instructor user
 */
export async function mockLoginAsInstructor(page: Page) {
  await setMockAuth(page, MOCK_USERS.instructor);
}

/**
 * Mock login as regular user
 */
export async function mockLoginAsUser(page: Page) {
  await setMockAuth(page, MOCK_USERS.user);
}

/**
 * Clear all authentication cookies
 */
export async function clearMockAuth(page: Page) {
  await page.context().clearCookies();
}
