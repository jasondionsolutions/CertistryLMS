"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";
import {
  createAIModelSchema,
  updateAIModelSchema,
  deleteAIModelSchema,
  toggleAIModelActiveSchema,
  type CreateAIModelInput,
  type UpdateAIModelInput,
  type DeleteAIModelInput,
  type ToggleAIModelActiveInput,
  type AIModelResponse,
  type AIModelListResponse,
} from "../types/aiModel.schema";

const prisma = new PrismaClient();

/**
 * Create a new AI model
 * Requires admin permission
 */
export const createAIModel = withPermission("ai_models.create")(
  async (
    user: AuthContext,
    input: CreateAIModelInput
  ): Promise<AIModelResponse> => {
    try {
      // Validate input
      const validated = createAIModelSchema.parse(input);

      // Check if modelId already exists
      const existing = await prisma.aIModel.findUnique({
        where: { modelId: validated.modelId },
      });

      if (existing) {
        return {
          success: false,
          error: "An AI model with this Model ID already exists",
        };
      }

      const aiModel = await prisma.aIModel.create({
        data: {
          name: validated.name,
          modelId: validated.modelId,
          provider: validated.provider,
          description: validated.description || null,
          isActive: validated.isActive,
        },
      });

      revalidatePath("/admin/ai-models");

      return {
        success: true,
        data: aiModel,
      };
    } catch (error) {
      console.error("Error creating AI model:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while creating AI model",
      };
    }
  }
);

/**
 * Update an existing AI model
 * Requires admin permission
 */
export const updateAIModel = withPermission("ai_models.update")(
  async (
    user: AuthContext,
    input: UpdateAIModelInput
  ): Promise<AIModelResponse> => {
    try {
      // Validate input
      const validated = updateAIModelSchema.parse(input);

      // If changing modelId, check it doesn't already exist
      if (validated.modelId) {
        const existing = await prisma.aIModel.findUnique({
          where: { modelId: validated.modelId },
        });

        if (existing && existing.id !== validated.id) {
          return {
            success: false,
            error: "An AI model with this Model ID already exists",
          };
        }
      }

      const updateData: any = {};
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.modelId !== undefined) updateData.modelId = validated.modelId;
      if (validated.provider !== undefined) updateData.provider = validated.provider;
      if (validated.description !== undefined) updateData.description = validated.description || null;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const aiModel = await prisma.aIModel.update({
        where: { id: validated.id },
        data: updateData,
      });

      revalidatePath("/admin/ai-models");

      return {
        success: true,
        data: aiModel,
      };
    } catch (error) {
      console.error("Error updating AI model:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while updating AI model",
      };
    }
  }
);

/**
 * Delete an AI model
 * Requires admin permission
 */
export const deleteAIModel = withPermission("ai_models.delete")(
  async (
    user: AuthContext,
    input: DeleteAIModelInput
  ): Promise<AIModelResponse> => {
    try {
      // Validate input
      const validated = deleteAIModelSchema.parse(input);

      await prisma.aIModel.delete({
        where: { id: validated.id },
      });

      revalidatePath("/admin/ai-models");

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting AI model:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while deleting AI model",
      };
    }
  }
);

/**
 * Toggle AI model active status
 * Requires admin permission
 */
export const toggleAIModelActive = withPermission("ai_models.update")(
  async (
    user: AuthContext,
    input: ToggleAIModelActiveInput
  ): Promise<AIModelResponse> => {
    try {
      // Validate input
      const validated = toggleAIModelActiveSchema.parse(input);

      const aiModel = await prisma.aIModel.update({
        where: { id: validated.id },
        data: { isActive: validated.isActive },
      });

      revalidatePath("/admin/ai-models");

      return {
        success: true,
        data: aiModel,
      };
    } catch (error) {
      console.error("Error toggling AI model status:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while toggling AI model status",
      };
    }
  }
);

/**
 * Get a single AI model by ID
 * Requires basic authentication
 */
export const getAIModel = withPermission("ai_models.read")(
  async (user: AuthContext, id: string): Promise<AIModelResponse> => {
    try {
      const aiModel = await prisma.aIModel.findUnique({
        where: { id },
      });

      if (!aiModel) {
        return {
          success: false,
          error: "AI model not found",
        };
      }

      return {
        success: true,
        data: aiModel,
      };
    } catch (error) {
      console.error("Error getting AI model:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while getting AI model",
      };
    }
  }
);

/**
 * List all AI models
 * Optionally filter by active status
 * Requires basic authentication
 */
export const listAIModels = withPermission("ai_models.read")(
  async (
    user: AuthContext,
    activeOnly: boolean = false
  ): Promise<AIModelListResponse> => {
    try {
      const where: any = {};

      if (activeOnly) {
        where.isActive = true;
      }

      const aiModels = await prisma.aIModel.findMany({
        where,
        orderBy: { name: "asc" },
      });

      return {
        success: true,
        data: aiModels,
      };
    } catch (error) {
      console.error("Error listing AI models:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while listing AI models",
      };
    }
  }
);
