/**
 * Video Query Hooks
 *
 * Client hooks for fetching and managing video data.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listVideos,
  getVideo,
  updateVideo,
  deleteVideo,
} from "../serverActions/video.action";
import type {
  VideoQueryInput,
  UpdateVideoInput,
  DeleteVideoInput,
} from "../types/video.types";

/**
 * Fetch list of videos with filtering
 */
export function useVideos(filters: VideoQueryInput = { limit: 50, offset: 0 }) {
  return useQuery({
    queryKey: ["videos", filters],
    queryFn: async () => {
      const result = await listVideos(filters);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch videos");
      }
      return result.data;
    },
  });
}

/**
 * Fetch single video by ID
 */
export function useVideo(videoId: string) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const result = await getVideo(videoId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch video");
      }
      return result.data;
    },
    enabled: !!videoId,
  });
}

/**
 * Update video metadata
 */
export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateVideoInput) => {
      const result = await updateVideo(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update video");
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Video updated successfully");
      queryClient.invalidateQueries({ queryKey: ["video", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete video
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteVideoInput) => {
      const result = await deleteVideo(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete video");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Video deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
