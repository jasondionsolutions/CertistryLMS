/**
 * Client hooks for document content mappings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocumentMappings,
  applyDocumentMappingSuggestions,
  addManualDocumentMapping,
  removeDocumentMapping,
  updatePrimaryDocumentMapping,
} from "../serverActions/documentMapping.action";
import type {
  GetDocumentMappingsInput,
  ApplyDocumentMappingSuggestionsInput,
  AddManualDocumentMappingInput,
  RemoveDocumentMappingInput,
  UpdatePrimaryDocumentMappingInput,
} from "../types/documentMapping.types";
import { toast } from "sonner";

/**
 * Get all mappings for a document
 */
export function useDocumentMappings(documentId: string) {
  return useQuery({
    queryKey: ["documentMappings", documentId],
    queryFn: async () => {
      const result = await getDocumentMappings({ documentId });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch mappings");
      }

      return result.data;
    },
    enabled: !!documentId,
  });
}

/**
 * Apply (confirm) AI mapping suggestions
 */
export function useApplyDocumentMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyDocumentMappingSuggestionsInput) => {
      const result = await applyDocumentMappingSuggestions(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to apply mappings");
      }

      return result.data;
    },
    onSuccess: (count, variables) => {
      toast.success(`Applied ${count} mapping${count !== 1 ? "s" : ""}`);
      queryClient.invalidateQueries({
        queryKey: ["documentMappings", variables.documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["document", variables.documentId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply mappings");
    },
  });
}

/**
 * Add manual mapping
 */
export function useAddDocumentMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddManualDocumentMappingInput) => {
      const result = await addManualDocumentMapping(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to add mapping");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Mapping added successfully");
      queryClient.invalidateQueries({
        queryKey: ["documentMappings", variables.documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["document", variables.documentId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add mapping");
    },
  });
}

/**
 * Remove mapping
 */
export function useRemoveDocumentMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveDocumentMappingInput & { documentId: string }) => {
      const result = await removeDocumentMapping({ mappingId: input.mappingId });

      if (!result.success) {
        throw new Error(result.error || "Failed to remove mapping");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      toast.success("Mapping removed");
      queryClient.invalidateQueries({
        queryKey: ["documentMappings", variables.documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["document", variables.documentId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove mapping");
    },
  });
}

/**
 * Update primary mapping
 */
export function useUpdatePrimaryDocumentMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePrimaryDocumentMappingInput) => {
      const result = await updatePrimaryDocumentMapping(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update primary mapping");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      toast.success("Primary mapping updated");
      queryClient.invalidateQueries({
        queryKey: ["documentMappings", variables.documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["document", variables.documentId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update primary mapping");
    },
  });
}
