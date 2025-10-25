/**
 * Content Mapping Types & Schemas
 *
 * Handles video-to-content mappings (objectives, bullets, sub-bullets)
 * with AI suggestions and manual overrides.
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const mappingSourceSchema = z.enum([
  "ai_suggested",
  "ai_confirmed",
  "manual",
]);

export type MappingSource = z.infer<typeof mappingSourceSchema>;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Suggest mappings for a video
 */
export const suggestMappingsSchema = z.object({
  videoId: z.string().cuid(),
  certificationId: z.string().cuid(),
});

export type SuggestMappingsInput = z.infer<typeof suggestMappingsSchema>;

/**
 * Apply (accept/confirm) AI mapping suggestions
 */
export const applyMappingSuggestionsSchema = z.object({
  videoId: z.string().cuid(),
  mappings: z.array(
    z.object({
      // Only ONE should be populated
      objectiveId: z.string().cuid().optional(),
      bulletId: z.string().cuid().optional(),
      subBulletId: z.string().cuid().optional(),

      isPrimary: z.boolean().default(false),
      confidence: z.number().min(0).max(1), // 0.0 to 1.0
    })
  ),
});

export type ApplyMappingSuggestionsInput = z.infer<
  typeof applyMappingSuggestionsSchema
>;

/**
 * Add a manual mapping
 */
export const addManualMappingSchema = z.object({
  videoId: z.string().cuid(),

  // Only ONE should be populated
  objectiveId: z.string().cuid().optional(),
  bulletId: z.string().cuid().optional(),
  subBulletId: z.string().cuid().optional(),

  isPrimary: z.boolean().default(false),
});

export type AddManualMappingInput = z.infer<typeof addManualMappingSchema>;

/**
 * Remove a mapping
 */
export const removeMappingSchema = z.object({
  mappingId: z.string().cuid(),
});

export type RemoveMappingInput = z.infer<typeof removeMappingSchema>;

/**
 * Update primary mapping
 */
export const updatePrimaryMappingSchema = z.object({
  videoId: z.string().cuid(),
  mappingId: z.string().cuid(),
});

export type UpdatePrimaryMappingInput = z.infer<
  typeof updatePrimaryMappingSchema
>;

/**
 * Get mappings for a video
 */
export const getVideoMappingsSchema = z.object({
  videoId: z.string().cuid(),
});

export type GetVideoMappingsInput = z.infer<typeof getVideoMappingsSchema>;

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Content mapping with full hierarchy
 */
export interface VideoContentMappingWithHierarchy {
  id: string;
  videoId: string;

  // Mapping level (only ONE populated)
  objectiveId: string | null;
  bulletId: string | null;
  subBulletId: string | null;

  // Metadata
  isPrimary: boolean;
  confidence: number;
  mappingSource: MappingSource;
  createdAt: Date;

  // Relations (populated based on mapping level)
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
}

/**
 * AI mapping suggestion (before being saved to DB)
 */
export interface MappingSuggestion {
  // Content identity (only ONE populated)
  objectiveId?: string;
  bulletId?: string;
  subBulletId?: string;

  // Hierarchy for display
  domain: {
    id: string;
    name: string;
  };
  objective: {
    id: string;
    code: string;
    description: string;
  };
  bullet?: {
    id: string;
    text: string;
  };
  subBullet?: {
    id: string;
    text: string;
  };

  // AI metadata
  confidence: number;
  isPrimarySuggestion: boolean;
}

/**
 * Summary of all mappings for a video
 */
export interface VideoMappingsSummary {
  videoId: string;
  totalMappings: number;
  primaryMapping: VideoContentMappingWithHierarchy | null;
  otherMappings: VideoContentMappingWithHierarchy[];
}

/**
 * Search result for manual mapping combobox
 */
export interface ContentSearchResult {
  // Content identity
  type: "objective" | "bullet" | "sub_bullet";
  id: string;

  // Display info
  hierarchy: string; // e.g., "1.1 | Malware attacks | Trojan.Generic"
  domainName: string;
  objectiveCode: string;
  objectiveDescription: string;
  bulletText?: string;
  subBulletText?: string;
}
