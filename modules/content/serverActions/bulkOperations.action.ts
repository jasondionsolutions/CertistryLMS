"use server";

/**
 * Bulk Operations Server Actions
 *
 * Bulk delete and re-map operations for content library
 */

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import type { AuthContext } from "@/lib/auth/types";
import {
  bulkDeleteSchema,
  bulkRemapSchema,
  type BulkDeleteInput,
  type BulkRemapInput,
} from "../types/contentLibrary.types";

/**
 * Bulk delete videos or documents
 * Cascade deletes all associated mappings
 */
export const bulkDeleteContent = withPermission("content.delete")(
  async (
    user: AuthContext,
    input: BulkDeleteInput
  ): Promise<{ success: boolean; deleted?: number; error?: string }> => {
    try {
      // Validate input
      const validated = bulkDeleteSchema.parse(input);
      const { contentIds, contentType } = validated;

      let deleted = 0;

      if (contentType === "video") {
        // Delete videos (cascade deletes mappings via Prisma schema)
        const result = await prisma.video.deleteMany({
          where: {
            id: { in: contentIds },
            isActive: true,
          },
        });
        deleted = result.count;
      } else if (contentType === "document") {
        // Delete documents (cascade deletes mappings via Prisma schema)
        const result = await prisma.document.deleteMany({
          where: {
            id: { in: contentIds },
            isActive: true,
          },
        });
        deleted = result.count;
      }

      return {
        success: true,
        deleted,
      };
    } catch (error) {
      console.error("[bulkDeleteContent] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete content",
      };
    }
  }
);

/**
 * Bulk re-map videos to a certification
 * Updates the certificationId for all selected videos
 * Note: Documents don't have direct certification mapping
 */
export const bulkRemapContent = withPermission("content.update")(
  async (
    user: AuthContext,
    input: BulkRemapInput
  ): Promise<{ success: boolean; updated?: number; error?: string }> => {
    try {
      // Validate input
      const validated = bulkRemapSchema.parse(input);
      const { contentIds, contentType, certificationId } = validated;

      // Verify certification exists
      const certification = await prisma.certification.findUnique({
        where: { id: certificationId, isActive: true },
      });

      if (!certification) {
        return {
          success: false,
          error: "Certification not found or inactive",
        };
      }

      let updated = 0;

      if (contentType === "video") {
        // Update videos certification
        const result = await prisma.video.updateMany({
          where: {
            id: { in: contentIds },
            isActive: true,
          },
          data: {
            certificationId,
          },
        });
        updated = result.count;
      } else if (contentType === "document") {
        // Documents don't have direct certification mapping
        // This would require creating mappings to objectives in that certification
        // For MVP, we'll skip this functionality
        return {
          success: false,
          error:
            "Bulk re-mapping documents is not supported. Documents are mapped to objectives, not certifications.",
        };
      }

      return {
        success: true,
        updated,
      };
    } catch (error) {
      console.error("[bulkRemapContent] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to re-map content",
      };
    }
  }
);
