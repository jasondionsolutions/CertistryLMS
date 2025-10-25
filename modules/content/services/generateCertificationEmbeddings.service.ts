/**
 * Service for generating embeddings for certification content
 *
 * Generates and caches OpenAI embeddings for domains, objectives,
 * bullets, and sub-bullets to enable AI-powered content mapping.
 */

import { prisma } from "@/lib/prisma";
import {
  createEmbedding,
  createEmbeddingsBatch,
  embeddingToBuffer,
} from "./embedding.service";

/**
 * Generate embeddings for all content in a certification
 * This is run asynchronously after certification creation
 */
export async function generateCertificationEmbeddings(
  certificationId: string
): Promise<{
  success: boolean;
  stats?: {
    domains: number;
    objectives: number;
    bullets: number;
    subBullets: number;
  };
  error?: string;
}> {
  try {
    console.log(`[Embeddings] Starting generation for certification: ${certificationId}`);

    const stats = {
      domains: 0,
      objectives: 0,
      bullets: 0,
      subBullets: 0,
    };

    // 1. Generate domain embeddings
    const domains = await prisma.certificationDomain.findMany({
      where: {
        certificationId,
        embedding: null, // Only process items without embeddings
      },
      select: { id: true, name: true },
    });

    for (const domain of domains) {
      try {
        const embedding = await createEmbedding(domain.name);
        const buffer = embeddingToBuffer(embedding);

        await prisma.certificationDomain.update({
          where: { id: domain.id },
          data: {
            embedding: buffer,
            embeddingUpdatedAt: new Date(),
          },
        });

        stats.domains++;
      } catch (error) {
        console.error(`[Embeddings] Failed to generate embedding for domain ${domain.id}:`, error);
      }
    }

    console.log(`[Embeddings] Generated ${stats.domains} domain embeddings`);

    // 2. Generate objective embeddings (in batches)
    const BATCH_SIZE = 100;
    const objectives = await prisma.certificationObjective.findMany({
      where: {
        domain: { certificationId },
        embedding: null,
      },
      select: {
        id: true,
        code: true,
        description: true,
      },
    });

    for (let i = 0; i < objectives.length; i += BATCH_SIZE) {
      const batch = objectives.slice(i, i + BATCH_SIZE);
      const texts = batch.map((obj) => `${obj.code}: ${obj.description}`);

      try {
        const embeddings = await createEmbeddingsBatch(texts);

        for (let j = 0; j < batch.length; j++) {
          const buffer = embeddingToBuffer(embeddings[j]);

          await prisma.certificationObjective.update({
            where: { id: batch[j].id },
            data: {
              embedding: buffer,
              embeddingUpdatedAt: new Date(),
            },
          });

          stats.objectives++;
        }
      } catch (error) {
        console.error(
          `[Embeddings] Failed to generate embeddings for objective batch ${i / BATCH_SIZE + 1}:`,
          error
        );
      }
    }

    console.log(`[Embeddings] Generated ${stats.objectives} objective embeddings`);

    // 3. Generate bullet embeddings (in batches, with parent objective context)
    const bullets = await prisma.bullet.findMany({
      where: {
        objective: {
          domain: { certificationId },
        },
        embedding: null,
      },
      select: {
        id: true,
        text: true,
        objective: {
          select: {
            code: true,
            description: true,
          },
        },
      },
    });

    for (let i = 0; i < bullets.length; i += BATCH_SIZE) {
      const batch = bullets.slice(i, i + BATCH_SIZE);
      const texts = batch.map(
        (bullet) =>
          `${bullet.objective.code}: ${bullet.objective.description} - ${bullet.text}`
      );

      try {
        const embeddings = await createEmbeddingsBatch(texts);

        for (let j = 0; j < batch.length; j++) {
          const buffer = embeddingToBuffer(embeddings[j]);

          await prisma.bullet.update({
            where: { id: batch[j].id },
            data: {
              embedding: buffer,
              embeddingUpdatedAt: new Date(),
            },
          });

          stats.bullets++;
        }
      } catch (error) {
        console.error(
          `[Embeddings] Failed to generate embeddings for bullet batch ${i / BATCH_SIZE + 1}:`,
          error
        );
      }
    }

    console.log(`[Embeddings] Generated ${stats.bullets} bullet embeddings`);

    // 4. Generate sub-bullet embeddings (in batches, with parent context)
    const subBullets = await prisma.subBullet.findMany({
      where: {
        bullet: {
          objective: {
            domain: { certificationId },
          },
        },
        embedding: null,
      },
      select: {
        id: true,
        text: true,
        bullet: {
          select: {
            text: true,
            objective: {
              select: {
                code: true,
                description: true,
              },
            },
          },
        },
      },
    });

    for (let i = 0; i < subBullets.length; i += BATCH_SIZE) {
      const batch = subBullets.slice(i, i + BATCH_SIZE);
      const texts = batch.map(
        (subBullet) =>
          `${subBullet.bullet.objective.code}: ${subBullet.bullet.objective.description} - ${subBullet.bullet.text} - ${subBullet.text}`
      );

      try {
        const embeddings = await createEmbeddingsBatch(texts);

        for (let j = 0; j < batch.length; j++) {
          const buffer = embeddingToBuffer(embeddings[j]);

          await prisma.subBullet.update({
            where: { id: batch[j].id },
            data: {
              embedding: buffer,
              embeddingUpdatedAt: new Date(),
            },
          });

          stats.subBullets++;
        }
      } catch (error) {
        console.error(
          `[Embeddings] Failed to generate embeddings for sub-bullet batch ${i / BATCH_SIZE + 1}:`,
          error
        );
      }
    }

    console.log(`[Embeddings] Generated ${stats.subBullets} sub-bullet embeddings`);

    console.log(`[Embeddings] ✅ Complete for certification ${certificationId}:`, stats);

    return { success: true, stats };
  } catch (error) {
    console.error(`[Embeddings] ❌ Failed for certification ${certificationId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
