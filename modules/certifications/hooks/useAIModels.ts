"use client";

import { useQuery } from "@tanstack/react-query";
import { listAIModels } from "../serverActions/aiModel.action";

/**
 * Hook for fetching AI models
 */
export function useAIModels(activeOnly: boolean = false) {
  return useQuery({
    queryKey: ["aiModels", activeOnly],
    queryFn: () => listAIModels(activeOnly),
  });
}
