/**
 * S3 Pre-signed URL Generation
 *
 * Generate pre-signed URLs for secure client-side uploads to S3.
 */

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME, generateS3Key, getS3PublicUrl } from "./config";
import type { PresignedUploadResponse } from "@/modules/content/types/video.types";

/**
 * Generate pre-signed URL for video upload
 *
 * @param fileName - Original file name
 * @param mimeType - File MIME type
 * @param category - S3 folder category
 * @returns Pre-signed URL, S3 key, and public URL
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  mimeType: string,
  category: "videos" | "documents" | "thumbnails" = "videos"
): Promise<PresignedUploadResponse> {
  // Generate unique S3 key
  const s3Key = generateS3Key(category, fileName);

  // Create PutObject command
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType,
    // ACL: "public-read", // Make file publicly readable (optional - depends on bucket policy)
  });

  // Generate pre-signed URL (valid for 15 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  // Generate public URL
  const publicUrl = getS3PublicUrl(s3Key);

  return {
    uploadUrl,
    s3Key,
    publicUrl,
  };
}

/**
 * Upload file directly to S3 (server-side)
 * Used for thumbnail generation or server-side uploads
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  mimeType: string,
  category: "videos" | "documents" | "thumbnails" = "videos"
): Promise<{ s3Key: string; url: string }> {
  const s3Key = generateS3Key(category, fileName);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return {
    s3Key,
    url: getS3PublicUrl(s3Key),
  };
}
