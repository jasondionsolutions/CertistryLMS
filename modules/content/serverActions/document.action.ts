"use server";

/**
 * Document Upload Server Actions
 *
 * RBAC-protected server actions for document management.
 */

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { withAccess } from "@/lib/middleware/withAccess";
import { AuthContext, NotFoundError } from "@/lib/auth/types";
import { generatePresignedUploadUrl, generatePresignedDownloadUrl } from "@/lib/s3/presignedUrl";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_NAME } from "@/lib/s3/config";
import { extractTextFromDocument } from "../services/textExtraction.service";
import { generateDocumentDescription } from "../services/aiDescription.service";
import type {
  PresignedUploadResponse,
  CreateDocumentInput,
  UpdateDocumentInput,
  GetDocumentInput,
  DeleteDocumentInput,
  GetDocumentsInput,
  DocumentWithRelations,
  DocumentSummary,
} from "../types/document.types";
import {
  createDocumentSchema,
  updateDocumentSchema,
  getDocumentSchema,
  deleteDocumentSchema,
  getDocumentsSchema,
} from "../types/document.types";

// ============================================================================
// UPLOAD
// ============================================================================

/**
 * Generate pre-signed URL for document upload
 *
 * Step 1 of upload process - client gets URL to upload directly to S3
 */
export const generateDocumentUploadUrl = withPermission("content.create")(
  async (
    user: AuthContext,
    fileName: string,
    mimeType: string
  ): Promise<{ success: boolean; data?: PresignedUploadResponse; error?: string }> => {
    try {
      // Generate pre-signed URL for documents folder
      const uploadData = await generatePresignedUploadUrl(
        fileName,
        mimeType,
        "documents"
      );

      return {
        success: true,
        data: uploadData,
      };
    } catch (error) {
      console.error("[generateDocumentUploadUrl] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate upload URL",
      };
    }
  }
);

/**
 * Create document record after upload to S3
 *
 * Step 2 of upload process - after client uploads to S3, save document record
 */
export const createDocument = withPermission("content.create")(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> => {
    try {
      // Validate input
      const validated = createDocumentSchema.parse(input);

      // Create document record
      const document = await prisma.document.create({
        data: {
          title: validated.title,
          description: validated.description,
          s3Key: validated.s3Key,
          url: validated.url,
          type: validated.type,
          fileSize: validated.fileSize,
          mimeType: validated.mimeType,
          version: validated.version,
          allowDownload: validated.allowDownload,
          uploadedBy: user.userId,
          isActive: true,
        },
      });

      return {
        success: true,
        data: { id: document.id },
      };
    } catch (error) {
      console.error("[createDocument] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      };
    }
  }
);

// ============================================================================
// READ
// ============================================================================

/**
 * Get single document with all relations
 */
export const getDocument = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: DocumentWithRelations; error?: string }> => {
    try {
      const validated = getDocumentSchema.parse(input);

      const document = await prisma.document.findUnique({
        where: { id: validated.id },
        include: {
          contentMappings: {
            include: {
              objective: {
                include: {
                  domain: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              bullet: {
                include: {
                  objective: {
                    include: {
                      domain: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              subBullet: {
                include: {
                  bullet: {
                    include: {
                      objective: {
                        include: {
                          domain: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: [{ isPrimary: "desc" }, { confidence: "desc" }],
          },
        },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      return {
        success: true,
        data: document as DocumentWithRelations,
      };
    } catch (error) {
      console.error("[getDocument] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get document",
      };
    }
  }
);

/**
 * Get all documents with pagination and filters
 */
export const getDocuments = withAccess(
  async (
    user: AuthContext,
    input: unknown = {}
  ): Promise<{
    success: boolean;
    data?: { documents: DocumentSummary[]; total: number };
    error?: string;
  }> => {
    try {
      const validated = getDocumentsSchema.parse(input);

      // Build where clause
      const where = {
        ...(validated.search && {
          OR: [
            { title: { contains: validated.search, mode: "insensitive" as const } },
            { description: { contains: validated.search, mode: "insensitive" as const } },
          ],
        }),
        ...(validated.type && { type: validated.type }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      };

      // Get documents
      const documents = await prisma.document.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          fileSize: true,
          version: true,
          allowDownload: true,
          createdAt: true,
          _count: {
            select: {
              contentMappings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: validated.offset,
        take: validated.limit,
      });

      // Get total count
      const total = await prisma.document.count({ where });

      // Transform to DocumentSummary
      const documentSummaries: DocumentSummary[] = documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        fileSize: doc.fileSize,
        version: doc.version,
        allowDownload: doc.allowDownload,
        createdAt: doc.createdAt,
        mappingCount: doc._count.contentMappings,
      }));

      return {
        success: true,
        data: {
          documents: documentSummaries,
          total,
        },
      };
    } catch (error) {
      console.error("[getDocuments] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get documents",
      };
    }
  }
);

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update document metadata
 */
export const updateDocument = withPermission("content.update")(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = updateDocumentSchema.parse(input);

      await prisma.document.update({
        where: { id: validated.id },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.version && { version: validated.version }),
          ...(validated.allowDownload !== undefined && { allowDownload: validated.allowDownload }),
          ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        },
      });

      return { success: true };
    } catch (error) {
      console.error("[updateDocument] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update document",
      };
    }
  }
);

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete document and remove from S3
 */
export const deleteDocument = withPermission("content.delete")(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = deleteDocumentSchema.parse(input);

      // Get document to retrieve S3 key
      const document = await prisma.document.findUnique({
        where: { id: validated.id },
        select: { s3Key: true },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      // Delete from S3
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: document.s3Key,
        });
        await s3Client.send(deleteCommand);
      } catch (s3Error) {
        console.error("[deleteDocument] S3 deletion failed:", s3Error);
        // Continue with DB deletion even if S3 fails
      }

      // Delete from database (cascades to mappings)
      await prisma.document.delete({
        where: { id: validated.id },
      });

      return { success: true };
    } catch (error) {
      console.error("[deleteDocument] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete document",
      };
    }
  }
);

// ============================================================================
// DOWNLOAD
// ============================================================================

/**
 * Generate presigned download URL for a document
 */
export const generateDocumentDownloadUrl = withAccess(
  async (
    _user: AuthContext,
    documentId: string
  ): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      // Get document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          s3Key: true,
          allowDownload: true,
        },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      if (!document.allowDownload) {
        return {
          success: false,
          error: "Downloads are not allowed for this document",
        };
      }

      // Generate presigned URL (valid for 1 hour)
      const downloadUrl = await generatePresignedDownloadUrl(document.s3Key, 3600);

      return {
        success: true,
        data: downloadUrl,
      };
    } catch (error) {
      console.error("[generateDocumentDownloadUrl] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate download URL",
      };
    }
  }
);

// ============================================================================
// AI DESCRIPTION GENERATION
// ============================================================================

/**
 * Generate AI description for a document
 * Called after document upload if generateAIDescription is enabled
 */
export const generateAIDescriptionForDocument = withAccess(
  async (
    _user: AuthContext,
    documentId: string
  ): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      // Get document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          title: true,
          description: true,
          s3Key: true,
          mimeType: true,
        },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      // Skip if already has description
      if (document.description) {
        return {
          success: true,
          data: document.description,
        };
      }

      // Skip if no s3Key or mimeType
      if (!document.s3Key || !document.mimeType) {
        return {
          success: false,
          error: "Document missing S3 key or MIME type",
        };
      }

      // Extract text from document
      const documentText = await extractTextFromDocument(
        document.s3Key,
        document.mimeType
      );

      // Generate AI description
      const aiDescription = await generateDocumentDescription(
        documentText,
        document.title,
        100
      );

      // Update document with AI description
      await prisma.document.update({
        where: { id: documentId },
        data: {
          description: aiDescription,
          aiDescriptionGenerated: true,
        },
      });

      return {
        success: true,
        data: aiDescription,
      };
    } catch (error) {
      console.error("[generateAIDescriptionForDocument] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI description",
      };
    }
  }
);

/**
 * Get presigned URL for document download
 *
 * Generates a secure URL for downloading the document
 */
export const getDocumentDownloadUrl = withAccess(
  async (
    _user: AuthContext,
    documentId: string
  ): Promise<{ success: boolean; data?: { url: string; expiresIn: number }; error?: string }> => {
    try {
      // Get document to retrieve s3Key
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { s3Key: true },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      if (!document.s3Key) {
        return {
          success: false,
          error: "Document has no S3 key",
        };
      }

      // Generate presigned URL (valid for 2 hours)
      const url = await generatePresignedDownloadUrl(document.s3Key, 7200);

      return {
        success: true,
        data: {
          url,
          expiresIn: 7200, // 2 hours in seconds
        },
      };
    } catch (error) {
      console.error("[getDocumentDownloadUrl] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate download URL",
      };
    }
  }
);
