// scripts/setup-s3-folders.ts
/**
 * S3 Folder Setup Script
 *
 * This script:
 * 1. Tests S3 connection with your credentials
 * 2. Creates the folder structure in your S3 bucket
 * 3. Verifies bucket configuration
 *
 * Run with: npx tsx scripts/setup-s3-folders.ts
 */

import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

// Validate required environment variables
const requiredEnvVars = [
  "AWS_S3_REGION",
  "AWS_S3_BUCKET_NAME",
  "AWS_S3_ACCESS_KEY_ID",
  "AWS_S3_SECRET_ACCESS_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error("\nPlease add this to your .env file.");
    console.error("See Documentation/AWS_S3_Setup_Guide.MD for setup instructions.\n");
    process.exit(1);
  }
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const ENVIRONMENTS = ["dev", "staging", "prod"];
const CATEGORIES = ["videos", "pdfs", "images", "thumbnails"];

/**
 * Test S3 connection by checking bucket access
 * (Doesn't require s3:ListAllMyBuckets permission)
 */
async function testConnection(): Promise<boolean> {
  try {
    console.log("🔍 Testing S3 connection and bucket access...");
    const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await s3Client.send(command);

    console.log(`✅ Successfully connected to AWS S3`);
    console.log(`✅ Bucket '${BUCKET_NAME}' found and accessible\n`);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to S3");

    if (error instanceof Error) {
      if (error.name === "InvalidAccessKeyId") {
        console.error("\n🔑 Invalid Access Key ID");
        console.error("Please check AWS_S3_ACCESS_KEY_ID in your .env file\n");
      } else if (error.name === "SignatureDoesNotMatch") {
        console.error("\n🔒 Invalid Secret Access Key");
        console.error("Please check AWS_S3_SECRET_ACCESS_KEY in your .env file\n");
      } else if (error.name === "NotFound" || error.name === "NoSuchBucket") {
        console.error(`\n📦 Bucket '${BUCKET_NAME}' not found`);
        console.error("Please create the bucket in AWS S3 Console");
        console.error("or update AWS_S3_BUCKET_NAME in your .env file\n");
      } else if (error.name === "Forbidden" || error.name === "AccessDenied") {
        console.error(`\n🔒 Access denied to bucket '${BUCKET_NAME}'`);
        console.error("Your IAM user doesn't have permission to access this bucket.");
        console.error("Please verify the IAM policy is attached correctly.\n");
      } else {
        console.error(`\nError: ${error.message}\n`);
      }
    }

    return false;
  }
}


/**
 * Create folder structure with placeholder files
 */
async function createFolderStructure(): Promise<void> {
  console.log("📁 Creating folder structure...\n");

  const placeholderContent = "This is a placeholder file created by the setup script.";
  let successCount = 0;
  let failureCount = 0;

  for (const env of ENVIRONMENTS) {
    console.log(`📂 Environment: ${env}`);

    for (const category of CATEGORIES) {
      const key = `${env}/${category}/.placeholder`;

      try {
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: placeholderContent,
          ContentType: "text/plain",
          Metadata: {
            purpose: "folder-structure-placeholder",
            createdBy: "setup-script",
            createdAt: new Date().toISOString(),
          },
        });

        await s3Client.send(command);
        console.log(`  ✅ ${key}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to create ${key}`);
        if (error instanceof Error) {
          console.error(`     Error: ${error.message}`);
        }
        failureCount++;
      }
    }

    console.log(); // Blank line between environments
  }

  console.log("📊 Summary:");
  console.log(`  ✅ Created: ${successCount} folders`);
  if (failureCount > 0) {
    console.log(`  ❌ Failed: ${failureCount} folders`);
  }
  console.log();
}

/**
 * Display folder structure
 */
function displayFolderStructure(): void {
  console.log("📋 Your S3 bucket structure:\n");
  console.log(`${BUCKET_NAME}/`);

  for (const env of ENVIRONMENTS) {
    console.log(`├── ${env}/`);

    CATEGORIES.forEach((category, index) => {
      const isLast = index === CATEGORIES.length - 1;
      const prefix = isLast ? "└──" : "├──";
      console.log(`│   ${prefix} ${category}/`);
    });

    console.log("│");
  }

  console.log();
}

/**
 * Main execution
 */
async function main() {
  console.log("\n🚀 CertistryLMS S3 Setup Script\n");
  console.log("=".repeat(50) + "\n");

  // Step 1: Test connection and bucket access
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Step 2: Create folder structure
  await createFolderStructure();

  // Step 3: Display structure
  displayFolderStructure();

  // Success message
  console.log("=".repeat(50));
  console.log("\n✅ S3 setup complete!\n");
  console.log("Next steps:");
  console.log("  1. Visit AWS S3 Console: https://s3.console.aws.amazon.com/s3/buckets/" + BUCKET_NAME);
  console.log("  2. Verify the folder structure was created");
  console.log("  3. You can now upload files using the server actions\n");
  console.log("💡 Tip: You can safely delete the .placeholder files later");
  console.log("    (they're only needed to create the folder structure)\n");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
