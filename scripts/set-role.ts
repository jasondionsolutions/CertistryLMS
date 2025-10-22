// scripts/set-role.ts
/**
 * Quick script to set user role using AWS SDK
 * This bypasses the Cognito Console limitation
 */

import { updateCognitoUserRole } from "../lib/auth/cognito.client";

async function main() {
  const username = "jason@certistry.com"; // Change this to your username
  const role = "admin"; // Change to: user, admin, or instructor

  console.log(`Setting role for: ${username}`);
  console.log(`Role: ${role}`);

  try {
    const result = await updateCognitoUserRole(username, role);
    console.log("✅ Success!", result);
    console.log("\nNow sign out and sign in again to see the changes.");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
