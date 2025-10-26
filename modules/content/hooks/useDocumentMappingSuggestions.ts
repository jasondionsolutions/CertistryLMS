/**
 * Client hook for AI document mapping suggestions
 */

import { useMutation } from "@tanstack/react-query";
import { suggestDocumentMappings } from "../serverActions/documentMapping.action";
import type {
  SuggestDocumentMappingsInput,
  DocumentMappingSuggestion,
} from "../types/documentMapping.types";
import { toast } from "sonner";

/**
 * Generate AI mapping suggestions for a document
 */
export function useSuggestDocumentMappings() {
  return useMutation({
    mutationFn: async (input: SuggestDocumentMappingsInput) => {
      const result = await suggestDocumentMappings(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate suggestions");
      }

      return result.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate AI suggestions");
    },
    onSuccess: (suggestions: DocumentMappingSuggestion[]) => {
      if (suggestions.length === 0) {
        toast.info("No suggestions found. Try adding mappings manually.");
      } else {
        toast.success(`Found ${suggestions.length} AI suggestions`);
      }
    },
  });
}
