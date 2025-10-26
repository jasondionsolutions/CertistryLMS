import { z } from "zod";

// =============================================================================
// UNIFIED CONTENT TYPE
// =============================================================================

export const contentTypeEnum = z.enum(["video", "document"]);
export type ContentType = z.infer<typeof contentTypeEnum>;

export const difficultyLevelEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type DifficultyLevel = z.infer<typeof difficultyLevelEnum>;

// Unified content item (Video or Document)
export interface UnifiedContentItem {
  id: string;
  contentType: ContentType;
  title: string;
  description: string | null;

  // Common metadata
  fileSize: number | null;
  difficultyLevel: DifficultyLevel;
  createdAt: Date;
  updatedAt: Date;

  // Type-specific fields
  duration?: number | null; // Video only (seconds)
  thumbnailUrl?: string | null; // Video only
  videoCode?: string | null; // Video only
  transcript?: string | null; // Video only
  transcriptionStatus?: string; // Video only
  type?: string; // Document only (pdf, docx, txt)
  version?: number; // Document only

  // Relationships
  certificationId?: string | null;
  certification?: { name: string; code: string } | null;
  mappingCount: number; // Count of content mappings
  isPrimaryFor: number; // Count where isPrimary = true
}

// =============================================================================
// SEARCH & FILTER SCHEMAS
// =============================================================================

export const contentSearchSchema = z.object({
  query: z.string().optional(), // Search term
  contentType: contentTypeEnum.optional(), // Filter by video/document
  certificationId: z.string().optional(), // Filter by certification
  difficulty: difficultyLevelEnum.optional(), // Filter by difficulty
  mappedStatus: z.enum(["all", "mapped", "unmapped"]).optional(), // Mapping filter
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string

  // Sorting
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "duration", "fileSize"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
});

export type ContentSearchInput = z.infer<typeof contentSearchSchema>;

export const contentSearchResultSchema = z.object({
  items: z.array(z.any()), // UnifiedContentItem[]
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type ContentSearchResult = {
  items: UnifiedContentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// =============================================================================
// STATISTICS SCHEMAS
// =============================================================================

export interface ContentStats {
  // Overall counts
  totalVideos: number;
  totalDocuments: number;
  totalContent: number;

  // Video-specific stats
  totalVideoDuration: number; // Total seconds
  totalVideoDurationFormatted: string; // "12h 34m"

  // Storage stats
  totalStorage: number; // Total bytes
  totalStorageFormatted: string; // "1.2 GB"
  videoStorage: number;
  documentStorage: number;

  // Breakdown by content type
  byContentType: {
    videos: number;
    documents: number;
  };

  // Breakdown by certification
  byCertification: Array<{
    certificationId: string | null;
    certificationName: string | null;
    certificationCode: string | null;
    count: number;
  }>;

  // Breakdown by difficulty
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };

  // Mapping stats
  mappedContent: number;
  unmappedContent: number;
  mappingCoverage: number; // Percentage
}

// =============================================================================
// BULK OPERATIONS SCHEMAS
// =============================================================================

export const bulkDeleteSchema = z.object({
  contentIds: z.array(z.string()).min(1, "At least one item must be selected"),
  contentType: contentTypeEnum,
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

export const bulkRemapSchema = z.object({
  contentIds: z.array(z.string()).min(1, "At least one item must be selected"),
  contentType: contentTypeEnum,
  certificationId: z.string().min(1, "Certification is required"),
});

export type BulkRemapInput = z.infer<typeof bulkRemapSchema>;

// =============================================================================
// PREVIEW SCHEMAS
// =============================================================================

export interface VideoPreview {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  transcript: string | null;
  captionsVttUrl: string | null;
  mappings: Array<{
    id: string;
    isPrimary: boolean;
    hierarchy: string; // "Domain > Objective > Bullet"
  }>;
}

export interface DocumentPreview {
  id: string;
  title: string;
  url: string;
  type: string; // pdf, docx, txt
  textPreview: string | null; // First 500 words for docx/txt
  mappings: Array<{
    id: string;
    isPrimary: boolean;
    hierarchy: string;
  }>;
}

export type ContentPreview = VideoPreview | DocumentPreview;

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface CertificationOption {
  id: string;
  name: string;
  code: string;
}
