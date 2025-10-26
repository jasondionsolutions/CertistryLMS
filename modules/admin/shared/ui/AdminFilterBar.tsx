// modules/admin/shared/ui/AdminFilterBar.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import React, { ReactNode, memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export interface AdminFilterBarProps {
  // Search functionality
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  enableSearch?: boolean;

  // Filter functionality
  filterComponents?: ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  enableFilters?: boolean;

  // Refresh functionality
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  enableRefresh?: boolean;

  // Item counts
  totalItems?: number;
  selectedCount?: number;
  itemLabel?: string;

  // Selection functionality
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
  isAllSelected?: boolean;
  enableSelection?: boolean;

  // Bulk actions
  onBulkDelete?: () => void | Promise<void>;
  bulkDeleteLabel?: string;
  enableBulkDelete?: boolean;
  bulkActionLoading?: boolean;

  // Additional content
  rightContent?: ReactNode;

  // Styling
  className?: string;
}

/**
 * Standardized filter bar component following gold standard layout:
 * 🔍 Search | 🔽 Filter | 🔄 Refresh | # items | # selected | Select All | Unselect All | Delete Selected
 */
function AdminFilterBarComponent({
  // Search props
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  enableSearch = true,

  // Filter props
  filterComponents,
  hasActiveFilters = false,
  onClearFilters,
  enableFilters = true,

  // Refresh props
  onRefresh,
  refreshing = false,
  enableRefresh = true,

  // Count props
  totalItems = 0,
  selectedCount = 0,
  itemLabel = "items",

  // Selection props
  onSelectAll,
  onUnselectAll,
  isAllSelected = false,
  enableSelection = false,

  // Bulk action props
  onBulkDelete,
  bulkDeleteLabel = "Delete Selected",
  enableBulkDelete = false,
  bulkActionLoading = false,

  // Additional props
  rightContent,
  className = "",
}: AdminFilterBarProps) {
  // State for bulk delete confirmation modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  // Handle bulk delete with confirmation
  const handleBulkDelete = () => {
    setShowDeleteConfirmation(true);
    setConfirmationText(""); // Reset confirmation text
  };

  const confirmBulkDelete = () => {
    if (onBulkDelete && confirmationText.toLowerCase() === "confirm") {
      onBulkDelete();
      setShowDeleteConfirmation(false);
      setConfirmationText("");
    }
  };

  const closeModal = () => {
    setShowDeleteConfirmation(false);
    setConfirmationText("");
  };

  return (
    <>
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
        {/* Left Side - Search, Filter, Refresh */}
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          {enableSearch && onSearchChange && (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9"
                aria-label="Search items"
              />
            </div>
          )}

          {/* Filter Components */}
          {enableFilters && (
            <div className="flex items-center gap-2">
              {filterComponents ? (
                filterComponents
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  aria-label="Open filters"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              )}
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}

          {/* Refresh */}
          {enableRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Right Side - Counts, Selection, Actions */}
        <div className="flex items-center gap-3 text-sm">
          {/* Item Count and Selection - Combined Format */}
          {enableSelection ? (
            <span className="text-muted-foreground whitespace-nowrap">
              {selectedCount} of {totalItems} {itemLabel} selected
            </span>
          ) : (
            <span className="text-muted-foreground whitespace-nowrap">
              {totalItems} {itemLabel}
            </span>
          )}

          {/* Selection Actions */}
          {enableSelection && (
            <>

              {/* Select All / Unselect All - Always visible when selection is enabled */}
              {onSelectAll && onUnselectAll && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSelectAll}
                    disabled={isAllSelected}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckSquare className="mr-1 h-3 w-3" />
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUnselectAll}
                    disabled={selectedCount === 0}
                    className="h-8 px-2 text-xs"
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Unselect All
                  </Button>
                </div>
              )}

              {/* Bulk Delete - Always visible when bulk delete is enabled */}
              {enableBulkDelete && onBulkDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedCount === 0 || bulkActionLoading}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {bulkDeleteLabel}
                </Button>
              )}
            </>
          )}

          {/* Additional Right Content */}
          {rightContent}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirmation} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Bulk Delete
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <p className="text-muted-foreground">
                Are you sure you want to delete <strong>{selectedCount} selected {selectedCount === 1 ? 'item' : 'items'}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone and will permanently remove all selected items.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmInput" className="text-sm font-medium text-muted-foreground">
                Type <strong>&quot;confirm&quot;</strong> to proceed:
              </label>
              <Input
                id="confirmInput"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type confirm here..."
                className="w-full"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={confirmBulkDelete}
              disabled={confirmationText.toLowerCase() !== "confirm" || bulkActionLoading}
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const AdminFilterBar = memo(AdminFilterBarComponent);

// Convenience component for basic filter bars
export const AdminFilterBarBasic = memo((props: Omit<AdminFilterBarProps, 'enableSearch' | 'enableFilters' | 'enableRefresh'>) => (
  <AdminFilterBar
    enableSearch
    enableFilters
    enableRefresh
    {...props}
  />
));
