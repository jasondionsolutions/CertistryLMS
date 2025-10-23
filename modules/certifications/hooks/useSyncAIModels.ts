import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAIModels } from "../serverActions/aiModel.action";
import { toast } from "sonner";

/**
 * Hook to sync AI models from Anthropic API
 * Fetches latest models and updates the database
 */
export function useSyncAIModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncAIModels(),
    onSuccess: (result) => {
      if (result.success && result.data) {
        const { newModels, updatedModels } = result.data;

        if (newModels > 0 || updatedModels > 0) {
          toast.success(
            `Synced ${newModels} new and ${updatedModels} updated model${
              newModels + updatedModels !== 1 ? "s" : ""
            }`
          );
        } else {
          toast.info("All models are up to date");
        }

        // Invalidate AI models query to refetch the list
        queryClient.invalidateQueries({ queryKey: ["aiModels"] });
      } else {
        toast.error(result.error || "Failed to sync models");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sync models");
    },
  });
}
