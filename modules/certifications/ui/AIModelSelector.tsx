"use client";

import { useEffect } from "react";
import { useAIModels } from "../hooks/useAIModels";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  onAutoSelect?: (modelId: string) => void;
  disabled?: boolean;
}

export function AIModelSelector({
  selectedModelId,
  onModelSelect,
  onAutoSelect,
  disabled,
}: AIModelSelectorProps) {
  const { data: response, isLoading, error } = useAIModels(true); // Only fetch active models

  const models = response?.data || [];

  // Auto-select first available model on mount
  useEffect(() => {
    if (models.length > 0 && !selectedModelId && onAutoSelect) {
      onAutoSelect(models[0].modelId);
    }
  }, [models, selectedModelId, onAutoSelect]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load AI models</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
        No AI models are currently enabled. Please contact an administrator to enable AI models.
      </div>
    );
  }

  return (
    <RadioGroup value={selectedModelId} onValueChange={onModelSelect} disabled={disabled}>
      {models.map((model) => (
        <div
          key={model.id}
          className={cn(
            "flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-colors",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/50 cursor-pointer"
          )}
        >
          <RadioGroupItem value={model.modelId} id={model.id} disabled={disabled} />
          <div className="flex-1">
            <Label
              htmlFor={model.id}
              className={cn("font-medium", disabled ? "cursor-not-allowed" : "cursor-pointer")}
            >
              {model.name}
            </Label>
            {model.description && (
              <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {model.provider}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{model.modelId}</span>
            </div>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
