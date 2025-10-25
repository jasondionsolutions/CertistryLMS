"use server";

/**
 * Content Mapping Server Actions
 *
 * Handles video-to-content mappings with AI suggestions and manual management.
 * All actions are RBAC-protected.
 */

import { prisma } from "@/lib/prisma";
import { withAccess } from "@/lib/middleware/withAccess";
import type { AuthContext } from "@/lib/auth/types";
import { suggestMappingsForVideo } from "../services/aiMapping.service";
import {
  suggestMappingsSchema,
  applyMappingSuggestionsSchema,
  addManualMappingSchema,
  removeMappingSchema,
  updatePrimaryMappingSchema,
  getVideoMappingsSchema,
  type VideoContentMappingWithHierarchy,
  type VideoMappingsSummary,
  type ContentSearchResult,
  type MappingSuggestion,
} from "../types/mapping.types";

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

/**
 * Generate AI mapping suggestions for a video
 */
export const suggestMappings = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: MappingSuggestion[]; error?: string }> => {
    try {
      const validated = suggestMappingsSchema.parse(input);

      // Verify video exists
      const video = await prisma.video.findUnique({
        where: { id: validated.videoId },
        select: { id: true, transcript: true, transcriptionStatus: true },
      });

      if (!video) {
        return { success: false, error: "Video not found" };
      }

      if (!video.transcript || video.transcriptionStatus !== "completed") {
        return {
          success: false,
          error: "Video transcript not available",
        };
      }

      // Generate AI suggestions
      const suggestions = await suggestMappingsForVideo(
        validated.videoId,
        validated.certificationId
      );

      return { success: true, data: suggestions };
    } catch (error) {
      console.error("[suggestMappings] Error:", error);
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
export const applyMappingSuggestions = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const validated = applyMappingSuggestionsSchema.parse(input);

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
        await prisma.videoContentMapping.updateMany({
          where: { videoId: validated.videoId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create all mappings
      const created = await prisma.videoContentMapping.createMany({
        data: validated.mappings.map(
          (m: {
            objectiveId?: string;
            bulletId?: string;
            subBulletId?: string;
            isPrimary: boolean;
            confidence: number;
          }) => ({
          videoId: validated.videoId,
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
      console.error("[applyMappingSuggestions] Error:", error);
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
export const addManualMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      const validated = addManualMappingSchema.parse(input);

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
        await prisma.videoContentMapping.updateMany({
          where: { videoId: validated.videoId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Check if mapping already exists
      const existing = await prisma.videoContentMapping.findFirst({
        where: {
          videoId: validated.videoId,
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
      const mapping = await prisma.videoContentMapping.create({
        data: {
          videoId: validated.videoId,
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
      console.error("[addManualMapping] Error:", error);
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
export const removeMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = removeMappingSchema.parse(input);

      await prisma.videoContentMapping.delete({
        where: { id: validated.mappingId },
      });

      return { success: true };
    } catch (error) {
      console.error("[removeMapping] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Update primary mapping for a video
 * Clears existing primary and sets new one
 */
export const updatePrimaryMapping = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validated = updatePrimaryMappingSchema.parse(input);

      // Clear existing primary
      await prisma.videoContentMapping.updateMany({
        where: { videoId: validated.videoId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set new primary
      await prisma.videoContentMapping.update({
        where: { id: validated.mappingId },
        data: { isPrimary: true },
      });

      return { success: true };
    } catch (error) {
      console.error("[updatePrimaryMapping] Error:", error);
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
 * Get all mappings for a video with full hierarchy
 */
export const getVideoMappings = withAccess(
  async (
    user: AuthContext,
    input: unknown
  ): Promise<{
    success: boolean;
    data?: VideoMappingsSummary;
    error?: string;
  }> => {
    try {
      const validated = getVideoMappingsSchema.parse(input);

      const mappings = await prisma.videoContentMapping.findMany({
        where: { videoId: validated.videoId },
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

      const summary: VideoMappingsSummary = {
        videoId: validated.videoId,
        totalMappings: mappings.length,
        primaryMapping:
          primaryMapping as VideoContentMappingWithHierarchy | null,
        otherMappings: otherMappings as VideoContentMappingWithHierarchy[],
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error("[getVideoMappings] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// ============================================================================
// SEARCH CONTENT (for manual combobox)
// ============================================================================

/**
 * Search objectives, bullets, and sub-bullets for manual mapping
 */
export const searchContent = withAccess(
  async (
    user: AuthContext,
    query: string,
    certificationId: string
  ): Promise<{
    success: boolean;
    data?: ContentSearchResult[];
    error?: string;
  }> => {
    try {
      if (!query || query.trim().length < 2) {
        return { success: true, data: [] };
      }

      const searchTerm = query.trim().toLowerCase();

      // Search objectives
      const objectives = await prisma.certificationObjective.findMany({
        where: {
          domain: { certificationId },
          OR: [
            { code: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          domain: { select: { name: true } },
        },
        take: 10,
      });

      // Search bullets
      const bullets = await prisma.bullet.findMany({
        where: {
          objective: {
            domain: { certificationId },
          },
          text: { contains: searchTerm, mode: "insensitive" },
        },
        include: {
          objective: {
            include: {
              domain: { select: { name: true } },
            },
          },
        },
        take: 10,
      });

      // Search sub-bullets
      const subBullets = await prisma.subBullet.findMany({
        where: {
          bullet: {
            objective: {
              domain: { certificationId },
            },
          },
          text: { contains: searchTerm, mode: "insensitive" },
        },
        include: {
          bullet: {
            include: {
              objective: {
                include: {
                  domain: { select: { name: true } },
                },
              },
            },
          },
        },
        take: 10,
      });

      // Format results
      const results: ContentSearchResult[] = [
        ...objectives.map(
          (obj: {
            id: string;
            code: string;
            description: string;
            domain: { name: string };
          }) => ({
          type: "objective" as const,
          id: obj.id,
          hierarchy: `${obj.code} | ${obj.description.slice(0, 60)}...`,
          domainName: obj.domain.name,
          objectiveCode: obj.code,
          objectiveDescription: obj.description,
        })
        ),
        ...bullets.map(
          (bullet: {
            id: string;
            text: string;
            objective: {
              id: string;
              code: string;
              description: string;
              domain: { name: string };
            };
          }) => ({
          type: "bullet" as const,
          id: bullet.id,
          hierarchy: `${bullet.objective.code} | ${bullet.text.slice(0, 60)}...`,
          domainName: bullet.objective.domain.name,
          objectiveCode: bullet.objective.code,
          objectiveDescription: bullet.objective.description,
          bulletText: bullet.text,
        })
        ),
        ...subBullets.map(
          (subBullet: {
            id: string;
            text: string;
            bullet: {
              id: string;
              text: string;
              objective: {
                id: string;
                code: string;
                description: string;
                domain: { name: string };
              };
            };
          }) => ({
          type: "sub_bullet" as const,
          id: subBullet.id,
          hierarchy: `${subBullet.bullet.objective.code} | ${subBullet.bullet.text.slice(0, 30)}... | ${subBullet.text.slice(0, 30)}...`,
          domainName: subBullet.bullet.objective.domain.name,
          objectiveCode: subBullet.bullet.objective.code,
          objectiveDescription: subBullet.bullet.objective.description,
          bulletText: subBullet.bullet.text,
          subBulletText: subBullet.text,
        })
        ),
      ];

      return { success: true, data: results.slice(0, 20) }; // Limit to 20 total results
    } catch (error) {
      console.error("[searchContent] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
