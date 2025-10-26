"use server";

/**
 * Content Library Server Actions
 *
 * Unified search, filter, and pagination for videos and documents
 */

import { prisma } from "@/lib/prisma";
import { withAccess } from "@/lib/middleware/withAccess";
import type { AuthContext } from "@/lib/auth/types";
import {
  contentSearchSchema,
  type ContentSearchInput,
  type ContentSearchResult,
  type UnifiedContentItem,
} from "../types/contentLibrary.types";

/**
 * Search and filter content library with pagination
 * Combines videos and documents into a unified result set
 */
export const searchContentLibrary = withAccess(
  async (
    user: AuthContext,
    input: ContentSearchInput
  ): Promise<{ success: boolean; data?: ContentSearchResult; error?: string }> => {
    try {
      // Validate input
      const validated = contentSearchSchema.parse(input);
      const {
        query,
        contentType,
        certificationId,
        difficulty,
        mappedStatus,
        dateFrom,
        dateTo,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        pageSize = 10,
      } = validated;

      // Build where conditions for videos
      const videoWhere: any = { isActive: true };
      const documentWhere: any = { isActive: true };

      // Search query (title, description, transcript for videos)
      if (query) {
        const searchTerm = { contains: query, mode: "insensitive" as const };
        videoWhere.OR = [
          { title: searchTerm },
          { description: searchTerm },
          { transcript: searchTerm },
          { videoCode: searchTerm },
        ];
        documentWhere.OR = [
          { title: searchTerm },
          { description: searchTerm },
        ];
      }

      // Certification filter
      if (certificationId) {
        videoWhere.certificationId = certificationId;
        // Documents don't have direct certification - filter via mappings later
      }

      // Difficulty filter
      if (difficulty) {
        videoWhere.difficultyLevel = difficulty;
        documentWhere.difficultyLevel = difficulty;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const dateFilter: any = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) dateFilter.lte = new Date(dateTo);

        videoWhere.createdAt = dateFilter;
        documentWhere.createdAt = dateFilter;
      }

      // Fetch videos and documents based on contentType filter
      const shouldFetchVideos = !contentType || contentType === "video";
      const shouldFetchDocuments = !contentType || contentType === "document";

      const [videos, documents] = await Promise.all([
        shouldFetchVideos
          ? prisma.video.findMany({
              where: videoWhere,
              include: {
                certification: {
                  select: { name: true, code: true },
                },
                contentMappings: {
                  select: { id: true, isPrimary: true },
                },
              },
            })
          : [],
        shouldFetchDocuments
          ? prisma.document.findMany({
              where: documentWhere,
              include: {
                contentMappings: {
                  select: { id: true, isPrimary: true },
                },
              },
            })
          : [],
      ]);

      // Convert to unified content items
      let allContent: UnifiedContentItem[] = [
        ...videos.map((v) => ({
          id: v.id,
          contentType: "video" as const,
          title: v.title,
          description: v.description,
          fileSize: v.fileSize,
          difficultyLevel: v.difficultyLevel as any,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          duration: v.duration,
          thumbnailUrl: v.thumbnailUrl,
          videoCode: v.videoCode,
          transcript: v.transcript,
          transcriptionStatus: v.transcriptionStatus,
          certificationId: v.certificationId,
          certification: v.certification,
          mappingCount: v.contentMappings.length,
          isPrimaryFor: v.contentMappings.filter((m) => m.isPrimary).length,
        })),
        ...documents.map((d) => ({
          id: d.id,
          contentType: "document" as const,
          title: d.title,
          description: d.description,
          fileSize: d.fileSize,
          difficultyLevel: d.difficultyLevel as any,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          type: d.type,
          version: d.version,
          certificationId: null, // Documents don't have direct certification
          certification: null,
          mappingCount: d.contentMappings.length,
          isPrimaryFor: d.contentMappings.filter((m) => m.isPrimary).length,
        })),
      ];

      // Filter by mapped status
      if (mappedStatus === "mapped") {
        allContent = allContent.filter((item) => item.mappingCount > 0);
      } else if (mappedStatus === "unmapped") {
        allContent = allContent.filter((item) => item.mappingCount === 0);
      }

      // Filter documents by certification (via mappings)
      if (certificationId && shouldFetchDocuments) {
        // For documents, we need to check if they have mappings to objectives in this certification
        // This is more complex - for MVP, we'll skip this filter for documents
        // TODO: Implement certification filter for documents via mappings
      }

      // Sort
      allContent.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "duration":
            aValue = a.duration ?? 0;
            bValue = b.duration ?? 0;
            break;
          case "fileSize":
            aValue = a.fileSize ?? 0;
            bValue = b.fileSize ?? 0;
            break;
          case "updatedAt":
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          case "createdAt":
          default:
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const total = allContent.length;
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;
      const items = allContent.slice(skip, skip + pageSize);

      return {
        success: true,
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      console.error("[searchContentLibrary] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to search content",
      };
    }
  }
);

/**
 * Get a list of available certifications for filtering
 */
export const getCertifications = withAccess(
  async (
    user: AuthContext
  ): Promise<{
    success: boolean;
    data?: Array<{ id: string; name: string; code: string }>;
    error?: string;
  }> => {
    try {
      const certifications = await prisma.certification.findMany({
        where: { isActive: true, isArchived: false },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });

      return { success: true, data: certifications };
    } catch (error) {
      console.error("[getCertifications] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch certifications",
      };
    }
  }
);
