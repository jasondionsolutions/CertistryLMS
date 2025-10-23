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
import { Card } from "@/components/ui/card";
import { PDFUploader } from "./PDFUploader";
import { AIModelSelector } from "./AIModelSelector";
import { CertificationForm } from "./CertificationForm";
import { AILoadingModal } from "@/components/ui/AILoadingModal";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useProcessBlueprintWithMetadata } from "../hooks/useProcessBlueprintWithMetadata";

interface CertificationPDFUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
}

export function CertificationPDFUploadForm({
  open,
  onOpenChange,
  onBack,
}: CertificationPDFUploadFormProps) {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [extractedData, setExtractedData] = React.useState<any>(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);

  const processBlueprint = useProcessBlueprintWithMetadata();

  const handleProcess = async () => {
    if (!pdfFile || !selectedModel) return;

    // TODO: This will call the AI to extract metadata + blueprint
    // For now, let's show a placeholder
    processBlueprint.mutate(
      { file: pdfFile, modelId: selectedModel },
      {
        onSuccess: (result) => {
          if (result.success && result.data) {
            setExtractedData(result.data);
            setShowReviewForm(true);
          }
        },
      }
    );
  };

  const handleReset = () => {
    setPdfFile(null);
    setSelectedModel("");
    setExtractedData(null);
    setShowReviewForm(false);
  };

  const handleFormSuccess = () => {
    onOpenChange(false);
    handleReset();
  };

  const canProcess = pdfFile && selectedModel && !processBlueprint.isPending;

  // If we're showing the review form, render the certification form with extracted data
  if (showReviewForm && extractedData) {
    return (
      <CertificationForm
        open={open}
        onOpenChange={onOpenChange}
        certification={extractedData.certification}
        blueprintData={extractedData.domains}
        onSuccess={handleFormSuccess}
        mode="review"
      />
    );
  }

  return (
    <>
      {/* AI Processing Modal */}
      <AILoadingModal
        isOpen={processBlueprint.isPending}
        title="AI is Processing Your PDF"
        estimatedDuration={180}
        message={
          <>
            <p className="mb-2">
              Claude is reading your exam blueprint and extracting:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Certification name and code</li>
              <li>Scoring structure</li>
              <li>Exam domains and weights</li>
              <li>Learning objectives and sub-objectives</li>
            </ul>
            <p className="mt-4 text-sm opacity-70">
              This usually takes 2-3 minutes depending on PDF complexity
            </p>
          </>
        }
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle>Upload Certification PDF</DialogTitle>
              <DialogDescription>
                AI will extract certification details and exam blueprint
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Upload PDF */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                1
              </span>
              Upload Exam Blueprint PDF
            </h3>
            <div className="overflow-hidden">
              <PDFUploader
                onFileSelect={setPdfFile}
                selectedFile={pdfFile}
                disabled={processBlueprint.isPending}
              />
            </div>
          </Card>

          {/* Step 2: Select AI Model */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                2
              </span>
              Select AI Model
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the AI model to extract certification metadata and exam
              structure
            </p>
            <AIModelSelector
              selectedModelId={selectedModel}
              onModelSelect={setSelectedModel}
              onAutoSelect={setSelectedModel}
              disabled={processBlueprint.isPending}
            />
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">AI will extract:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Certification name and code</li>
                  <li>Scoring structure (passing score, max score)</li>
                  <li>Exam domains with weights</li>
                  <li>Learning objectives and sub-objectives</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  You&apos;ll be able to review and edit before saving.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={!canProcess}
            className="min-w-[120px]"
          >
            {processBlueprint.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Process PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
