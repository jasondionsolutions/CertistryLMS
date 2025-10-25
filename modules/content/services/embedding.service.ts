/**
 * OpenAI Embedding Service
 *
 * Handles text embedding generation using OpenAI's text-embedding-3-small model.
 * Embeddings are used for semantic similarity comparisons between video transcripts
 * and certification objectives/bullets/sub-bullets.
 *
 * Model: text-embedding-3-small
 * - Dimensions: 1536
 * - Cost: $0.00002 per 1K tokens (~$0.0003 per video)
 * - Speed: ~1-2 seconds per request
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_TOKENS_PER_REQUEST = 8000; // Safety margin below 8191 limit

/**
 * Create an embedding vector for a single text
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation");
  }

  // Truncate if text is too long (rough estimate: 1 token ≈ 4 characters)
  const maxChars = MAX_TOKENS_PER_REQUEST * 4;
  const truncatedText = text.slice(0, maxChars);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

/**
 * Create embeddings for multiple texts in a single API call
 * More efficient than individual calls
 */
export async function createEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty strings
  const validTexts = texts.filter((t) => t && t.trim().length > 0);

  if (validTexts.length === 0) {
    throw new Error("No valid texts provided for embedding generation");
  }

  // Truncate each text if needed
  const maxChars = MAX_TOKENS_PER_REQUEST * 4;
  const truncatedTexts = validTexts.map((text) => text.slice(0, maxChars));

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedTexts,
    encoding_format: "float",
  });

  // Map embeddings back to original order
  return response.data.map((item) => item.embedding);
}

/**
 * Convert embedding array to Buffer for Prisma Bytes field
 */
export function embeddingToBuffer(embedding: number[]): Buffer {
  // Store as Float32Array for space efficiency
  const float32Array = new Float32Array(embedding);
  return Buffer.from(float32Array.buffer);
}

/**
 * Convert Buffer from Prisma Bytes field back to embedding array
 */
export function bufferToEmbedding(buffer: Buffer): number[] {
  const float32Array = new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  return Array.from(float32Array);
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 and 1 (higher = more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get embedding dimensions for validation
 */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}
