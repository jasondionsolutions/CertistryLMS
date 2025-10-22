"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processBlueprint } from "../serverActions/processBlueprint.action";

interface ProcessBlueprintInput {
  certificationId: string;
  modelId: string;
  file: File;
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Hook for processing blueprint PDF with AI
 */
export function useProcessBlueprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProcessBlueprintInput) => {
      // Convert file to base64
      const pdfBase64 = await fileToBase64(input.file);

      // Call server action
      return processBlueprint({
        certificationId: input.certificationId,
        modelId: input.modelId,
        pdfBase64,
        pdfFileName: input.file.name,
      });
    },
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        toast.success(
          `Blueprint processed successfully! Imported ${response.data.domainsCreated} domains, ${response.data.objectivesCreated} objectives.`
        );
        queryClient.invalidateQueries({ queryKey: ["domains", variables.certificationId] });
      } else {
        toast.error(response.error || "Failed to process blueprint");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred while processing blueprint");
    },
  });
}
