"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUp, Edit } from "lucide-react";

interface CertificationCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: "pdf" | "manual") => void;
}

export function CertificationCreationDialog({
  open,
  onOpenChange,
  onSelectMode,
}: CertificationCreationDialogProps) {
  const handleModeSelect = (mode: "pdf" | "manual") => {
    onSelectMode(mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Certification</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to create your certification
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* PDF Upload Option */}
          <Card
            className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => handleModeSelect("pdf")}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Upload PDF</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered extraction of certification details and exam blueprint
                </p>
              </div>
            </div>
          </Card>

          {/* Manual Entry Option */}
          <Card
            className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => handleModeSelect("manual")}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Edit className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Manual Entry</h3>
                <p className="text-sm text-muted-foreground">
                  Manually enter certification details and build blueprint later
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Recommended: Upload PDF for faster setup with AI-powered extraction
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
