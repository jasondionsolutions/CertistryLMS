"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkDeleteContent,
  bulkRemapContent,
} from "../serverActions/bulkOperations.action";
import type {
  BulkDeleteInput,
  BulkRemapInput,
} from "../types/contentLibrary.types";

/**
 * Hook for bulk delete operation
 */
export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkDeleteInput) => bulkDeleteContent(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Successfully deleted ${result.deleted} item${result.deleted !== 1 ? "s" : ""}`
        );
        // Invalidate content library and stats
        queryClient.invalidateQueries({ queryKey: ["contentLibrary"] });
        queryClient.invalidateQueries({ queryKey: ["contentStats"] });
      } else {
        toast.error(result.error ?? "Failed to delete content");
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete content"
      );
    },
  });
}

/**
 * Hook for bulk re-map operation
 */
export function useBulkRemap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkRemapInput) => bulkRemapContent(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Successfully re-mapped ${result.updated} item${result.updated !== 1 ? "s" : ""}`
        );
        // Invalidate content library and stats
        queryClient.invalidateQueries({ queryKey: ["contentLibrary"] });
        queryClient.invalidateQueries({ queryKey: ["contentStats"] });
      } else {
        toast.error(result.error ?? "Failed to re-map content");
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to re-map content"
      );
    },
  });
}
