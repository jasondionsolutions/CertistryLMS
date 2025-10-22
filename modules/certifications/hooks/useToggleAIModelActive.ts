"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleAIModelActive } from "../serverActions/aiModel.action";
import type { ToggleAIModelActiveInput } from "../types/aiModel.schema";

/**
 * Hook for toggling AI model active status
 */
export function useToggleAIModelActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ToggleAIModelActiveInput) => toggleAIModelActive(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          response.data?.isActive
            ? "AI model activated successfully"
            : "AI model deactivated successfully"
        );
        queryClient.invalidateQueries({ queryKey: ["aiModels"] });
      } else {
        toast.error(response.error || "Failed to toggle AI model status");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
