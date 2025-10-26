/**
 * Text Extraction Service
 *
 * Extracts text content from PDF, DOCX, and TXT documents for AI analysis.
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_NAME } from "@/lib/s3/config";
import mammoth from "mammoth";

/**
 * Extract text from a document stored in S3
 *
 * @param s3Key - S3 object key
 * @param mimeType - Document MIME type
 * @returns Extracted text content
 */
export async function extractTextFromDocument(
  s3Key: string,
  mimeType: string
): Promise<string> {
  try {
    // Download document from S3
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("Empty response from S3");
    }

    // Convert stream to buffer
    const buffer = await streamToBuffer(response.Body);

    // Extract text based on MIME type
    switch (mimeType) {
      case "application/pdf":
        return await extractTextFromPDF(buffer);

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await extractTextFromDOCX(buffer);

      case "text/plain":
        return await extractTextFromTXT(buffer);

      default:
        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  } catch (error) {
    console.error("[extractTextFromDocument] Error:", error);
    throw new Error(
      `Failed to extract text from document: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from PDF buffer using unpdf (lightweight, no canvas dependencies)
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use unpdf - a modern, lightweight PDF parser
    const { extractText } = await import("unpdf");

    // Convert Buffer to Uint8Array (unpdf requires Uint8Array)
    const uint8Array = new Uint8Array(buffer);

    // Extract text from the PDF
    const { text } = await extractText(uint8Array);

    // text is an array of strings (one per page), join them
    const fullText = Array.isArray(text) ? text.join("\n\n") : text;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    return fullText.trim();
  } catch (error) {
    console.error("[extractTextFromPDF] Error:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("[extractTextFromDOCX] Error:", error);
    throw new Error(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from TXT buffer
 */
async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString("utf-8").trim();
  } catch (error) {
    console.error("[extractTextFromTXT] Error:", error);
    throw new Error(
      `Failed to extract text from TXT: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Convert readable stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

/**
 * Truncate text to maximum length (for AI context limits)
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length in characters (default: 100,000)
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 100000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate and add ellipsis
  return text.substring(0, maxLength) + "\n\n[... document truncated ...]";
}

/**
 * Extract a preview (first N words) from text for display purposes
 *
 * @param text - Full text content
 * @param wordCount - Number of words to include in preview (default: 500)
 * @returns Preview text
 */
export function extractTextPreview(
  text: string,
  wordCount: number = 500
): string {
  if (!text || text.trim().length === 0) {
    return "";
  }

  // Split by whitespace and take first N words
  const words = text.trim().split(/\s+/);

  if (words.length <= wordCount) {
    return text;
  }

  // Join first N words and add ellipsis
  const preview = words.slice(0, wordCount).join(" ");
  return preview + "...";
}

/**
 * Extract text preview from a document stored in S3
 * Optimized for quick preview generation (first 500 words)
 *
 * @param s3Key - S3 object key
 * @param mimeType - Document MIME type
 * @param wordCount - Number of words to include (default: 500)
 * @returns Preview text
 */
export async function extractDocumentPreview(
  s3Key: string,
  mimeType: string,
  wordCount: number = 500
): Promise<string> {
  try {
    // For PDFs, we can't easily extract just first N words without parsing the whole thing
    // So we extract all text and then truncate
    const fullText = await extractTextFromDocument(s3Key, mimeType);
    return extractTextPreview(fullText, wordCount);
  } catch (error) {
    console.error("[extractDocumentPreview] Error:", error);
    // Return empty string instead of throwing to allow preview failures to degrade gracefully
    return "";
  }
}
