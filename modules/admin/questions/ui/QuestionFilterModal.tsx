// modules/admin/questions/ui/QuestionFilterModal.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE
import React, { useState, useEffect, useMemo } from "react";
import { AdminFilterModal, type FilterConfig, type FilterOption } from "@/modules/admin/shared/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterState {
  certificationIds: string[]; // Changed from examIds - multi-select for certifications
  certificationMode: 'include' | 'exclude';
  domainId: string; // Single domain selection when one certification is selected
  objectiveId: string; // Single objective selection when domain is selected
  questionTypes: string[];
  questionTypeMode: 'include' | 'exclude';
  search: string;
}

interface Certification {
  id: string;
  name: string;
  code: string;
  domains?: Domain[];
}

interface Domain {
  id: string;
  name: string;
  objectives?: Objective[];
}

interface Objective {
  id: string;
  code: string;
  description: string;
}

interface QuestionFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  currentFilters: FilterState;
  certifications: Certification[];
  loading?: boolean;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "ordering", label: "Ordering" },
  { value: "categorization", label: "Categorization" },
];

export default function QuestionFilterModal({
  open,
  onClose,
  onApply,
  onClear,
  currentFilters,
  certifications,
  loading = false,
}: QuestionFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  // Convert certifications to FilterOption format
  const certificationOptions: FilterOption[] = useMemo(() =>
    certifications.map(cert => ({
      id: cert.id,
      name: cert.name,
      version: cert.code
    })), [certifications]);

  // Update local filters when current filters change
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  // Get available domains when exactly one certification is selected
  const availableDomains = useMemo(() => {
    if (localFilters.certificationIds.length !== 1) return [];
    const selectedCert = certifications.find(c => c.id === localFilters.certificationIds[0]);
    return selectedCert?.domains || [];
  }, [localFilters.certificationIds, certifications]);

  // Get available objectives when a domain is selected
  const availableObjectives = useMemo(() => {
    if (!localFilters.domainId || localFilters.certificationIds.length !== 1) return [];
    const selectedCert = certifications.find(c => c.id === localFilters.certificationIds[0]);
    const selectedDomain = selectedCert?.domains?.find(d => d.id === localFilters.domainId);
    return selectedDomain?.objectives || [];
  }, [localFilters.domainId, localFilters.certificationIds, certifications]);

  // Custom sections for search, domain dropdown, and objective dropdown
  const searchSection = (
    <div className="space-y-2">
      <Label htmlFor="search">Search</Label>
      <Input
        id="search"
        placeholder="Search question text, certification, domain, or objective..."
        value={localFilters.search}
        onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
      />
    </div>
  );

  const domainSection = localFilters.certificationIds.length === 1 && availableDomains.length > 0 && (
    <div className="space-y-2">
      <Label htmlFor="domain">Domain</Label>
      <Select
        value={localFilters.domainId || "all"}
        onValueChange={(value) => setLocalFilters(prev => ({
          ...prev,
          domainId: value === "all" ? "" : value,
          objectiveId: "" // Clear objective when domain changes
        }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a domain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Domains</SelectItem>
          {availableDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const objectiveSection = localFilters.domainId && availableObjectives.length > 0 && (
    <div className="space-y-2">
      <Label htmlFor="objective">Objective</Label>
      <Select
        value={localFilters.objectiveId || "all"}
        onValueChange={(value) => setLocalFilters(prev => ({
          ...prev,
          objectiveId: value === "all" ? "" : value
        }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an objective" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Objectives</SelectItem>
          {availableObjectives.map((objective) => (
            <SelectItem key={objective.id} value={objective.id}>
              {objective.code}: {objective.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const questionTypesSection = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Question Types</Label>
        <div className="text-xs text-muted-foreground">
          {localFilters.questionTypes.length > 0 && (
            <span>
              {localFilters.questionTypeMode === 'include' ? 'Including' : 'Excluding'} {localFilters.questionTypes.length} type{localFilters.questionTypes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Include/Exclude toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="include-types"
            name="type-mode"
            value="include"
            checked={localFilters.questionTypeMode === 'include'}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, questionTypeMode: e.target.value as 'include' | 'exclude' }))}
            className="h-4 w-4"
          />
          <Label htmlFor="include-types" className="text-sm">Include</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="exclude-types"
            name="type-mode"
            value="exclude"
            checked={localFilters.questionTypeMode === 'exclude'}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, questionTypeMode: e.target.value as 'include' | 'exclude' }))}
            className="h-4 w-4"
          />
          <Label htmlFor="exclude-types" className="text-sm">Exclude</Label>
        </div>
      </div>

      {/* Question type checkboxes */}
      <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-md p-3">
        {QUESTION_TYPES.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type.value}`}
              checked={localFilters.questionTypes.includes(type.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setLocalFilters(prev => ({ ...prev, questionTypes: [...prev.questionTypes, type.value] }));
                } else {
                  setLocalFilters(prev => ({ ...prev, questionTypes: prev.questionTypes.filter(t => t !== type.value) }));
                }
              }}
            />
            <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
              {type.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const filterConfig: FilterConfig = {
    title: "Filter Questions",
    description: "Refine your question search with advanced filters",

    multiSelectConfig: {
      label: "Certifications",
      options: certificationOptions,
      selectedIds: localFilters.certificationIds,
      onSelectionChange: (selectedIds) => setLocalFilters(prev => ({
        ...prev,
        certificationIds: selectedIds,
        // Clear domain and objective when certifications change
        domainId: selectedIds.length === 1 ? prev.domainId : "",
        objectiveId: selectedIds.length === 1 ? prev.objectiveId : ""
      })),
      mode: localFilters.certificationMode,
      onModeChange: (mode) => setLocalFilters(prev => ({ ...prev, certificationMode: mode })),
      includeUnknownOption: true,
      unknownOptionLabel: "⚠️ Questions Without Certification Assignment"
    },

    customSections: [
      searchSection,
      domainSection,
      objectiveSection,
      questionTypesSection
    ].filter(Boolean) // Remove null values
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleCancel = () => {
    setLocalFilters(currentFilters);
  };

  return (
    <AdminFilterModal
      open={open}
      onOpenChange={onClose}
      config={filterConfig}
      onApply={handleApply}
      onCancel={handleCancel}
    />
  );
}
