/**
 * AI Document Mapping Service
 *
 * Uses Claude AI to analyze document content and suggest mappings to
 * certification objectives, bullets, and sub-bullets.
 *
 * Strategy: Claude API for semantic analysis
 * - Extract text from document (PDF/DOCX/TXT)
 * - Send to Claude with certification content structure
 * - Claude analyzes and suggests top N mappings with confidence scores
 * - Prefer lowest level (sub-bullets > bullets > objectives)
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { extractTextFromDocument, truncateText } from "./textExtraction.service";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONFIDENCE_THRESHOLD = 0.6; // 60% minimum confidence
const MAX_SUGGESTIONS = 5; // Top 5 suggestions

/**
 * Get the active AI model from the database
 */
async function getActiveAIModel(): Promise<string> {
  const activeModel = await prisma.aIModel.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Fallback to Claude 3.5 Sonnet if no active model found
  return activeModel?.modelId || "claude-3-5-sonnet-20241022";
}

export interface DocumentMappingSuggestion {
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
 * Suggest content mappings for a document based on its text content
 */
export async function suggestMappingsForDocument(
  documentId: string,
  certificationId: string
): Promise<DocumentMappingSuggestion[]> {
  // 1. Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { s3Key: true, mimeType: true, type: true },
  });

  if (!document || !document.s3Key || !document.mimeType) {
    return []; // No document or missing metadata
  }

  // 2. Extract text from document
  let documentText: string;
  try {
    documentText = await extractTextFromDocument(document.s3Key, document.mimeType);

    // Truncate if too long (Claude has 200k token limit, but we want to be conservative)
    documentText = truncateText(documentText, 50000);

    if (!documentText || documentText.trim().length === 0) {
      return []; // No text content
    }
  } catch (error) {
    console.error("[suggestMappingsForDocument] Text extraction failed:", error);
    return [];
  }

  // 3. Get certification content structure
  const domains = await prisma.certificationDomain.findMany({
    where: {
      certificationId,
    },
    include: {
      objectives: {
        include: {
          bullets: {
            include: {
              subBullets: true,
            },
          },
        },
      },
    },
  });

  if (domains.length === 0) {
    return []; // No content to map to
  }

  // 4. Build content structure for Claude
  const contentStructure = domains.map((domain) => ({
    domain: {
      id: domain.id,
      name: domain.name,
    },
    objectives: domain.objectives.map((objective) => ({
      id: objective.id,
      code: objective.code,
      description: objective.description,
      bullets: objective.bullets.map((bullet) => ({
        id: bullet.id,
        text: bullet.text,
        subBullets: bullet.subBullets.map((subBullet) => ({
          id: subBullet.id,
          text: subBullet.text,
        })),
      })),
    })),
  }));

  // 5. Get active AI model from database
  const modelId = await getActiveAIModel();

  // 6. Call Claude API to analyze and suggest mappings
  try {
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildMappingPrompt(documentText, contentStructure),
        },
      ],
    });

    // 6. Parse Claude's response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return [];
    }

    const suggestions = parseClaudeResponse(textContent.text, contentStructure);

    // 7. Sort by confidence and take top N
    suggestions.sort((a, b) => b.confidence - a.confidence);
    const topSuggestions = suggestions
      .filter((s) => s.confidence >= CONFIDENCE_THRESHOLD)
      .slice(0, MAX_SUGGESTIONS);

    // 8. Mark highest confidence as primary
    if (topSuggestions.length > 0) {
      topSuggestions[0].isPrimarySuggestion = true;
    }

    return topSuggestions;
  } catch (error) {
    console.error("[suggestMappingsForDocument] Claude API error:", error);
    return [];
  }
}

/**
 * Build prompt for Claude to analyze document and suggest mappings
 */
function buildMappingPrompt(
  documentText: string,
  contentStructure: any[]
): string {
  return `You are an expert at analyzing study materials and mapping them to certification exam objectives.

I have a document with the following content:

<document>
${documentText}
</document>

I need you to analyze this document and suggest which certification objectives, bullets, or sub-bullets it best maps to. Here is the certification content structure:

${JSON.stringify(contentStructure, null, 2)}

Your task:
1. Analyze the document content
2. Identify which objectives/bullets/sub-bullets this document covers
3. Prefer the LOWEST LEVEL possible (sub-bullets > bullets > objectives)
4. Return the top 5 best matches with confidence scores (0.0 to 1.0)

Return your response as a JSON array in this exact format:
[
  {
    "objectiveId": "obj_id_here" (or null if mapping to bullet/sub-bullet),
    "bulletId": "bullet_id_here" (or null if mapping to objective/sub-bullet),
    "subBulletId": "sub_bullet_id_here" (or null if mapping to objective/bullet),
    "confidence": 0.95,
    "reason": "Brief explanation of why this matches"
  }
]

Important:
- Only ONE of objectiveId, bulletId, or subBulletId should be populated per match
- Confidence should be between 0.0 and 1.0
- Only suggest matches with confidence >= 0.6
- Return empty array [] if no good matches found

Return ONLY the JSON array, no other text.`;
}

/**
 * Parse Claude's JSON response into DocumentMappingSuggestion[]
 */
function parseClaudeResponse(
  responseText: string,
  contentStructure: any[]
): DocumentMappingSuggestion[] {
  try {
    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/```\n?$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/```\n?$/, "");
    }

    const parsedMatches = JSON.parse(jsonText);

    if (!Array.isArray(parsedMatches)) {
      return [];
    }

    // Transform to DocumentMappingSuggestion format
    const suggestions: DocumentMappingSuggestion[] = [];

    for (const match of parsedMatches) {
      const { objectiveId, bulletId, subBulletId, confidence } = match;

      // Skip if confidence too low
      if (confidence < CONFIDENCE_THRESHOLD) {
        continue;
      }

      // Find the content in structure
      for (const domain of contentStructure) {
        for (const objective of domain.objectives) {
          // Check if mapping to this objective
          if (objectiveId === objective.id && !bulletId && !subBulletId) {
            suggestions.push({
              objectiveId: objective.id,
              domain: domain.domain,
              objective: {
                id: objective.id,
                code: objective.code,
                description: objective.description,
              },
              confidence,
              isPrimarySuggestion: false,
            });
            break;
          }

          // Check bullets
          for (const bullet of objective.bullets) {
            if (bulletId === bullet.id && !subBulletId) {
              suggestions.push({
                bulletId: bullet.id,
                domain: domain.domain,
                objective: {
                  id: objective.id,
                  code: objective.code,
                  description: objective.description,
                },
                bullet: {
                  id: bullet.id,
                  text: bullet.text,
                },
                confidence,
                isPrimarySuggestion: false,
              });
              break;
            }

            // Check sub-bullets
            for (const subBullet of bullet.subBullets) {
              if (subBulletId === subBullet.id) {
                suggestions.push({
                  subBulletId: subBullet.id,
                  domain: domain.domain,
                  objective: {
                    id: objective.id,
                    code: objective.code,
                    description: objective.description,
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
                  isPrimarySuggestion: false,
                });
                break;
              }
            }
          }
        }
      }
    }

    return suggestions;
  } catch (error) {
    console.error("[parseClaudeResponse] Parse error:", error);
    return [];
  }
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
