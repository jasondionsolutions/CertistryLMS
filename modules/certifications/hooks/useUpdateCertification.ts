"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCertification } from "../serverActions/certification.action";
import type { UpdateCertificationInput } from "../types/certification.schema";

/**
 * Hook for updating a certification
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCertificationInput) => updateCertification(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Certification updated successfully");
        queryClient.invalidateQueries({ queryKey: ["certifications"] });
      } else {
        toast.error(response.error || "Failed to update certification");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
