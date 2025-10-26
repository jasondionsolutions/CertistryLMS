"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentStats } from "../serverActions/contentStats.action";
import type { ContentStats } from "../types/contentLibrary.types";

/**
 * Hook to fetch content library statistics
 */
export function useContentStats() {
  return useQuery<ContentStats>({
    queryKey: ["contentStats"],
    queryFn: async () => {
      const result = await getContentStats();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch statistics");
      }
      return result.data;
    },
    staleTime: 60000, // 1 minute
  });
}
