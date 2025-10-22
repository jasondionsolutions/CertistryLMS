// tests/home.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  // Navigate to homepage
  const response = await page.goto("/");

  // Check that page loads with 200 status
  expect(response?.status()).toBe(200);

  // Wait for page to be ready
  await page.waitForLoadState("networkidle");

  // Take screenshot on failure for debugging
  await page.screenshot({ path: "test-results/homepage.png", fullPage: true });

  // Check that page has loaded by looking for any text content
  const bodyText = await page.textContent("body");
  expect(bodyText).toBeTruthy();
  expect(bodyText!.length).toBeGreaterThan(0);
});
