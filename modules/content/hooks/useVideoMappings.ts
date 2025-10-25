/**
 * Client hook for querying video mappings
 */

import { useQuery } from "@tanstack/react-query";
import { getVideoMappings } from "../serverActions/mapping.action";
import type { VideoMappingsSummary } from "../types/mapping.types";

/**
 * Get all mappings for a video
 */
export function useVideoMappings(videoId: string) {
  return useQuery<VideoMappingsSummary>({
    queryKey: ["videoMappings", videoId],
    queryFn: async () => {
      const result = await getVideoMappings({ videoId });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch video mappings");
      }

      return result.data;
    },
    enabled: !!videoId, // Only run if videoId is provided
  });
}
