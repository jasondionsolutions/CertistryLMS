"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  requireTypedConfirmation?: boolean;
  confirmationWord?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning";
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  requireTypedConfirmation = false,
  confirmationWord = "Confirm",
  onConfirm,
  variant = "danger",
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      setError(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (requireTypedConfirmation) {
      if (inputValue.toLowerCase() === confirmationWord.toLowerCase()) {
        onConfirm();
        onOpenChange(false);
      } else {
        setError(true);
      }
    } else {
      onConfirm();
      onOpenChange(false);
    }
  };

  const canConfirm = !requireTypedConfirmation || inputValue.toLowerCase() === confirmationWord.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                variant === "danger"
                  ? "bg-red-100 dark:bg-red-900"
                  : "bg-orange-100 dark:bg-orange-900"
              }`}
            >
              <AlertTriangle
                className={`h-6 w-6 ${
                  variant === "danger"
                    ? "text-red-600 dark:text-red-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTypedConfirmation && (
          <div className="space-y-2 pt-4">
            <Label htmlFor="confirmation">
              Type <span className="font-semibold">&quot;{confirmationWord}&quot;</span> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(false);
              }}
              placeholder={confirmationWord}
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Please type &quot;{confirmationWord}&quot; exactly to confirm.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={requireTypedConfirmation && !canConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
