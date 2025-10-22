"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { archiveCertification } from "../serverActions/certification.action";
import type { ArchiveCertificationInput } from "../types/certification.schema";

/**
 * Hook for archiving/unarchiving a certification
 */
export function useArchiveCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ArchiveCertificationInput) => archiveCertification(input),
    onSuccess: (response, variables) => {
      if (response.success) {
        const action = variables.isArchived ? "archived" : "unarchived";
        toast.success(`Certification ${action} successfully`);
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
