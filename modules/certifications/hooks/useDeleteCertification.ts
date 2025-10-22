"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCertification } from "../serverActions/certification.action";
import type { DeleteCertificationInput } from "../types/certification.schema";

/**
 * Hook for deleting a certification
 */
export function useDeleteCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteCertificationInput) => deleteCertification(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Certification deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["certifications"] });
      } else {
        toast.error(response.error || "Failed to delete certification");
      }
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "An unexpected error occurred");
    },
  });
}
