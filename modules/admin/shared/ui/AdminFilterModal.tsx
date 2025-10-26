// modules/admin/shared/ui/AdminFilterModal.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import React, { ReactNode, useId } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckSquare, Square } from "lucide-react";

export interface FilterOption {
  id: string;
  name: string;
  version?: string;
}

export interface FilterConfig {
  title: string;
  description: string;

  // Multi-select options (like exams)
  multiSelectConfig?: {
    label: string;
    options: FilterOption[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    mode: 'include' | 'exclude';
    onModeChange: (mode: 'include' | 'exclude') => void;
    includeUnknownOption?: boolean;
    unknownOptionLabel?: string;
  };

  // Simple select dropdowns
  selectConfigs?: Array<{
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    placeholder?: string;
  }>;

  // Custom filter sections
  customSections?: ReactNode[];
}

interface AdminFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FilterConfig;
  onApply?: () => void;
  onCancel?: () => void;
}

export function AdminFilterModal({
  open,
  onOpenChange,
  config,
  onApply,
  onCancel
}: AdminFilterModalProps) {
  const modalId = useId();

  const handleApply = () => {
    onApply?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-[50%] left-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 p-6 shadow-lg border rounded-lg">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Multi-Select Section (like Exams) */}
          {config.multiSelectConfig && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{config.multiSelectConfig.label}</label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        const allIds = [
                          ...config.multiSelectConfig!.options.map(option => option.id),
                          ...(config.multiSelectConfig!.includeUnknownOption ? ['unknown'] : [])
                        ];
                        config.multiSelectConfig!.onSelectionChange(allIds);
                      }}
                      title={`Select All ${config.multiSelectConfig.label}`}
                    >
                      <CheckSquare className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => config.multiSelectConfig!.onSelectionChange([])}
                      title={`Deselect All ${config.multiSelectConfig.label}`}
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Selection summary */}
                  {config.multiSelectConfig.selectedIds.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {config.multiSelectConfig.mode === 'include' ? 'Including' : 'Excluding'} {config.multiSelectConfig.selectedIds.length} {config.multiSelectConfig.label.toLowerCase()}{config.multiSelectConfig.selectedIds.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`include-${modalId}`}
                      name={`mode-${modalId}`}
                      value="include"
                      checked={config.multiSelectConfig.mode === 'include'}
                      onChange={(e) => config.multiSelectConfig!.onModeChange(e.target.value as 'include' | 'exclude')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <Label htmlFor={`include-${modalId}`} className="text-sm">Include</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`exclude-${modalId}`}
                      name={`mode-${modalId}`}
                      value="exclude"
                      checked={config.multiSelectConfig.mode === 'exclude'}
                      onChange={(e) => config.multiSelectConfig!.onModeChange(e.target.value as 'include' | 'exclude')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <Label htmlFor={`exclude-${modalId}`} className="text-sm">Exclude</Label>
                  </div>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                {/* Unknown option if enabled */}
                {config.multiSelectConfig.includeUnknownOption && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="option-unknown"
                      checked={config.multiSelectConfig.selectedIds.includes('unknown')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          config.multiSelectConfig!.onSelectionChange([...config.multiSelectConfig!.selectedIds, 'unknown']);
                        } else {
                          config.multiSelectConfig!.onSelectionChange(config.multiSelectConfig!.selectedIds.filter(id => id !== 'unknown'));
                        }
                      }}
                    />
                    <Label htmlFor="option-unknown" className="text-sm text-amber-600 font-medium cursor-pointer">
                      {config.multiSelectConfig.unknownOptionLabel || '⚠️ Items Without Assignment'}
                    </Label>
                  </div>
                )}

                {/* Regular options */}
                {config.multiSelectConfig.options
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${option.id}`}
                        checked={config.multiSelectConfig!.selectedIds.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            config.multiSelectConfig!.onSelectionChange([...config.multiSelectConfig!.selectedIds, option.id]);
                          } else {
                            config.multiSelectConfig!.onSelectionChange(config.multiSelectConfig!.selectedIds.filter(id => id !== option.id));
                          }
                        }}
                      />
                      <Label htmlFor={`option-${option.id}`} className="text-sm cursor-pointer">
                        {option.name} {option.version && `(${option.version})`}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Simple Select Dropdowns */}
          {config.selectConfigs?.map((selectConfig, index) => (
            <div key={index} className="flex items-center gap-4">
              <label className="text-sm font-medium min-w-16">{selectConfig.label}</label>
              <Select
                value={selectConfig.value || 'all'}
                onValueChange={(value) => selectConfig.onChange(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder={selectConfig.placeholder} />
                </SelectTrigger>
                <SelectContent
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg"
                  position="popper"
                  sideOffset={5}
                >
                  <SelectItem value="all">All</SelectItem>
                  {selectConfig.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Custom Sections */}
          {config.customSections?.map((section, index) => (
            <div key={index}>
              {section}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
