"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for creating certification with blueprint
const createWithBlueprintSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isScoredExam: z.boolean(),
  passingScore: z.number().optional(),
  maxScore: z.number().optional(),
  defaultStudyDuration: z.number().min(1),
  isActive: z.boolean().default(true),
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

interface CreateCertificationWithBlueprintResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    code: string;
    domainsCreated: number;
    objectivesCreated: number;
  };
  error?: string;
}

/**
 * Create a new certification and import blueprint data in one transaction
 * Used when creating certification from AI-extracted PDF data
 */
export const createCertificationWithBlueprint = withPermission("certifications.create")(
  async (
    _user: AuthContext,
    input: z.infer<typeof createWithBlueprintSchema>
  ): Promise<CreateCertificationWithBlueprintResponse> => {
    try {
      // Validate input
      const validated = createWithBlueprintSchema.parse(input);

      console.error(`Creating certification with blueprint: ${validated.name}`);

      // Check for duplicate code
      const existing = await prisma.certification.findFirst({
        where: { code: validated.code },
      });

      if (existing) {
        return {
          success: false,
          error: `A certification with code "${validated.code}" already exists`,
        };
      }

      // Create certification with blueprint in a transaction
      // Increase timeout for large blueprints (default is 5s, we need more for many domains/objectives)
      const result = await prisma.$transaction(async (tx) => {
        // Create certification
        const certification = await tx.certification.create({
          data: {
            name: validated.name,
            code: validated.code,
            description: validated.description || null,
            isScoredExam: validated.isScoredExam,
            passingScore: validated.passingScore || null,
            maxScore: validated.maxScore || null,
            defaultStudyDuration: validated.defaultStudyDuration,
            isActive: validated.isActive,
            isArchived: false,
          },
        });

        let domainsCreated = 0;
        let objectivesCreated = 0;
        let bulletsCreated = 0;
        let subBulletsCreated = 0;

        // Import domains and objectives
        for (let domainIndex = 0; domainIndex < validated.domains.length; domainIndex++) {
          const domainData = validated.domains[domainIndex];

          const domain = await tx.certificationDomain.create({
            data: {
              certificationId: certification.id,
              name: domainData.name,
              weight: domainData.percentage ? domainData.percentage / 100 : 0,
              order: domainIndex,
            },
          });
          domainsCreated++;

          // Import objectives
          for (let objIndex = 0; objIndex < domainData.objectives.length; objIndex++) {
            const objectiveData = domainData.objectives[objIndex];

            const objective = await tx.certificationObjective.create({
              data: {
                domainId: domain.id,
                code: objectiveData.objectiveNumber,
                description: objectiveData.name,
                difficulty: "intermediate", // Default difficulty
                order: objIndex,
              },
            });
            objectivesCreated++;

            // Import bullets
            if (objectiveData.bullets) {
              for (let bulletIndex = 0; bulletIndex < objectiveData.bullets.length; bulletIndex++) {
                const bulletData = objectiveData.bullets[bulletIndex];

                const bullet = await tx.bullet.create({
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

                    await tx.subBullet.create({
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

        console.error(
          `Created certification with ${domainsCreated} domains, ${objectivesCreated} objectives, ${bulletsCreated} bullets, ${subBulletsCreated} sub-bullets`
        );

        return {
          certification,
          stats: {
            domainsCreated,
            objectivesCreated,
            bulletsCreated,
            subBulletsCreated,
          },
        };
      }, {
        timeout: 120000, // 120 seconds (2 minutes) - increased for large blueprints like CompTIA Security+ with many objectives/bullets
      });

      revalidatePath("/admin/certifications");
      revalidatePath(`/admin/certifications/${result.certification.id}/blueprint`);

      return {
        success: true,
        data: {
          id: result.certification.id,
          name: result.certification.name,
          code: result.certification.code,
          domainsCreated: result.stats.domainsCreated,
          objectivesCreated: result.stats.objectivesCreated,
        },
      };
    } catch (error) {
      console.error("Error creating certification with blueprint:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create certification",
      };
    }
  }
);
