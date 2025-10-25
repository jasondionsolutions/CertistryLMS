/**
 * SuggestedMappingCard Component
 *
 * Displays an AI-suggested mapping with confidence score and hierarchy
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MappingHierarchy } from "./MappingHierarchy";
import type { MappingSuggestion } from "../types/mapping.types";
import { Star } from "lucide-react";

interface SuggestedMappingCardProps {
  suggestion: MappingSuggestion;
  isSelected: boolean;
  onToggleSelect: (selected: boolean) => void;
  onSetPrimary: () => void;
  isPrimary: boolean;
}

export function SuggestedMappingCard({
  suggestion,
  isSelected,
  onToggleSelect,
  onSetPrimary,
  isPrimary,
}: SuggestedMappingCardProps) {
  const confidencePercent = Math.round(suggestion.confidence * 100);
  const isHighConfidence = suggestion.confidence >= 0.9;

  return (
    <Card
      className={`transition-colors ${
        isSelected ? "border-primary" : "border-border"
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header with confidence */}
            <div className="flex items-center justify-between">
              <Badge
                variant={isHighConfidence ? "default" : "secondary"}
                className="text-xs"
              >
                {isHighConfidence ? "🟢" : "🟡"} {confidencePercent}% match
              </Badge>

              {isPrimary && (
                <Badge variant="outline" className="text-xs">
                  <Star className="mr-1 h-3 w-3" />
                  Primary
                </Badge>
              )}
            </div>

            {/* Hierarchy */}
            <MappingHierarchy mapping={suggestion} />

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onSetPrimary}
                disabled={isPrimary}
              >
                <Star className="mr-1 h-3 w-3" />
                Set as Primary
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
