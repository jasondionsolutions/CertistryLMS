"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCertificationWithBlueprint } from "../serverActions/createCertificationWithBlueprint.action";

/**
 * Hook for creating a certification with blueprint data
 * Used when certification is created from AI-extracted PDF
 */
export function useCreateCertificationWithBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCertificationWithBlueprint,
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success(
          `Certification created with ${response.data.domainsCreated} domains and ${response.data.objectivesCreated} objectives!`
        );
        queryClient.invalidateQueries({ queryKey: ["certifications"] });
      } else {
        toast.error(response.error || "Failed to create certification");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
