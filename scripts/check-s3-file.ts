/**
 * Check if S3 file exists
 */

import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

async function checkFile(s3Key: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;

  console.log(`🔍 Checking S3 file:`);
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Key: ${s3Key}`);
  console.log();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    console.log("✅ FILE EXISTS!");
    console.log(`   Size: ${(response.ContentLength! / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Type: ${response.ContentType}`);
    console.log(`   Last Modified: ${response.LastModified}`);

    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      console.log("❌ FILE NOT FOUND");
      console.log("   The file does not exist in S3");
    } else {
      console.log("❌ ERROR:", error.message);
    }
    return false;
  }
}

// Check the file
const s3Key = process.argv[2] || "dev/videos/1761275226255-AISF1_09_05_Emerging_Guidance_and_Standards_.mp4";
checkFile(s3Key);
