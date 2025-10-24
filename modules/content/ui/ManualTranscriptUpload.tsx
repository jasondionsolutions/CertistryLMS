"use client";

/**
 * Manual Transcript Upload Component
 *
 * Allows instructors to upload VTT transcript files for videos.
 */

import { useState, useRef } from "react";
import { useUploadManualTranscript } from "../hooks/useTranscriptionStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ManualTranscriptUploadProps {
  videoId: string;
  trigger?: React.ReactNode; // Custom trigger button
  onSuccess?: () => void; // Callback after successful upload
}

export function ManualTranscriptUpload({ videoId, trigger, onSuccess }: ManualTranscriptUploadProps) {
  const [open, setOpen] = useState(false);
  const [vttContent, setVttContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadTranscript, isPending } = useUploadManualTranscript();

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".vtt")) {
      setValidationError("Please select a VTT file (.vtt extension)");
      return;
    }

    // Read file content
    try {
      const content = await file.text();
      setVttContent(content);
      setValidationError(null);
    } catch (error) {
      setValidationError("Failed to read file");
      console.error("File read error:", error);
    }
  };

  // Validate VTT content
  const validateVttContent = (content: string): boolean => {
    if (!content.trim()) {
      setValidationError("VTT content cannot be empty");
      return false;
    }

    if (!content.startsWith("WEBVTT")) {
      setValidationError("Invalid VTT format. File must start with 'WEBVTT'");
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Handle upload
  const handleUpload = () => {
    if (!validateVttContent(vttContent)) {
      return;
    }

    uploadTranscript(
      {
        videoId,
        vttContent,
        updateDescription: false,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setVttContent("");
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Transcript
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Manual Transcript</DialogTitle>
          <DialogDescription>
            Upload a VTT (WebVTT) transcript file for this video. The transcript will be used for
            closed captions and searchability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>VTT File</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".vtt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {vttContent ? "Change File" : "Select VTT File"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a .vtt file containing the video transcript with timestamps.
            </p>
          </div>

          {/* VTT Content Preview/Edit */}
          <div className="space-y-2">
            <Label>VTT Content</Label>
            <Textarea
              value={vttContent}
              onChange={(e) => {
                setVttContent(e.target.value);
                setValidationError(null);
              }}
              placeholder="WEBVTT&#10;&#10;00:00:00.000 --> 00:00:05.000&#10;This is the first caption.&#10;&#10;00:00:05.000 --> 00:00:10.000&#10;This is the second caption."
              className="font-mono text-sm min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              You can also paste VTT content directly here or edit the uploaded file.
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* VTT Format Help */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>VTT Format Example:</strong>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {`WEBVTT

00:00:00.000 --> 00:00:05.000
This is the first caption.

00:00:05.000 --> 00:00:10.000
This is the second caption.`}
              </pre>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isPending || !vttContent}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Transcript
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
