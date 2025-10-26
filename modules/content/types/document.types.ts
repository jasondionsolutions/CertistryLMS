/**
 * Document Types and Zod Schemas
 *
 * Type definitions and validation schemas for document upload and management.
 */

import { z } from "zod";

/**
 * Supported document MIME types
 */
export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "text/plain", // TXT
] as const;

/**
 * Document file extensions
 */
export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
] as const;

/**
 * Max file size: 100MB
 */
export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB in bytes

/**
 * Document type enum
 */
export const DocumentType = z.enum(["pdf", "docx", "txt"]);

export type DocumentType = z.infer<typeof DocumentType>;

/**
 * Schema for creating a new document
 */
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  s3Key: z.string().min(1, "S3 key is required"),
  url: z.string().url("Invalid URL"),
  type: DocumentType,
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_SIZE),
  mimeType: z.enum(SUPPORTED_DOCUMENT_TYPES),
  version: z.number().int().positive().default(1),
  allowDownload: z.boolean().default(true),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/**
 * Schema for updating a document
 */
export const updateDocumentSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  version: z.number().int().positive().optional(),
  allowDownload: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

/**
 * Schema for getting a document
 */
export const getDocumentSchema = z.object({
  id: z.string().cuid(),
});

export type GetDocumentInput = z.infer<typeof getDocumentSchema>;

/**
 * Schema for deleting a document
 */
export const deleteDocumentSchema = z.object({
  id: z.string().cuid(),
});

export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;

/**
 * Schema for listing documents
 */
export const getDocumentsSchema = z.object({
  search: z.string().optional(),
  type: DocumentType.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>;

/**
 * Presigned upload response type (reuse from video.types.ts)
 */
export interface PresignedUploadResponse {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
}

/**
 * Document with relations
 */
export interface DocumentWithRelations {
  id: string;
  title: string;
  description: string | null;
  s3Key: string;
  url: string;
  type: string;
  fileSize: number | null;
  mimeType: string | null;
  version: number;
  uploadedBy: string | null;
  allowDownload: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contentMappings: {
    id: string;
    objectiveId: string | null;
    bulletId: string | null;
    subBulletId: string | null;
    isPrimary: boolean;
    confidence: number;
    mappingSource: string;
    createdAt: Date;
    // Nested relations (only ONE will be populated based on mapping level)
    objective?: {
      id: string;
      code: string;
      description: string;
      domain: {
        id: string;
        name: string;
      };
    };
    bullet?: {
      id: string;
      text: string;
      objective: {
        id: string;
        code: string;
        description: string;
        domain: {
          id: string;
          name: string;
        };
      };
    };
    subBullet?: {
      id: string;
      text: string;
      bullet: {
        id: string;
        text: string;
        objective: {
          id: string;
          code: string;
          description: string;
          domain: {
            id: string;
            name: string;
          };
        };
      };
    };
  }[];
}

/**
 * Document summary (for lists)
 */
export interface DocumentSummary {
  id: string;
  title: string;
  type: string;
  fileSize: number | null;
  version: number;
  allowDownload: boolean;
  createdAt: Date;
  mappingCount: number;
}
