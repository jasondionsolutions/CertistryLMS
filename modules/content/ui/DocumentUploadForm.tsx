"use client";

/**
 * Document Upload Form Component
 *
 * Drag-drop file upload with form for document metadata.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadDocument } from "../hooks/useUploadDocument";
import { DocumentUploadProgress } from "./DocumentUploadProgress";
import {
  SUPPORTED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE,
  type DocumentType,
} from "../types/document.types";
import { Upload, X, FileText } from "lucide-react";

export function DocumentUploadForm() {
  const router = useRouter();
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);
  const [allowDownload, setAllowDownload] = useState(true);
  const [generateAIDescription, setGenerateAIDescription] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Prevent default browser behavior for drag-drop anywhere on the page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add listeners to prevent browser from opening files
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension as any)) {
      alert(`Only ${SUPPORTED_DOCUMENT_EXTENSIONS.join(", ")} files are supported`);
      return;
    }

    // Check file size
    if (file.size > MAX_DOCUMENT_SIZE) {
      alert("File size must be less than 100MB");
      return;
    }

    setFile(file);

    // Auto-populate title if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const cleanTitle = fileName.replace(/_/g, " "); // Replace underscores with spaces
      setTitle(cleanTitle);
    }
  };

  const removeFile = () => {
    setFile(null);
    setTitle("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a document file");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    // Determine document type from file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    let docType: DocumentType;
    switch (extension) {
      case "pdf":
        docType = "pdf";
        break;
      case "docx":
        docType = "docx";
        break;
      case "txt":
        docType = "txt";
        break;
      default:
        alert("Unsupported file type");
        return;
    }

    uploadDocument(
      {
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        type: docType,
        version,
        allowDownload,
        generateAIDescription,
      },
      {
        onSuccess: () => {
          // Reset form
          setFile(null);
          setTitle("");
          setDescription("");
          setVersion(1);
          setAllowDownload(true);
          setGenerateAIDescription(true);
          setUploadProgress(0);

          // Redirect to documents library
          router.push("/admin/content/documents");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardContent className="pt-6">
          {!file ? (
            <div
              className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept={SUPPORTED_DOCUMENT_EXTENSIONS.join(",")}
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isUploading}
              />
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    Drop document here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, DOCX, TXT (max 100MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Info */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <DocumentUploadProgress progress={uploadProgress} fileName={file.name} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Form */}
      {file && !isUploading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter document description (optional)"
                rows={4}
              />
            </div>

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                min={1}
                value={version}
                onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Use version numbers to track document updates
              </p>
            </div>

            {/* Allow Download Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="allowDownload">Allow students to download</Label>
                <p className="text-sm text-muted-foreground">
                  Enable file download for students
                </p>
              </div>
              <Switch
                id="allowDownload"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
            </div>

            {/* AI Description Generation Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="generateAIDescription">
                  Generate AI description (100 words)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically generate description from document content
                </p>
              </div>
              <Switch
                id="generateAIDescription"
                checked={generateAIDescription}
                onCheckedChange={setGenerateAIDescription}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {file && !isUploading && (
        <div className="flex items-center gap-4">
          <Button type="submit" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/content/documents")}
          >
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
