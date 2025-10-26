/**
 * Client hook for document upload
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateDocumentUploadUrl,
  createDocument,
  generateAIDescriptionForDocument,
} from "../serverActions/document.action";
import type { CreateDocumentInput } from "../types/document.types";
import { toast } from "sonner";

/**
 * Upload document to S3 and save metadata
 */
export function useUploadDocument() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      file: File;
      title: string;
      description?: string;
      type: "pdf" | "docx" | "txt";
      version?: number;
      allowDownload?: boolean;
      generateAIDescription?: boolean;
    }) => {
      // Step 1: Generate presigned URL
      const urlResult = await generateDocumentUploadUrl(
        input.file.name,
        input.file.type
      );

      if (!urlResult.success || !urlResult.data) {
        throw new Error(urlResult.error || "Failed to generate upload URL");
      }

      const { uploadUrl, s3Key, publicUrl } = urlResult.data;

      // Step 2: Upload to S3 with progress tracking
      setUploadProgress(0);
      await uploadToS3(uploadUrl, input.file, (progress) => {
        setUploadProgress(progress);
      });

      // Step 3: Save document metadata to database
      const documentInput: CreateDocumentInput = {
        title: input.title,
        description: input.description,
        s3Key,
        url: publicUrl,
        type: input.type,
        fileSize: input.file.size,
        mimeType: input.file.type as "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain",
        version: input.version || 1,
        allowDownload: input.allowDownload ?? true,
      };

      const createResult = await createDocument(documentInput);

      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error || "Failed to save document");
      }

      const document = createResult.data;

      // Step 4: Generate AI description if requested and no manual description provided
      if (input.generateAIDescription && !input.description) {
        try {
          console.error("[Upload] Generating AI description...");

          // Call server action to generate AI description
          await generateAIDescriptionForDocument(document.id);

          console.error("[Upload] AI description generated successfully");
        } catch (error) {
          console.error("[Upload] AI description generation failed:", error);
          // Don't fail the entire upload if description generation fails
        }
      }

      return document;
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload document");
      setUploadProgress(0);
    },
  });
}

/**
 * Upload file to S3 using presigned URL
 */
async function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

/**
 * Get current upload progress (0-100)
 */
export function useUploadProgress() {
  return useState(0);
}
