"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileUp, Edit, Save } from "lucide-react";
import { PDFUploader } from "./PDFUploader";
import { AIModelSelector } from "./AIModelSelector";
import { DomainsEditor } from "./DomainsEditor";
import { AILoadingModal } from "@/components/ui/AILoadingModal";
import { useDomains } from "../hooks/useDomains";
import { useProcessBlueprint } from "../hooks/useProcessBlueprint";
import { useBulkImportDomains } from "../hooks/useDomainMutations";

interface BlueprintManagerProps {
  certificationId: string;
  certificationName: string;
}

export function BlueprintManager({ certificationId, certificationName }: BlueprintManagerProps) {
  const [activeTab, setActiveTab] = React.useState<string>("upload");
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>("");

  // Fetch existing domains
  const { data: domainsResponse, isLoading: isLoadingDomains } = useDomains(certificationId);
  const domains = domainsResponse?.data || [];

  // Mutations
  const { mutate: processBlueprint, isPending: isProcessing } = useProcessBlueprint();
  const { mutate: saveDomains, isPending: isSaving } = useBulkImportDomains(certificationId);

  // Local state for manual editing
  const [localDomains, setLocalDomains] = React.useState<any[]>([]);

  // Initialize local domains when data loads
  React.useEffect(() => {
    if (domains.length > 0) {
      // Convert database domains to editor format
      const editorDomains = domains.map((domain) => ({
        ...domain,
        objectives: domain.objectives.map((objective) => ({
          ...objective,
          bullets: objective.bullets?.map((bullet) => ({
            ...bullet,
            subBullets: bullet.subBullets || [],
          })) || [],
        })),
      }));
      setLocalDomains(editorDomains);
    }
  }, [domains]);

  // Handler for AI model auto-select
  const handleAutoSelectModel = (modelId: string) => {
    if (!selectedModel) {
      setSelectedModel(modelId);
    }
  };

  // Handle AI processing
  const handleProcessPDF = () => {
    if (!pdfFile || !selectedModel) return;

    processBlueprint(
      { certificationId, modelId: selectedModel, file: pdfFile },
      {
        onSuccess: () => {
          setPdfFile(null);
          setSelectedModel("");
          setActiveTab("manual"); // Switch to manual tab to view results
        },
      }
    );
  };

  // Handle manual save
  const handleSaveManual = () => {
    // Convert editor format back to API format
    const formattedDomains = localDomains.map((domain, domainIndex) => ({
      name: domain.name,
      weight: domain.weight,
      order: domainIndex,
      objectives: domain.objectives.map((objective: any, objIndex: number) => ({
        code: objective.code,
        description: objective.description,
        difficulty: objective.difficulty,
        order: objIndex,
        bullets: objective.bullets?.map((bullet: any, bulletIndex: number) => ({
          text: bullet.text,
          order: bulletIndex,
          subBullets: bullet.subBullets?.map((subBullet: any, subIndex: number) => ({
            text: subBullet.text,
            order: subIndex,
          })) || [],
        })) || [],
      })),
    }));

    saveDomains({
      certificationId,
      domains: formattedDomains,
    });
  };

  const canProcessPDF = pdfFile && selectedModel && !isProcessing;
  const canSaveManual = localDomains.length > 0 && !isSaving;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Blueprint Management</h2>
        <p className="text-muted-foreground mt-1">
          Upload an exam blueprint PDF for AI extraction or build manually
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <FileUp className="h-4 w-4 mr-2" />
            Upload PDF (AI)
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Edit className="h-4 w-4 mr-2" />
            Manual / Edit
          </TabsTrigger>
        </TabsList>

        {/* Upload PDF Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">1. Upload Exam PDF</h3>
            <PDFUploader
              onFileSelect={setPdfFile}
              selectedFile={pdfFile}
              disabled={isProcessing}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">2. Select AI Model</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the AI model to process your exam PDF and extract domains and objectives.
            </p>
            <AIModelSelector
              selectedModelId={selectedModel}
              onModelSelect={setSelectedModel}
              onAutoSelect={handleAutoSelectModel}
              disabled={isProcessing}
            />
          </Card>

          {/* Info Card */}
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary">AI Extraction Info</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  The AI will extract all domains, objectives, bullets, and sub-bullets from your PDF.
                  You can review and edit the results in the &quot;Manual / Edit&quot; tab after processing.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleProcessPDF} disabled={!canProcessPDF} size="lg">
              Process with AI
            </Button>
          </div>
        </TabsContent>

        {/* Manual Edit Tab */}
        <TabsContent value="manual" className="space-y-6">
          {isLoadingDomains ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Loading blueprint...</p>
            </Card>
          ) : localDomains.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  No blueprint created yet. Upload a PDF with AI or create domains manually below.
                </p>
                <Button onClick={() => setLocalDomains([{
                  name: "New Domain",
                  weight: 0,
                  order: 0,
                  objectives: [],
                }])}>
                  <Edit className="h-4 w-4 mr-2" />
                  Start Manual Creation
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Blueprint Editor
                </h3>
                <DomainsEditor
                  domains={localDomains}
                  onChange={setLocalDomains}
                  isEditable={true}
                />
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to database state
                    const editorDomains = domains.map((domain) => ({
                      ...domain,
                      objectives: domain.objectives.map((objective) => ({
                        ...objective,
                        bullets: objective.bullets?.map((bullet) => ({
                          ...bullet,
                          subBullets: bullet.subBullets || [],
                        })) || [],
                      })),
                    }));
                    setLocalDomains(editorDomains);
                  }}
                >
                  Reset Changes
                </Button>
                <Button onClick={handleSaveManual} disabled={!canSaveManual} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Blueprint"}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading Modal */}
      <AILoadingModal
        isOpen={isProcessing}
        title="Processing Exam Blueprint"
        message="The AI is analyzing your PDF and extracting exam domains, objectives, and details. This may take 30-60 seconds."
        estimatedDuration={45}
      />
    </div>
  );
}
