"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateAIModel } from "../hooks/useCreateAIModel";
import { useUpdateAIModel } from "../hooks/useUpdateAIModel";
import { createAIModelSchema, updateAIModelSchema } from "../types/aiModel.schema";

interface AIModelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiModel?: {
    id: string;
    name: string;
    modelId: string;
    provider: string;
    description: string | null;
    isActive: boolean;
  };
}

export function AIModelForm({
  open,
  onOpenChange,
  aiModel,
}: AIModelFormProps) {
  const isEditing = !!aiModel;
  const createAIModel = useCreateAIModel();
  const updateAIModel = useUpdateAIModel();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: isEditing ? zodResolver(updateAIModelSchema) : zodResolver(createAIModelSchema),
    defaultValues: aiModel || {
      name: "",
      modelId: "",
      provider: "anthropic",
      description: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (aiModel) {
      reset(aiModel);
    }
  }, [aiModel, reset]);

  const onSubmit = async (data: any) => {
    if (isEditing) {
      const result = await updateAIModel.mutateAsync(data);
      if (result.success) {
        onOpenChange(false);
        reset();
      }
    } else {
      const result = await createAIModel.mutateAsync(data);
      if (result.success) {
        onOpenChange(false);
        reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit AI Model" : "Add AI Model"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the AI model configuration."
              : "Add a new AI model for blueprint extraction."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Model Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Claude 3.5 Sonnet"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          {/* Model ID */}
          <div className="space-y-2">
            <Label htmlFor="modelId">
              Model ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modelId"
              placeholder="claude-3-5-sonnet-20241022"
              {...register("modelId")}
            />
            {errors.modelId && (
              <p className="text-sm text-destructive">{errors.modelId.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The API identifier for this model (e.g., claude-3-5-sonnet-20241022)
            </p>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">
              Provider <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider"
              placeholder="anthropic"
              {...register("provider")}
            />
            {errors.provider && (
              <p className="text-sm text-destructive">{errors.provider.message as string}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for this model..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message as string}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (available for selection)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
