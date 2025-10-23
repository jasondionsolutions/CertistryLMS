"use server";

import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Schema for AI extracted certification metadata + blueprint
const aiExtractedDataSchema = z.object({
  certification: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
    isScoredExam: z.boolean(),
    passingScore: z.number().optional(),
    maxScore: z.number().optional(),
    defaultStudyDuration: z.number().min(1).default(45),
  }),
  domains: z.array(
    z.object({
      domainNumber: z.string(),
      name: z.string(),
      percentage: z.number().optional(),
      objectives: z.array(
        z.object({
          objectiveNumber: z.string(),
          name: z.string(),
          bullets: z
            .array(
              z.object({
                text: z.string(),
                subBullets: z
                  .array(
                    z.object({
                      text: z.string(),
                    })
                  )
                  .optional(),
              })
            )
            .optional(),
        })
      ),
    })
  ),
});

const METADATA_EXTRACTION_PROMPT = `You are an expert at analyzing certification exam documents. Extract BOTH certification metadata AND the complete exam structure from this PDF.

EXTRACT THE FOLLOWING:

1. CERTIFICATION METADATA:
   - name: The full certification name (e.g., "CompTIA Security+")
   - code: The certification code/exam code (e.g., "SY0-701", "AWS-SAA-C03")
   - description: Brief description of what this certification covers (1-2 sentences)
   - isScoredExam: true if the exam has a numeric score, false if it's pass/fail only
   - passingScore: The minimum passing score (if scored exam)
   - maxScore: The maximum possible score (if scored exam)
   - defaultStudyDuration: Recommended study duration in days (default to 45 if not specified)

2. EXAM BLUEPRINT:
   Extract ALL domains and ALL objectives:
   - Domain number (e.g., "1", "2")
   - Domain name
   - Percentage weight (as a number, e.g., 24 for 24%)
   - ALL objectives within each domain:
     - Objective number (e.g., "1.1", "1.2")
     - Objective name/description
     - Bullets: Any bullet points under the objective
     - Sub-bullets: Any nested items under bullets

CRITICAL INSTRUCTIONS:
- Extract EVERY domain and EVERY objective listed
- Look for scoring information (often in exam overview/details section)
- If scoring info is not found, set isScoredExam to true and use reasonable defaults
- Keep bullet text concise but complete
- Ensure ALL strings are properly escaped
- Do NOT use comments in JSON
- If a field is optional and not present, omit it

Respond ONLY with valid JSON. No markdown, no code blocks - ONLY raw JSON.

Format:
{
  "certification": {
    "name": "CompTIA Security+ (SY0-701)",
    "code": "SY0-701",
    "description": "CompTIA Security+ validates the baseline skills necessary to perform core security functions and pursue an IT security career.",
    "isScoredExam": true,
    "passingScore": 750,
    "maxScore": 900,
    "defaultStudyDuration": 45
  },
  "domains": [
    {
      "domainNumber": "1",
      "name": "General Security Concepts",
      "percentage": 12,
      "objectives": [
        {
          "objectiveNumber": "1.1",
          "name": "Compare and contrast various types of security controls",
          "bullets": [
            {
              "text": "Categories",
              "subBullets": [
                { "text": "Technical" },
                { "text": "Managerial" },
                { "text": "Operational" }
              ]
            },
            {
              "text": "Control types",
              "subBullets": [
                { "text": "Preventative" },
                { "text": "Deterrent" }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

interface ProcessBlueprintWithMetadataResponse {
  success: boolean;
  data?: {
    certification: {
      name: string;
      code: string;
      description: string | null;
      isScoredExam: boolean;
      passingScore: number | null;
      maxScore: number | null;
      defaultStudyDuration: number;
      isActive: boolean;
    };
    domains: any[];
  };
  error?: string;
}

/**
 * Process a PDF to extract certification metadata AND blueprint structure
 * Used for creating new certifications from PDF
 */
export const processBlueprintWithMetadata = withPermission("certifications.create")(
  async (
    user: AuthContext,
    input: {
      modelId: string;
      pdfBase64: string;
      pdfFileName: string;
    }
  ): Promise<ProcessBlueprintWithMetadataResponse> => {
    try {
      console.error(`Processing PDF with metadata extraction...`);
      console.error(`Using model: ${input.modelId}`);
      console.error(`File: ${input.pdfFileName}`);

      // Call Anthropic API
      const message = await anthropic.messages.create({
        model: input.modelId,
        max_tokens: 16000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: input.pdfBase64,
                },
              },
              {
                type: "text",
                text: METADATA_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      // Extract text from response
      const responseText = message.content
        .filter((block) => block.type === "text")
        .map((block) => (block as any).text)
        .join("\n");

      console.error("AI Response received, parsing...");

      // Try to parse as JSON
      let extractedData: any;
      try {
        extractedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Initial JSON parse failed, attempting repair...");
        try {
          const repairedJson = jsonrepair(responseText);
          extractedData = JSON.parse(repairedJson);
        } catch (repairError) {
          console.error("JSON repair failed:", repairError);
          return {
            success: false,
            error: "Failed to parse AI response as valid JSON",
          };
        }
      }

      // Validate against schema
      const validatedData = aiExtractedDataSchema.parse(extractedData);

      console.error(`Extracted certification: ${validatedData.certification.name}`);
      console.error(`Extracted ${validatedData.domains.length} domains`);

      // Return data ready for certification form
      return {
        success: true,
        data: {
          certification: {
            name: validatedData.certification.name,
            code: validatedData.certification.code,
            description: validatedData.certification.description || null,
            isScoredExam: validatedData.certification.isScoredExam,
            passingScore: validatedData.certification.passingScore || null,
            maxScore: validatedData.certification.maxScore || null,
            defaultStudyDuration: validatedData.certification.defaultStudyDuration || 45,
            isActive: true, // Default to active
          },
          domains: validatedData.domains,
        },
      };
    } catch (error) {
      console.error("Error processing blueprint with metadata:", error);

      if (error instanceof Anthropic.APIError) {
        return {
          success: false,
          error: `Anthropic API Error: ${error.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process PDF",
      };
    }
  }
);
