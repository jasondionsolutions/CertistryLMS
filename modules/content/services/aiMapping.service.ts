/**
 * AI Mapping Service
 *
 * Suggests content mappings by analyzing video transcripts against
 * certification objectives using semantic similarity (embeddings).
 *
 * Strategy: Semantic Similarity (OpenAI Embeddings)
 * - Compare transcript embedding with cached bullet/sub-bullet embeddings
 * - Return top N matches above confidence threshold
 * - Focus on bullets/sub-bullets for precision (not just objectives)
 */

import { prisma } from "@/lib/prisma";
import {
  createEmbedding,
  bufferToEmbedding,
  cosineSimilarity,
} from "./embedding.service";

const CONFIDENCE_THRESHOLD = 0.6; // 60% minimum similarity (adjusted for semantic embeddings)
const MAX_SUGGESTIONS = 5; // Top 5 suggestions

export interface MappingSuggestion {
  // Content identity (only ONE will be populated)
  objectiveId?: string;
  bulletId?: string;
  subBulletId?: string;

  // Content hierarchy for display
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
  confidence: number; // 0.0 to 1.0
  isPrimarySuggestion: boolean; // Highest confidence suggestion
}

/**
 * Suggest content mappings for a video based on its transcript
 */
export async function suggestMappingsForVideo(
  videoId: string,
  certificationId: string
): Promise<MappingSuggestion[]> {
  // 1. Get video transcript
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { transcript: true, transcriptionStatus: true },
  });

  if (!video || !video.transcript || video.transcript.trim().length === 0) {
    return []; // No transcript = no AI suggestions
  }

  if (video.transcriptionStatus !== "completed") {
    return []; // Only suggest for completed transcriptions
  }

  // 2. Create embedding for transcript
  const transcriptEmbedding = await createEmbedding(video.transcript);

  // 3. Get all bullets and sub-bullets with cached embeddings
  const bulletsAndSubBullets = await prisma.bullet.findMany({
    where: {
      objective: {
        domain: {
          certificationId,
        },
      },
      embedding: { not: null }, // Only consider items with cached embeddings
    },
    include: {
      subBullets: {
        where: {
          embedding: { not: null },
        },
      },
      objective: {
        include: {
          domain: true,
        },
      },
    },
  });

  // Also get objectives with embeddings (in case bullet has no embedding)
  const objectives = await prisma.certificationObjective.findMany({
    where: {
      domain: {
        certificationId,
      },
      embedding: { not: null },
    },
    include: {
      domain: true,
    },
  });

  // 4. Calculate similarities
  const suggestions: MappingSuggestion[] = [];

  // Check sub-bullets first (highest precision)
  for (const bullet of bulletsAndSubBullets) {
    for (const subBullet of bullet.subBullets) {
      if (!subBullet.embedding) continue;

      const subBulletEmbedding = bufferToEmbedding(
        Buffer.from(subBullet.embedding)
      );
      const confidence = cosineSimilarity(
        transcriptEmbedding,
        subBulletEmbedding
      );

      if (confidence >= CONFIDENCE_THRESHOLD) {
        suggestions.push({
          subBulletId: subBullet.id,
          // Only populate subBulletId, not bulletId or objectiveId (most specific level)
          domain: {
            id: bullet.objective.domain.id,
            name: bullet.objective.domain.name,
          },
          objective: {
            id: bullet.objective.id,
            code: bullet.objective.code,
            description: bullet.objective.description,
          },
          bullet: {
            id: bullet.id,
            text: bullet.text,
          },
          subBullet: {
            id: subBullet.id,
            text: subBullet.text,
          },
          confidence,
          isPrimarySuggestion: false, // Will set later
        });
      }
    }
  }

  // Check bullets (medium precision)
  for (const bullet of bulletsAndSubBullets) {
    if (!bullet.embedding) continue;

    // Skip if we already have a sub-bullet from this bullet
    const hasSubBulletSuggestion = suggestions.some(
      (s) => s.bullet?.id === bullet.id && s.subBulletId
    );
    if (hasSubBulletSuggestion) continue;

    const bulletEmbedding = bufferToEmbedding(Buffer.from(bullet.embedding));
    const confidence = cosineSimilarity(transcriptEmbedding, bulletEmbedding);

    if (confidence >= CONFIDENCE_THRESHOLD) {
      suggestions.push({
        bulletId: bullet.id,
        // Only populate bulletId, not objectiveId (most specific level)
        domain: {
          id: bullet.objective.domain.id,
          name: bullet.objective.domain.name,
        },
        objective: {
          id: bullet.objective.id,
          code: bullet.objective.code,
          description: bullet.objective.description,
        },
        bullet: {
          id: bullet.id,
          text: bullet.text,
        },
        confidence,
        isPrimarySuggestion: false,
      });
    }
  }

  // Check objectives (lowest precision, fallback)
  for (const objective of objectives) {
    if (!objective.embedding) continue;

    // Skip if we already have a bullet/sub-bullet from this objective
    const hasChildSuggestion = suggestions.some(
      (s) => s.objective?.id === objective.id && (s.bulletId || s.subBulletId)
    );
    if (hasChildSuggestion) continue;

    const objectiveEmbedding = bufferToEmbedding(
      Buffer.from(objective.embedding)
    );
    const confidence = cosineSimilarity(
      transcriptEmbedding,
      objectiveEmbedding
    );

    if (confidence >= CONFIDENCE_THRESHOLD) {
      suggestions.push({
        objectiveId: objective.id,
        domain: {
          id: objective.domain.id,
          name: objective.domain.name,
        },
        objective: {
          id: objective.id,
          code: objective.code,
          description: objective.description,
        },
        confidence,
        isPrimarySuggestion: false,
      });
    }
  }

  // 5. Sort by confidence and take top N
  suggestions.sort((a, b) => b.confidence - a.confidence);
  const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);

  // 6. Mark highest confidence as primary suggestion
  if (topSuggestions.length > 0) {
    topSuggestions[0].isPrimarySuggestion = true;
  }

  return topSuggestions;
}

/**
 * Get confidence threshold for filtering suggestions
 */
export function getConfidenceThreshold(): number {
  return CONFIDENCE_THRESHOLD;
}

/**
 * Get max number of suggestions returned
 */
export function getMaxSuggestions(): number {
  return MAX_SUGGESTIONS;
}
