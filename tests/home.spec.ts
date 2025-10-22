// tests/home.spec.ts
import { test, expect } from "@playwright/test";

/**
 * Homepage Tests
 *
 * Tests the public homepage for unauthenticated users
 */

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should load successfully", async ({ page }) => {
    // Check that page loads with 200 status
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("should display CertistryLMS branding", async ({ page }) => {
    // Check for logo/brand name
    await expect(page.getByRole("heading", { name: /CertistryLMS/i })).toBeVisible();
  });

  test("should display hero section with main heading", async ({ page }) => {
    // Check for hero heading - use first() to avoid strict mode violation
    await expect(page.getByText(/Master Your/i)).toBeVisible();
    await expect(page.getByText(/Certification Journey/i).first()).toBeVisible();
  });

  test("should display sign in button", async ({ page }) => {
    // Check for auth button in header - use first() to get the header button
    const signInButton = page.getByRole("button", { name: /Sign In/i }).or(page.getByRole("link", { name: /Get Started/i })).first();
    await expect(signInButton).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    // Check for feature section
    await expect(page.getByText(/Structured Learning/i)).toBeVisible();
    await expect(page.getByText(/Progress Tracking/i)).toBeVisible();
    await expect(page.getByText(/Multiple Certifications/i)).toBeVisible();
    await expect(page.getByText(/Secure & Reliable/i)).toBeVisible();
  });

  test("should display call-to-action section", async ({ page }) => {
    // Check for CTA
    await expect(page.getByText(/Ready to Start Your Certification Journey/i)).toBeVisible();
  });

  test("should display footer", async ({ page }) => {
    // Check for footer content
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("CertistryLMS");
    expect(bodyText).toContain("All rights reserved");
  });

  test("should have proper gradient styling", async ({ page }) => {
    // Check that gradient classes are applied
    const bodyHtml = await page.content();
    expect(bodyHtml).toContain("from-purple");
    expect(bodyHtml).toContain("to-blue");
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check that main elements are still visible
    await expect(page.getByRole("heading", { name: /CertistryLMS/i })).toBeVisible();
    await expect(page.getByText(/Master Your/i)).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check that main elements are still visible
    await expect(page.getByRole("heading", { name: /CertistryLMS/i })).toBeVisible();
    await expect(page.getByText(/Master Your/i)).toBeVisible();
  });

  test("should take full page screenshot for visual regression", async ({ page }) => {
    // Take screenshot for visual testing
    await page.screenshot({
      path: "test-results/homepage-full.png",
      fullPage: true,
    });

    // Check that body has content
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
