"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitName } from "../serverActions/visitor.action";

/**
 * Hook for submitting visitor name
 * Follows the architecture pattern: Component -> Hook -> Server Action
 */
export function useSubmitName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => submitName(formData),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(`Welcome, ${response.data?.name}!`);
        // Invalidate any queries that depend on visitor name
        queryClient.invalidateQueries({ queryKey: ["visitorName"] });
      } else {
        toast.error(response.error || "Failed to save name");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}
