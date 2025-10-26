"use server";

/**
 * Document Content Mapping Server Actions
 *
 * Handles document-to-content mappings with AI suggestions and manual management.
 * All actions are RBAC-protected.
 */

import { prisma } from "@/lib/prisma";
import { withAccess } from "@/lib/middleware/withAccess";
import type { AuthContext } from "@/lib/auth/types";
import { suggestMappingsForDocument } from "../services/documentAIMapping.service";
import {
  suggestDocumentMappingsSchema,
  applyDocumentMappingSuggestionsSchema,
  addManualDocumentMappingSchema,
  removeDocumentMappingSchema,
  updatePrimaryDocumentMappingSchema,
  getDocumentMappingsSchema,
  type DocumentContentMappingWithHierarchy,
  type DocumentMappingsSummary,
  type DocumentMappingSuggestion,
} from "../types/documentMapping.types";

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

/**
 * Generate AI mapping suggestions for a document
 */
export const suggestDocumentMappings = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: DocumentMappingSuggestion[]; error?: string }> => {
    try {
      const validated = suggestDocumentMappingsSchema.parse(input);

      // Verify document exists
      const document = await prisma.document.findUnique({
        where: { id: validated.documentId },
        select: { id: true, s3Key: true, mimeType: true },
      });

      if (!document) {
        return { success: false, error: "Document not found" };
      }

      if (!document.s3Key || !document.mimeType) {
        return {
          success: false,
          error: "Document metadata incomplete",
        };
      }

      // Generate AI suggestions
      const suggestions = await suggestMappingsForDocument(
        validated.documentId,
        validated.certificationId
      );

      return { success: true, data: suggestions };
    } catch (error) {
      console.error("[suggestDocumentMappings] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// ============================================================================
// APPLY MAPPINGS
// ============================================================================

/**
 * Apply (accept/confirm) AI mapping suggestions
 * Bulk operation to save multiple mappings at once
 */
export const applyDocumentMappingSuggestions = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const validated = applyDocumentMappingSuggestionsSchema.parse(input);

      // Validate that each mapping has exactly ONE level populated
      for (const mapping of validated.mappings) {
        const populatedFields = [
          mapping.objectiveId,
          mapping.bulletId,
          mapping.subBulletId,
        ].filter((field): field is string => Boolean(field));

        if (populatedFields.length !== 1) {
          return {
            success: false,
            error:
              "Each mapping must have exactly one of: objectiveId, bulletId, or subBulletId",
          };
        }
      }

      // If any mapping is marked as primary, clear existing primary mappings
      const hasPrimary = validated.mappings.some(
        (m: { isPrimary: boolean }) => m.isPrimary
      );
      if (hasPrimary) {
        await prisma.documentContentMapping.updateMany({
          where: { documentId: validated.documentId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create all mappings
      const created = await prisma.documentContentMapping.createMany({
        data: validated.mappings.map(
          (m: {
            objectiveId?: string;
            bulletId?: string;
            subBulletId?: string;
            isPrimary: boolean;
            confidence: number;
          }) => ({
          documentId: validated.documentId,
          objectiveId: m.objectiveId || null,
          bulletId: m.bulletId || null,
          subBulletId: m.subBulletId || null,
          isPrimary: m.isPrimary,
          confidence: m.confidence,
          mappingSource: "ai_confirmed", // AI suggestion confirmed by user
        })
        ),
      });

      return { success: true, data: created.count };
    } catch (error) {
      console.error("[applyDocumentMappingSuggestions] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// ============================================================================
// MANUAL MAPPINGS
// ============================================================================

/**
 * Manually add a content mapping
 */
export const addManualDocumentMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      const validated = addManualDocumentMappingSchema.parse(input);

      // Validate exactly ONE level is populated
      const populatedFields = [
        validated.objectiveId,
        validated.bulletId,
        validated.subBulletId,
      ].filter(Boolean);

      if (populatedFields.length !== 1) {
        return {
          success: false,
          error:
            "Must specify exactly one of: objectiveId, bulletId, or subBulletId",
        };
      }

      // If marking as primary, clear existing primary
      if (validated.isPrimary) {
        await prisma.documentContentMapping.updateMany({
          where: { documentId: validated.documentId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Check if mapping already exists
      const existing = await prisma.documentContentMapping.findFirst({
        where: {
          documentId: validated.documentId,
          ...(validated.objectiveId && {
            objectiveId: validated.objectiveId,
          }),
          ...(validated.bulletId && { bulletId: validated.bulletId }),
          ...(validated.subBulletId && { subBulletId: validated.subBulletId }),
        },
      });

      if (existing) {
        return { success: false, error: "Mapping already exists" };
      }

      // Create mapping
      const mapping = await prisma.documentContentMapping.create({
        data: {
          documentId: validated.documentId,
          objectiveId: validated.objectiveId || null,
          bulletId: validated.bulletId || null,
          subBulletId: validated.subBulletId || null,
          isPrimary: validated.isPrimary,
          confidence: 1.0, // Manual mappings have 100% confidence
          mappingSource: "manual",
        },
      });

      return { success: true, data: mapping.id };
    } catch (error) {
      console.error("[addManualDocumentMapping] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Remove a content mapping
 */
export const removeDocumentMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = removeDocumentMappingSchema.parse(input);

      await prisma.documentContentMapping.delete({
        where: { id: validated.mappingId },
      });

      return { success: true };
    } catch (error) {
      console.error("[removeDocumentMapping] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Update primary mapping for a document
 * Clears existing primary and sets new one
 */
export const updatePrimaryDocumentMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = updatePrimaryDocumentMappingSchema.parse(input);

      // Clear existing primary
      await prisma.documentContentMapping.updateMany({
        where: { documentId: validated.documentId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set new primary
      await prisma.documentContentMapping.update({
        where: { id: validated.mappingId },
        data: { isPrimary: true },
      });

      return { success: true };
    } catch (error) {
      console.error("[updatePrimaryDocumentMapping] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// ============================================================================
// QUERY MAPPINGS
// ============================================================================

/**
 * Get all mappings for a document with full hierarchy
 */
export const getDocumentMappings = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{
    success: boolean;
    data?: DocumentMappingsSummary;
    error?: string;
  }> => {
    try {
      const validated = getDocumentMappingsSchema.parse(input);

      const mappings = await prisma.documentContentMapping.findMany({
        where: { documentId: validated.documentId },
        include: {
          objective: {
            include: {
              domain: {
                select: { id: true, name: true },
              },
            },
          },
          bullet: {
            include: {
              objective: {
                include: {
                  domain: {
                    select: { id: true, name: true },
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
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { confidence: "desc" }],
      });

      const primaryMapping = mappings.find((m) => m.isPrimary) || null;
      const otherMappings = mappings.filter((m) => !m.isPrimary);

      const summary: DocumentMappingsSummary = {
        documentId: validated.documentId,
        totalMappings: mappings.length,
        primaryMapping:
          primaryMapping as DocumentContentMappingWithHierarchy | null,
        otherMappings: otherMappings as DocumentContentMappingWithHierarchy[],
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error("[getDocumentMappings] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
