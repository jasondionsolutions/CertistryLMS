"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Edit, Trash, Power, PowerOff } from "lucide-react";
import { useAIModels } from "@/modules/certifications/hooks/useAIModels";
import { useDeleteAIModel } from "@/modules/certifications/hooks/useDeleteAIModel";
import { useToggleAIModelActive } from "@/modules/certifications/hooks/useToggleAIModelActive";
import { AIModelForm } from "@/modules/certifications/ui/AIModelForm";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<AIModel | null>(null);

  const { data: response, isLoading } = useAIModels(false);
  const deleteModel = useDeleteAIModel();
  const toggleActive = useToggleAIModelActive();

  const aiModels = response?.data || [];

  const handleEdit = (model: AIModel) => {
    setSelectedModel(model);
    setFormOpen(true);
  };

  const handleDelete = (model: AIModel) => {
    setSelectedModel(model);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedModel) return;

    await deleteModel.mutateAsync({ id: selectedModel.id });
    setDeleteDialogOpen(false);
    setSelectedModel(null);
  };

  const handleToggleActive = async (model: AIModel) => {
    await toggleActive.mutateAsync({
      id: model.id,
      isActive: !model.isActive,
    });
  };

  const handleCreateNew = () => {
    setSelectedModel(null);
    setFormOpen(true);
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
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add AI Model
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && aiModels.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No AI models configured</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first AI model to enable blueprint extraction from PDFs.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Model
            </Button>
          </div>
        </div>
      )}

      {/* Models List */}
      {!isLoading && aiModels.length > 0 && (
        <div className="space-y-3">
          {aiModels.map((model) => (
            <div
              key={model.id}
              className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{model.name}</h3>
                    {model.isActive ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {model.modelId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Provider: {model.provider}
                  </p>
                  {model.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {model.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(model)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(model)}>
                      {model.isActive ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(model)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && aiModels.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {aiModels.length} model{aiModels.length !== 1 ? "s" : ""} configured
        </p>
      )}

      {/* Form Dialog */}
      <AIModelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        aiModel={selectedModel || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedModel?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
