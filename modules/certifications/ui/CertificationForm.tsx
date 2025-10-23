"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AILoadingModal } from "@/components/ui/AILoadingModal";
import { useCreateCertification } from "../hooks/useCreateCertification";
import { useUpdateCertification } from "../hooks/useUpdateCertification";
import { useCreateCertificationWithBlueprint } from "../hooks/useCreateCertificationWithBlueprint";
import { createCertificationSchema, updateCertificationSchema } from "../types/certification.schema";

interface CertificationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: {
    id?: string;
    name: string;
    code: string;
    description: string | null;
    isScoredExam: boolean;
    passingScore: number | null;
    maxScore: number | null;
    defaultStudyDuration: number;
    isActive: boolean;
  };
  blueprintData?: any[]; // Blueprint domains from AI extraction
  onSuccess?: () => void;
  mode?: "create" | "edit" | "review";
}

export function CertificationForm({
  open,
  onOpenChange,
  certification,
  blueprintData,
  onSuccess,
  mode,
}: CertificationFormProps) {
  const isEditing = !!certification?.id;
  const isReview = mode === "review";
  const hasBlueprint = !!blueprintData && blueprintData.length > 0;
  const createCertification = useCreateCertification();
  const createWithBlueprint = useCreateCertificationWithBlueprint();
  const updateCertification = useUpdateCertification();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: isEditing ? zodResolver(updateCertificationSchema) : zodResolver(createCertificationSchema),
    defaultValues: certification || {
      name: "",
      code: "",
      description: "",
      isScoredExam: true,
      passingScore: null,
      maxScore: null,
      defaultStudyDuration: 45,
      isActive: true,
    },
  });

  const isScoredExam = watch("isScoredExam");

  React.useEffect(() => {
    if (certification) {
      reset(certification);
    }
  }, [certification, reset]);

  const onSubmit = async (data: any) => {
    if (isEditing) {
      const result = await updateCertification.mutateAsync(data);
      if (result.success) {
        onOpenChange(false);
        reset();
        onSuccess?.();
      }
    } else {
      // If we have blueprint data, create certification with blueprint
      if (hasBlueprint) {
        const result = await createWithBlueprint.mutateAsync({
          ...data,
          domains: blueprintData,
        });
        if (result.success) {
          onOpenChange(false);
          reset();
          onSuccess?.();
        }
      } else {
        // Otherwise, create certification without blueprint
        const result = await createCertification.mutateAsync(data);
        if (result.success) {
          onOpenChange(false);
          reset();
          onSuccess?.();
        }
      }
    }
  };

  // Calculate blueprint complexity for loading estimation
  const getBlueprintStats = () => {
    if (!blueprintData) return { objectives: 0, bullets: 0, subBullets: 0 };

    let objectives = 0;
    let bullets = 0;
    let subBullets = 0;

    blueprintData.forEach((domain) => {
      objectives += domain.objectives?.length || 0;
      domain.objectives?.forEach((obj: any) => {
        bullets += obj.bullets?.length || 0;
        obj.bullets?.forEach((bullet: any) => {
          subBullets += bullet.subBullets?.length || 0;
        });
      });
    });

    return { objectives, bullets, subBullets };
  };

  const stats = getBlueprintStats();
  const totalItems = (blueprintData?.length || 0) + stats.objectives + stats.bullets + stats.subBullets;
  // Estimate: ~0.3 seconds per item (domain/objective/bullet/sub-bullet)
  const estimatedDuration = Math.max(30, Math.min(120, Math.ceil(totalItems * 0.3)));

  return (
    <>
      {/* Saving Progress Modal */}
      <AILoadingModal
        isOpen={createWithBlueprint.isPending}
        title="Saving Certification & Blueprint"
        estimatedDuration={estimatedDuration}
        message={
          <>
            <p className="mb-2">
              Creating certification and importing blueprint structure:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{blueprintData?.length || 0} domain{blueprintData?.length !== 1 ? "s" : ""}</li>
              <li>{stats.objectives} objective{stats.objectives !== 1 ? "s" : ""}</li>
              {stats.bullets > 0 && <li>{stats.bullets} bullet point{stats.bullets !== 1 ? "s" : ""}</li>}
              {stats.subBullets > 0 && <li>{stats.subBullets} sub-bullet{stats.subBullets !== 1 ? "s" : ""}</li>}
            </ul>
            <p className="mt-4 text-sm opacity-70">
              Large blueprints may take up to 2 minutes to save completely
            </p>
          </>
        }
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReview
              ? "Review Extracted Data"
              : isEditing
              ? "Edit Certification"
              : "Create Certification"}
          </DialogTitle>
          <DialogDescription>
            {isReview
              ? "Review and edit the certification details extracted from the PDF."
              : isEditing
              ? "Update the certification details below."
              : "Add a new certification program to the system."}
            {hasBlueprint && !isEditing && (
              <span className="block mt-1 text-primary font-medium">
                Blueprint with {blueprintData.length} domain{blueprintData.length !== 1 ? "s" : ""} will be imported
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Certification Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Certification Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="CompTIA Security+"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          {/* Certification Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Certification Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="SY0-701"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message as string}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter certification description..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message as string}</p>
            )}
          </div>

          {/* Scored Exam Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isScoredExam"
              checked={isScoredExam}
              onCheckedChange={(checked) => setValue("isScoredExam", checked as boolean)}
            />
            <Label htmlFor="isScoredExam" className="cursor-pointer">
              Scored Exam (uncheck for Pass/Fail only)
            </Label>
          </div>

          {/* Scoring Fields (conditional) */}
          {isScoredExam && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passingScore">
                  Passing Score <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passingScore"
                  type="number"
                  placeholder="750"
                  {...register("passingScore", { valueAsNumber: true })}
                />
                {errors.passingScore && (
                  <p className="text-sm text-destructive">{errors.passingScore.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">
                  Max Score <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxScore"
                  type="number"
                  placeholder="900"
                  {...register("maxScore", { valueAsNumber: true })}
                />
                {errors.maxScore && (
                  <p className="text-sm text-destructive">{errors.maxScore.message as string}</p>
                )}
              </div>
            </div>
          )}

          {/* Default Study Duration */}
          <div className="space-y-3">
            <Label>
              Default Study Duration <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={watch("defaultStudyDuration")?.toString()}
              onValueChange={(value) => setValue("defaultStudyDuration", parseInt(value))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="duration-30" />
                <Label htmlFor="duration-30" className="cursor-pointer font-normal">
                  30 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="45" id="duration-45" />
                <Label htmlFor="duration-45" className="cursor-pointer font-normal">
                  45 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="60" id="duration-60" />
                <Label htmlFor="duration-60" className="cursor-pointer font-normal">
                  60 days
                </Label>
              </div>
            </RadioGroup>
            {errors.defaultStudyDuration && (
              <p className="text-sm text-destructive">{errors.defaultStudyDuration.message as string}</p>
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
              Active (visible to students)
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
    </>
  );
}
