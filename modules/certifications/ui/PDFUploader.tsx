"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PDFUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function PDFUploader({ onFileSelect, selectedFile, disabled }: PDFUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    disabled,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      {!selectedFile ? (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? "Drop the PDF file here" : "Drag & drop an exam blueprint PDF here"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse (max 5MB)
            </p>
            <Button type="button" variant="secondary" size="sm" disabled={disabled}>
              Select PDF
            </Button>
          </div>
          {fileRejections.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">File rejected:</p>
              <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
                {fileRejections[0].errors.map((error) => (
                  <li key={error.code}>
                    {error.code === "file-too-large"
                      ? "File is too large (max 5MB)"
                      : error.code === "file-invalid-type"
                      ? "Only PDF files are allowed"
                      : error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="border rounded-lg p-4 bg-accent/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
