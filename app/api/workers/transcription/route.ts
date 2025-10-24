/**
 * Transcription Worker API Route
 *
 * Processes video transcription jobs from BullMQ queue.
 * Triggered by Vercel cron job every 2 minutes.
 */

import { NextResponse } from "next/server";
import { Worker, Job } from "bullmq";
import { redisConnection } from "@/lib/queue/config";
import { TranscriptionJobData } from "@/lib/queue/transcriptionQueue";
import { transcribeVideo } from "@/modules/content/services/whisper.service";
import { generateVideoDescription } from "@/modules/content/services/aiDescription.service";
import { prisma } from "@/lib/prisma";

/**
 * GET handler - Process pending transcription jobs
 *
 * This endpoint is called by Vercel cron to process jobs from the queue.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[Worker] Transcription worker triggered");

    // Create worker instance
    const worker = new Worker<TranscriptionJobData>(
      "video-transcription",
      async (job: Job<TranscriptionJobData>) => {
        const { videoId, s3Key, fileName, generateDescription } = job.data;

        console.error(`[Worker] Processing job for video ${videoId}`);

        try {
          // Update status to processing
          await prisma.video.update({
            where: { id: videoId },
            data: {
              transcriptionStatus: "processing",
              transcriptionError: null,
            },
          });

          // Step 1: Transcribe video using Whisper
          console.error(`[Worker] Transcribing video ${videoId}...`);
          const result = await transcribeVideo(s3Key, videoId);

          // Step 2: Generate AI description if requested
          let aiDescription: string | undefined;
          if (generateDescription && result.transcript) {
            console.error(`[Worker] Generating AI description for video ${videoId}...`);
            try {
              aiDescription = await generateVideoDescription(result.transcript, fileName, 100);
            } catch (error) {
              console.error(`[Worker] AI description generation failed:`, error);
              // Don't fail the entire job if description fails
              aiDescription = undefined;
            }
          }

          // Step 3: Update video record with transcription results
          await prisma.video.update({
            where: { id: videoId },
            data: {
              transcript: result.transcript,
              captionsVttUrl: result.vttUrl,
              captionsVttS3Key: result.vttS3Key,
              transcriptionStatus: "completed",
              transcriptionError: null,
              isProcessed: true,
              // Update description only if AI generation succeeded and was requested
              ...(aiDescription && {
                description: aiDescription,
                aiDescriptionGenerated: true,
              }),
            },
          });

          console.error(`[Worker] Successfully processed video ${videoId}`);

          return { success: true, videoId };
        } catch (error) {
          console.error(`[Worker] Transcription failed for video ${videoId}:`, error);

          // Update video record with error
          await prisma.video.update({
            where: { id: videoId },
            data: {
              transcriptionStatus: "failed",
              transcriptionError: error instanceof Error ? error.message : "Unknown error",
              isProcessed: true, // Mark as processed even if failed (won't retry automatically)
            },
          });

          // Re-throw to mark job as failed in BullMQ
          throw error;
        }
      },
      {
        connection: redisConnection,
        // Process jobs one at a time (Vercel function can only handle one job per invocation)
        concurrency: 1,
        // Don't remove completed jobs immediately (keep for debugging)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Track processed jobs
    let processedCount = 0;

    // Event handlers for logging
    worker.on("completed", (job) => {
      processedCount++;
      console.error(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err);
    });

    // Process jobs for up to 50 seconds (leave 10 seconds buffer for Vercel's 60s timeout)
    const timeout = 50000; // 50 seconds

    await new Promise<void>((resolve) => {
      const timer = setTimeout(async () => {
        console.error("[Worker] Timeout reached, closing worker");
        await worker.close();
        resolve();
      }, timeout);

      // Also listen for when worker becomes idle
      worker.on("drained", async () => {
        console.error("[Worker] Queue drained, closing worker");
        clearTimeout(timer);
        await worker.close();
        resolve();
      });
    });

    console.error(`[Worker] Processed ${processedCount} job(s)`);

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} transcription job(s)`,
      processedCount,
    });
  } catch (error) {
    console.error("[Worker] Worker error:", error);
    return NextResponse.json(
      {
        error: "Worker failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
