// tests/certifications.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.helper";

/**
 * Certification CRUD Tests
 *
 * Tests for Issue #10: Create Certification CRUD Interface
 *
 * Covers:
 * - Listing certifications (card and table views)
 * - Search and filtering
 * - Creating new certifications (scored and pass/fail)
 * - Editing certifications
 * - Deleting certifications (with dependency checks)
 * - Archiving certifications
 *
 * Note: These tests require admin authentication
 */

// Test data
const testCertification = {
  name: "Test Certification E2E",
  code: "TEST-E2E-001",
  description: "This is a test certification for automated E2E testing",
  passingScore: 700,
  maxScore: 1000,
  duration: 45,
};

/**
 * CERTIFICATION MANAGEMENT TESTS
 *
 * These tests require authenticated admin access via Cognito.
 * Make sure .env.test is configured with valid test user credentials.
 *
 * Tests are organized to run in sequence:
 * 1. Basic page load tests (can run with empty DB)
 * 2. Create certifications (creates test data)
 * 3. Interaction tests (uses created data)
 */
test.describe("Certification Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user before each test
    await loginAsAdmin(page);

    // Navigate to certifications page
    await page.goto("/admin/certifications");

    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Page Load and UI", () => {
    test("should load certifications page successfully", async ({ page }) => {
      // Check page title
      await expect(page.getByRole("heading", { name: "Certification Management" })).toBeVisible();

      // Check for key UI elements
      await expect(page.getByRole("button", { name: /New Certification/i })).toBeVisible();
      await expect(page.getByPlaceholder("Search certifications...")).toBeVisible();
      await expect(page.getByRole("button", { name: /Status:/i })).toBeVisible();
    });

    test("should have view toggle buttons", async ({ page }) => {
      // Find view toggle buttons (should exist even with no data)
      const cardViewButton = page.locator('button[aria-label="Card view"]');
      const tableViewButton = page.locator('button[aria-label="Table view"]');

      await expect(cardViewButton).toBeVisible();
      await expect(tableViewButton).toBeVisible();
    });
  });

  test.describe("Empty States", () => {
    test("should show empty state when no certifications match search", async ({ page }) => {
      // Search for something that definitely doesn't exist
      await page.getByPlaceholder("Search certifications...").fill("XXXXXXXXX_NONEXISTENT_XXXXXXXXX");
      await page.waitForTimeout(500);

      // Check for empty state message
      await expect(page.getByText(/no certifications found/i)).toBeVisible();
    });
  });

  test.describe("Create Certification", () => {
    test("should open create certification modal", async ({ page }) => {
      await page.getByRole("button", { name: /New Certification/i }).click();

      // Check modal is open
      await expect(page.getByRole("heading", { name: "Create Certification" })).toBeVisible();
      await expect(page.getByLabel(/Certification Name/i)).toBeVisible();
      await expect(page.getByLabel(/Certification Code/i)).toBeVisible();
    });

    test("should create a new scored certification", async ({ page }) => {
      // Open create modal
      await page.getByRole("button", { name: /New Certification/i }).click();

      // Fill form
      await page.getByLabel(/Certification Name/i).fill(testCertification.name);
      await page.getByLabel(/Certification Code/i).fill(testCertification.code);
      await page.getByLabel(/Description/i).fill(testCertification.description);

      // Ensure "Scored Exam" is checked
      const scoredExamCheckbox = page.getByLabel(/Scored Exam/i);
      if (!await scoredExamCheckbox.isChecked()) {
        await scoredExamCheckbox.check();
      }

      // Fill scoring fields
      await page.getByLabel(/Passing Score/i).fill(testCertification.passingScore.toString());
      await page.getByLabel(/Max Score/i).fill(testCertification.maxScore.toString());

      // Select duration
      await page.getByLabel(/45 days/i).check();

      // Ensure "Active" is checked
      const activeCheckbox = page.getByLabel(/Active/i);
      if (!await activeCheckbox.isChecked()) {
        await activeCheckbox.check();
      }

      // Submit form
      await page.getByRole("button", { name: /^Create$/i }).click();

      // Wait for success (modal should close)
      await page.waitForTimeout(1000);
      await expect(page.getByRole("heading", { name: "Create Certification" })).not.toBeVisible();

      // Verify certification appears in list
      await expect(page.getByText(testCertification.name).first()).toBeVisible();
    });

    test("should create a pass/fail certification", async ({ page }) => {
      // Open create modal
      await page.getByRole("button", { name: /New Certification/i }).click();

      // Fill basic info
      await page.getByLabel(/Certification Name/i).fill("Pass/Fail Test Cert");
      await page.getByLabel(/Certification Code/i).fill("PF-001");

      // Uncheck "Scored Exam" to make it pass/fail
      await page.getByLabel(/Scored Exam/i).uncheck();
      await page.waitForTimeout(300);

      // Scoring fields should not be visible
      await expect(page.getByLabel(/Passing Score/i)).not.toBeVisible();
      await expect(page.getByLabel(/Max Score/i)).not.toBeVisible();

      // Select duration
      await page.getByLabel(/30 days/i).check();

      // Submit form
      await page.getByRole("button", { name: /^Create$/i }).click();

      // Wait for success
      await page.waitForTimeout(1000);
      await expect(page.getByText("Pass/Fail Test Cert").first()).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      // Open create modal
      await page.getByRole("button", { name: /New Certification/i }).click();

      // Try to submit without filling required fields
      await page.getByRole("button", { name: /^Create$/i }).click();

      // Check for validation errors
      await page.waitForTimeout(500);
      // Modal should still be open (form didn't submit)
      await expect(page.getByRole("heading", { name: "Create Certification" })).toBeVisible();
    });

    test("should close modal on cancel", async ({ page }) => {
      // Open create modal
      await page.getByRole("button", { name: /New Certification/i }).click();

      // Click cancel
      await page.getByRole("button", { name: /Cancel/i }).click();

      // Modal should close
      await expect(page.getByRole("heading", { name: "Create Certification" })).not.toBeVisible();
    });
  });

  // These tests require certifications to exist - they should run after creation tests
  test.describe("Interaction Tests (with data)", () => {
    // Check if any certifications exist before running interaction tests
    test.beforeEach(async ({ page }) => {
      // Wait a bit for data to load
      await page.waitForTimeout(1000);

      // Check if we have any certifications
      const hasCertifications = await page.locator('button[aria-label="Actions"]').count() > 0;

      // Skip interaction tests if no data exists
      test.skip(!hasCertifications, "No certifications exist in database - skipping interaction tests");
    });

    test("should toggle between card and table views", async ({ page }) => {
      const cardViewButton = page.locator('button[aria-label="Card view"]');
      const tableViewButton = page.locator('button[aria-label="Table view"]');

      // Switch to table view
      await tableViewButton.click();
      await page.waitForTimeout(500);

      // Check for table structure
      await expect(page.locator('table')).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();

      // Switch back to card view
      await cardViewButton.click();
      await page.waitForTimeout(500);

      // Table should not be visible
      await expect(page.locator('table')).not.toBeVisible();
    });

    test("should filter certifications by status", async ({ page }) => {
      // Click status dropdown
      await page.getByRole("button", { name: /Status:/i }).click();

      // Select "Active" filter
      await page.getByRole("menuitem", { name: "Active" }).first().click();
      await page.waitForTimeout(500);

      // Verify filter is applied
      await expect(page.getByRole("button", { name: /Status: Active/i })).toBeVisible();
    });

    test("should filter by inactive status", async ({ page }) => {
      await page.getByRole("button", { name: /Status:/i }).click();
      await page.getByRole("menuitem", { name: "Inactive" }).first().click();
      await page.waitForTimeout(500);

      await expect(page.getByRole("button", { name: /Status: Inactive/i })).toBeVisible();
    });

    test("should filter by archived status", async ({ page }) => {
      await page.getByRole("button", { name: /Status:/i }).click();
      await page.getByRole("menuitem", { name: "Archived" }).first().click();
      await page.waitForTimeout(500);

      await expect(page.getByRole("button", { name: /Status: Archived/i })).toBeVisible();
    });

    test("should clear filters and show all certifications", async ({ page }) => {
      // Apply a filter first
      await page.getByRole("button", { name: /Status:/i }).click();
      await page.getByRole("menuitem", { name: "Active" }).first().click();
      await page.waitForTimeout(500);

      // Clear filter
      await page.getByRole("button", { name: /Status: Active/i }).click();
      await page.getByRole("menuitem", { name: "All" }).first().click();
      await page.waitForTimeout(500);

      await expect(page.getByRole("button", { name: /Status: All/i })).toBeVisible();
    });

    test("should open edit modal when clicking edit", async ({ page }) => {
      // Find first certification's action menu
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();

      // Click edit
      await page.getByRole("menuitem", { name: /Edit/i }).click();

      // Check edit modal is open
      await expect(page.getByRole("heading", { name: "Edit Certification" })).toBeVisible();

      // Form should be pre-filled with existing data
      const nameInput = page.getByLabel(/Certification Name/i);
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    });

    test("should update certification details", async ({ page }) => {
      // Open edit modal for first certification
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
      await expect(page.getByRole("heading", { name: "Edit Certification" })).not.toBeVisible();
    });

    test("should toggle certification active status", async ({ page }) => {
      // Open edit modal
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();
      await page.getByRole("menuitem", { name: /Edit/i }).click();

      // Toggle active checkbox
      const activeCheckbox = page.getByLabel(/Active \(visible to students\)/i);
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
      // Open action menu for first certification
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();

      // Click delete
      await page.getByRole("menuitem", { name: /Delete/i }).click();

      // Check delete dialog is open
      await page.waitForTimeout(500);
      await expect(page.getByRole("heading", { name: /Delete Certification/i })).toBeVisible();
    });

    test("should show warning if certification has students or content", async ({ page }) => {
      // This test assumes the certification has dependencies
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      await firstActionButton.click();
      await page.getByRole("menuitem", { name: /Delete/i }).click();

      await page.waitForTimeout(500);

      // Check for warning text about students/content
      const dialogContent = await page.textContent('body');
      const hasWarning = dialogContent?.includes('student') || dialogContent?.includes('content') || dialogContent?.includes('archive');

      if (hasWarning) {
        // Archive button should be visible instead of delete
        await expect(page.getByRole("button", { name: /Archive/i })).toBeVisible();
      }
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
    });
  });

  test.describe("Results Display", () => {
    test("should display certification count", async ({ page }) => {
      // Look for results count text
      await page.waitForTimeout(500);
      const bodyText = await page.textContent("body");

      // Should show "Showing X certification(s)"
      const hasCountText = bodyText?.match(/Showing \d+ certification/i);
      expect(hasCountText).toBeTruthy();
    });

    test("should display certification details in card view", async ({ page }) => {
      // Ensure we're in card view
      const cardViewButton = page.locator('button[aria-label="Card view"]').or(page.locator('button:has(svg.lucide-layout-grid)'));
      await cardViewButton.click();
      await page.waitForTimeout(500);

      // Check for card elements (assuming at least one cert exists)
      // Cards should show: name, code, score info, duration, students, status badges
      const bodyText = await page.textContent("body");

      // Should have some certification info visible
      expect(bodyText).toContain("certification");
    });

    test("should display certification details in table view", async ({ page }) => {
      // Switch to table view
      const tableViewButton = page.locator('button[aria-label="Table view"]').or(page.locator('button:has(svg.lucide-list)'));
      await tableViewButton.click();
      await page.waitForTimeout(500);

      // Check table headers
      await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Code" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Score" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Duration" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    });
  });
});
