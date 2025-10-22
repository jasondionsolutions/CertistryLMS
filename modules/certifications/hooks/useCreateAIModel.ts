"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAIModel } from "../serverActions/aiModel.action";
import type { CreateAIModelInput } from "../types/aiModel.schema";

/**
 * Hook for creating an AI model
 */
export function useCreateAIModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAIModelInput) => createAIModel(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("AI model created successfully");
        queryClient.invalidateQueries({ queryKey: ["aiModels"] });
      } else {
        toast.error(response.error || "Failed to create AI model");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
