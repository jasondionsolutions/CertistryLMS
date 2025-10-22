// tests/auth-flow.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.helper";

/**
 * Authentication Flow Test
 *
 * Tests the Cognito authentication flow to ensure login works correctly
 */

test.describe("Authentication Flow", () => {
  test("should successfully login as admin", async ({ page }) => {
    // Login
    await loginAsAdmin(page);

    // Verify we're logged in by checking for user menu button (shows user's name/initials)
    const userMenuButton = page.getByRole("button", { name: /Jason Dion|Admin|JD/i });
    await expect(userMenuButton).toBeVisible({ timeout: 5000 });

    console.log("✅ Authentication successful!");
  });

  test("should be able to access admin pages after login", async ({ page }) => {
    // Login
    await loginAsAdmin(page);

    // Navigate to admin certifications page
    await page.goto("/admin/certifications");
    await page.waitForLoadState("networkidle");

    // Check we can access the page (not redirected to login)
    await expect(
      page.getByRole("heading", { name: "Certification Management" })
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ Successfully accessed admin page!");
  });
});
