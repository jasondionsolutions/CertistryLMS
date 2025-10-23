"use server";

import { withPermission } from "@/lib/middleware/withPermission";
import { AuthContext } from "@/lib/auth/types";

/**
 * Fetched Model structure from Anthropic API
 */
export type FetchedModel = {
  modelId: string;
  displayName: string;
  description: string | null;
  capabilities: string[];
  contextWindow: number;
};

/**
 * Response type for fetch operations
 */
export type FetchModelsResponse = {
  success: boolean;
  data?: FetchedModel[];
  error?: string;
};

/**
 * Fetch available Claude models from Anthropic API
 * Requires admin permission
 */
export const fetchAnthropicModels = withPermission("ai_models.read")(
  async (user: AuthContext): Promise<FetchModelsResponse> => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: "Anthropic API key not configured",
        };
      }

      // Fetch models from Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/models", {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Map Anthropic models to our format
      const models: FetchedModel[] = (data.data || []).map((model: any) => ({
        modelId: model.id,
        displayName: formatModelName(model.id),
        description: model.description || generateModelDescription(model.id),
        capabilities: ["chat", "vision", "pdf-processing"],
        contextWindow: 200000, // Claude models support 200k tokens
      }));

      return {
        success: true,
        data: models,
      };
    } catch (error) {
      console.error("Error fetching Anthropic models:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while fetching Anthropic models",
      };
    }
  }
);

/**
 * Helper: Format model ID to display name
 */
function formatModelName(modelId: string): string {
  // Convert "claude-3-5-sonnet-20241022" to "Claude 3.5 Sonnet"
  const parts = modelId.split("-");

  if (parts[0] === "claude") {
    const version = parts.slice(1, 3).join(".");
    const variant = parts[3] || "";
    const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    return `Claude ${version} ${capitalizedVariant}`.trim();
  }

  return modelId;
}

/**
 * Helper: Generate description for Claude models
 */
function generateModelDescription(modelId: string): string {
  if (modelId.includes("opus")) {
    return "Most capable Claude model for complex tasks requiring advanced reasoning";
  } else if (modelId.includes("sonnet")) {
    return "Balanced model offering strong performance for most tasks";
  } else if (modelId.includes("haiku")) {
    return "Fastest model optimized for simple queries and quick responses";
  }
  return "Claude AI model by Anthropic";
}
