"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useAIModels } from "@/modules/certifications/hooks/useAIModels";
import { useSyncAIModels } from "@/modules/certifications/hooks/useSyncAIModels";
import { AIModelForm } from "@/modules/certifications/ui/AIModelForm";
import { AIModelCard } from "@/modules/certifications/ui/AIModelCard";

type AIModel = {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function AIModelsPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: response, isLoading } = useAIModels(false);
  const syncModels = useSyncAIModels();

  const aiModels = React.useMemo(() => response?.data || [], [response?.data]);

  // Filter models by search query
  const filteredModels = React.useMemo(() => {
    if (!searchQuery.trim()) return aiModels;

    const query = searchQuery.toLowerCase();
    return aiModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.modelId.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query)
    );
  }, [aiModels, searchQuery]);

  // Separate active and inactive models
  const activeModels = filteredModels.filter((m) => m.isActive);
  const inactiveModels = filteredModels.filter((m) => !m.isActive);

  const handleCreateNew = () => {
    setSelectedModel(null);
    setFormOpen(true);
  };

  const handleSync = () => {
    syncModels.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Models</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI models available for blueprint extraction
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            variant="outline"
            disabled={syncModels.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncModels.isPending ? "animate-spin" : ""}`}
            />
            {syncModels.isPending ? "Syncing..." : "Check for New Models"}
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add AI Model
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search AI models..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && aiModels.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No AI models configured</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Sync with Anthropic API to discover available Claude models, or add models manually.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleSync} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Models
              </Button>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && aiModels.length > 0 && filteredModels.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No models found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No models match your search query &ldquo;{searchQuery}&rdquo;
            </p>
            <Button onClick={() => setSearchQuery("")} variant="outline">
              Clear Search
            </Button>
          </div>
        </div>
      )}

      {/* Active Models */}
      {!isLoading && activeModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Active Models ({activeModels.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeModels.map((model) => (
              <AIModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Models */}
      {!isLoading && inactiveModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Inactive Models ({inactiveModels.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveModels.map((model) => (
              <AIModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredModels.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""} total
          {searchQuery && ` matching &ldquo;${searchQuery}&rdquo;`}
        </p>
      )}

      {/* Form Dialog */}
      <AIModelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        aiModel={selectedModel || undefined}
      />
    </div>
  );
}
