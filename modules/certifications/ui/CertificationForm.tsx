"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { AILoadingModal } from "@/components/ui/AILoadingModal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Trash, Archive, FileText, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateCertification } from "../hooks/useCreateCertification";
import { useUpdateCertification } from "../hooks/useUpdateCertification";
import { useCreateCertificationWithBlueprint } from "../hooks/useCreateCertificationWithBlueprint";
import { useDeleteCertification } from "../hooks/useDeleteCertification";
import { useArchiveCertification } from "../hooks/useArchiveCertification";
import { createCertificationSchema, updateCertificationSchema } from "../types/certification.schema";
import { getDomains } from "../serverActions/domain.action";
import { exportBlueprintAsCSV, exportBlueprintAsJSON } from "../lib/exportBlueprint";
import { toast } from "sonner";

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
    _count?: {
      domains: number;
      currentStudents: number;
    };
  };
  blueprintData?: any[]; // Blueprint domains from AI extraction
  onSuccess?: () => void;
  mode?: "create" | "edit" | "review";
  startInEditMode?: boolean; // Force the form to start in edit mode
}

export function CertificationForm({
  open,
  onOpenChange,
  certification,
  blueprintData,
  onSuccess,
  mode,
  startInEditMode = false,
}: CertificationFormProps) {
  const router = useRouter();
  const isEditing = !!certification?.id;
  const isReview = mode === "review";
  const hasBlueprint = !!blueprintData && blueprintData.length > 0;
  // Review mode is always editable, new certs start in edit mode, existing certs start in view mode (unless startInEditMode is true)
  const [isEditMode, setIsEditMode] = React.useState(isReview || startInEditMode || !isEditing);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);
  const createCertification = useCreateCertification();
  const createWithBlueprint = useCreateCertificationWithBlueprint();
  const updateCertification = useUpdateCertification();
  const deleteCertification = useDeleteCertification();
  const archiveCertification = useArchiveCertification();

  // Determine if we should show delete or archive button
  // Only check for enrolled students - domains/objectives are part of initial blueprint
  const studentCount = certification?._count?.currentStudents ?? 0;
  const hasEnrolledStudents = studentCount > 0;
  const showArchiveButton = hasEnrolledStudents;
  const showDeleteButton = !hasEnrolledStudents;

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
      // Review mode is always editable, otherwise use startInEditMode or default to view mode
      setIsEditMode(isReview || startInEditMode);
    } else {
      setIsEditMode(true); // New cert starts in edit mode
    }
  }, [certification, reset, open, startInEditMode, isReview]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleArchiveClick = () => {
    setShowArchiveConfirm(true);
  };

  const confirmDelete = async () => {
    if (!certification?.id) return;
    const result = await deleteCertification.mutateAsync({ id: certification.id });
    if (result.success) {
      onOpenChange(false);
      reset();
      onSuccess?.();
    }
  };

  const confirmArchive = async () => {
    if (!certification?.id) return;
    const result = await archiveCertification.mutateAsync({ id: certification.id, isArchived: true });
    if (result.success) {
      onOpenChange(false);
      reset();
      onSuccess?.();
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    if (!certification?.id || !certification?.name || !certification?.code) return;

    try {
      // Fetch domains with full nested structure
      const domainsResult = await getDomains(certification.id);

      if (!domainsResult.success || !domainsResult.data) {
        toast.error("Failed to fetch blueprint data");
        return;
      }

      const exportData = {
        certificationName: certification.name,
        certificationCode: certification.code,
        domains: domainsResult.data,
      };

      if (format === "csv") {
        exportBlueprintAsCSV(exportData);
        toast.success("Blueprint exported as CSV");
      } else {
        exportBlueprintAsJSON(exportData);
        toast.success("Blueprint exported as JSON");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export blueprint");
    }
  };

  const handleActiveToggle = async (checked: boolean) => {
    // If trying to activate, validate domain weights first
    if (checked && certification?.id) {
      const domainsResult = await getDomains(certification.id);

      if (domainsResult.success && domainsResult.data) {
        const totalWeight = domainsResult.data.reduce((sum, d) => sum + (d.weight || 0), 0);
        const totalPercentage = Math.round(totalWeight * 100 * 10) / 10;
        const isWeightValid = totalPercentage >= 99.5 && totalPercentage <= 100.5;

        if (!isWeightValid) {
          toast.error(
            `Cannot activate certification: Domain weights must sum to 100%. Current total: ${totalPercentage}%`,
            { duration: 5000 }
          );
          setValue("isActive", false);
          return;
        }
      }
    }

    setValue("isActive", checked);

    // Auto-save if editing an existing certification
    if (certification?.id) {
      await updateCertification.mutateAsync({
        id: certification.id,
        name: certification.name,
        code: certification.code,
        description: certification.description ?? undefined,
        isScoredExam: certification.isScoredExam,
        passingScore: certification.passingScore ?? undefined,
        maxScore: certification.maxScore ?? undefined,
        defaultStudyDuration: certification.defaultStudyDuration,
        isActive: checked,
      });
      onSuccess?.();
    }
  };

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
              ? "Certification Details"
              : "Create Certification"}
          </DialogTitle>
          <DialogDescription>
            {isReview
              ? "Review and edit the certification details extracted from the PDF."
              : isEditing
              ? isEditMode
                ? "Update the certification details below."
                : "View certification details. Click Edit to make changes."
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
              disabled={!isEditMode}
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
              disabled={!isEditMode}
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
              rows={6}
              disabled={!isEditMode}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message as string}</p>
            )}
          </div>

          {/* Scored Exam Switch */}
          <div className="flex items-center gap-3">
            <Label htmlFor="isScoredExam">
              Scored Exam (Pass/Fail only if disabled)
            </Label>
            <Switch
              id="isScoredExam"
              checked={isScoredExam}
              onCheckedChange={(checked) => setValue("isScoredExam", checked)}
              disabled={!isEditMode}
            />
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
              disabled={!isEditMode}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="duration-7" />
                <Label htmlFor="duration-7" className="cursor-pointer font-normal">
                  7 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="14" id="duration-14" />
                <Label htmlFor="duration-14" className="cursor-pointer font-normal">
                  14 days
                </Label>
              </div>
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

          {/* Active Status Toggle */}
          <div className="flex items-center gap-3">
            <Label htmlFor="isActive">Status:</Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!watch("isActive") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                Inactive
              </span>
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={handleActiveToggle}
              />
              <span className={`text-sm ${watch("isActive") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                Active
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center w-full">
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (certification?.id) {
                        router.push(`/admin/certifications/${certification.id}/blueprint`);
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Blueprint
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport("csv")}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("json")}>
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && showDeleteButton && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={deleteCertification.isPending}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {isEditing && showArchiveButton && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleArchiveClick}
                  disabled={archiveCertification.isPending}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                  setIsEditMode(!isEditing);
                }}
              >
                Cancel
              </Button>
              {isEditing && !isEditMode ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditMode(true);
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Save" : "Create"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Certification"
        description={`You are about to permanently delete "${certification?.name} (${certification?.code})".\n\nThis action cannot be undone and will delete all blueprint data.`}
        confirmText="Delete"
        requireTypedConfirmation={true}
        confirmationWord="Confirm"
        onConfirm={confirmDelete}
        variant="danger"
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Certification"
        description={`You are about to archive "${certification?.name} (${certification?.code})".\n\nThis certification will be hidden from active students and cannot be re-assigned.`}
        confirmText="Archive"
        requireTypedConfirmation={true}
        confirmationWord="Confirm"
        onConfirm={confirmArchive}
        variant="warning"
      />
    </>
  );
}
