// modules/admin/shared/ui/AdminPaginationStandardized.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface AdminPaginationStandardizedProps {
  // Current pagination state
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;

  // Handlers
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;

  // Configuration
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;
  hasActiveFilters?: boolean;
  totalUnfilteredItems?: number;

  // Styling
  className?: string;
}

/**
 * Standardized pagination component matching the Books page gold standard
 * Features: First/Previous/Next/Last navigation, page size selector (5,10,25,50,All), item count display
 */
function AdminPaginationStandardizedComponent({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  onFirstPage,
  onLastPage,
  pageSizeOptions = [5, 10, 25, 50, -1],
  showPageSizeSelector = true,
  showPaginationInfo = true,
  hasActiveFilters = false,
  totalUnfilteredItems,
  className = "",
}: AdminPaginationStandardizedProps) {

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {/* Pagination Info */}
      {showPaginationInfo && (
        <div className="text-sm text-muted-foreground">
          Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          {hasActiveFilters && totalUnfilteredItems && (
            <span> (filtered from {totalUnfilteredItems} total entries)</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border">
                {pageSizeOptions.map((size) => (
                  <SelectPrimitive.Item
                    key={size}
                    value={size.toString()}
                    className="bg-background hover:bg-accent focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <SelectPrimitive.ItemText>
                      {size === -1 ? 'All' : size}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            disabled={currentPage === 1}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Info */}
          <div className="flex items-center gap-2 px-3 py-1">
            <span className="text-sm">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLastPage}
            disabled={currentPage >= totalPages}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const AdminPaginationStandardized = memo(AdminPaginationStandardizedComponent);

// Convenience component with common defaults
export const AdminPaginationStandardizedBasic = memo((props: Omit<AdminPaginationStandardizedProps, 'showPageSizeSelector' | 'showPaginationInfo'>) => (
  <AdminPaginationStandardized
    showPageSizeSelector
    showPaginationInfo
    {...props}
  />
));
