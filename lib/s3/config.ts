/**
 * AWS S3 Configuration
 *
 * Centralized S3 client configuration and constants.
 */

import { S3Client } from "@aws-sdk/client-s3";

/**
 * Validate S3 environment variables
 */
function validateS3Config() {
  const required = [
    "AWS_S3_REGION",
    "AWS_S3_BUCKET_NAME",
    "AWS_S3_ACCESS_KEY_ID",
    "AWS_S3_SECRET_ACCESS_KEY",
    "AWS_S3_FOLDER",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required S3 environment variables: ${missing.join(", ")}`
    );
  }
}

// Validate on import
validateS3Config();

/**
 * S3 Client instance
 */
export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

/**
 * S3 bucket name
 */
export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * S3 folder prefix (dev, staging, prod)
 */
export const S3_FOLDER = process.env.AWS_S3_FOLDER!;

/**
 * S3 region
 */
export const S3_REGION = process.env.AWS_S3_REGION!;

/**
 * Generate S3 key with folder prefix
 */
export function generateS3Key(category: "videos" | "documents" | "thumbnails", fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${S3_FOLDER}/${category}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Get public URL for S3 object
 */
export function getS3PublicUrl(s3Key: string): string {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
}
