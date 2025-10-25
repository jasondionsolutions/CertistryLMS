/**
 * Client hook for applying (accepting) AI mapping suggestions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyMappingSuggestions } from "../serverActions/mapping.action";
import type { ApplyMappingSuggestionsInput } from "../types/mapping.types";
import { toast } from "sonner";

/**
 * Apply (accept/confirm) AI mapping suggestions
 */
export function useApplyMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyMappingSuggestionsInput) => {
      const result = await applyMappingSuggestions(input);

      if (!result.success || result.data === undefined) {
        throw new Error(result.error || "Failed to apply mappings");
      }

      return { videoId: input.videoId, count: result.data };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply mappings");
    },
    onSuccess: ({ videoId, count }) => {
      toast.success(`Applied ${count} mapping${count !== 1 ? "s" : ""}`);

      // Invalidate video mappings query to refetch
      queryClient.invalidateQueries({
        queryKey: ["videoMappings", videoId],
      });
    },
  });
}
