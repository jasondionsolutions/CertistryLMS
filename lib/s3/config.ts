/**
 * AWS S3 Configuration
 *
 * Centralized S3 client configuration and constants.
 */

import { S3Client } from "@aws-sdk/client-s3";

/**
 * Lazy-initialized S3 client to prevent build-time errors
 */
let _s3Client: S3Client | null = null;

/**
 * Get S3 client instance (lazy initialization)
 */
export function getS3Client(): S3Client {
  if (!_s3Client) {
    const region = process.env.AWS_S3_REGION;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        `Missing required S3 environment variables: AWS_S3_REGION, AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY`
      );
    }

    _s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _s3Client;
}

/**
 * Export s3Client for backward compatibility (lazy wrapper)
 */
export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const client = getS3Client();
    const value = client[prop as keyof S3Client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

/**
 * Get S3 bucket name
 */
export function getS3BucketName(): string {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("Missing required S3 environment variable: AWS_S3_BUCKET_NAME");
  }
  return bucketName;
}

/**
 * Get S3 folder prefix
 */
export function getS3Folder(): string {
  const folder = process.env.AWS_S3_FOLDER;
  if (!folder) {
    throw new Error("Missing required S3 environment variable: AWS_S3_FOLDER");
  }
  return folder;
}

/**
 * Get S3 region
 */
export function getS3Region(): string {
  const region = process.env.AWS_S3_REGION;
  if (!region) {
    throw new Error("Missing required S3 environment variable: AWS_S3_REGION");
  }
  return region;
}

/**
 * S3 bucket name (lazy getter for backward compatibility)
 */
export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * S3 folder prefix (lazy getter for backward compatibility)
 */
export const S3_FOLDER = process.env.AWS_S3_FOLDER || "";

/**
 * S3 region (lazy getter for backward compatibility)
 */
export const S3_REGION = process.env.AWS_S3_REGION || "";

/**
 * Generate S3 key with folder prefix
 */
export function generateS3Key(category: "videos" | "documents" | "thumbnails", fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${getS3Folder()}/${category}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Get public URL for S3 object
 */
export function getS3PublicUrl(s3Key: string): string {
  return `https://${getS3BucketName()}.s3.${getS3Region()}.amazonaws.com/${s3Key}`;
}
