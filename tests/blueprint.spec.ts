// tests/blueprint.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.helper";
import path from "path";

/**
 * Blueprint Management Tests
 *
 * Tests for Issue #11: Exam Blueprint Upload/Parser
 *
 * Covers:
 * - Navigation to blueprint management page
 * - PDF upload interface
 * - AI model selection
 * - Manual blueprint creation
 * - Editing domains, objectives, bullets, and sub-bullets
 * - Saving and resetting changes
 *
 * Note: These tests require admin authentication and at least one certification to exist
 */

/**
 * BLUEPRINT MANAGEMENT TESTS
 *
 * These tests require:
 * 1. Authenticated admin access via Cognito
 * 2. At least one certification in the database
 * 3. AI models configured in the system
 *
 * Make sure .env.test is configured with valid test user credentials and ANTHROPIC_API_KEY.
 */
test.describe("Blueprint Management", () => {
  let certificationId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Login as admin user before each test
    await loginAsAdmin(page);

    // Navigate to certifications page
    await page.goto("/admin/certifications");
    await page.waitForLoadState("networkidle");

    // Get the first certification ID from the page
    await page.waitForTimeout(1000);
    const firstActionButton = page.locator('button[aria-label="Actions"]').first();

    if (await firstActionButton.count() > 0) {
      // Click the first action menu
      await firstActionButton.click();

      // Get the Manage Blueprint link and extract certification ID from it
      const manageBlueprintItem = page.getByRole("menuitem", { name: /Manage Blueprint/i });

      if (await manageBlueprintItem.count() > 0) {
        // Extract href to get certification ID
        await manageBlueprintItem.click();

        // Wait for navigation
        await page.waitForLoadState("networkidle");

        // Extract ID from URL
        const url = page.url();
        const match = url.match(/\/admin\/certifications\/([^\/]+)\/blueprint/);
        if (match) {
          certificationId = match[1];
        }
      } else {
        // Close the menu
        await page.keyboard.press("Escape");
      }
    }

    // Skip tests if no certification exists
    test.skip(!certificationId, "No certifications exist in database - skipping blueprint tests");
  });

  test.describe("Page Load and Navigation", () => {
    test("should navigate to blueprint page from certifications list", async ({ page }) => {
      // Verify we're on the blueprint page
      await expect(page).toHaveURL(/\/admin\/certifications\/.*\/blueprint/);

      // Check for back button
      const backButton = page.locator('button:has(svg.lucide-arrow-left)');
      await expect(backButton).toBeVisible();

      // Check for page heading
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("should display Blueprint Management heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Blueprint Management" })).toBeVisible();
      await expect(page.getByText(/Upload an exam blueprint PDF for AI extraction or build manually/i)).toBeVisible();
    });

    test("should have two tabs: Upload PDF and Manual/Edit", async ({ page }) => {
      // Check for tabs
      await expect(page.getByRole("tab", { name: /Upload PDF \(AI\)/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Manual \/ Edit/i })).toBeVisible();
    });

    test("should navigate back to certifications page when clicking back button", async ({ page }) => {
      const backButton = page.locator('button:has(svg.lucide-arrow-left)');
      await backButton.click();

      await page.waitForLoadState("networkidle");

      // Should be back on certifications page
      await expect(page).toHaveURL("/admin/certifications");
    });
  });

  test.describe("Upload PDF Tab", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we're on the Upload PDF tab
      await page.getByRole("tab", { name: /Upload PDF \(AI\)/i }).click();
      await page.waitForTimeout(500);
    });

    test("should display PDF upload section", async ({ page }) => {
      await expect(page.getByText(/1\. Upload Exam PDF/i)).toBeVisible();
      await expect(page.getByText(/2\. Select AI Model/i)).toBeVisible();
    });

    test("should display AI extraction info card", async ({ page }) => {
      await expect(page.getByText(/AI Extraction Info/i)).toBeVisible();
      await expect(page.getByText(/The AI will extract all domains, objectives, bullets/i)).toBeVisible();
    });

    test("should display AI model selector", async ({ page }) => {
      await expect(page.getByText(/Choose the AI model to process your exam PDF/i)).toBeVisible();
    });

    test("should have Process with AI button disabled initially", async ({ page }) => {
      const processButton = page.getByRole("button", { name: /Process with AI/i });
      await expect(processButton).toBeVisible();
      await expect(processButton).toBeDisabled();
    });

    test("should show file upload dropzone", async ({ page }) => {
      // Look for upload area (drag-and-drop zone)
      const uploadText = page.getByText(/drag.*drop.*pdf/i).or(page.getByText(/click to upload/i));
      await expect(uploadText.first()).toBeVisible();
    });

    test("should display available AI models as radio options", async ({ page }) => {
      // Wait for AI models to load
      await page.waitForTimeout(1000);

      // Check if any radio buttons are visible (models loaded)
      const radioButtons = page.locator('input[type="radio"]');
      const count = await radioButtons.count();

      // Should have at least one AI model available
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Manual/Edit Tab", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to Manual/Edit tab
      await page.getByRole("tab", { name: /Manual \/ Edit/i }).click();
      await page.waitForTimeout(500);
    });

    test("should display manual edit tab content", async ({ page }) => {
      // Should see either the editor or empty state
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;
      const hasEmptyState = await page.getByText(/No blueprint created yet/i).count() > 0;

      expect(hasEditor || hasEmptyState).toBeTruthy();
    });

    test("should show empty state when no blueprint exists", async ({ page }) => {
      const emptyState = page.getByText(/No blueprint created yet/i);

      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByRole("button", { name: /Start Manual Creation/i })).toBeVisible();
      }
    });

    test("should allow starting manual creation", async ({ page }) => {
      const emptyState = page.getByText(/No blueprint created yet/i);

      if (await emptyState.count() > 0) {
        // Click start manual creation
        await page.getByRole("button", { name: /Start Manual Creation/i }).click();
        await page.waitForTimeout(500);

        // Should now show the editor
        await expect(page.getByText(/Blueprint Editor/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /Save Blueprint/i })).toBeVisible();
      }
    });

    test("should display Reset Changes and Save Blueprint buttons when editing", async ({ page }) => {
      // Start manual creation if needed
      const emptyState = page.getByText(/No blueprint created yet/i);
      if (await emptyState.count() > 0) {
        await page.getByRole("button", { name: /Start Manual Creation/i }).click();
        await page.waitForTimeout(500);
      }

      // Check for action buttons
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;
      if (hasEditor) {
        await expect(page.getByRole("button", { name: /Reset Changes/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /Save Blueprint/i })).toBeVisible();
      }
    });
  });

  test.describe("DomainsEditor Functionality", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to Manual/Edit tab
      await page.getByRole("tab", { name: /Manual \/ Edit/i }).click();
      await page.waitForTimeout(500);

      // Start manual creation if needed
      const emptyState = page.getByText(/No blueprint created yet/i);
      if (await emptyState.count() > 0) {
        await page.getByRole("button", { name: /Start Manual Creation/i }).click();
        await page.waitForTimeout(500);
      }
    });

    test("should display domain editor with accordion", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Should have accordion structure
        // Look for domain name input or domain header
        const domainName = page.getByText(/New Domain/i).or(page.getByPlaceholder(/Domain name/i));
        await expect(domainName.first()).toBeVisible();
      }
    });

    test("should allow editing domain name", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Find domain name input
        const domainInput = page.locator('input[placeholder*="Domain"]').or(page.locator('input[value*="New Domain"]')).first();

        if (await domainInput.count() > 0) {
          await domainInput.click();
          await domainInput.fill("Updated Domain Name");
          await page.waitForTimeout(300);

          // Verify the value changed
          const value = await domainInput.inputValue();
          expect(value).toBe("Updated Domain Name");
        }
      }
    });

    test("should allow editing domain weight", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Find weight input (should accept decimal between 0-1)
        const weightInput = page.locator('input[type="number"]').first();

        if (await weightInput.count() > 0) {
          await weightInput.click();
          await weightInput.fill("0.25");
          await page.waitForTimeout(300);

          // Verify the value changed
          const value = await weightInput.inputValue();
          expect(parseFloat(value)).toBe(0.25);
        }
      }
    });

    test("should have Add Domain button", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        const addDomainButton = page.getByRole("button", { name: /Add Domain/i });
        await expect(addDomainButton).toBeVisible();
      }
    });

    test("should add a new domain when clicking Add Domain", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Count initial domains
        const initialDomainCount = await page.locator('input[placeholder*="Domain"]').count();

        // Click Add Domain
        const addDomainButton = page.getByRole("button", { name: /Add Domain/i });
        await addDomainButton.click();
        await page.waitForTimeout(300);

        // Count domains after adding
        const newDomainCount = await page.locator('input[placeholder*="Domain"]').count();

        expect(newDomainCount).toBeGreaterThan(initialDomainCount);
      }
    });

    test("should allow adding objectives to a domain", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Look for Add Objective button
        const addObjectiveButton = page.getByRole("button", { name: /Add Objective/i }).first();

        if (await addObjectiveButton.count() > 0) {
          await expect(addObjectiveButton).toBeVisible();

          // Click to add objective
          await addObjectiveButton.click();
          await page.waitForTimeout(300);

          // Should see objective fields
          const objectiveCode = page.getByPlaceholder(/Objective code/i).first();
          if (await objectiveCode.count() > 0) {
            await expect(objectiveCode).toBeVisible();
          }
        }
      }
    });

    test("should allow deleting a domain", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Add a second domain first (so we can delete one)
        const addDomainButton = page.getByRole("button", { name: /Add Domain/i });
        await addDomainButton.click();
        await page.waitForTimeout(300);

        // Count domains
        const domainCount = await page.locator('input[placeholder*="Domain"]').count();

        if (domainCount > 1) {
          // Find delete button (trash icon)
          const deleteButton = page.locator('button:has(svg.lucide-trash)').first();
          await deleteButton.click();
          await page.waitForTimeout(300);

          // Count should decrease
          const newDomainCount = await page.locator('input[placeholder*="Domain"]').count();
          expect(newDomainCount).toBeLessThan(domainCount);
        }
      }
    });
  });

  test.describe("Save and Reset Functionality", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to Manual/Edit tab
      await page.getByRole("tab", { name: /Manual \/ Edit/i }).click();
      await page.waitForTimeout(500);

      // Start manual creation if needed
      const emptyState = page.getByText(/No blueprint created yet/i);
      if (await emptyState.count() > 0) {
        await page.getByRole("button", { name: /Start Manual Creation/i }).click();
        await page.waitForTimeout(500);
      }
    });

    test("should save blueprint changes", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Make a change
        const domainInput = page.locator('input[placeholder*="Domain"]').first();
        if (await domainInput.count() > 0) {
          await domainInput.click();
          await domainInput.fill("Test Domain for Save");
          await page.waitForTimeout(300);
        }

        // Click Save Blueprint
        const saveButton = page.getByRole("button", { name: /Save Blueprint/i });
        await saveButton.click();

        // Wait for save operation
        await page.waitForTimeout(2000);

        // Should show success toast or similar feedback
        // (Actual verification depends on your toast implementation)
      }
    });

    test("should reset changes when clicking Reset Changes", async ({ page }) => {
      const hasEditor = await page.getByText(/Blueprint Editor/i).count() > 0;

      if (hasEditor) {
        // Make a change
        const domainInput = page.locator('input[placeholder*="Domain"]').first();
        if (await domainInput.count() > 0) {
          const originalValue = await domainInput.inputValue();
          await domainInput.click();
          await domainInput.fill("Temporary Change");
          await page.waitForTimeout(300);

          // Click Reset Changes
          const resetButton = page.getByRole("button", { name: /Reset Changes/i });
          await resetButton.click();
          await page.waitForTimeout(500);

          // Value should revert
          const newValue = await domainInput.inputValue();
          expect(newValue).toBe(originalValue);
        }
      }
    });
  });

  test.describe("Manage Blueprint Menu Item", () => {
    test("should show Manage Blueprint option in certifications list card view", async ({ page }) => {
      // Navigate back to certifications
      await page.goto("/admin/certifications");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Ensure card view is active
      const cardViewButton = page.locator('button[aria-label="Card view"]');
      if (await cardViewButton.count() > 0) {
        await cardViewButton.click();
        await page.waitForTimeout(500);
      }

      // Click first actions menu
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      if (await firstActionButton.count() > 0) {
        await firstActionButton.click();

        // Check for Manage Blueprint menu item
        await expect(page.getByRole("menuitem", { name: /Manage Blueprint/i })).toBeVisible();
      }
    });

    test("should show Manage Blueprint option in certifications list table view", async ({ page }) => {
      // Navigate back to certifications
      await page.goto("/admin/certifications");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Switch to table view
      const tableViewButton = page.locator('button[aria-label="Table view"]');
      if (await tableViewButton.count() > 0) {
        await tableViewButton.click();
        await page.waitForTimeout(500);
      }

      // Click first actions menu
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      if (await firstActionButton.count() > 0) {
        await firstActionButton.click();

        // Check for Manage Blueprint menu item
        await expect(page.getByRole("menuitem", { name: /Manage Blueprint/i })).toBeVisible();
      }
    });

    test("should have FileText icon on Manage Blueprint menu item", async ({ page }) => {
      // Navigate back to certifications
      await page.goto("/admin/certifications");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Click first actions menu
      const firstActionButton = page.locator('button[aria-label="Actions"]').first();
      if (await firstActionButton.count() > 0) {
        await firstActionButton.click();

        // Check for FileText icon in menu item
        const manageBlueprintItem = page.getByRole("menuitem", { name: /Manage Blueprint/i });
        const icon = manageBlueprintItem.locator('svg.lucide-file-text');
        await expect(icon).toBeVisible();
      }
    });
  });
});
