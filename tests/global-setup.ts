// tests/global-setup.ts
import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup for Playwright tests
 *
 * This runs once before all tests and creates authenticated sessions
 * that can be reused across tests.
 *
 * For now, we'll skip authentication setup since Cognito requires
 * real user accounts. Tests can run unauthenticated or be manually
 * configured with real credentials.
 */

async function globalSetup(config: FullConfig) {
  console.log("🔧 Running global test setup...");

  // Check if test users are configured
  const hasTestUsers =
    process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD;

  if (!hasTestUsers) {
    console.log(
      "⚠️  Test user credentials not configured. Skipping authentication setup."
    );
    console.log(
      "   To enable authenticated tests, create .env.test with test credentials."
    );
    console.log("   See tests/README.md for setup instructions.");
    return;
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
