"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAIModel } from "../serverActions/aiModel.action";
import type { DeleteAIModelInput } from "../types/aiModel.schema";

/**
 * Hook for deleting an AI model
 */
export function useDeleteAIModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteAIModelInput) => deleteAIModel(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("AI model deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["aiModels"] });
      } else {
        toast.error(response.error || "Failed to delete AI model");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
