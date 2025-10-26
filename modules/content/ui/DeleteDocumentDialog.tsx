"use client";

/**
 * DeleteDocumentDialog Component
 *
 * Confirmation dialog for deleting a document
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteDocument } from "../hooks/useDocuments";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteDocumentDialogProps {
  documentId: string;
  documentTitle: string;
  trigger?: React.ReactNode;
}

export function DeleteDocumentDialog({
  documentId,
  documentTitle,
  trigger,
}: DeleteDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteDocument, isPending } = useDeleteDocument();

  const handleDelete = () => {
    deleteDocument(
      { id: documentId },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{documentTitle}&quot;? This action
            cannot be undone and will remove all associated mappings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
