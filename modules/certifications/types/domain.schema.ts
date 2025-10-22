import { z } from "zod";

// =============================================================================
// SUB-BULLET SCHEMAS
// =============================================================================

export const subBulletSchema = z.object({
  text: z.string().min(1, "Sub-bullet text is required"),
  order: z.number().int().nonnegative(),
});

export const createSubBulletSchema = z.object({
  bulletId: z.string().cuid(),
  text: z.string().min(1, "Sub-bullet text is required").trim(),
  order: z.number().int().nonnegative(),
});

export const updateSubBulletSchema = z.object({
  id: z.string().cuid(),
  text: z.string().min(1, "Sub-bullet text is required").trim().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const deleteSubBulletSchema = z.object({
  id: z.string().cuid(),
});

// =============================================================================
// BULLET SCHEMAS
// =============================================================================

export const bulletSchema = z.object({
  text: z.string().min(1, "Bullet text is required"),
  order: z.number().int().nonnegative(),
  subBullets: z.array(subBulletSchema).optional(),
});

export const createBulletSchema = z.object({
  objectiveId: z.string().cuid(),
  text: z.string().min(1, "Bullet text is required").trim(),
  order: z.number().int().nonnegative(),
});

export const updateBulletSchema = z.object({
  id: z.string().cuid(),
  text: z.string().min(1, "Bullet text is required").trim().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const deleteBulletSchema = z.object({
  id: z.string().cuid(),
});

// =============================================================================
// OBJECTIVE SCHEMAS
// =============================================================================

export const objectiveSchema = z.object({
  code: z.string().min(1, "Objective code is required"),
  description: z.string().min(1, "Objective description is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  order: z.number().int().nonnegative(),
  bullets: z.array(bulletSchema).optional(),
});

export const createObjectiveSchema = z.object({
  domainId: z.string().cuid(),
  code: z.string().min(1, "Objective code is required").trim(),
  description: z.string().min(1, "Objective description is required").trim(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  order: z.number().int().nonnegative(),
});

export const updateObjectiveSchema = z.object({
  id: z.string().cuid(),
  code: z.string().min(1, "Objective code is required").trim().optional(),
  description: z.string().min(1, "Objective description is required").trim().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  order: z.number().int().nonnegative().optional(),
});

export const deleteObjectiveSchema = z.object({
  id: z.string().cuid(),
});

// =============================================================================
// DOMAIN SCHEMAS
// =============================================================================

export const domainSchema = z.object({
  name: z.string().min(1, "Domain name is required"),
  weight: z.number().min(0).max(1), // Stored as decimal (e.g., 0.24 for 24%)
  order: z.number().int().nonnegative(),
  objectives: z.array(objectiveSchema).optional(),
});

export const createDomainSchema = z.object({
  certificationId: z.string().cuid(),
  name: z.string().min(1, "Domain name is required").trim(),
  weight: z.number().min(0).max(1),
  order: z.number().int().nonnegative(),
});

export const updateDomainSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Domain name is required").trim().optional(),
  weight: z.number().min(0).max(1).optional(),
  order: z.number().int().nonnegative().optional(),
});

export const deleteDomainSchema = z.object({
  id: z.string().cuid(),
});

// =============================================================================
// BULK IMPORT SCHEMA (for AI extraction)
// =============================================================================

export const bulkImportDomainSchema = z.object({
  certificationId: z.string().cuid(),
  domains: z.array(
    z.object({
      name: z.string().min(1),
      weight: z.number().min(0).max(1),
      order: z.number().int().nonnegative(),
      objectives: z.array(
        z.object({
          code: z.string().min(1),
          description: z.string().min(1),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
          order: z.number().int().nonnegative(),
          bullets: z.array(
            z.object({
              text: z.string().min(1),
              order: z.number().int().nonnegative(),
              subBullets: z.array(
                z.object({
                  text: z.string().min(1),
                  order: z.number().int().nonnegative(),
                })
              ).optional(),
            })
          ).optional(),
        })
      ),
    })
  ),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SubBullet = z.infer<typeof subBulletSchema>;
export type CreateSubBulletInput = z.infer<typeof createSubBulletSchema>;
export type UpdateSubBulletInput = z.infer<typeof updateSubBulletSchema>;
export type DeleteSubBulletInput = z.infer<typeof deleteSubBulletSchema>;

export type Bullet = z.infer<typeof bulletSchema>;
export type CreateBulletInput = z.infer<typeof createBulletSchema>;
export type UpdateBulletInput = z.infer<typeof updateBulletSchema>;
export type DeleteBulletInput = z.infer<typeof deleteBulletSchema>;

export type Objective = z.infer<typeof objectiveSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type DeleteObjectiveInput = z.infer<typeof deleteObjectiveSchema>;

export type Domain = z.infer<typeof domainSchema>;
export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type DeleteDomainInput = z.infer<typeof deleteDomainSchema>;

export type BulkImportDomainInput = z.infer<typeof bulkImportDomainSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface DomainResponse {
  success: boolean;
  data?: {
    id: string;
    certificationId: string;
    name: string;
    weight: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    objectives?: Array<{
      id: string;
      domainId: string;
      code: string;
      description: string;
      difficulty: string;
      order: number;
      createdAt: Date;
      updatedAt: Date;
      bullets?: Array<{
        id: string;
        objectiveId: string;
        text: string;
        order: number;
        createdAt: Date;
        updatedAt: Date;
        subBullets?: Array<{
          id: string;
          bulletId: string;
          text: string;
          order: number;
          createdAt: Date;
          updatedAt: Date;
        }>;
      }>;
    }>;
  };
  error?: string;
}

export interface DomainListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    certificationId: string;
    name: string;
    weight: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    objectives: Array<{
      id: string;
      domainId: string;
      code: string;
      description: string;
      difficulty: string;
      order: number;
      createdAt: Date;
      updatedAt: Date;
      bullets: Array<{
        id: string;
        objectiveId: string;
        text: string;
        order: number;
        createdAt: Date;
        updatedAt: Date;
        subBullets: Array<{
          id: string;
          bulletId: string;
          text: string;
          order: number;
          createdAt: Date;
          updatedAt: Date;
        }>;
      }>;
    }>;
  }>;
  error?: string;
}

export interface ObjectiveResponse {
  success: boolean;
  data?: {
    id: string;
    domainId: string;
    code: string;
    description: string;
    difficulty: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export interface BulletResponse {
  success: boolean;
  data?: {
    id: string;
    objectiveId: string;
    text: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export interface SubBulletResponse {
  success: boolean;
  data?: {
    id: string;
    bulletId: string;
    text: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export interface BulkImportResponse {
  success: boolean;
  data?: {
    domainsCreated: number;
    objectivesCreated: number;
    bulletsCreated: number;
    subBulletsCreated: number;
  };
  error?: string;
}