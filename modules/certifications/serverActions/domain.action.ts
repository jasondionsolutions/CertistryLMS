"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import {
  createDomainSchema,
  updateDomainSchema,
  deleteDomainSchema,
  createObjectiveSchema,
  updateObjectiveSchema,
  deleteObjectiveSchema,
  createBulletSchema,
  updateBulletSchema,
  deleteBulletSchema,
  createSubBulletSchema,
  updateSubBulletSchema,
  deleteSubBulletSchema,
  bulkImportDomainSchema,
  type CreateDomainInput,
  type UpdateDomainInput,
  type DeleteDomainInput,
  type CreateObjectiveInput,
  type UpdateObjectiveInput,
  type DeleteObjectiveInput,
  type CreateBulletInput,
  type UpdateBulletInput,
  type DeleteBulletInput,
  type CreateSubBulletInput,
  type UpdateSubBulletInput,
  type DeleteSubBulletInput,
  type BulkImportDomainInput,
  type DomainResponse,
  type DomainListResponse,
  type ObjectiveResponse,
  type BulletResponse,
  type SubBulletResponse,
  type BulkImportResponse,
} from "../types/domain.schema";

const prisma = new PrismaClient();

// =============================================================================
// DOMAIN OPERATIONS
// =============================================================================

/**
 * Create a new domain
 */
export const createDomain = withPermission("certifications.update")(
  async (user: AuthContext, input: CreateDomainInput): Promise<DomainResponse> => {
    try {
      const validated = createDomainSchema.parse(input);

      const domain = await prisma.certificationDomain.create({
        data: {
          certificationId: validated.certificationId,
          name: validated.name,
          weight: validated.weight,
          order: validated.order,
        },
      });

      revalidatePath(`/admin/certifications/${validated.certificationId}/blueprint`);

      return { success: true, data: domain };
    } catch (error) {
      console.error("Error creating domain:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create domain",
      };
    }
  }
);

/**
 * Update an existing domain
 */
export const updateDomain = withPermission("certifications.update")(
  async (user: AuthContext, input: UpdateDomainInput): Promise<DomainResponse> => {
    try {
      const validated = updateDomainSchema.parse(input);

      const updateData: any = {};
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.weight !== undefined) updateData.weight = validated.weight;
      if (validated.order !== undefined) updateData.order = validated.order;

      const domain = await prisma.certificationDomain.update({
        where: { id: validated.id },
        data: updateData,
      });

      revalidatePath(`/admin/certifications/${domain.certificationId}/blueprint`);

      return { success: true, data: domain };
    } catch (error) {
      console.error("Error updating domain:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update domain",
      };
    }
  }
);

/**
 * Delete a domain (cascades to objectives, bullets, sub-bullets)
 */
export const deleteDomain = withPermission("certifications.update")(
  async (user: AuthContext, input: DeleteDomainInput): Promise<DomainResponse> => {
    try {
      const validated = deleteDomainSchema.parse(input);

      const domain = await prisma.certificationDomain.findUnique({
        where: { id: validated.id },
      });

      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      await prisma.certificationDomain.delete({
        where: { id: validated.id },
      });

      revalidatePath(`/admin/certifications/${domain.certificationId}/blueprint`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting domain:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete domain",
      };
    }
  }
);

// =============================================================================
// OBJECTIVE OPERATIONS
// =============================================================================

/**
 * Create a new objective
 */
export const createObjective = withPermission("certifications.update")(
  async (user: AuthContext, input: CreateObjectiveInput): Promise<ObjectiveResponse> => {
    try {
      const validated = createObjectiveSchema.parse(input);

      const objective = await prisma.certificationObjective.create({
        data: {
          domainId: validated.domainId,
          code: validated.code,
          description: validated.description,
          difficulty: validated.difficulty,
          order: validated.order,
        },
      });

      const domain = await prisma.certificationDomain.findUnique({
        where: { id: validated.domainId },
      });

      if (domain) {
        revalidatePath(`/admin/certifications/${domain.certificationId}/blueprint`);
      }

      return { success: true, data: objective };
    } catch (error) {
      console.error("Error creating objective:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create objective",
      };
    }
  }
);

/**
 * Update an existing objective
 */
export const updateObjective = withPermission("certifications.update")(
  async (user: AuthContext, input: UpdateObjectiveInput): Promise<ObjectiveResponse> => {
    try {
      const validated = updateObjectiveSchema.parse(input);

      const updateData: any = {};
      if (validated.code !== undefined) updateData.code = validated.code;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.difficulty !== undefined) updateData.difficulty = validated.difficulty;
      if (validated.order !== undefined) updateData.order = validated.order;

      const objective = await prisma.certificationObjective.update({
        where: { id: validated.id },
        data: updateData,
        include: { domain: true },
      });

      revalidatePath(`/admin/certifications/${objective.domain.certificationId}/blueprint`);

      return { success: true, data: objective };
    } catch (error) {
      console.error("Error updating objective:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update objective",
      };
    }
  }
);

/**
 * Delete an objective (cascades to bullets, sub-bullets)
 */
export const deleteObjective = withPermission("certifications.update")(
  async (user: AuthContext, input: DeleteObjectiveInput): Promise<ObjectiveResponse> => {
    try {
      const validated = deleteObjectiveSchema.parse(input);

      const objective = await prisma.certificationObjective.findUnique({
        where: { id: validated.id },
        include: { domain: true },
      });

      if (!objective) {
        return { success: false, error: "Objective not found" };
      }

      await prisma.certificationObjective.delete({
        where: { id: validated.id },
      });

      revalidatePath(`/admin/certifications/${objective.domain.certificationId}/blueprint`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting objective:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete objective",
      };
    }
  }
);

// =============================================================================
// BULLET OPERATIONS
// =============================================================================

/**
 * Create a new bullet
 */
export const createBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: CreateBulletInput): Promise<BulletResponse> => {
    try {
      const validated = createBulletSchema.parse(input);

      const bullet = await prisma.bullet.create({
        data: {
          objectiveId: validated.objectiveId,
          text: validated.text,
          order: validated.order,
        },
      });

      const objective = await prisma.certificationObjective.findUnique({
        where: { id: validated.objectiveId },
        include: { domain: true },
      });

      if (objective) {
        revalidatePath(`/admin/certifications/${objective.domain.certificationId}/blueprint`);
      }

      return { success: true, data: bullet };
    } catch (error) {
      console.error("Error creating bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create bullet",
      };
    }
  }
);

/**
 * Update an existing bullet
 */
export const updateBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: UpdateBulletInput): Promise<BulletResponse> => {
    try {
      const validated = updateBulletSchema.parse(input);

      const updateData: any = {};
      if (validated.text !== undefined) updateData.text = validated.text;
      if (validated.order !== undefined) updateData.order = validated.order;

      const bullet = await prisma.bullet.update({
        where: { id: validated.id },
        data: updateData,
        include: {
          objective: {
            include: { domain: true },
          },
        },
      });

      revalidatePath(`/admin/certifications/${bullet.objective.domain.certificationId}/blueprint`);

      return { success: true, data: bullet };
    } catch (error) {
      console.error("Error updating bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update bullet",
      };
    }
  }
);

/**
 * Delete a bullet (cascades to sub-bullets)
 */
export const deleteBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: DeleteBulletInput): Promise<BulletResponse> => {
    try {
      const validated = deleteBulletSchema.parse(input);

      const bullet = await prisma.bullet.findUnique({
        where: { id: validated.id },
        include: {
          objective: {
            include: { domain: true },
          },
        },
      });

      if (!bullet) {
        return { success: false, error: "Bullet not found" };
      }

      await prisma.bullet.delete({
        where: { id: validated.id },
      });

      revalidatePath(`/admin/certifications/${bullet.objective.domain.certificationId}/blueprint`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete bullet",
      };
    }
  }
);

// =============================================================================
// SUB-BULLET OPERATIONS
// =============================================================================

/**
 * Create a new sub-bullet
 */
export const createSubBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: CreateSubBulletInput): Promise<SubBulletResponse> => {
    try {
      const validated = createSubBulletSchema.parse(input);

      const subBullet = await prisma.subBullet.create({
        data: {
          bulletId: validated.bulletId,
          text: validated.text,
          order: validated.order,
        },
      });

      const bullet = await prisma.bullet.findUnique({
        where: { id: validated.bulletId },
        include: {
          objective: {
            include: { domain: true },
          },
        },
      });

      if (bullet) {
        revalidatePath(`/admin/certifications/${bullet.objective.domain.certificationId}/blueprint`);
      }

      return { success: true, data: subBullet };
    } catch (error) {
      console.error("Error creating sub-bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create sub-bullet",
      };
    }
  }
);

/**
 * Update an existing sub-bullet
 */
export const updateSubBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: UpdateSubBulletInput): Promise<SubBulletResponse> => {
    try {
      const validated = updateSubBulletSchema.parse(input);

      const updateData: any = {};
      if (validated.text !== undefined) updateData.text = validated.text;
      if (validated.order !== undefined) updateData.order = validated.order;

      const subBullet = await prisma.subBullet.update({
        where: { id: validated.id },
        data: updateData,
        include: {
          bullet: {
            include: {
              objective: {
                include: { domain: true },
              },
            },
          },
        },
      });

      revalidatePath(`/admin/certifications/${subBullet.bullet.objective.domain.certificationId}/blueprint`);

      return { success: true, data: subBullet };
    } catch (error) {
      console.error("Error updating sub-bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update sub-bullet",
      };
    }
  }
);

/**
 * Delete a sub-bullet
 */
export const deleteSubBullet = withPermission("certifications.update")(
  async (user: AuthContext, input: DeleteSubBulletInput): Promise<SubBulletResponse> => {
    try {
      const validated = deleteSubBulletSchema.parse(input);

      const subBullet = await prisma.subBullet.findUnique({
        where: { id: validated.id },
        include: {
          bullet: {
            include: {
              objective: {
                include: { domain: true },
              },
            },
          },
        },
      });

      if (!subBullet) {
        return { success: false, error: "Sub-bullet not found" };
      }

      await prisma.subBullet.delete({
        where: { id: validated.id },
      });

      revalidatePath(`/admin/certifications/${subBullet.bullet.objective.domain.certificationId}/blueprint`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting sub-bullet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete sub-bullet",
      };
    }
  }
);

// =============================================================================
// FETCH OPERATIONS
// =============================================================================

/**
 * Get all domains for a certification (with full nested structure)
 */
export const getDomains = withPermission("certifications.read")(
  async (user: AuthContext, certificationId: string): Promise<DomainListResponse> => {
    try {
      const domains = await prisma.certificationDomain.findMany({
        where: { certificationId },
        orderBy: { order: "asc" },
        include: {
          objectives: {
            orderBy: { order: "asc" },
            include: {
              bullets: {
                orderBy: { order: "asc" },
                include: {
                  subBullets: {
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      return { success: true, data: domains };
    } catch (error) {
      console.error("Error fetching domains:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch domains",
      };
    }
  }
);

// =============================================================================
// BULK IMPORT (for AI extraction)
// =============================================================================

/**
 * Bulk import domains from AI extraction
 * Deletes existing domains for the certification first
 */
export const bulkImportDomains = withPermission("certifications.update")(
  async (user: AuthContext, input: BulkImportDomainInput): Promise<BulkImportResponse> => {
    try {
      const validated = bulkImportDomainSchema.parse(input);

      let domainsCreated = 0;
      let objectivesCreated = 0;
      let bulletsCreated = 0;
      let subBulletsCreated = 0;

      // Delete existing domains (cascades to objectives, bullets, sub-bullets)
      await prisma.certificationDomain.deleteMany({
        where: { certificationId: validated.certificationId },
      });

      // Import new domains
      for (const domainData of validated.domains) {
        const domain = await prisma.certificationDomain.create({
          data: {
            certificationId: validated.certificationId,
            name: domainData.name,
            weight: domainData.weight,
            order: domainData.order,
          },
        });
        domainsCreated++;

        // Import objectives for this domain
        for (const objectiveData of domainData.objectives) {
          const objective = await prisma.certificationObjective.create({
            data: {
              domainId: domain.id,
              code: objectiveData.code,
              description: objectiveData.description,
              difficulty: objectiveData.difficulty,
              order: objectiveData.order,
            },
          });
          objectivesCreated++;

          // Import bullets for this objective
          if (objectiveData.bullets) {
            for (const bulletData of objectiveData.bullets) {
              const bullet = await prisma.bullet.create({
                data: {
                  objectiveId: objective.id,
                  text: bulletData.text,
                  order: bulletData.order,
                },
              });
              bulletsCreated++;

              // Import sub-bullets for this bullet
              if (bulletData.subBullets) {
                for (const subBulletData of bulletData.subBullets) {
                  await prisma.subBullet.create({
                    data: {
                      bulletId: bullet.id,
                      text: subBulletData.text,
                      order: subBulletData.order,
                    },
                  });
                  subBulletsCreated++;
                }
              }
            }
          }
        }
      }

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
      console.error("Error bulk importing domains:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to bulk import domains",
      };
    }
  }
);
