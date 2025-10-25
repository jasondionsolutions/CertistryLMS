/**
 * Video Types and Zod Schemas
 *
 * Type definitions and validation schemas for video upload and management.
 */

import { z } from "zod";

/**
 * Supported video MIME types
 */
export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // MOV
  "video/x-msvideo", // AVI
] as const;

/**
 * Video file extensions
 */
export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"] as const;

/**
 * Max file size: 2GB (from requirements)
 */
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

/**
 * Transcription status enum
 */
export const TranscriptionStatus = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "skipped", // User opted out of transcription
]);

export type TranscriptionStatus = z.infer<typeof TranscriptionStatus>;

/**
 * Difficulty level enum
 */
export const DifficultyLevel = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

/**
 * Schema for creating a new video
 */
export const createVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  videoCode: z.string().optional(),
  description: z.string().optional(),
  s3Key: z.string().min(1, "S3 key is required"),
  url: z.string().url("Invalid URL"),
  fileSize: z.number().int().positive().max(MAX_VIDEO_SIZE),
  mimeType: z.enum(SUPPORTED_VIDEO_TYPES),
  duration: z.number().int().positive().optional(),
  difficultyLevel: DifficultyLevel.default("intermediate"),
  allowDownload: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
  thumbnailS3Key: z.string().optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;

/**
 * Schema for updating a video
 */
export const updateVideoSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(255).optional(),
  videoCode: z.string().optional(),
  description: z.string().optional(),
  difficultyLevel: DifficultyLevel.optional(),
  allowDownload: z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
  thumbnailS3Key: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

/**
 * Schema for generating pre-signed upload URL
 */
export const generateUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().int().positive().max(MAX_VIDEO_SIZE, "File too large (max 2GB)"),
  mimeType: z.enum(SUPPORTED_VIDEO_TYPES, {
    message: "Only MP4, MOV, and AVI files are supported",
  }),
});

export type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlSchema>;

/**
 * Response type for pre-signed URL generation
 */
export interface PresignedUploadResponse {
  uploadUrl: string; // Pre-signed URL for client-side upload
  s3Key: string; // S3 object key
  publicUrl: string; // Public URL after upload completes
}

/**
 * Schema for video upload completion
 * Called after client uploads to S3 to save metadata
 */
export const completeVideoUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  videoCode: z.string().optional(),
  description: z.string().optional(),
  s3Key: z.string().min(1, "S3 key is required"),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(SUPPORTED_VIDEO_TYPES),
  difficultyLevel: DifficultyLevel.default("intermediate"),
  allowDownload: z.boolean().default(false),
  enableTranscription: z.boolean().default(true),
  generateAiDescription: z.boolean().default(true),
});

export type CompleteVideoUploadInput = z.infer<typeof completeVideoUploadSchema>;

/**
 * Schema for deleting a video
 */
export const deleteVideoSchema = z.object({
  id: z.string().cuid(),
});

export type DeleteVideoInput = z.infer<typeof deleteVideoSchema>;

/**
 * Video query/filter schema
 */
export const videoQuerySchema = z.object({
  search: z.string().optional(),
  difficultyLevel: DifficultyLevel.optional(),
  transcriptionStatus: TranscriptionStatus.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type VideoQueryInput = z.infer<typeof videoQuerySchema>;

/**
 * Video with relations (for display)
 */
export interface VideoWithRelations {
  id: string;
  title: string;
  videoCode: string | null;
  description: string | null;
  s3Key: string;
  url: string;
  thumbnailUrl: string | null;
  transcript: string | null;
  transcriptionStatus: TranscriptionStatus;
  transcriptionError: string | null;
  aiDescriptionGenerated: boolean;
  duration: number | null;
  fileSize: number | null;
  mimeType: string | null;
  difficultyLevel: DifficultyLevel;
  uploadedBy: string | null;
  allowDownload: boolean;
  isProcessed: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contentMappings: Array<{
    id: string;
    objectiveId: string | null;
    bulletId: string | null;
    subBulletId: string | null;
    isPrimary: boolean;
    confidence: number;
    mappingSource: string;
    objective?: {
      id: string;
      code: string;
      description: string;
      domain: {
        name: string;
      };
    };
    bullet?: {
      id: string;
      text: string;
      objective: {
        id: string;
        code: string;
        description: string;
        domain: {
          name: string;
        };
      };
    };
    subBullet?: {
      id: string;
      text: string;
      bullet: {
        id: string;
        text: string;
        objective: {
          id: string;
          code: string;
          description: string;
          domain: {
            name: string;
          };
        };
      };
    };
  }>;
}
