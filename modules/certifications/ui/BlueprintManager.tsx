"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { DomainsEditor } from "./DomainsEditor";
import { useDomains } from "../hooks/useDomains";
import { useBulkImportDomains } from "../hooks/useDomainMutations";

interface BlueprintManagerProps {
  certificationId: string;
  certificationName: string;
}

export function BlueprintManager({ certificationId, certificationName }: BlueprintManagerProps) {
  // Fetch existing domains
  const { data: domainsResponse, isLoading: isLoadingDomains } = useDomains(certificationId);
  const domains = domainsResponse?.data || [];

  // Mutations
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

  const canSaveManual = localDomains.length > 0 && !isSaving;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Blueprint Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage exam domains, objectives, and learning outcomes
        </p>
      </div>

      {/* Blueprint Editor */}
      {isLoadingDomains ? (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Loading blueprint...</p>
        </Card>
      ) : localDomains.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No blueprint created yet. Create domains manually to get started.
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
    </div>
  );
}
