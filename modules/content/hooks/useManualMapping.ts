/**
 * Client hooks for manual mapping operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addManualMapping,
  removeMapping,
  updatePrimaryMapping,
} from "../serverActions/mapping.action";
import type {
  AddManualMappingInput,
  RemoveMappingInput,
  UpdatePrimaryMappingInput,
} from "../types/mapping.types";
import { toast } from "sonner";

/**
 * Add a manual content mapping
 */
export function useAddManualMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddManualMappingInput) => {
      const result = await addManualMapping(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to add mapping");
      }

      return { videoId: input.videoId, mappingId: result.data };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add mapping");
    },
    onSuccess: ({ videoId }) => {
      toast.success("Mapping added successfully");

      // Invalidate video mappings query to refetch
      queryClient.invalidateQueries({
        queryKey: ["videoMappings", videoId],
      });
    },
  });
}

/**
 * Remove a content mapping
 */
export function useRemoveMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mappingId,
      videoId,
    }: RemoveMappingInput & { videoId: string }) => {
      const result = await removeMapping({ mappingId });

      if (!result.success) {
        throw new Error(result.error || "Failed to remove mapping");
      }

      return { videoId };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove mapping");
    },
    onSuccess: ({ videoId }) => {
      toast.success("Mapping removed");

      // Invalidate video mappings query to refetch
      queryClient.invalidateQueries({
        queryKey: ["videoMappings", videoId],
      });
    },
  });
}

/**
 * Update primary mapping for a video
 */
export function useUpdatePrimaryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePrimaryMappingInput) => {
      const result = await updatePrimaryMapping(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update primary mapping");
      }

      return input;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update primary mapping");
    },
    onSuccess: ({ videoId }) => {
      toast.success("Primary mapping updated");

      // Invalidate video mappings query to refetch
      queryClient.invalidateQueries({
        queryKey: ["videoMappings", videoId],
      });
    },
  });
}
