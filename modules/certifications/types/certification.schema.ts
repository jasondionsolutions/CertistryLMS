import { z } from "zod";

/**
 * Zod schema for creating a certification
 */
export const createCertificationSchema = z.object({
  name: z.string().min(1, "Certification name is required").trim(),
  code: z.string().min(1, "Certification code is required").trim(),
  description: z.string().optional(),

  // Scoring configuration
  isScoredExam: z.boolean().default(true),
  passingScore: z.number().int().positive().nullable().optional(),
  maxScore: z.number().int().positive().nullable().optional(),

  // Study duration
  defaultStudyDuration: z.number().int().positive().default(45),

  // Status
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // If scored exam, must have both passing and max scores
    if (data.isScoredExam) {
      return data.passingScore != null && data.maxScore != null;
    }
    return true;
  },
  {
    message: "Passing score and max score are required for scored exams",
    path: ["passingScore"],
  }
).refine(
  (data) => {
    // If scored exam, passing score must be less than or equal to max score
    if (data.isScoredExam && data.passingScore != null && data.maxScore != null) {
      return data.passingScore <= data.maxScore;
    }
    return true;
  },
  {
    message: "Passing score must be less than or equal to max score",
    path: ["passingScore"],
  }
);

/**
 * Zod schema for updating a certification
 */
export const updateCertificationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Certification name is required").trim(),
  code: z.string().min(1, "Certification code is required").trim(),
  description: z.string().optional(),

  // Scoring configuration
  isScoredExam: z.boolean(),
  passingScore: z.number().int().positive().nullable().optional(),
  maxScore: z.number().int().positive().nullable().optional(),

  // Study duration
  defaultStudyDuration: z.number().int().positive(),

  // Status
  isActive: z.boolean(),
}).refine(
  (data) => {
    if (data.isScoredExam) {
      return data.passingScore != null && data.maxScore != null;
    }
    return true;
  },
  {
    message: "Passing score and max score are required for scored exams",
    path: ["passingScore"],
  }
).refine(
  (data) => {
    if (data.isScoredExam && data.passingScore != null && data.maxScore != null) {
      return data.passingScore <= data.maxScore;
    }
    return true;
  },
  {
    message: "Passing score must be less than or equal to max score",
    path: ["passingScore"],
  }
);

/**
 * Zod schema for deleting a certification
 */
export const deleteCertificationSchema = z.object({
  id: z.string().cuid(),
});

/**
 * Zod schema for archiving a certification
 */
export const archiveCertificationSchema = z.object({
  id: z.string().cuid(),
  isArchived: z.boolean(),
});

/**
 * Zod schema for listing certifications with filters
 */
export const listCertificationsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "archived"]).optional().default("all"),
  sortBy: z.enum(["name", "code", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Type exports
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
export type DeleteCertificationInput = z.infer<typeof deleteCertificationSchema>;
export type ArchiveCertificationInput = z.infer<typeof archiveCertificationSchema>;
export type ListCertificationsInput = z.infer<typeof listCertificationsSchema>;

// Response types
export interface CertificationResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isScoredExam: boolean;
    passingScore: number | null;
    maxScore: number | null;
    defaultStudyDuration: number;
    isActive: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      domains: number;
      currentStudents: number;
    };
  };
  error?: string;
}

export interface CertificationListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    isScoredExam: boolean;
    passingScore: number | null;
    maxScore: number | null;
    defaultStudyDuration: number;
    isActive: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      domains: number;
      currentStudents: number;
    };
  }>;
  error?: string;
}

export interface DeleteCheckResponse {
  success: boolean;
  data?: {
    canDelete: boolean;
    hasStudents: boolean;
    hasContent: boolean;
    studentCount: number;
    domainCount: number;
  };
  error?: string;
}
