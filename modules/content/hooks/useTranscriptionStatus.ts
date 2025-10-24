"use client";

/**
 * Transcription Status Hook
 *
 * Polls transcription status for a video and provides retry functionality.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTranscriptionStatus, retryTranscription, uploadManualTranscript } from "../serverActions/transcription.action";
import { toast } from "sonner";

/**
 * Poll transcription status for a video
 *
 * Automatically refetches every 5 seconds while status is "pending" or "processing"
 */
export function useTranscriptionStatus(videoId: string | null) {
  return useQuery({
    queryKey: ["transcription-status", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const result = await getTranscriptionStatus(videoId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch transcription status");
      }
      return result.data;
    },
    enabled: !!videoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 5 seconds if pending or processing
      if (data && (data.status === "pending" || data.status === "processing")) {
        return 5000; // 5 seconds
      }
      // Stop polling if completed, failed, or skipped
      return false;
    },
    refetchIntervalInBackground: false,
  });
}

/**
 * Retry failed transcription
 */
export function useRetryTranscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const result = await retryTranscription(videoId);
      if (!result.success) {
        throw new Error(result.error || "Failed to retry transcription");
      }
      return result;
    },
    onSuccess: (_, videoId) => {
      toast.success("Transcription queued for retry");
      // Invalidate status query to start polling again
      queryClient.invalidateQueries({ queryKey: ["transcription-status", videoId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Upload manual transcript (VTT file)
 */
export function useUploadManualTranscript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      vttContent,
      updateDescription,
    }: {
      videoId: string;
      vttContent: string;
      updateDescription?: boolean;
    }) => {
      const result = await uploadManualTranscript({
        videoId,
        vttContent,
        updateDescription,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to upload transcript");
      }
      return result;
    },
    onSuccess: (_, { videoId }) => {
      toast.success("Transcript uploaded successfully");
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["transcription-status", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
