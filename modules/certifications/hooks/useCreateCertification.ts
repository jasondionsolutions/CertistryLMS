"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCertification } from "../serverActions/certification.action";
import type { CreateCertificationInput } from "../types/certification.schema";

/**
 * Hook for creating a certification
 */
export function useCreateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCertificationInput) => createCertification(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Certification created successfully");
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
