"use client";

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { useDeleteCertification } from "../hooks/useDeleteCertification";
import { useArchiveCertification } from "../hooks/useArchiveCertification";
import { checkCertificationDeletion } from "../serverActions/certification.action";
import { AlertTriangle, Archive } from "lucide-react";

interface DeleteCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification: {
    id: string;
    name: string;
    code: string;
  } | null;
  onSuccess?: () => void;
}

export function DeleteCertificationDialog({
  open,
  onOpenChange,
  certification,
  onSuccess,
}: DeleteCertificationDialogProps) {
  const [deleteCheck, setDeleteCheck] = React.useState<{
    canDelete: boolean;
    hasStudents: boolean;
    hasContent: boolean;
    studentCount: number;
    domainCount: number;
  } | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);

  const deleteCertification = useDeleteCertification();
  const archiveCertification = useArchiveCertification();

  React.useEffect(() => {
    async function checkDeletion() {
      if (certification && open) {
        setIsChecking(true);
        try {
          const result = await checkCertificationDeletion(certification.id);
          if (result.success && result.data) {
            setDeleteCheck(result.data);
          }
        } catch (error) {
          console.error("Error checking deletion:", error);
        }
        setIsChecking(false);
      }
    }
    checkDeletion();
  }, [certification, open]);

  const handleDelete = async () => {
    if (!certification) return;

    if (deleteCheck?.canDelete) {
      await deleteCertification.mutateAsync({ id: certification.id });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleArchive = async () => {
    if (!certification) return;

    await archiveCertification.mutateAsync({
      id: certification.id,
      isArchived: true,
    });
    onOpenChange(false);
    onSuccess?.();
  };

  if (!certification) return null;

  const canDelete = deleteCheck?.canDelete ?? false;
  const hasReferences = deleteCheck?.hasStudents || deleteCheck?.hasContent;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>
              {canDelete ? "Delete Certification" : "Cannot Delete Certification"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong>{certification.name}</strong> ({certification.code})
              </p>

              {isChecking && <p>Checking dependencies...</p>}

              {!isChecking && hasReferences && (
                <div className="rounded-lg bg-muted p-3 space-y-2">
                  <p className="text-sm">This certification has:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {deleteCheck?.hasStudents && (
                      <li>{deleteCheck.studentCount} enrolled student(s)</li>
                    )}
                    {deleteCheck?.hasContent && (
                      <li>{deleteCheck.domainCount} domain(s) with content</li>
                    )}
                  </ul>
                  <p className="text-sm font-medium mt-2">
                    You can archive it instead to hide it from new enrollments.
                  </p>
                </div>
              )}

              {!isChecking && canDelete && (
                <p>No students enrolled or content exists. This action cannot be undone.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {canDelete ? (
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          ) : (
            <Button
              onClick={handleArchive}
              disabled={archiveCertification.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
