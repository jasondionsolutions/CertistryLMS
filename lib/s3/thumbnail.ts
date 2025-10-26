/**
 * Video Thumbnail Generation
 *
 * Utilities for generating and managing video thumbnails.
 */

import { uploadToS3 } from "./presignedUrl";

/**
 * Generate default thumbnail URL
 * Uses placeholder service for now - can be enhanced with actual video frame extraction
 *
 * @param videoTitle - Video title for placeholder text
 * @returns Default thumbnail URL
 */
export function generateDefaultThumbnailUrl(videoTitle: string): string {
  // Use a placeholder service for default thumbnails
  // Format: 1280x720 (16:9 aspect ratio, standard for video)
  const encodedTitle = encodeURIComponent(videoTitle.slice(0, 50));
  return `https://placehold.co/1280x720/1e40af/white?text=${encodedTitle}&font=roboto`;
}

/**
 * Upload custom thumbnail to S3
 *
 * @param thumbnailFile - Thumbnail image buffer
 * @param fileName - Original file name
 * @param mimeType - Image MIME type (image/jpeg, image/png)
 * @returns S3 key and public URL
 */
export async function uploadCustomThumbnail(
  thumbnailFile: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ s3Key: string; url: string }> {
  return await uploadToS3(thumbnailFile, fileName, mimeType, "thumbnails");
}

/**
 * Supported thumbnail image types
 */
export const SUPPORTED_THUMBNAIL_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Max thumbnail size: 10MB
 */
export const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate thumbnail file
 *
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateThumbnailFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_THUMBNAIL_SIZE) {
    return "Thumbnail must be less than 10MB";
  }

  // Check file type
  const validTypes: string[] = [...SUPPORTED_THUMBNAIL_TYPES];
  if (!validTypes.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are supported";
  }

  return null;
}

/**
 * TODO: Future enhancement - Extract frame from video using ffmpeg or AWS Lambda
 *
 * This would involve:
 * 1. Download video from S3
 * 2. Extract frame at specific timestamp (e.g., 5 seconds in)
 * 3. Resize to 1280x720
 * 4. Upload to S3 thumbnails folder
 * 5. Return thumbnail URL
 *
 * Implementation options:
 * - AWS Lambda with ffmpeg layer
 * - Server-side ffmpeg (if self-hosted)
 * - Third-party service (e.g., Cloudinary, Mux)
 */
export async function generateVideoFrameThumbnail(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  videoS3Key: string
): Promise<{ s3Key: string; url: string }> {
  throw new Error("Video frame extraction not yet implemented");
  // Future implementation here
}
