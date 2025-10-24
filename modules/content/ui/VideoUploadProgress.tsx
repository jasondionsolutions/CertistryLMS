"use client";

/**
 * Video Upload Progress Component
 *
 * Displays upload progress with a progress bar.
 */

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface VideoUploadProgressProps {
  fileName: string;
  progress: number;
}

export function VideoUploadProgress({ fileName, progress }: VideoUploadProgressProps) {
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <p className="text-sm font-medium">Uploading {fileName}...</p>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">{progress}%</p>
    </div>
  );
}
