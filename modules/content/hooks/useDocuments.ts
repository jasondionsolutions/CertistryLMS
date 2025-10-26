/**
 * Client hooks for querying documents
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../serverActions/document.action";
import type {
  GetDocumentsInput,
  GetDocumentInput,
  UpdateDocumentInput,
  DeleteDocumentInput,
} from "../types/document.types";
import { toast } from "sonner";

/**
 * Get all documents with pagination and filters
 */
export function useDocuments(input?: GetDocumentsInput) {
  return useQuery({
    queryKey: ["documents", input],
    queryFn: async () => {
      const result = await getDocuments(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch documents");
      }

      return result.data;
    },
  });
}

/**
 * Get single document with all relations
 */
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const result = await getDocument({ id: documentId });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch document");
      }

      return result.data;
    },
    enabled: !!documentId,
  });
}

/**
 * Update document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDocumentInput) => {
      const result = await updateDocument(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update document");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      toast.success("Document updated successfully");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document");
    },
  });
}

/**
 * Delete document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteDocumentInput) => {
      const result = await deleteDocument(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });
}
