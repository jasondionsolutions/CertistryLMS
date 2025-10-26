"use server";

/**
 * Content Statistics Server Actions
 *
 * Aggregated statistics for the content library
 */

import { prisma } from "@/lib/prisma";
import { withAccess } from "@/lib/middleware/withAccess";
import type { AuthContext } from "@/lib/auth/types";
import type { ContentStats } from "../types/contentLibrary.types";

/**
 * Get comprehensive statistics for the content library
 */
export const getContentStats = withAccess(
  async (
    user: AuthContext
  ): Promise<{ success: boolean; data?: ContentStats; error?: string }> => {
    try {
      // Run all queries in parallel for performance
      const [
        videoCount,
        documentCount,
        videoDurationSum,
        videoStorageSum,
        documentStorageSum,
        videosWithMappings,
        documentsWithMappings,
        videosByDifficulty,
        documentsByDifficulty,
        videosByCertification,
      ] = await Promise.all([
        // Total counts
        prisma.video.count({ where: { isActive: true } }),
        prisma.document.count({ where: { isActive: true } }),

        // Video duration sum
        prisma.video.aggregate({
          where: { isActive: true },
          _sum: { duration: true },
        }),

        // Storage sums
        prisma.video.aggregate({
          where: { isActive: true },
          _sum: { fileSize: true },
        }),
        prisma.document.aggregate({
          where: { isActive: true },
          _sum: { fileSize: true },
        }),

        // Mapping counts
        prisma.video.count({
          where: {
            isActive: true,
            contentMappings: { some: {} },
          },
        }),
        prisma.document.count({
          where: {
            isActive: true,
            contentMappings: { some: {} },
          },
        }),

        // By difficulty
        prisma.video.groupBy({
          by: ["difficultyLevel"],
          where: { isActive: true },
          _count: true,
        }),
        prisma.document.groupBy({
          by: ["difficultyLevel"],
          where: { isActive: true },
          _count: true,
        }),

        // Videos by certification
        prisma.video.groupBy({
          by: ["certificationId"],
          where: { isActive: true },
          _count: true,
        }),
      ]);

      // Calculate totals
      const totalContent = videoCount + documentCount;
      const totalVideoDuration = videoDurationSum._sum.duration ?? 0;
      const videoStorage = videoStorageSum._sum.fileSize ?? 0;
      const documentStorage = documentStorageSum._sum.fileSize ?? 0;
      const totalStorage = videoStorage + documentStorage;
      const mappedContent = videosWithMappings + documentsWithMappings;
      const unmappedContent = totalContent - mappedContent;

      // Format duration (seconds to "Xh Ym")
      const hours = Math.floor(totalVideoDuration / 3600);
      const minutes = Math.floor((totalVideoDuration % 3600) / 60);
      const totalVideoDurationFormatted =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Format storage (bytes to human readable)
      const totalStorageFormatted = formatBytes(totalStorage);

      // Aggregate difficulty counts
      const difficultyMap: Record<string, number> = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      };

      videosByDifficulty.forEach((item) => {
        difficultyMap[item.difficultyLevel] =
          (difficultyMap[item.difficultyLevel] ?? 0) + item._count;
      });

      documentsByDifficulty.forEach((item) => {
        difficultyMap[item.difficultyLevel] =
          (difficultyMap[item.difficultyLevel] ?? 0) + item._count;
      });

      // Get certification details for breakdown
      const certificationIds = videosByCertification
        .map((v) => v.certificationId)
        .filter((id): id is string => id !== null);

      const certifications = await prisma.certification.findMany({
        where: { id: { in: certificationIds } },
        select: { id: true, name: true, code: true },
      });

      const certificationMap = new Map(
        certifications.map((c) => [c.id, c])
      );

      const byCertification = videosByCertification.map((item) => {
        const cert = item.certificationId
          ? certificationMap.get(item.certificationId)
          : null;
        return {
          certificationId: item.certificationId,
          certificationName: cert?.name ?? null,
          certificationCode: cert?.code ?? null,
          count: item._count,
        };
      });

      // Calculate mapping coverage percentage
      const mappingCoverage =
        totalContent > 0 ? Math.round((mappedContent / totalContent) * 100) : 0;

      const stats: ContentStats = {
        // Overall counts
        totalVideos: videoCount,
        totalDocuments: documentCount,
        totalContent,

        // Video-specific stats
        totalVideoDuration,
        totalVideoDurationFormatted,

        // Storage stats
        totalStorage,
        totalStorageFormatted,
        videoStorage,
        documentStorage,

        // Breakdown by content type
        byContentType: {
          videos: videoCount,
          documents: documentCount,
        },

        // Breakdown by certification
        byCertification,

        // Breakdown by difficulty
        byDifficulty: {
          beginner: difficultyMap.beginner,
          intermediate: difficultyMap.intermediate,
          advanced: difficultyMap.advanced,
        },

        // Mapping stats
        mappedContent,
        unmappedContent,
        mappingCoverage,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("[getContentStats] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch content statistics",
      };
    }
  }
);

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
