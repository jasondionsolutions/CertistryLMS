/**
 * Video Transcription Queue
 *
 * BullMQ queue for processing video transcriptions asynchronously.
 * Jobs are added when videos are uploaded and processed by a worker.
 */

import { Queue } from "bullmq";
import { defaultQueueOptions } from "./config";

/**
 * Transcription job data interface
 */
export interface TranscriptionJobData {
  videoId: string;
  s3Key: string;
  fileName: string;
  generateDescription: boolean; // Whether to generate AI description after transcription
}

/**
 * Transcription queue instance
 * Singleton pattern to avoid creating multiple queue instances
 */
let transcriptionQueue: Queue<TranscriptionJobData> | null = null;

/**
 * Get or create the transcription queue instance
 */
export function getTranscriptionQueue(): Queue<TranscriptionJobData> {
  if (!transcriptionQueue) {
    transcriptionQueue = new Queue<TranscriptionJobData>(
      "video-transcription",
      defaultQueueOptions
    );
  }

  return transcriptionQueue;
}

/**
 * Add a video transcription job to the queue
 */
export async function addTranscriptionJob(data: TranscriptionJobData) {
  const queue = getTranscriptionQueue();

  return await queue.add("transcribe-video", data, {
    // Custom options per job
    jobId: `transcribe-${data.videoId}`, // Prevents duplicate jobs for same video
  });
}

/**
 * Get job status by video ID
 */
export async function getTranscriptionJobStatus(videoId: string) {
  const queue = getTranscriptionQueue();
  const job = await queue.getJob(`transcribe-${videoId}`);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    state: await job.getState(),
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
  };
}

/**
 * Close queue connection (for graceful shutdown)
 */
export async function closeTranscriptionQueue() {
  if (transcriptionQueue) {
    await transcriptionQueue.close();
    transcriptionQueue = null;
  }
}
