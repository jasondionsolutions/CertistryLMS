/**
 * DocumentUploadProgress Component
 *
 * Displays upload progress for documents
 */

"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface DocumentUploadProgressProps {
  progress: number;
  fileName: string;
}

export function DocumentUploadProgress({
  progress,
  fileName,
}: DocumentUploadProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm font-medium">
          Uploading {fileName}... {progress}%
        </p>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
