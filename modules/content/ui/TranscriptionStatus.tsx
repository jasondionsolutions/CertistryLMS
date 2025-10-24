"use client";

/**
 * Transcription Status Component
 *
 * Displays transcription status with badges, progress indicators, and retry actions.
 */

import { useTranscriptionStatus, useRetryTranscription } from "../hooks/useTranscriptionStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2, XCircle, RefreshCw, MinusCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TranscriptionStatusProps {
  videoId: string;
  onUploadManual?: () => void; // Callback to open manual upload modal
}

export function TranscriptionStatus({ videoId, onUploadManual }: TranscriptionStatusProps) {
  const { data: status, isLoading } = useTranscriptionStatus(videoId);
  const { mutate: retry, isPending: isRetrying } = useRetryTranscription();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading status...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Status badge based on current status
  const getStatusBadge = () => {
    switch (status.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "skipped":
        return (
          <Badge variant="outline" className="gap-1">
            <MinusCircle className="h-3 w-3" />
            Skipped
          </Badge>
        );
      default:
        return <Badge variant="outline">{status.status}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Badge and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Transcription:</span>
          {getStatusBadge()}
          {status.hasTranscript && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Has Transcript
            </Badge>
          )}
          {status.hasCaptions && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Has Captions
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {status.status === "failed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retry(videoId)}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </>
              )}
            </Button>
          )}
          {onUploadManual && (status.status === "failed" || status.status === "skipped" || !status.hasTranscript) && (
            <Button variant="outline" size="sm" onClick={onUploadManual}>
              Upload Manual Transcript
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {status.status === "failed" && status.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{status.error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Message */}
      {(status.status === "pending" || status.status === "processing") && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-sm">
            {status.status === "pending"
              ? "Transcription queued. Processing will begin shortly."
              : "Transcription in progress. This may take a few minutes."}
          </AlertDescription>
        </Alert>
      )}

      {/* Skipped Message */}
      {status.status === "skipped" && (
        <Alert>
          <AlertDescription className="text-sm">
            Transcription was disabled during upload. You can upload a manual transcript if available.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
