/**
 * Document Content Mapping Types & Schemas
 *
 * Handles document-to-content mappings (objectives, bullets, sub-bullets)
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
 * Suggest mappings for a document
 */
export const suggestDocumentMappingsSchema = z.object({
  documentId: z.string().cuid(),
  certificationId: z.string().cuid(),
});

export type SuggestDocumentMappingsInput = z.infer<
  typeof suggestDocumentMappingsSchema
>;

/**
 * Apply (accept/confirm) AI mapping suggestions
 */
export const applyDocumentMappingSuggestionsSchema = z.object({
  documentId: z.string().cuid(),
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

export type ApplyDocumentMappingSuggestionsInput = z.infer<
  typeof applyDocumentMappingSuggestionsSchema
>;

/**
 * Add a manual mapping
 */
export const addManualDocumentMappingSchema = z.object({
  documentId: z.string().cuid(),

  // Only ONE should be populated
  objectiveId: z.string().cuid().optional(),
  bulletId: z.string().cuid().optional(),
  subBulletId: z.string().cuid().optional(),

  isPrimary: z.boolean().default(false),
});

export type AddManualDocumentMappingInput = z.infer<
  typeof addManualDocumentMappingSchema
>;

/**
 * Remove a mapping
 */
export const removeDocumentMappingSchema = z.object({
  mappingId: z.string().cuid(),
});

export type RemoveDocumentMappingInput = z.infer<
  typeof removeDocumentMappingSchema
>;

/**
 * Update primary mapping
 */
export const updatePrimaryDocumentMappingSchema = z.object({
  documentId: z.string().cuid(),
  mappingId: z.string().cuid(),
});

export type UpdatePrimaryDocumentMappingInput = z.infer<
  typeof updatePrimaryDocumentMappingSchema
>;

/**
 * Get mappings for a document
 */
export const getDocumentMappingsSchema = z.object({
  documentId: z.string().cuid(),
});

export type GetDocumentMappingsInput = z.infer<
  typeof getDocumentMappingsSchema
>;

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Content mapping with full hierarchy
 */
export interface DocumentContentMappingWithHierarchy {
  id: string;
  documentId: string;

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
export interface DocumentMappingSuggestion {
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
 * Summary of all mappings for a document
 */
export interface DocumentMappingsSummary {
  documentId: string;
  totalMappings: number;
  primaryMapping: DocumentContentMappingWithHierarchy | null;
  otherMappings: DocumentContentMappingWithHierarchy[];
}
