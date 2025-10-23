"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToggleAIModelActive } from "../hooks/useToggleAIModelActive";

type AIModel = {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  description: string | null;
  isActive: boolean;
};

interface AIModelCardProps {
  model: AIModel;
}

export function AIModelCard({ model }: AIModelCardProps) {
  const toggleActive = useToggleAIModelActive();

  const handleToggle = async () => {
    await toggleActive.mutateAsync({
      id: model.id,
      isActive: !model.isActive,
    });
  };

  // Get provider badge color
  const getProviderBadgeColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "anthropic":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "openai":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card
      className={`transition-all ${
        model.isActive ? "border-primary shadow-md" : "border-border"
      }`}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{model.name}</h3>
          <Badge className={getProviderBadgeColor(model.provider)}>
            {model.provider}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model ID */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Model ID</p>
          <p className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
            {model.modelId}
          </p>
        </div>

        {/* Description */}
        {model.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground">{model.description}</p>
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor={`toggle-${model.id}`} className="text-sm font-medium">
            Enable for use
          </Label>
          <Switch
            id={`toggle-${model.id}`}
            checked={model.isActive}
            onCheckedChange={handleToggle}
            disabled={toggleActive.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
