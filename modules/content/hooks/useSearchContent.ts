/**
 * Client hook for searching content (objectives, bullets, sub-bullets)
 */

import { useQuery } from "@tanstack/react-query";
import { searchContent } from "../serverActions/mapping.action";
import type { ContentSearchResult } from "../types/mapping.types";

/**
 * Search objectives, bullets, and sub-bullets for manual mapping
 */
export function useSearchContent(query: string, certificationId: string) {
  return useQuery<ContentSearchResult[]>({
    queryKey: ["searchContent", certificationId, query],
    queryFn: async () => {
      const result = await searchContent(query, certificationId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to search content");
      }

      return result.data;
    },
    enabled: query.length >= 2 && !!certificationId, // Only search if query is at least 2 chars
    staleTime: 30000, // Cache results for 30 seconds
  });
}
