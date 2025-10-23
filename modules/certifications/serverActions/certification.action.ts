"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import {
  createCertificationSchema,
  updateCertificationSchema,
  deleteCertificationSchema,
  archiveCertificationSchema,
  listCertificationsSchema,
  type CreateCertificationInput,
  type UpdateCertificationInput,
  type DeleteCertificationInput,
  type ArchiveCertificationInput,
  type ListCertificationsInput,
  type CertificationResponse,
  type CertificationListResponse,
  type DeleteCheckResponse,
} from "../types/certification.schema";

const prisma = new PrismaClient();

/**
 * Create a new certification
 * Requires admin or instructor permission
 */
export const createCertification = withPermission("certifications.create")(
  async (
    user: AuthContext,
    input: CreateCertificationInput
  ): Promise<CertificationResponse> => {
    try {
      // Validate input
      const validated = createCertificationSchema.parse(input);

      // Prepare data for creation
      const data: any = {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        isScoredExam: validated.isScoredExam,
        defaultStudyDuration: validated.defaultStudyDuration,
        isActive: validated.isActive,
      };

      // Add scoring fields if scored exam
      if (validated.isScoredExam) {
        data.passingScore = validated.passingScore;
        data.maxScore = validated.maxScore;
      } else {
        data.passingScore = null;
        data.maxScore = null;
      }

      const certification = await prisma.certification.create({
        data,
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      revalidatePath("/admin/certifications");

      return {
        success: true,
        data: certification,
      };
    } catch (error) {
      console.error("Error creating certification:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while creating certification",
      };
    }
  }
);

/**
 * Update an existing certification
 * Requires admin or instructor permission
 */
export const updateCertification = withPermission("certifications.update")(
  async (
    user: AuthContext,
    input: UpdateCertificationInput
  ): Promise<CertificationResponse> => {
    try {
      // Validate input
      const validated = updateCertificationSchema.parse(input);

      // Prepare data for update
      const data: any = {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        isScoredExam: validated.isScoredExam,
        defaultStudyDuration: validated.defaultStudyDuration,
        isActive: validated.isActive,
      };

      // Add scoring fields if scored exam
      if (validated.isScoredExam) {
        data.passingScore = validated.passingScore;
        data.maxScore = validated.maxScore;
      } else {
        data.passingScore = null;
        data.maxScore = null;
      }

      const certification = await prisma.certification.update({
        where: { id: validated.id },
        data,
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      revalidatePath("/admin/certifications");

      return {
        success: true,
        data: certification,
      };
    } catch (error) {
      console.error("Error updating certification:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while updating certification",
      };
    }
  }
);

/**
 * Check if certification can be deleted
 * Returns information about students and content
 */
export const checkCertificationDeletion = withPermission(
  "certifications.delete"
)(
  async (
    user: AuthContext,
    id: string
  ): Promise<DeleteCheckResponse> => {
    try {
      const certification = await prisma.certification.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      if (!certification) {
        return {
          success: false,
          error: "Certification not found",
        };
      }

      const hasStudents = certification._count.currentStudents > 0;
      // Domains are part of blueprint structure, not a blocker for deletion
      const canDelete = !hasStudents;

      return {
        success: true,
        data: {
          canDelete,
          hasStudents,
          hasContent: false, // Domains are part of blueprint, not content
          studentCount: certification._count.currentStudents,
          domainCount: certification._count.domains,
        },
      };
    } catch (error) {
      console.error("Error checking certification deletion:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }
);

/**
 * Delete a certification (only if no students or content)
 * Requires admin or instructor permission
 */
export const deleteCertification = withPermission("certifications.delete")(
  async (
    user: AuthContext,
    input: DeleteCertificationInput
  ): Promise<CertificationResponse> => {
    try {
      // Validate input
      const validated = deleteCertificationSchema.parse(input);

      // Check if can delete
      const check = await checkCertificationDeletion(validated.id);
      if (!check.success || !check.data?.canDelete) {
        return {
          success: false,
          error: check.data?.hasStudents || check.data?.hasContent
            ? "Cannot delete certification with enrolled students or content. Please archive it instead."
            : "Certification cannot be deleted",
        };
      }

      await prisma.certification.delete({
        where: { id: validated.id },
      });

      revalidatePath("/admin/certifications");

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting certification:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while deleting certification",
      };
    }
  }
);

/**
 * Archive or unarchive a certification
 * Requires admin or instructor permission
 */
export const archiveCertification = withPermission("certifications.update")(
  async (
    user: AuthContext,
    input: ArchiveCertificationInput
  ): Promise<CertificationResponse> => {
    try {
      // Validate input
      const validated = archiveCertificationSchema.parse(input);

      const certification = await prisma.certification.update({
        where: { id: validated.id },
        data: {
          isArchived: validated.isArchived,
          // If archiving, also set to inactive
          ...(validated.isArchived && { isActive: false }),
        },
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      revalidatePath("/admin/certifications");

      return {
        success: true,
        data: certification,
      };
    } catch (error) {
      console.error("Error archiving certification:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while archiving certification",
      };
    }
  }
);

/**
 * Get a single certification by ID
 * Requires basic authentication
 */
export const getCertification = withPermission("certifications.read")(
  async (user: AuthContext, id: string): Promise<CertificationResponse> => {
    try {
      const certification = await prisma.certification.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      if (!certification) {
        return {
          success: false,
          error: "Certification not found",
        };
      }

      return {
        success: true,
        data: certification,
      };
    } catch (error) {
      console.error("Error getting certification:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while getting certification",
      };
    }
  }
);

/**
 * List all certifications with optional filters
 * Requires basic authentication
 */
export const listCertifications = withPermission("certifications.read")(
  async (
    user: AuthContext,
    input?: ListCertificationsInput
  ): Promise<CertificationListResponse> => {
    try {
      // Validate input
      const validated = input ? listCertificationsSchema.parse(input) : listCertificationsSchema.parse({});

      // Build where clause
      const where: any = {};

      // Search filter
      if (validated.search) {
        where.OR = [
          { name: { contains: validated.search, mode: "insensitive" } },
          { code: { contains: validated.search, mode: "insensitive" } },
          { description: { contains: validated.search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (validated.status === "active") {
        where.isActive = true;
        where.isArchived = false;
      } else if (validated.status === "inactive") {
        where.isActive = false;
        where.isArchived = false;
      } else if (validated.status === "archived") {
        where.isArchived = true;
      }
      // "all" means no status filter

      // Build orderBy
      const orderBy: any = {};
      orderBy[validated.sortBy!] = validated.sortOrder;

      const certifications = await prisma.certification.findMany({
        where,
        orderBy,
        include: {
          _count: {
            select: {
              domains: true,
              currentStudents: true,
            },
          },
        },
      });

      return {
        success: true,
        data: certifications,
      };
    } catch (error) {
      console.error("Error listing certifications:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while listing certifications",
      };
    }
  }
);
