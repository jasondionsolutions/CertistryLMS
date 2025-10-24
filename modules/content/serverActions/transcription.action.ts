"use server";

/**
 * Transcription Server Actions
 *
 * RBAC-protected server actions for managing video transcriptions.
 */

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext, NotFoundError, ValidationError } from "@/lib/auth/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Manual transcript upload input schema
 */
const manualTranscriptUploadSchema = z.object({
  videoId: z.string().cuid(),
  vttContent: z.string().min(1, "VTT content is required"),
  updateDescription: z.boolean().optional(),
});

type ManualTranscriptUploadInput = z.infer<typeof manualTranscriptUploadSchema>;

/**
 * Extract plain text from VTT content
 */
function extractTextFromVtt(vttContent: string): string {
  const lines = vttContent.split("\n");
  const textLines: string[] = [];

  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (
      line.trim() &&
      !line.startsWith("WEBVTT") &&
      !line.includes("-->") &&
      !line.match(/^\d+$/)
    ) {
      textLines.push(line.trim());
    }
  }

  return textLines.join(" ");
}

/**
 * Upload VTT file to S3
 */
async function uploadVttToS3(
  vttContent: string,
  videoId: string
): Promise<{ s3Key: string; url: string }> {
  const s3Key = `${process.env.AWS_S3_FOLDER}/captions/${videoId}.vtt`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: vttContent,
    ContentType: "text/vtt",
    CacheControl: "max-age=31536000", // Cache for 1 year
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${s3Key}`;

  return { s3Key, url };
}

/**
 * Upload manual transcript (VTT format)
 *
 * Allows instructors to upload pre-existing VTT transcripts for videos.
 * VTT file is uploaded to S3, and video record is updated.
 */
export const uploadManualTranscript = withPermission("content.update")(
  async (
    user: AuthContext,
    input: ManualTranscriptUploadInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate input
      const validated = manualTranscriptUploadSchema.parse(input);

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id: validated.videoId },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
      }

      // Validate VTT format (basic check)
      if (!validated.vttContent.startsWith("WEBVTT")) {
        throw new ValidationError("Invalid VTT format. File must start with 'WEBVTT'");
      }

      // Upload VTT to S3
      const { s3Key, url } = await uploadVttToS3(validated.vttContent, validated.videoId);

      // Extract plain text transcript
      const transcript = extractTextFromVtt(validated.vttContent);

      // Update video record
      await prisma.video.update({
        where: { id: validated.videoId },
        data: {
          transcript,
          captionsVttUrl: url,
          captionsVttS3Key: s3Key,
          transcriptionStatus: "completed",
          transcriptionError: null,
          isProcessed: true,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("[uploadManualTranscript] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload transcript",
      };
    }
  }
);

/**
 * Get transcription status for a video
 */
export const getTranscriptionStatus = withPermission("content.read")(
  async (
    user: AuthContext,
    videoId: string
  ): Promise<{
    success: boolean;
    data?: {
      status: string;
      error?: string;
      hasTranscript: boolean;
      hasCaptions: boolean;
    };
    error?: string;
  }> => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: {
          transcriptionStatus: true,
          transcriptionError: true,
          transcript: true,
          captionsVttUrl: true,
        },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
      }

      return {
        success: true,
        data: {
          status: video.transcriptionStatus,
          error: video.transcriptionError || undefined,
          hasTranscript: !!video.transcript,
          hasCaptions: !!video.captionsVttUrl,
        },
      };
    } catch (error) {
      console.error("[getTranscriptionStatus] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      };
    }
  }
);

/**
 * Retry failed transcription
 *
 * Re-queues a failed transcription job.
 */
export const retryTranscription = withPermission("content.update")(
  async (
    user: AuthContext,
    videoId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        throw new NotFoundError("Video not found");
      }

      // Reset transcription status
      await prisma.video.update({
        where: { id: videoId },
        data: {
          transcriptionStatus: "pending",
          transcriptionError: null,
          isProcessed: false,
        },
      });

      // Re-queue transcription job
      const { addTranscriptionJob } = await import("@/lib/queue/transcriptionQueue");
      await addTranscriptionJob({
        videoId: video.id,
        s3Key: video.s3Key,
        fileName: video.title,
        generateDescription: false, // Don't regenerate description on retry
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("[retryTranscription] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retry transcription",
      };
    }
  }
);
