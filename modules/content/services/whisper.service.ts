/**
 * OpenAI Whisper Service (Vercel-Compatible - No FFmpeg)
 *
 * Transcribes videos using OpenAI Whisper API.
 * Simplified version that sends video files directly to Whisper.
 * No audio extraction needed - Whisper accepts video files.
 */

import OpenAI from "openai";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";

// S3 configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

// Whisper API limits
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB max for Whisper API

// Lazy OpenAI client initialization (prevents build-time errors)
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface TranscriptionResult {
  transcript: string; // Plain text transcript
  vttUrl: string; // S3 URL to VTT captions file
  vttS3Key: string; // S3 key for VTT file
}

/**
 * Transcribe a video using OpenAI Whisper API
 *
 * @param videoId - Video ID for tracking
 * @param s3Key - S3 key of the video file
 * @returns Transcription result with plain text and VTT captions
 */
export async function transcribeVideo(videoId: string, s3Key: string): Promise<TranscriptionResult> {
  let videoPath: string | null = null;

  try {
    console.log("[Whisper] Starting transcription for video", videoId);

    // Step 1: Download video from S3
    console.log("[Whisper] Downloading video from S3...");
    videoPath = await downloadVideoFromS3(s3Key);

    // Step 2: Check file size
    const fileSize = getFileSize(videoPath);
    console.log(`[Whisper] Video file size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Video file too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). ` +
          `Maximum supported size is 25MB. Please compress the video before uploading.`
      );
    }

    // Step 3: Transcribe video file directly (Whisper accepts video files)
    console.log("[Whisper] Sending to Whisper API for transcription...");
    const transcript = await transcribeVideoFile(videoPath);
    const vtt = await transcribeVideoFileAsVTT(videoPath);

    // Step 4: Upload VTT to S3
    console.log("[Whisper] Uploading VTT captions to S3...");
    const { s3Key: vttS3Key, url: vttUrl } = await uploadVttToS3(vtt, videoId);

    console.log("[Whisper] Transcription complete!");

    return {
      transcript,
      vttUrl,
      vttS3Key,
    };
  } catch (error) {
    console.error("[Whisper] Transcription failed:", error);
    throw error;
  } finally {
    // Cleanup temp files
    if (videoPath) {
      console.log("[Whisper] Cleaning up temp files...");
      cleanupTempFiles([videoPath]);
    }
  }
}

/**
 * Download video from S3 to temporary file
 */
async function downloadVideoFromS3(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const body = response.Body as Readable;

  // Create temp file
  const tempDir = os.tmpdir();
  const fileName = path.basename(s3Key);
  const tempFilePath = path.join(tempDir, `download-${Date.now()}-${fileName}`);

  // Write stream to file
  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(tempFilePath);
    body.pipe(writeStream);
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  return tempFilePath;
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Transcribe video file and return plain text
 */
async function transcribeVideoFile(videoPath: string): Promise<string> {
  const openai = getOpenAIClient();
  const videoStream = fs.createReadStream(videoPath);

  const response = await openai.audio.transcriptions.create({
    file: videoStream,
    model: "whisper-1",
    response_format: "text",
  });

  return response.trim();
}

/**
 * Transcribe video file and return VTT format (with timestamps)
 */
async function transcribeVideoFileAsVTT(videoPath: string): Promise<string> {
  const openai = getOpenAIClient();
  const videoStream = fs.createReadStream(videoPath);

  const response = await openai.audio.transcriptions.create({
    file: videoStream,
    model: "whisper-1",
    response_format: "vtt",
  });

  return response;
}

/**
 * Upload VTT file to S3
 */
async function uploadVttToS3(vttContent: string, videoId: string): Promise<{ s3Key: string; url: string }> {
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
 * Clean up temporary files
 */
function cleanupTempFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Whisper] Deleted temp file: ${filePath}`);
      }
    } catch (error) {
      console.warn(`[Whisper] Failed to delete temp file ${filePath}:`, error);
    }
  }
}
