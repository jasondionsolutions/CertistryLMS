/**
 * AI Description Generation Service
 *
 * Generates concise video descriptions using OpenAI GPT models.
 */

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a concise description from video transcript
 *
 * @param transcript - Full video transcript (plain text)
 * @param title - Video title for context
 * @param maxWords - Maximum number of words (default: 100)
 * @returns Generated description
 */
export async function generateVideoDescription(
  transcript: string,
  title: string,
  maxWords: number = 100
): Promise<string> {
  try {
    console.error(`[AI Description] Generating description for: ${title}`);

    // Truncate transcript if too long (GPT-3.5 has token limits)
    // Max ~4000 tokens for input, keep transcript under ~3000 tokens (~2250 words)
    const maxTranscriptWords = 2000;
    const words = transcript.split(" ");
    const truncatedTranscript =
      words.length > maxTranscriptWords
        ? words.slice(0, maxTranscriptWords).join(" ") + "..."
        : transcript;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fast and cost-effective for descriptions
      messages: [
        {
          role: "system",
          content: `You are an educational content specialist. Your task is to write concise, informative video descriptions for an LMS (Learning Management System).

The description should:
- Be exactly ${maxWords} words or fewer
- Summarize the key topics and learning objectives
- Be written in a professional, educational tone
- Focus on what students will learn
- Avoid marketing language or fluff
- Use present tense`,
        },
        {
          role: "user",
          content: `Write a ${maxWords}-word description for this video:

Title: ${title}

Transcript:
${truncatedTranscript}`,
        },
      ],
      max_tokens: 200, // ~150 words max
      temperature: 0.7, // Balanced creativity and consistency
    });

    const description = completion.choices[0]?.message?.content?.trim() || "";

    if (!description) {
      throw new Error("OpenAI returned empty description");
    }

    console.error(`[AI Description] Generated: ${description.substring(0, 100)}...`);

    return description;
  } catch (error) {
    console.error("[AI Description] Generation failed:", error);
    throw new Error(
      `Failed to generate AI description: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate and truncate description to word limit
 */
export function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.split(" ");
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(" ") + "...";
}
