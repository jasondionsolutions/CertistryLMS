"use server";

import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/middleware/withRole";
import { withAccess } from "@/lib/middleware/withAccess";
import { AuthContext, ValidationError, NotFoundError } from "@/lib/auth/types";
import {
  uploadFile as uploadToS3,
  deleteFile as deleteFromS3,
  replaceFile as replaceInS3,
  getPresignedDownloadUrl,
  fileExists,
} from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import {
  fileUploadSchema,
  fileReplaceSchema,
  fileDeleteSchema,
  presignedUrlSchema,
  type FileUploadInput,
  type FileUploadResponse,
  type FileReplaceInput,
  type FileReplaceResponse,
  type FileDeleteInput,
  type FileDeleteResponse,
  type PresignedUrlInput,
  type PresignedUrlResponse,
  type FileListResponse,
} from "../types/fileUpload.schema";

/**
 * Upload a file to S3 and track in database
 * Restricted to admin and instructor roles
 *
 * @param user - Authenticated user context
 * @param fileData - File as Buffer
 * @param input - Upload metadata
 * @returns Upload result with file details
 */
export const uploadFileAction = withRole(["admin", "instructor"])(
  async (
    user: AuthContext,
    fileData: Buffer,
    input: FileUploadInput
  ): Promise<FileUploadResponse> => {
    try {
      // Validate input
      const validated = fileUploadSchema.parse(input);

      // Upload to S3
      const { key, url } = await uploadToS3(
        fileData,
        validated.fileName,
        validated.category,
        validated.contentType,
        validated.subfolder
      );

      // Track in database
      const file = await prisma.file.create({
        data: {
          key,
          url,
          fileName: validated.fileName,
          fileSize: fileData.length,
          mimeType: validated.contentType,
          category: validated.category,
          referencedBy: validated.referencedBy,
          referenceType: validated.referenceType,
          uploadedBy: user.userId,
        },
      });

      // Revalidate relevant paths
      revalidatePath("/admin");
      revalidatePath("/dashboard");

      return {
        success: true,
        data: {
          id: file.id,
          key: file.key,
          url: file.url,
          fileName: file.fileName,
          fileSize: file.fileSize,
          category: file.category,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to upload file",
      };
    }
  }
);

/**
 * Replace an existing file with automatic cleanup
 * Restricted to admin and instructor roles
 *
 * @param user - Authenticated user context
 * @param fileData - New file as Buffer
 * @param input - Replacement metadata
 * @returns Replacement result
 */
export const replaceFileAction = withRole(["admin", "instructor"])(
  async (
    user: AuthContext,
    fileData: Buffer,
    input: FileReplaceInput
  ): Promise<FileReplaceResponse> => {
    try {
      // Validate input
      const validated = fileReplaceSchema.parse(input);

      // Get existing file record
      const existingFile = await prisma.file.findUnique({
        where: { id: validated.oldFileId },
      });

      if (!existingFile) {
        throw new NotFoundError("File not found");
      }

      // Replace file in S3 (automatically deletes old file)
      const { key, url } = await replaceInS3(
        existingFile.key,
        fileData,
        validated.fileName,
        validated.category,
        validated.contentType,
        validated.subfolder
      );

      // Update database record
      const updatedFile = await prisma.file.update({
        where: { id: validated.oldFileId },
        data: {
          key,
          url,
          fileName: validated.fileName,
          fileSize: fileData.length,
          mimeType: validated.contentType,
          updatedAt: new Date(),
        },
      });

      // Revalidate relevant paths
      revalidatePath("/admin");
      revalidatePath("/dashboard");

      return {
        success: true,
        data: {
          id: updatedFile.id,
          key: updatedFile.key,
          url: updatedFile.url,
          fileName: updatedFile.fileName,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to replace file",
      };
    }
  }
);

/**
 * Delete a file from S3 and database
 * Restricted to admin role only
 *
 * @param user - Authenticated user context
 * @param input - Delete input with file ID
 * @returns Deletion result
 */
export const deleteFileAction = withRole("admin")(
  async (
    user: AuthContext,
    input: FileDeleteInput
  ): Promise<FileDeleteResponse> => {
    try {
      // Validate input
      const validated = fileDeleteSchema.parse(input);

      // Get file record
      const file = await prisma.file.findUnique({
        where: { id: validated.fileId },
      });

      if (!file) {
        throw new NotFoundError("File not found");
      }

      // Delete from S3
      await deleteFromS3(file.key);

      // Delete from database
      await prisma.file.delete({
        where: { id: validated.fileId },
      });

      // Revalidate relevant paths
      revalidatePath("/admin");
      revalidatePath("/dashboard");

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to delete file",
      };
    }
  }
);

/**
 * Get a pre-signed download URL for a file
 * Available to all authenticated users
 *
 * @param user - Authenticated user context
 * @param input - Pre-signed URL request
 * @returns Pre-signed URL with expiration
 */
export const getPresignedUrlAction = withAccess(
  async (
    user: AuthContext,
    input: PresignedUrlInput
  ): Promise<PresignedUrlResponse> => {
    try {
      // Validate input
      const validated = presignedUrlSchema.parse(input);

      // Get file record
      const file = await prisma.file.findUnique({
        where: { id: validated.fileId },
      });

      if (!file) {
        throw new NotFoundError("File not found");
      }

      // Verify file exists in S3
      const exists = await fileExists(file.key);
      if (!exists) {
        throw new NotFoundError("File not found in storage");
      }

      // Generate pre-signed URL (default 1 hour, max 24 hours)
      const expiresIn = validated.expiresIn || 3600;
      const url = await getPresignedDownloadUrl(file.key, expiresIn);

      return {
        success: true,
        data: {
          url,
          expiresIn,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to generate download URL",
      };
    }
  }
);

/**
 * List all files (optionally filtered by category or reference)
 * Available to admin and instructor roles
 *
 * @param user - Authenticated user context
 * @param category - Optional category filter
 * @param referencedBy - Optional reference filter
 * @returns List of files
 */
export const listFilesAction = withRole(["admin", "instructor"])(
  async (
    user: AuthContext,
    category?: string,
    referencedBy?: string
  ): Promise<FileListResponse> => {
    try {
      const files = await prisma.file.findMany({
        where: {
          ...(category && { category }),
          ...(referencedBy && { referencedBy }),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to list files",
      };
    }
  }
);

/**
 * Get a single file by ID
 * Available to all authenticated users
 *
 * @param user - Authenticated user context
 * @param fileId - File ID
 * @returns File details
 */
export const getFileAction = withAccess(
  async (user: AuthContext, fileId: string) => {
    try {
      if (!fileId) {
        throw new ValidationError("File ID is required");
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundError("File not found");
      }

      return {
        success: true,
        data: file,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Failed to get file",
      };
    }
  }
);
