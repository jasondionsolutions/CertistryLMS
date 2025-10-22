"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateAIModel } from "../serverActions/aiModel.action";
import type { UpdateAIModelInput } from "../types/aiModel.schema";

/**
 * Hook for updating an AI model
 */
export function useUpdateAIModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAIModelInput) => updateAIModel(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("AI model updated successfully");
        queryClient.invalidateQueries({ queryKey: ["aiModels"] });
      } else {
        toast.error(response.error || "Failed to update AI model");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
