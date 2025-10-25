/**
 * VideoMappingClient Component
 *
 * Client-side interactive mapping interface
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSuggestMappings } from "@/modules/content/hooks/useMappingSuggestions";
import { useApplyMappings } from "@/modules/content/hooks/useApplyMappings";
import { useVideoMappings } from "@/modules/content/hooks/useVideoMappings";
import {
  useRemoveMapping,
  useUpdatePrimaryMapping,
} from "@/modules/content/hooks/useManualMapping";
import { SuggestedMappingCard } from "@/modules/content/ui/SuggestedMappingCard";
import { ManualMappingCombobox } from "@/modules/content/ui/ManualMappingCombobox";
import { MappingHierarchy } from "@/modules/content/ui/MappingHierarchy";
import type { MappingSuggestion } from "@/modules/content/types/mapping.types";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  AlertCircle,
} from "lucide-react";

interface VideoMappingClientProps {
  videoId: string;
  certificationId: string;
  hasTranscript: boolean;
}

export function VideoMappingClient({
  videoId,
  certificationId,
  hasTranscript,
}: VideoMappingClientProps) {
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set()
  );
  const [primarySuggestionIndex, setPrimarySuggestionIndex] = useState<
    number | null
  >(null);

  // Hooks
  const { mutate: generateSuggestions, isPending: isGenerating } =
    useSuggestMappings();
  const { mutate: applyMappings, isPending: isApplying } = useApplyMappings();
  const { data: mappingsSummary, isLoading: isLoadingMappings } =
    useVideoMappings(videoId);
  const { mutate: removeMapping, isPending: isRemoving } = useRemoveMapping();
  const { mutate: updatePrimary, isPending: isUpdatingPrimary } =
    useUpdatePrimaryMapping();

  // Handle generate suggestions
  const handleGenerateSuggestions = () => {
    generateSuggestions(
      { videoId, certificationId },
      {
        onSuccess: (data) => {
          setSuggestions(data);
          // Auto-select all suggestions
          setSelectedSuggestions(new Set(data.map((_, i) => i)));
          // Set primary to highest confidence (first one)
          if (data.length > 0 && data[0].isPrimarySuggestion) {
            setPrimarySuggestionIndex(0);
          }
        },
      }
    );
  };

  // Handle toggle suggestion selection
  const handleToggleSuggestion = (index: number, selected: boolean) => {
    const newSelected = new Set(selectedSuggestions);
    if (selected) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
      // If deselecting primary, clear primary
      if (index === primarySuggestionIndex) {
        setPrimarySuggestionIndex(null);
      }
    }
    setSelectedSuggestions(newSelected);
  };

  // Handle set primary suggestion
  const handleSetPrimarySuggestion = (index: number) => {
    setPrimarySuggestionIndex(index);
    // Ensure it's selected
    setSelectedSuggestions((prev) => new Set(prev).add(index));
  };

  // Handle apply selected suggestions
  const handleApplySuggestions = () => {
    const selectedMappings = Array.from(selectedSuggestions)
      .map((index) => suggestions[index])
      .map((suggestion) => ({
        objectiveId: suggestion.objectiveId,
        bulletId: suggestion.bulletId,
        subBulletId: suggestion.subBulletId,
        isPrimary:
          primarySuggestionIndex !== null &&
          suggestions[primarySuggestionIndex] === suggestion,
        confidence: suggestion.confidence,
      }));

    applyMappings(
      { videoId, mappings: selectedMappings },
      {
        onSuccess: () => {
          setSuggestions([]);
          setSelectedSuggestions(new Set());
          setPrimarySuggestionIndex(null);
        },
      }
    );
  };

  // Handle remove mapping
  const handleRemoveMapping = (mappingId: string) => {
    removeMapping({ mappingId, videoId });
  };

  // Handle update primary mapping
  const handleUpdatePrimary = (mappingId: string) => {
    updatePrimary({ videoId, mappingId });
  };

  const hasSelectedSuggestions = selectedSuggestions.size > 0;

  return (
    <div className="space-y-6">
      {/* AI Suggestions Section */}
      {hasTranscript && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Suggested Mappings
                </CardTitle>
                <CardDescription>
                  Automatically generated suggestions based on video transcript
                </CardDescription>
              </div>
              <Button
                onClick={handleGenerateSuggestions}
                disabled={isGenerating || suggestions.length > 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : suggestions.length > 0 ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Suggestions Generated
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Suggestions
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {suggestions.length > 0 && (
            <CardContent className="space-y-4">
              {/* Suggestions list */}
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <SuggestedMappingCard
                    key={index}
                    suggestion={suggestion}
                    isSelected={selectedSuggestions.has(index)}
                    onToggleSelect={(selected) =>
                      handleToggleSuggestion(index, selected)
                    }
                    onSetPrimary={() => handleSetPrimarySuggestion(index)}
                    isPrimary={primarySuggestionIndex === index}
                  />
                ))}
              </div>

              {/* Apply button */}
              {hasSelectedSuggestions && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedSuggestions.size} mapping
                      {selectedSuggestions.size !== 1 ? "s" : ""} selected
                    </p>
                    <Button
                      onClick={handleApplySuggestions}
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Apply Selected Mappings
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* No Transcript Warning */}
      {!hasTranscript && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <AlertCircle className="h-5 w-5" />
              No Transcript Available
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              AI suggestions require a completed transcript. You can add
              mappings manually below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Manual Mapping Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Mapping Manually
          </CardTitle>
          <CardDescription>
            Search and select objectives, bullets, or sub-bullets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualMappingCombobox
            videoId={videoId}
            certificationId={certificationId}
          />
        </CardContent>
      </Card>

      {/* Current Mappings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
          <CardDescription>
            {isLoadingMappings
              ? "Loading..."
              : `${mappingsSummary?.totalMappings || 0} mapping${
                  mappingsSummary?.totalMappings !== 1 ? "s" : ""
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMappings ? (
            <p className="text-sm text-muted-foreground">Loading mappings...</p>
          ) : mappingsSummary && mappingsSummary.totalMappings > 0 ? (
            <div className="space-y-4">
              {/* Primary mapping */}
              {mappingsSummary.primaryMapping && (
                <div className="rounded-lg border border-primary bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="default" className="text-xs">
                      <Star className="mr-1 h-3 w-3" />
                      Primary
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleRemoveMapping(mappingsSummary.primaryMapping!.id)
                        }
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <MappingHierarchy
                    mapping={mappingsSummary.primaryMapping}
                    showConfidence
                    confidence={mappingsSummary.primaryMapping.confidence}
                  />
                </div>
              )}

              {/* Other mappings */}
              {mappingsSummary.otherMappings.length > 0 && (
                <>
                  {mappingsSummary.primaryMapping && <Separator />}
                  <div className="space-y-3">
                    {mappingsSummary.otherMappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {mapping.mappingSource === "manual"
                              ? "Manual"
                              : "AI Confirmed"}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdatePrimary(mapping.id)}
                              disabled={isUpdatingPrimary}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMapping(mapping.id)}
                              disabled={isRemoving}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <MappingHierarchy
                          mapping={mapping}
                          showConfidence
                          confidence={mapping.confidence}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No mappings yet. Generate AI suggestions or add mappings manually
              above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
