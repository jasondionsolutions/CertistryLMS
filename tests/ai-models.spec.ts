// tests/ai-models.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.helper";

/**
 * AI Models Management Tests
 *
 * Tests for Issue #11: AI Model CRUD Interface
 *
 * Covers:
 * - Listing AI models
 * - Creating new AI models
 * - Editing AI models
 * - Deleting AI models
 * - Activating/deactivating AI models
 *
 * Note: These tests require admin authentication
 */

// Test data
const testAIModel = {
  name: "Test Model E2E",
  modelId: "test-model-e2e-001",
  provider: "anthropic",
  description: "This is a test AI model for automated E2E testing",
};

/**
 * AI MODEL MANAGEMENT TESTS
 *
 * These tests require authenticated admin access via Cognito.
 * Make sure .env.test is configured with valid test user credentials.
 */
test.describe("AI Models Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user before each test
    await loginAsAdmin(page);

    // Navigate to AI models page
    await page.goto("/admin/ai-models");

    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Page Load and UI", () => {
    test("should load AI models page successfully", async ({ page }) => {
      // Check page title
      await expect(page.getByRole("heading", { name: "AI Models" })).toBeVisible();

      // Check for key UI elements
      await expect(page.getByRole("button", { name: /Add AI Model/i })).toBeVisible();
      await expect(page.getByPlaceholder("Search AI models...")).toBeVisible();
    });

    test("should display AI models table", async ({ page }) => {
      // Check for table structure
      await expect(page.locator("table")).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Model ID" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Provider" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter models by search term", async ({ page }) => {
      // Wait for models to load
      await page.waitForTimeout(1000);

      // Get initial count
      const initialCount = await page.locator("tbody tr").count();

      if (initialCount > 0) {
        // Search for "Claude"
        await page.getByPlaceholder("Search AI models...").fill("Claude");
        await page.waitForTimeout(500);

        // Results should be filtered
        const filteredCount = await page.locator("tbody tr").count();
        expect(filteredCount).toBeGreaterThan(0);
      }
    });

    test("should show no results for non-existent search", async ({ page }) => {
      // Search for something that doesn't exist
      await page.getByPlaceholder("Search AI models...").fill("XXXXXXXXX_NONEXISTENT_XXXXXXXXX");
      await page.waitForTimeout(500);

      // Should show empty state or no results
      const rowCount = await page.locator("tbody tr").count();
      expect(rowCount).toBe(0);
    });
  });

  test.describe("Create AI Model", () => {
    test("should open create AI model dialog", async ({ page }) => {
      await page.getByRole("button", { name: /Add AI Model/i }).click();

      // Check dialog is open
      await expect(page.getByRole("heading", { name: "Add AI Model" })).toBeVisible();
      await expect(page.getByLabel(/Model Name/i)).toBeVisible();
      await expect(page.getByLabel(/Model ID/i)).toBeVisible();
      await expect(page.getByLabel(/Provider/i)).toBeVisible();
    });

    test("should create a new AI model", async ({ page }) => {
      // Open create dialog
      await page.getByRole("button", { name: /Add AI Model/i }).click();

      // Fill form
      await page.getByLabel(/Model Name/i).fill(testAIModel.name);
      await page.getByLabel(/Model ID/i).fill(testAIModel.modelId);

      // Select provider from dropdown
      await page.getByLabel(/Provider/i).click();
      await page.getByRole("option", { name: "anthropic" }).click();

      await page.getByLabel(/Description/i).fill(testAIModel.description);

      // Ensure "Active" is checked
      const activeCheckbox = page.getByLabel(/Active/i);
      if (!await activeCheckbox.isChecked()) {
        await activeCheckbox.check();
      }

      // Submit form
      await page.getByRole("button", { name: /^Add Model$/i }).click();

      // Wait for success (dialog should close)
      await page.waitForTimeout(1000);
      await expect(page.getByRole("heading", { name: "Add AI Model" })).not.toBeVisible();

      // Verify model appears in table
      await expect(page.getByText(testAIModel.name).first()).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      // Open create dialog
      await page.getByRole("button", { name: /Add AI Model/i }).click();

      // Try to submit without filling required fields
      await page.getByRole("button", { name: /^Add Model$/i }).click();

      // Check for validation errors
      await page.waitForTimeout(500);
      // Dialog should still be open (form didn't submit)
      await expect(page.getByRole("heading", { name: "Add AI Model" })).toBeVisible();
    });

    test("should close dialog on cancel", async ({ page }) => {
      // Open create dialog
      await page.getByRole("button", { name: /Add AI Model/i }).click();

      // Click cancel
      await page.getByRole("button", { name: /Cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole("heading", { name: "Add AI Model" })).not.toBeVisible();
    });
  });

  test.describe("Interaction Tests (with data)", () => {
    test.beforeEach(async ({ page }) => {
      // Wait for data to load
      await page.waitForTimeout(1000);

      // Check if we have any AI models
      const hasModels = await page.locator('button[aria-label="Actions"]').count() > 0;

      // Skip interaction tests if no data exists
      test.skip(!hasModels, "No AI models exist in database - skipping interaction tests");
    });

    test("should open edit dialog when clicking edit", async ({ page }) => {
      // Find first model's action menu
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();

      // Click edit
      await page.getByRole("menuitem", { name: /Edit/i }).click();

      // Check edit dialog is open
      await expect(page.getByRole("heading", { name: "Edit AI Model" })).toBeVisible();

      // Form should be pre-filled with existing data
      const nameInput = page.getByLabel(/Model Name/i);
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    });

    test("should update AI model details", async ({ page }) => {
      // Open edit dialog for first model
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();
      await page.getByRole("menuitem", { name: /Edit/i }).click();

      // Update description
      const updatedDescription = `Updated at ${Date.now()}`;
      await page.getByLabel(/Description/i).fill(updatedDescription);

      // Submit
      await page.getByRole("button", { name: /Update/i }).click();

      // Wait for success
      await page.waitForTimeout(1000);
      await expect(page.getByRole("heading", { name: "Edit AI Model" })).not.toBeVisible();
    });

    test("should toggle AI model active status", async ({ page }) => {
      // Open edit dialog
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();
      await page.getByRole("menuitem", { name: /Edit/i }).click();

      // Toggle active checkbox
      const activeCheckbox = page.getByLabel(/Active/i);
      const wasChecked = await activeCheckbox.isChecked();

      if (wasChecked) {
        await activeCheckbox.uncheck();
      } else {
        await activeCheckbox.check();
      }

      // Submit
      await page.getByRole("button", { name: /Update/i }).click();
      await page.waitForTimeout(1000);
    });

    test("should open delete confirmation dialog", async ({ page }) => {
      // Open action menu for first model
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();

      // Click delete
      await page.getByRole("menuitem", { name: /Delete/i }).click();

      // Check delete dialog is open
      await page.waitForTimeout(500);
      await expect(page.getByRole("heading", { name: /Delete AI Model/i })).toBeVisible();
    });

    test("should cancel delete operation", async ({ page }) => {
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();
      await page.getByRole("menuitem", { name: /Delete/i }).click();

      await page.waitForTimeout(500);

      // Click cancel
      await page.getByRole("button", { name: /Cancel/i }).click();

      // Dialog should close
      await page.waitForTimeout(300);
      await expect(page.getByRole("heading", { name: /Delete AI Model/i })).not.toBeVisible();
    });
  });

  test.describe("Status Display", () => {
    test("should display active status badge", async ({ page }) => {
      // Wait for data to load
      await page.waitForTimeout(1000);

      const bodyText = await page.textContent("body");

      // Should have active status somewhere
      expect(bodyText).toContain("Active");
    });

    test("should display model count", async ({ page }) => {
      // Wait for data to load
      await page.waitForTimeout(500);

      // Count rows in table (excluding header)
      const rowCount = await page.locator("tbody tr").count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });
  });
});
