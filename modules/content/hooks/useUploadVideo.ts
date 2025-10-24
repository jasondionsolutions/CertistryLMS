/**
 * Video Upload Hook
 *
 * Client hook for handling multi-step video upload:
 * 1. Generate pre-signed URL
 * 2. Upload file to S3
 * 3. Complete upload by saving metadata
 */

import { useState } from "react";
import { toast } from "sonner";
import { generateVideoUploadUrl, completeVideoUpload } from "../serverActions/video.action";
import type { CompleteVideoUploadInput } from "../types/video.types";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseUploadVideoResult {
  uploadVideo: (file: File, metadata: Omit<CompleteVideoUploadInput, "s3Key" | "fileSize" | "mimeType">) => Promise<{ success: boolean; videoId?: string }>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
}

export function useUploadVideo(): UseUploadVideoResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = async (
    file: File,
    metadata: Omit<CompleteVideoUploadInput, "s3Key" | "fileSize" | "mimeType">
  ): Promise<{ success: boolean; videoId?: string }> => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Step 1: Generate pre-signed URL
      const urlResult = await generateVideoUploadUrl({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type as any, // Type validated by form before upload
      });

      if (!urlResult.success || !urlResult.data) {
        throw new Error(urlResult.error || "Failed to generate upload URL");
      }

      const { uploadUrl, s3Key } = urlResult.data;

      // Step 2: Upload to S3 with progress tracking
      await uploadToS3(file, uploadUrl, (loaded, total) => {
        const percentage = Math.round((loaded / total) * 100);
        setProgress({ loaded, total, percentage });
      });

      // Step 3: Complete upload by saving metadata
      const completeResult = await completeVideoUpload({
        ...metadata,
        s3Key,
        fileSize: file.size,
        mimeType: file.type as any, // Type validated by form before upload
      });

      if (!completeResult.success || !completeResult.data) {
        throw new Error(completeResult.error || "Failed to save video");
      }

      toast.success("Video uploaded successfully! Transcription is being processed.");

      setIsUploading(false);
      setProgress(null);

      return {
        success: true,
        videoId: completeResult.data.id,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setIsUploading(false);
      setProgress(null);
      toast.error(errorMessage);

      return {
        success: false,
      };
    }
  };

  return {
    uploadVideo,
    isUploading,
    progress,
    error,
  };
}

/**
 * Upload file to S3 using pre-signed URL
 */
async function uploadToS3(
  file: File,
  presignedUrl: string,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total);
      }
    });

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was aborted"));
    });

    // Send PUT request to S3
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
