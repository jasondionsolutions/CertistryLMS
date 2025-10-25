/**
 * Client hook for AI mapping suggestions
 */

import { useMutation } from "@tanstack/react-query";
import { suggestMappings } from "../serverActions/mapping.action";
import type { SuggestMappingsInput, MappingSuggestion } from "../types/mapping.types";
import { toast } from "sonner";

/**
 * Generate AI mapping suggestions for a video
 */
export function useSuggestMappings() {
  return useMutation({
    mutationFn: async (input: SuggestMappingsInput) => {
      const result = await suggestMappings(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate suggestions");
      }

      return result.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate AI suggestions");
    },
    onSuccess: (suggestions: MappingSuggestion[]) => {
      if (suggestions.length === 0) {
        toast.info("No suggestions found. Try adding mappings manually.");
      } else {
        toast.success(`Found ${suggestions.length} AI suggestions`);
      }
    },
  });
}
