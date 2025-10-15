// tests/home.spec.ts
import { test, expect } from "@playwright/test";

test("homepage renders correctly", async ({ page }) => {
  await page.goto("/");

  // Check that the Next.js logo is present
  await expect(page.locator("img[alt='Next.js logo']")).toBeVisible();

  // Check the presence of your main heading or elements you own
  await expect(
    page.getByText("Get started by editing", { exact: false })
  ).toBeVisible();

  // Remove or rewrite button tests that reference Vercel
  const docsLink = page.getByRole("link", { name: /read our docs/i });
  await expect(docsLink).toHaveAttribute("href", /nextjs\.org\/docs/);
});
