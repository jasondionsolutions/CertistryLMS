/**
 * Whisper Transcription Service
 *
 * Handles video transcription using OpenAI Whisper API.
 * Supports audio extraction, chunking, and VTT caption generation.
 */

import OpenAI from "openai";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import ffmpeg from "fluent-ffmpeg";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const MAX_FILE_SIZE_MB = 25; // Whisper API limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Transcription result interface
 */
export interface TranscriptionResult {
  transcript: string; // Plain text transcript
  vttContent: string; // VTT format with timestamps
  vttS3Key: string; // S3 key where VTT file is stored
  vttUrl: string; // Public URL for VTT file
  duration?: number; // Duration in seconds (if available)
}

/**
 * Download file from S3 to local temp directory
 */
async function downloadFromS3(s3Key: string): Promise<string> {
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
 * Extract audio from video using ffmpeg
 * Returns path to extracted audio file (MP3 format)
 */
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(path.extname(videoPath), ".mp3");

  return new Promise<string>((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .noVideo()
      .on("end", () => resolve(audioPath))
      .on("error", (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run();
  });
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Split audio file into chunks if larger than max size
 * Returns array of chunk file paths
 */
async function splitAudioIntoChunks(audioPath: string): Promise<string[]> {
  const fileSize = getFileSize(audioPath);

  // If file is under limit, no chunking needed
  if (fileSize <= MAX_FILE_SIZE_BYTES) {
    return [audioPath];
  }

  // Calculate number of chunks needed
  const numChunks = Math.ceil(fileSize / MAX_FILE_SIZE_BYTES);
  const chunkPaths: string[] = [];

  // Get audio duration
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });

  const chunkDuration = duration / numChunks;

  // Split into chunks
  for (let i = 0; i < numChunks; i++) {
    const chunkPath = audioPath.replace(".mp3", `-chunk-${i}.mp3`);
    const startTime = i * chunkDuration;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .setStartTime(startTime)
        .setDuration(chunkDuration)
        .output(chunkPath)
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .on("end", () => resolve())
        .on("error", (err) => reject(new Error(`Chunking failed: ${err.message}`)))
        .run();
    });

    chunkPaths.push(chunkPath);
  }

  return chunkPaths;
}

/**
 * Transcribe a single audio file using Whisper API
 */
async function transcribeAudioChunk(audioPath: string): Promise<string> {
  const audioStream = fs.createReadStream(audioPath);

  const transcription = await openai.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-1",
    response_format: "vtt", // Request VTT format with timestamps
    language: "en", // Assuming English, can be made dynamic
  });

  return transcription as unknown as string; // VTT content as string
}

/**
 * Merge multiple VTT transcripts into one
 */
function mergeVttTranscripts(vttChunks: string[]): string {
  if (vttChunks.length === 1) {
    return vttChunks[0];
  }

  // Parse and merge VTT chunks with adjusted timestamps
  let mergedVtt = "WEBVTT\n\n";
  let timeOffset = 0;

  for (let i = 0; i < vttChunks.length; i++) {
    const chunk = vttChunks[i];
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    // Skip "WEBVTT" header
    const contentLines = lines.slice(1);

    for (let j = 0; j < contentLines.length; j += 2) {
      const timestampLine = contentLines[j];
      const textLine = contentLines[j + 1];

      if (timestampLine && textLine && timestampLine.includes("-->")) {
        // Adjust timestamps by offset (simplified - assumes format "00:00:00.000 --> 00:00:05.000")
        // For production, use a proper VTT parser
        mergedVtt += `${timestampLine}\n${textLine}\n\n`;
      }
    }

    // TODO: Calculate proper time offset for next chunk
    // This is a simplified version - proper implementation would parse timestamps
  }

  return mergedVtt;
}

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
      }
    } catch (error) {
      console.error(`Failed to delete temp file ${filePath}:`, error);
    }
  }
}

/**
 * Main transcription function
 *
 * Downloads video from S3, extracts audio, transcribes with Whisper,
 * generates VTT captions, and uploads to S3.
 *
 * @param s3Key - S3 key of the video file
 * @param videoId - Video ID for naming the VTT file
 * @returns Transcription result with plain text and VTT data
 */
export async function transcribeVideo(s3Key: string, videoId: string): Promise<TranscriptionResult> {
  const tempFiles: string[] = [];

  try {
    console.error(`[Whisper] Starting transcription for video ${videoId}`);

    // Step 1: Download video from S3
    console.error("[Whisper] Downloading video from S3...");
    const videoPath = await downloadFromS3(s3Key);
    tempFiles.push(videoPath);

    // Step 2: Extract audio
    console.error("[Whisper] Extracting audio...");
    const audioPath = await extractAudio(videoPath);
    tempFiles.push(audioPath);

    // Step 3: Split audio into chunks if necessary
    console.error("[Whisper] Checking if chunking is needed...");
    const audioChunks = await splitAudioIntoChunks(audioPath);
    tempFiles.push(...audioChunks.filter((chunk) => chunk !== audioPath));

    // Step 4: Transcribe each chunk
    console.error(`[Whisper] Transcribing ${audioChunks.length} chunk(s)...`);
    const vttChunks: string[] = [];

    for (let i = 0; i < audioChunks.length; i++) {
      console.error(`[Whisper] Transcribing chunk ${i + 1}/${audioChunks.length}...`);
      const vtt = await transcribeAudioChunk(audioChunks[i]);
      vttChunks.push(vtt);
    }

    // Step 5: Merge VTT chunks
    console.error("[Whisper] Merging transcripts...");
    const vttContent = mergeVttTranscripts(vttChunks);

    // Step 6: Extract plain text
    const transcript = extractTextFromVtt(vttContent);

    // Step 7: Upload VTT to S3
    console.error("[Whisper] Uploading VTT to S3...");
    const { s3Key: vttS3Key, url: vttUrl } = await uploadVttToS3(vttContent, videoId);

    console.error(`[Whisper] Transcription complete for video ${videoId}`);

    return {
      transcript,
      vttContent,
      vttS3Key,
      vttUrl,
    };
  } catch (error) {
    console.error("[Whisper] Transcription failed:", error);
    throw error;
  } finally {
    // Clean up temp files
    console.error("[Whisper] Cleaning up temp files...");
    cleanupTempFiles(tempFiles);
  }
}
