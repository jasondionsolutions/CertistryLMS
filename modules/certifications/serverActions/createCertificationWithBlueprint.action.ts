"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, Prisma } from "@prisma/client";
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

      // Create certification with blueprint using BULK inserts for performance
      // Old approach: nested creates = 855+ sequential queries for large blueprints
      // New approach: bulk createMany = ~8 queries total
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Step 1: Create certification
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

        // Step 2: Bulk insert ALL domains
        const domainsData = validated.domains.map((domainData, domainIndex) => ({
          certificationId: certification.id,
          name: domainData.name,
          weight: domainData.percentage ? domainData.percentage / 100 : 0,
          order: domainIndex,
        }));

        await tx.certificationDomain.createMany({
          data: domainsData,
        });

        // Step 3: Query back domains to get IDs (ordered by order field for matching)
        const createdDomains = await tx.certificationDomain.findMany({
          where: { certificationId: certification.id },
          orderBy: { order: 'asc' },
          select: { id: true, order: true },
        });

        // Step 4: Bulk insert ALL objectives
        const objectivesData: Array<{
          domainId: string;
          code: string;
          description: string;
          difficulty: string;
          order: number;
        }> = [];

        validated.domains.forEach((domainData, domainIndex) => {
          const domainId = createdDomains[domainIndex].id;
          domainData.objectives.forEach((objectiveData, objIndex) => {
            objectivesData.push({
              domainId,
              code: objectiveData.objectiveNumber,
              description: objectiveData.name,
              difficulty: "intermediate",
              order: objIndex,
            });
          });
        });

        if (objectivesData.length > 0) {
          await tx.certificationObjective.createMany({
            data: objectivesData,
          });
        }

        // Step 5: Query back objectives to get IDs
        const createdObjectives = await tx.certificationObjective.findMany({
          where: {
            domainId: { in: createdDomains.map((d: { id: string }) => d.id) },
          },
          orderBy: [{ domainId: 'asc' }, { order: 'asc' }],
          select: { id: true, domainId: true, order: true },
        });

        // Step 6: Bulk insert ALL bullets
        const bulletsData: Array<{
          objectiveId: string;
          text: string;
          order: number;
        }> = [];

        let objectiveIndex = 0;
        validated.domains.forEach((domainData) => {
          domainData.objectives.forEach((objectiveData) => {
            const objectiveId = createdObjectives[objectiveIndex].id;
            objectiveData.bullets?.forEach((bulletData, bulletIndex) => {
              bulletsData.push({
                objectiveId,
                text: bulletData.text,
                order: bulletIndex,
              });
            });
            objectiveIndex++;
          });
        });

        if (bulletsData.length > 0) {
          await tx.bullet.createMany({
            data: bulletsData,
          });
        }

        // Step 7: Query back bullets to get IDs
        const createdBullets = await tx.bullet.findMany({
          where: {
            objectiveId: { in: createdObjectives.map((o: { id: string }) => o.id) },
          },
          orderBy: [{ objectiveId: 'asc' }, { order: 'asc' }],
          select: { id: true, objectiveId: true, order: true },
        });

        // Step 8: Bulk insert ALL sub-bullets
        const subBulletsData: Array<{
          bulletId: string;
          text: string;
          order: number;
        }> = [];

        let bulletIndex = 0;
        validated.domains.forEach((domainData) => {
          domainData.objectives.forEach((objectiveData) => {
            objectiveData.bullets?.forEach((bulletData) => {
              const bulletId = createdBullets[bulletIndex].id;
              bulletData.subBullets?.forEach((subBulletData, subIndex) => {
                subBulletsData.push({
                  bulletId,
                  text: subBulletData.text,
                  order: subIndex,
                });
              });
              bulletIndex++;
            });
          });
        });

        if (subBulletsData.length > 0) {
          await tx.subBullet.createMany({
            data: subBulletsData,
          });
        }

        // Count stats
        const domainsCreated = domainsData.length;
        const objectivesCreated = objectivesData.length;
        const bulletsCreated = bulletsData.length;
        const subBulletsCreated = subBulletsData.length;

        console.error(
          `Created certification with ${domainsCreated} domains, ${objectivesCreated} objectives, ${bulletsCreated} bullets, ${subBulletsCreated} sub-bullets using BULK inserts`
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
        timeout: 30000, // 30 seconds timeout (should complete much faster now)
      });

      // Validate domain weights and force certification inactive if invalid
      const totalWeight = validated.domains.reduce((sum, d) => sum + ((d.percentage || 0) / 100), 0);
      const totalPercentage = Math.round(totalWeight * 100 * 10) / 10; // Round to 1 decimal
      const isWeightValid = totalPercentage >= 99.5 && totalPercentage <= 100.5;

      // If weights are invalid, force certification to inactive
      if (!isWeightValid) {
        await prisma.certification.update({
          where: { id: result.certification.id },
          data: { isActive: false },
        });
        console.error(`Domain weights invalid (${totalPercentage}%). Certification forced to inactive.`);
      }

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
