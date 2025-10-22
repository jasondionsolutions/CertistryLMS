"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Schema for AI extraction input
const processBlueprintSchema = z.object({
  certificationId: z.string().cuid(),
  modelId: z.string().min(1),
});

// Schema for AI extracted data (matches kdpspecialist format)
const aiExtractedBlueprintSchema = z.object({
  domains: z.array(
    z.object({
      domainNumber: z.string(),
      name: z.string(),
      percentage: z.number().optional(),
      objectives: z.array(
        z.object({
          objectiveNumber: z.string(),
          name: z.string(),
          bullets: z.array(
            z.object({
              text: z.string(),
              subBullets: z.array(
                z.object({
                  text: z.string(),
                })
              ).optional(),
            })
          ).optional(),
        })
      ),
    })
  ),
});

const BLUEPRINT_EXTRACTION_PROMPT = `You are an expert at analyzing certification exam documents. Your task is to extract the COMPLETE exam structure from this PDF.

CRITICAL: Extract EVERY SINGLE domain and EVERY SINGLE objective listed in the exam guide. Do not stop early or skip any.

Please extract:
1. ALL exam domains (if there are 5 domains, extract all 5):
   - Domain number (e.g., "1", "2", "3", "4", "5")
   - Domain name
   - Percentage weight if available (as a number, e.g., 24 for 24%)
   - ALL objectives within each domain (extract every objective, no matter how many):
     - Objective number (e.g., "1.1", "1.2")
     - Objective name/description
     - Bullets: Any bullet points or detailed task statements listed under the objective
     - Sub-bullets: Any indented/nested items under bullets

EXTRACTION STRATEGY:
- Extract ALL domains and ALL objectives with their bullets/sub-bullets
- Keep bullet text concise but complete - preserve all key information
- Prioritize completeness over verbosity
- Ensure you reach the last domain and last objective

FORMATTING:
- Ensure ALL strings are properly escaped (escape quotes, newlines, etc.)
- Do NOT use comments in the JSON
- Ensure all arrays have commas between elements
- If a field is optional and not present, omit it entirely (do not use null)
- Use concise but complete text for bullets

For example, if an objective says:
"1.1 Understand security controls"
And lists:
Categories
- Technical
- Managerial
- Operational
Control types
- Preventative
- Deterrent

Extract those as bullets and sub-bullets.

Respond ONLY with valid JSON. No markdown, no code blocks, no explanatory text - ONLY the raw JSON.

Format:
{
  "domains": [
    {
      "domainNumber": "1",
      "name": "Domain Name",
      "percentage": 25,
      "objectives": [
        {
          "objectiveNumber": "1.1",
          "name": "Objective description",
          "bullets": [
            {
              "text": "Main bullet point",
              "subBullets": [
                { "text": "Sub-bullet detail 1" },
                { "text": "Sub-bullet detail 2" }
              ]
            },
            {
              "text": "Another bullet point"
            }
          ]
        }
      ]
    }
  ]
}`;

interface ProcessBlueprintResponse {
  success: boolean;
  data?: {
    domainsCreated: number;
    objectivesCreated: number;
    bulletsCreated: number;
    subBulletsCreated: number;
  };
  error?: string;
}

/**
 * Process a PDF blueprint with AI and save to database
 * Accepts PDF as base64 string
 */
export const processBlueprint = withPermission("certifications.update")(
  async (
    user: AuthContext,
    input: {
      certificationId: string;
      modelId: string;
      pdfBase64: string;
      pdfFileName: string;
    }
  ): Promise<ProcessBlueprintResponse> => {
    try {
      // Validate input
      const validated = processBlueprintSchema.parse({
        certificationId: input.certificationId,
        modelId: input.modelId,
      });

      // Verify certification exists
      const certification = await prisma.certification.findUnique({
        where: { id: validated.certificationId },
      });

      if (!certification) {
        return {
          success: false,
          error: "Certification not found",
        };
      }

      // Call Anthropic API
      console.error(`Processing blueprint for certification ${certification.name}...`);
      console.error(`Using model: ${input.modelId}`);

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
                text: BLUEPRINT_EXTRACTION_PROMPT,
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
      const validatedData = aiExtractedBlueprintSchema.parse(extractedData);

      console.error(`Extracted ${validatedData.domains.length} domains`);

      // Store raw AI response in certification blueprint field
      await prisma.certification.update({
        where: { id: validated.certificationId },
        data: {
          blueprint: extractedData,
        },
      });

      // Delete existing domains (cascades to objectives, bullets, sub-bullets)
      await prisma.certificationDomain.deleteMany({
        where: { certificationId: validated.certificationId },
      });

      let domainsCreated = 0;
      let objectivesCreated = 0;
      let bulletsCreated = 0;
      let subBulletsCreated = 0;

      // Import domains
      for (let domainIndex = 0; domainIndex < validatedData.domains.length; domainIndex++) {
        const domainData = validatedData.domains[domainIndex];

        const domain = await prisma.certificationDomain.create({
          data: {
            certificationId: validated.certificationId,
            name: domainData.name,
            weight: domainData.percentage ? domainData.percentage / 100 : 0,
            order: domainIndex,
          },
        });
        domainsCreated++;

        // Import objectives
        for (let objIndex = 0; objIndex < domainData.objectives.length; objIndex++) {
          const objectiveData = domainData.objectives[objIndex];

          const objective = await prisma.certificationObjective.create({
            data: {
              domainId: domain.id,
              code: objectiveData.objectiveNumber,
              description: objectiveData.name,
              difficulty: "intermediate",
              order: objIndex,
            },
          });
          objectivesCreated++;

          // Import bullets
          if (objectiveData.bullets) {
            for (let bulletIndex = 0; bulletIndex < objectiveData.bullets.length; bulletIndex++) {
              const bulletData = objectiveData.bullets[bulletIndex];

              const bullet = await prisma.bullet.create({
                data: {
                  objectiveId: objective.id,
                  text: bulletData.text,
                  order: bulletIndex,
                },
              });
              bulletsCreated++;

              // Import sub-bullets
              if (bulletData.subBullets) {
                for (let subIndex = 0; subIndex < bulletData.subBullets.length; subIndex++) {
                  const subBulletData = bulletData.subBullets[subIndex];

                  await prisma.subBullet.create({
                    data: {
                      bulletId: bullet.id,
                      text: subBulletData.text,
                      order: subIndex,
                    },
                  });
                  subBulletsCreated++;
                }
              }
            }
          }
        }
      }

      console.error(`Successfully imported ${domainsCreated} domains, ${objectivesCreated} objectives, ${bulletsCreated} bullets, ${subBulletsCreated} sub-bullets`);

      revalidatePath(`/admin/certifications/${validated.certificationId}/blueprint`);

      return {
        success: true,
        data: {
          domainsCreated,
          objectivesCreated,
          bulletsCreated,
          subBulletsCreated,
        },
      };
    } catch (error) {
      console.error("Error processing blueprint:", error);

      if (error instanceof Anthropic.APIError) {
        return {
          success: false,
          error: `Anthropic API Error: ${error.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process blueprint",
      };
    }
  }
);
