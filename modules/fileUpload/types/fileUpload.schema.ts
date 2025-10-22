// modules/fileUpload/types/fileUpload.schema.ts
import { z } from "zod";

/**
 * File categories supported by the application
 */
export const fileCategorySchema = z.enum([
  "videos",
  "pdfs",
  "images",
  "thumbnails",
]);

export type FileCategory = z.infer<typeof fileCategorySchema>;

/**
 * File upload input schema
 */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  category: fileCategorySchema,
  contentType: z.string().min(1, "Content type is required"),
  subfolder: z.string().optional(),
  referencedBy: z.string().optional(),
  referenceType: z.string().optional(),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

/**
 * File replacement input schema
 */
export const fileReplaceSchema = z.object({
  oldFileId: z.string().min(1, "Old file ID is required"),
  fileName: z.string().min(1, "File name is required"),
  category: fileCategorySchema,
  contentType: z.string().min(1, "Content type is required"),
  subfolder: z.string().optional(),
});

export type FileReplaceInput = z.infer<typeof fileReplaceSchema>;

/**
 * File delete input schema
 */
export const fileDeleteSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
});

export type FileDeleteInput = z.infer<typeof fileDeleteSchema>;

/**
 * Pre-signed URL request schema
 */
export const presignedUrlSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  expiresIn: z.number().min(60).max(86400).optional(), // 1 min to 24 hours
});

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;

/**
 * Server action response types
 */
export interface FileUploadResponse {
  success: boolean;
  data?: {
    id: string;
    key: string;
    url: string;
    fileName: string;
    fileSize: number;
    category: string;
  };
  error?: string;
}

export interface FileReplaceResponse {
  success: boolean;
  data?: {
    id: string;
    key: string;
    url: string;
    fileName: string;
  };
  error?: string;
}

export interface FileDeleteResponse {
  success: boolean;
  error?: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  data?: {
    url: string;
    expiresIn: number;
  };
  error?: string;
}

export interface FileListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    referencedBy?: string | null;
    referenceType?: string | null;
    uploadedBy?: string | null;
    createdAt: Date;
  }>;
  error?: string;
}
