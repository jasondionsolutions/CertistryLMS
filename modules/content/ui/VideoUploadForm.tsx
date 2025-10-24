"use client";

/**
 * Video Upload Form Component
 *
 * Drag-drop file upload with form for video metadata.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadVideo } from "../hooks/useUploadVideo";
import { VideoUploadProgress } from "./VideoUploadProgress";
import {
  SUPPORTED_VIDEO_EXTENSIONS,
  MAX_VIDEO_SIZE,
  type DifficultyLevel,
} from "../types/video.types";
import { Upload, X } from "lucide-react";

export function VideoUploadForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { uploadVideo, isUploading, progress } = useUploadVideo();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [videoCode, setVideoCode] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("intermediate");
  const [allowDownload, setAllowDownload] = useState(false);
  const [enableTranscription, setEnableTranscription] = useState(true);
  const [generateAiDescription, setGenerateAiDescription] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
    if (!SUPPORTED_VIDEO_EXTENSIONS.includes(extension as any)) {
      alert(`Only ${SUPPORTED_VIDEO_EXTENSIONS.join(", ")} files are supported`);
      return;
    }

    // Check file size
    if (file.size > MAX_VIDEO_SIZE) {
      alert("File size must be less than 2GB");
      return;
    }

    setFile(file);

    // Auto-populate title and video code if empty
    if (!title || !videoCode) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

      // Try to extract video code pattern (e.g., SY7_01_01 or AISF1_07_07)
      // Pattern: [LETTERS][NUMBERS]_[NUMBERS]_[NUMBERS] followed by space or underscore
      const codeMatch = fileName.match(/^([A-Z]+\d+_\d+_\d+)[_ ]/i);

      if (codeMatch) {
        // Extract code and title
        const extractedCode = codeMatch[1];
        const remainingTitle = fileName.substring(extractedCode.length + 1); // +1 for the separator (space or underscore)

        if (!videoCode) {
          setVideoCode(extractedCode.toUpperCase()); // e.g., "SY7_01_01" or "AISF1_07_07"
        }
        if (!title) {
          // Convert underscores to spaces and trim
          setTitle(remainingTitle.replace(/_/g, " ").trim()); // e.g., "Introduction to Security+" or "Risk Measurement"
        }
      } else {
        // No code pattern found, just use the whole filename as title
        if (!title) {
          setTitle(fileName.replace(/_/g, " "));
        }
      }
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a video file");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      const result = await uploadVideo(file, {
        title: title.trim(),
        videoCode: videoCode.trim() || undefined,
        description: description.trim() || undefined,
        difficultyLevel,
        allowDownload,
        enableTranscription,
        generateAiDescription,
      });

      if (result.success) {
        // Reset form
        setFile(null);
        setTitle("");
        setVideoCode("");
        setDescription("");
        setDifficultyLevel("intermediate");
        setAllowDownload(false);
        setEnableTranscription(true);
        setGenerateAiDescription(true);

        // Invalidate videos query to force refresh on video list page
        queryClient.invalidateQueries({ queryKey: ["videos"] });

        // Redirect to video list or management page
        router.push("/admin/content/videos");
      }
      // If result.success is false, error is already shown by toast in the hook
    } catch (error) {
      // Additional error handling in case of unexpected errors
      console.error("[VideoUploadForm] Unexpected error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a video file (MP4, MOV, AVI). Maximum size: 2GB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <Label>Video File</Label>
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  mt-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors
                  ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                `}
              >
                <input
                  type="file"
                  id="video-upload"
                  accept={SUPPORTED_VIDEO_EXTENSIONS.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drag and drop your video here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP4, MOV, AVI (max 2GB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="mt-2 p-4 border rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && progress && (
            <VideoUploadProgress
              fileName={file?.name || ""}
              progress={progress.percentage}
            />
          )}

          {/* Metadata Form */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Introduction to Security+"
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="videoCode">Video Code</Label>
            <Input
              id="videoCode"
              value={videoCode}
              onChange={(e) => setVideoCode(e.target.value)}
              placeholder="SY7_01_01"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional structured identifier (e.g., SY7_01_01)
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context about this video content..."
              rows={4}
              disabled={isUploading}
            />
          </div>

          {/* Transcription Options */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="enableTranscription"
                checked={enableTranscription}
                onChange={(e) => {
                  setEnableTranscription(e.target.checked);
                  // Auto-disable AI description if transcription is disabled
                  if (!e.target.checked) {
                    setGenerateAiDescription(false);
                  }
                }}
                disabled={isUploading}
                className="mt-1 rounded border-gray-300"
              />
              <div className="flex-1">
                <Label htmlFor="enableTranscription" className="font-medium cursor-pointer">
                  Enable video transcription
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically transcribe audio for searchability and AI features
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="generateAiDescription"
                checked={generateAiDescription}
                onChange={(e) => setGenerateAiDescription(e.target.checked)}
                disabled={isUploading || !enableTranscription}
                className="mt-1 rounded border-gray-300"
              />
              <div className="flex-1">
                <Label
                  htmlFor="generateAiDescription"
                  className={`font-medium cursor-pointer ${!enableTranscription ? "text-muted-foreground" : ""}`}
                >
                  Generate AI description (100 words)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {enableTranscription
                    ? "AI will create/update description after transcription completes"
                    : "Requires transcription to be enabled"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={difficultyLevel}
              onValueChange={(value) => setDifficultyLevel(value as DifficultyLevel)}
              disabled={isUploading}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowDownload"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              disabled={isUploading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="allowDownload" className="font-normal">
              Allow students to download this video
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
