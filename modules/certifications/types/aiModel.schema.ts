import { z } from "zod";

/**
 * Zod schema for creating an AI model
 */
export const createAIModelSchema = z.object({
  name: z.string().min(1, "Model name is required").trim(),
  modelId: z.string().min(1, "Model ID is required").trim(),
  provider: z.string().min(1, "Provider is required").trim(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Zod schema for updating an AI model
 */
export const updateAIModelSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Model name is required").trim().optional(),
  modelId: z.string().min(1, "Model ID is required").trim().optional(),
  provider: z.string().min(1, "Provider is required").trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod schema for deleting an AI model
 */
export const deleteAIModelSchema = z.object({
  id: z.string().cuid(),
});

/**
 * Zod schema for toggling AI model active status
 */
export const toggleAIModelActiveSchema = z.object({
  id: z.string().cuid(),
  isActive: z.boolean(),
});

// Type exports
export type CreateAIModelInput = z.infer<typeof createAIModelSchema>;
export type UpdateAIModelInput = z.infer<typeof updateAIModelSchema>;
export type DeleteAIModelInput = z.infer<typeof deleteAIModelSchema>;
export type ToggleAIModelActiveInput = z.infer<typeof toggleAIModelActiveSchema>;

// Response types
export interface AIModelResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    modelId: string;
    provider: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export interface AIModelListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    modelId: string;
    provider: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  error?: string;
}
