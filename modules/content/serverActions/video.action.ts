"use server";

/**
 * Video Upload Server Actions
 *
 * RBAC-protected server actions for video management.
 */

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext, NotFoundError, ValidationError } from "@/lib/auth/types";
import { generatePresignedUploadUrl } from "@/lib/s3/presignedUrl";
import { generateDefaultThumbnailUrl } from "@/lib/s3/thumbnail";
import { addTranscriptionJob } from "@/lib/queue/transcriptionQueue";
import type {
  GenerateUploadUrlInput,
  PresignedUploadResponse,
  CompleteVideoUploadInput,
  UpdateVideoInput,
  DeleteVideoInput,
  VideoQueryInput,
  VideoWithRelations,
} from "../types/video.types";
import {
  generateUploadUrlSchema,
  completeVideoUploadSchema,
  updateVideoSchema,
  deleteVideoSchema,
  videoQuerySchema,
} from "../types/video.types";

/**
 * Generate pre-signed URL for video upload
 *
 * Step 1 of upload process - client gets URL to upload directly to S3
 */
export const generateVideoUploadUrl = withPermission("content.create")(
  async (
    user: AuthContext,
    input: GenerateUploadUrlInput
  ): Promise<{ success: boolean; data?: PresignedUploadResponse; error?: string }> => {
    try {
      // Validate input
      const validated = generateUploadUrlSchema.parse(input);

      // Generate pre-signed URL
      const uploadData = await generatePresignedUploadUrl(
        validated.fileName,
        validated.mimeType,
        "videos"
      );

      return {
        success: true,
        data: uploadData,
      };
    } catch (error) {
      console.error("[generateVideoUploadUrl] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate upload URL",
      };
    }
  }
);

/**
 * Complete video upload - save metadata to database
 *
 * Step 2 of upload process - after client uploads to S3, save video record
 */
export const completeVideoUpload = withPermission("content.create")(
  async (
    user: AuthContext,
    input: CompleteVideoUploadInput
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> => {
    try {
      // Validate input
      const validated = completeVideoUploadSchema.parse(input);

      // Generate S3 public URL from key
      const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${validated.s3Key}`;

      // Generate default thumbnail
      const thumbnailUrl = generateDefaultThumbnailUrl(validated.title);

      // Determine transcription status based on user preference
      const transcriptionStatus = validated.enableTranscription ? "pending" : "skipped";

      // Create video record
      const video = await prisma.video.create({
        data: {
          title: validated.title,
          videoCode: validated.videoCode,
          description: validated.description,
          s3Key: validated.s3Key,
          url,
          fileSize: validated.fileSize,
          mimeType: validated.mimeType,
          difficultyLevel: validated.difficultyLevel,
          allowDownload: validated.allowDownload,
          thumbnailUrl,
          uploadedBy: user.userId,
          transcriptionStatus,
          aiDescriptionGenerated: false, // Will be set to true when AI generates description
          isProcessed: !validated.enableTranscription, // If no transcription, mark as processed
          isActive: true,
        },
      });

      // Queue transcription job only if enabled
      if (validated.enableTranscription) {
        await addTranscriptionJob({
          videoId: video.id,
          s3Key: video.s3Key,
          fileName: validated.title,
          generateDescription: validated.generateAiDescription,
        });
      }

      return {
        success: true,
        data: { id: video.id },
      };
    } catch (error) {
      console.error("[completeVideoUpload] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save video",
      };
    }
  }
);

/**
 * Update video metadata
 */
export const updateVideo = withPermission("content.update")(
  async (
    user: AuthContext,
    input: UpdateVideoInput
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> => {
    try {
      // Validate input
      const validated = updateVideoSchema.parse(input);

      // Check if video exists
      const existingVideo = await prisma.video.findUnique({
        where: { id: validated.id },
      });

      if (!existingVideo) {
        throw new NotFoundError("Video not found");
      }

      // Update video
      const { id, ...updateData } = validated;
      const video = await prisma.video.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: { id: video.id },
      };
    } catch (error) {
      console.error("[updateVideo] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update video",
      };
    }
  }
);

/**
 * Delete video (soft delete by setting isActive = false)
 *
 * TODO: Implement S3 cleanup (delete video file and thumbnail from S3)
 */
export const deleteVideo = withPermission("content.delete")(
  async (
    user: AuthContext,
    input: DeleteVideoInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate input
      const validated = deleteVideoSchema.parse(input);

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id: validated.id },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
      }

      // Soft delete (set isActive = false)
      await prisma.video.update({
        where: { id: validated.id },
        data: { isActive: false },
      });

      // TODO: Delete from S3
      // - Delete video file: s3Client.send(new DeleteObjectCommand({ Bucket, Key: video.s3Key }))
      // - Delete thumbnail if custom: s3Client.send(new DeleteObjectCommand({ Bucket, Key: video.thumbnailS3Key }))

      return {
        success: true,
      };
    } catch (error) {
      console.error("[deleteVideo] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete video",
      };
    }
  }
);

/**
 * Get single video with relations
 */
export const getVideo = withPermission("content.read")(
  async (
    user: AuthContext,
    videoId: string
  ): Promise<{ success: boolean; data?: VideoWithRelations; error?: string }> => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          objectiveMappings: {
            include: {
              objective: {
                include: {
                  domain: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
      }

      return {
        success: true,
        data: video as VideoWithRelations,
      };
    } catch (error) {
      console.error("[getVideo] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch video",
      };
    }
  }
);

/**
 * List videos with pagination and filtering
 */
export const listVideos = withPermission("content.read")(
  async (
    user: AuthContext,
    input: VideoQueryInput = { limit: 50, offset: 0 }
  ): Promise<{
    success: boolean;
    data?: { videos: VideoWithRelations[]; total: number };
    error?: string;
  }> => {
    try {
      // Validate input
      const validated = videoQuerySchema.parse(input);

      // Build where clause
      const where: any = {};

      if (validated.search) {
        where.OR = [
          { title: { contains: validated.search, mode: "insensitive" } },
          { description: { contains: validated.search, mode: "insensitive" } },
          { transcript: { contains: validated.search, mode: "insensitive" } },
        ];
      }

      if (validated.difficultyLevel) {
        where.difficultyLevel = validated.difficultyLevel;
      }

      if (validated.transcriptionStatus) {
        where.transcriptionStatus = validated.transcriptionStatus;
      }

      if (validated.isActive !== undefined) {
        where.isActive = validated.isActive;
      }

      // Get total count
      const total = await prisma.video.count({ where });

      // Get videos with pagination
      const videos = await prisma.video.findMany({
        where,
        include: {
          objectiveMappings: {
            include: {
              objective: {
                include: {
                  domain: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: validated.limit,
        skip: validated.offset,
      });

      return {
        success: true,
        data: {
          videos: videos as VideoWithRelations[],
          total,
        },
      };
    } catch (error) {
      console.error("[listVideos] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch videos",
      };
    }
  }
);
