"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { processBlueprintWithMetadata } from "../serverActions/processBlueprintWithMetadata.action";

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
 * Hook for processing blueprint PDF with metadata extraction
 * Extracts certification details AND blueprint structure from PDF
 */
export function useProcessBlueprintWithMetadata() {
  return useMutation({
    mutationFn: async (input: { file: File; modelId: string }) => {
      // Convert file to base64
      const pdfBase64 = await fileToBase64(input.file);

      // Call server action
      return processBlueprintWithMetadata({
        modelId: input.modelId,
        pdfBase64,
        pdfFileName: input.file.name,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process PDF");
    },
  });
}
