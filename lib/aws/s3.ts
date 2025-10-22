// lib/aws/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * AWS S3 Utility Functions
 *
 * Provides secure file upload, download, and management for CertistryLMS.
 *
 * Features:
 * - File uploads with automatic path generation
 * - Pre-signed URLs for secure downloads
 * - File replacement with automatic cleanup
 * - Orphan file detection and cleanup
 */

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const FOLDER = process.env.AWS_S3_FOLDER || "dev";

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  video: parseInt(process.env.AWS_S3_MAX_FILE_SIZE_VIDEO || "1073741824"), // 1 GB
  pdf: parseInt(process.env.AWS_S3_MAX_FILE_SIZE_PDF || "52428800"), // 50 MB
  image: parseInt(process.env.AWS_S3_MAX_FILE_SIZE_IMAGE || "10485760"), // 10 MB
};

/**
 * File type categories
 */
export type FileCategory = "videos" | "pdfs" | "images" | "thumbnails";

/**
 * Generate S3 key (path) for a file
 */
function generateS3Key(
  category: FileCategory,
  fileName: string,
  subfolder?: string
): string {
  const sanitizedFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

  if (subfolder) {
    return `${FOLDER}/${category}/${subfolder}/${uniqueFileName}`;
  }

  return `${FOLDER}/${category}/${uniqueFileName}`;
}

/**
 * Validate file size based on type
 */
function validateFileSize(file: Buffer, fileType: "video" | "pdf" | "image") {
  const maxSize = FILE_SIZE_LIMITS[fileType];
  if (file.length > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
    const fileSizeMB = (file.length / 1024 / 1024).toFixed(2);
    throw new Error(
      `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB) for ${fileType} files`
    );
  }
}

/**
 * Upload file to S3
 *
 * @param file - File buffer
 * @param fileName - Original file name
 * @param category - File category (videos, pdfs, images, thumbnails)
 * @param contentType - MIME type
 * @param subfolder - Optional subfolder path
 * @returns Object with key and URL
 *
 * @example
 * ```typescript
 * const { key, url } = await uploadFile(
 *   fileBuffer,
 *   "intro-video.mp4",
 *   "videos",
 *   "video/mp4",
 *   "security-plus/module-1"
 * );
 * ```
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  category: FileCategory,
  contentType: string,
  subfolder?: string
): Promise<{ key: string; url: string }> {
  // Validate file size based on category
  if (category === "videos") {
    validateFileSize(file, "video");
  } else if (category === "pdfs") {
    validateFileSize(file, "pdf");
  } else if (category === "images" || category === "thumbnails") {
    validateFileSize(file, "image");
  }

  const key = generateS3Key(category, fileName, subfolder);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
    Metadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
      category,
    },
  });

  try {
    await s3Client.send(command);

    // Generate URL (will need pre-signed URL for access)
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;

    return { key, url };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Get pre-signed URL for downloading file
 *
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed URL
 *
 * @example
 * ```typescript
 * const url = await getPresignedDownloadUrl("dev/videos/intro.mp4", 7200);
 * // User can access this URL for 2 hours
 * ```
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

/**
 * Get pre-signed URL for uploading file directly from browser
 *
 * @param key - S3 object key
 * @param contentType - MIME type
 * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns Pre-signed upload URL
 *
 * @example
 * ```typescript
 * const uploadUrl = await getPresignedUploadUrl(
 *   "dev/videos/new-video.mp4",
 *   "video/mp4"
 * );
 * // Client can PUT file directly to this URL
 * ```
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating pre-signed upload URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

/**
 * Delete file from S3
 *
 * @param key - S3 object key
 * @returns Success status
 *
 * @example
 * ```typescript
 * await deleteFile("dev/videos/old-video.mp4");
 * ```
 */
export async function deleteFile(key: string): Promise<{ success: boolean }> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}

/**
 * Replace file with automatic cleanup of old file
 *
 * This ensures no orphan files are left in S3.
 *
 * @param oldKey - S3 key of file to replace
 * @param newFile - New file buffer
 * @param newFileName - New file name
 * @param category - File category
 * @param contentType - MIME type
 * @param subfolder - Optional subfolder
 * @returns Object with new key and URL
 *
 * @example
 * ```typescript
 * const { key, url } = await replaceFile(
 *   "dev/thumbnails/old-thumb.jpg",
 *   newFileBuffer,
 *   "new-thumb.jpg",
 *   "thumbnails",
 *   "image/jpeg"
 * );
 * // Old file automatically deleted after new file uploaded
 * ```
 */
export async function replaceFile(
  oldKey: string,
  newFile: Buffer,
  newFileName: string,
  category: FileCategory,
  contentType: string,
  subfolder?: string
): Promise<{ key: string; url: string }> {
  try {
    // Upload new file first
    const { key, url } = await uploadFile(
      newFile,
      newFileName,
      category,
      contentType,
      subfolder
    );

    // Only delete old file after new one successfully uploaded
    try {
      await deleteFile(oldKey);
    } catch (deleteError) {
      console.warn(`Warning: Failed to delete old file ${oldKey}:`, deleteError);
      // Don't throw - new file is uploaded successfully
    }

    return { key, url };
  } catch (error) {
    console.error("Error replacing file:", error);
    throw new Error("Failed to replace file");
  }
}

/**
 * Check if file exists in S3
 *
 * @param key - S3 object key
 * @returns Boolean indicating if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all files in a folder
 *
 * @param prefix - Folder prefix (e.g., "dev/videos/")
 * @param maxKeys - Maximum number of files to return
 * @returns Array of file keys
 *
 * @example
 * ```typescript
 * const videoFiles = await listFiles("dev/videos/", 100);
 * ```
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 1000
): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  try {
    const response = await s3Client.send(command);
    return response.Contents?.map((obj) => obj.Key!) || [];
  } catch (error) {
    console.error("Error listing files from S3:", error);
    throw new Error("Failed to list files from S3");
  }
}

/**
 * Get file metadata
 *
 * @param key - S3 object key
 * @returns File metadata
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  metadata: Record<string, string>;
}> {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || "application/octet-stream",
      metadata: response.Metadata || {},
    };
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw new Error("Failed to get file metadata");
  }
}
