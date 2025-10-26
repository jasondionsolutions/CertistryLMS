"use client";

/**
 * EditDocumentDialog Component
 *
 * Modal dialog for editing document metadata
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateDocument } from "../hooks/useDocuments";
import { getDocument } from "../serverActions/document.action";
import { Pencil, Loader2 } from "lucide-react";

interface EditDocumentDialogProps {
  documentId: string;
  documentTitle: string;
  trigger?: React.ReactNode;
}

export function EditDocumentDialog({
  documentId,
  documentTitle,
  trigger,
}: EditDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateDocument, isPending } = useUpdateDocument();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);
  const [allowDownload, setAllowDownload] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDocument();
    }
  }, [isOpen]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      const result = await getDocument({ id: documentId });
      if (result.success && result.data) {
        setTitle(result.data.title);
        setDescription(result.data.description || "");
        setVersion(result.data.version);
        setAllowDownload(result.data.allowDownload);
      }
    } catch (error) {
      console.error("Failed to load document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateDocument(
      {
        id: documentId,
        title: title.trim(),
        description: description.trim() || undefined,
        version,
        allowDownload,
      },
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
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={4}
              />
            </div>

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="edit-version">Version</Label>
              <Input
                id="edit-version"
                type="number"
                min="1"
                value={version}
                onChange={(e) => setVersion(parseInt(e.target.value))}
                required
              />
            </div>

            {/* Allow Download */}
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-allow-download" className="cursor-pointer">
                Allow students to download this document
              </Label>
              <Switch
                id="edit-allow-download"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
