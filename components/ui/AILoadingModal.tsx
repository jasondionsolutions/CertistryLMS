"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AILoadingModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  estimatedDuration?: number; // in seconds
}

export function AILoadingModal({
  isOpen,
  title,
  message,
  estimatedDuration,
}: AILoadingModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const estimatedRemaining = estimatedDuration
    ? Math.max(0, estimatedDuration - elapsedTime)
    : null;

  const progressPercentage = estimatedDuration
    ? Math.min(100, (elapsedTime / estimatedDuration) * 100)
    : null;

  return (
    <Dialog open={isOpen} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Spinner */}
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            {progressPercentage !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="text-center space-y-3 w-full">
            <h3 className="text-lg font-semibold">{title}</h3>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            {/* Progress Bar */}
            {progressPercentage !== null && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}

            {/* Time Info */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {estimatedRemaining !== null && (
                <>
                  <span>•</span>
                  <span>
                    {estimatedRemaining > 0
                      ? `~${formatTime(estimatedRemaining)} remaining`
                      : "Finishing up..."}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
