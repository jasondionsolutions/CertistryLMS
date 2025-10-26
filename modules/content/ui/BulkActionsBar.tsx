"use client";

import { useState } from "react";
import { Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkDelete, useBulkRemap } from "../hooks/useBulkOperations";
import { useCertifications } from "../hooks/useContentLibrary";
import type { ContentType } from "../types/contentLibrary.types";

interface BulkActionsBarProps {
  selectedIds: string[];
  contentType: ContentType;
  onClearSelection: () => void;
}

/**
 * Bulk actions toolbar
 * Appears when items are selected
 */
export function BulkActionsBar({
  selectedIds,
  contentType,
  onClearSelection,
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRemapDialog, setShowRemapDialog] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState("");

  const { data: certifications } = useCertifications();
  const { mutate: bulkDelete, isPending: isDeleting } = useBulkDelete();
  const { mutate: bulkRemap, isPending: isRemapping } = useBulkRemap();

  const handleDelete = () => {
    bulkDelete(
      { contentIds: selectedIds, contentType },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          onClearSelection();
        },
      }
    );
  };

  const handleRemap = () => {
    if (!selectedCertId) return;

    bulkRemap(
      {
        contentIds: selectedIds,
        contentType,
        certificationId: selectedCertId,
      },
      {
        onSuccess: () => {
          setShowRemapDialog(false);
          setSelectedCertId("");
          onClearSelection();
        },
      }
    );
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {contentType === "video" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRemapDialog(true)}
              disabled={isRemapping}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Re-map to Certification
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} item
              {selectedIds.length !== 1 ? "s" : ""}? This will also delete all
              associated mappings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remap dialog */}
      <Dialog open={showRemapDialog} onOpenChange={setShowRemapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-map to Certification</DialogTitle>
            <DialogDescription>
              Select a certification to assign to {selectedIds.length} selected
              video{selectedIds.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedCertId} onValueChange={setSelectedCertId}>
              <SelectTrigger>
                <SelectValue placeholder="Select certification" />
              </SelectTrigger>
              <SelectContent>
                {certifications?.map((cert) => (
                  <SelectItem key={cert.id} value={cert.id}>
                    {cert.code} - {cert.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemapDialog(false);
                setSelectedCertId("");
              }}
              disabled={isRemapping}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemap}
              disabled={!selectedCertId || isRemapping}
            >
              {isRemapping ? "Re-mapping..." : "Re-map"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
