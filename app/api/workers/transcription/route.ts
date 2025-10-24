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

    // Cleanup: Reset any videos stuck in "processing" (from previous worker crashes/timeouts)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckVideos = await prisma.video.findMany({
      where: {
        transcriptionStatus: "processing",
        updatedAt: { lt: fiveMinutesAgo },
      },
    });

    if (stuckVideos.length > 0) {
      console.error(`[Worker] Found ${stuckVideos.length} stuck videos, resetting to pending`);
      await prisma.video.updateMany({
        where: {
          id: { in: stuckVideos.map((v) => v.id) },
        },
        data: {
          transcriptionStatus: "pending",
          transcriptionError: null,
          isProcessed: false,
        },
      });
    }

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

          // Step 1: Transcribe video using Whisper (with 3.5 minute timeout to leave buffer)
          console.error(`[Worker] Transcribing video ${videoId}...`);
          const transcriptionPromise = transcribeVideo(videoId, s3Key);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Transcription timeout - video took too long to process")), 210000) // 3.5 minutes
          );
          const result = await Promise.race([transcriptionPromise, timeoutPromise]) as Awaited<ReturnType<typeof transcribeVideo>>;

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

    // Process jobs for up to 4 minutes (leave 1 minute buffer for Vercel's 5 minute timeout on Pro plan)
    // Note: Hobby plan has 60s limit - this requires Pro plan
    const timeout = 240000; // 4 minutes (240 seconds)

    await new Promise<void>((resolve) => {
      const timer = setTimeout(async () => {
        console.error("[Worker] Timeout reached, pausing worker and waiting for active jobs to complete");
        // Pause the worker to stop accepting new jobs
        await worker.pause();
        // Wait a moment for active job to finish (if any)
        setTimeout(async () => {
          console.error("[Worker] Closing worker after grace period");
          await worker.close();
          resolve();
        }, 5000); // 5 second grace period for active job cleanup
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
