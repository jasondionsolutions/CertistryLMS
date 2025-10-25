/**
 * Server action for checking embedding status
 */

"use server";

import { prisma } from "@/lib/prisma";
import { withAccess } from "@/lib/middleware/withAccess";
import type { AuthContext } from "@/lib/auth/types";

export interface EmbeddingStatus {
  certificationId: string;
  hasEmbeddings: boolean;
  totalItems: number;
  embeddedItems: number;
  percentageComplete: number;
  status: "none" | "partial" | "complete";
}

/**
 * Check embedding status for a certification
 */
export const getEmbeddingStatus = withAccess(
  async (
    _user: AuthContext,
    certificationId: string
  ): Promise<{
    success: boolean;
    data?: EmbeddingStatus;
    error?: string;
  }> => {
    try {
      // Count objectives, bullets, and sub-bullets (with and without embeddings)
      const [objectives, bullets, subBullets] = await Promise.all([
        prisma.certificationObjective.findMany({
          where: {
            domain: { certificationId },
          },
          select: { embedding: true },
        }),
        prisma.bullet.findMany({
          where: {
            objective: {
              domain: { certificationId },
            },
          },
          select: { embedding: true },
        }),
        prisma.subBullet.findMany({
          where: {
            bullet: {
              objective: {
                domain: { certificationId },
              },
            },
          },
          select: { embedding: true },
        }),
      ]);

      const totalItems =
        objectives.length + bullets.length + subBullets.length;
      const embeddedItems =
        objectives.filter((o) => o.embedding).length +
        bullets.filter((b) => b.embedding).length +
        subBullets.filter((sb) => sb.embedding).length;

      const percentageComplete =
        totalItems === 0 ? 0 : Math.round((embeddedItems / totalItems) * 100);

      let status: "none" | "partial" | "complete";
      if (embeddedItems === 0) {
        status = "none";
      } else if (embeddedItems < totalItems) {
        status = "partial";
      } else {
        status = "complete";
      }

      return {
        success: true,
        data: {
          certificationId,
          hasEmbeddings: embeddedItems > 0,
          totalItems,
          embeddedItems,
          percentageComplete,
          status,
        },
      };
    } catch (error) {
      console.error("[getEmbeddingStatus] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
