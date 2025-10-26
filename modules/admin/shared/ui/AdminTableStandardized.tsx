// modules/admin/shared/ui/AdminTableStandardized.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import React, { ReactNode, memo, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Import the new filter bar and pagination components
import { AdminFilterBar } from "@/modules/admin/shared/ui/AdminFilterBar";
import { AdminPaginationStandardized } from "@/modules/admin/shared/ui/AdminPaginationStandardized";

// Types from the standardized hook
import type { AdminTableState, AdminTableActions } from "@/modules/admin/shared/hooks/useAdminTableStandardized";

// Import the base interface from AdminTable for consistency
import type { TableDataItem } from '@/modules/admin/shared/ui/AdminTable';

export interface AdminTableColumn<T extends TableDataItem = TableDataItem> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface AdminTableProps<T extends TableDataItem = TableDataItem, TFilters = Record<string, unknown>> {
  // Data and state from standardized hook
  state: AdminTableState<T, TFilters>;
  actions: AdminTableActions<T, TFilters>;

  // Table configuration
  columns: AdminTableColumn<T>[];
  getItemId?: (item: T) => string;

  // UI customization
  title?: string;
  description?: string;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  className?: string;

  // Features
  enableSearch?: boolean;
  enableSelection?: boolean;
  enableBulkActions?: boolean;
  enablePagination?: boolean;
  enableRefresh?: boolean;
  enableFilters?: boolean;
  enableAutoClearFilters?: boolean;

  // Search configuration
  searchPlaceholder?: string;
  searchable?: boolean;

  // Pagination configuration
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;

  // Responsive configuration
  enableResponsive?: boolean;
  responsiveBreakpoint?: number;
  mobileCardRender?: (item: T, index: number) => ReactNode;

  // Bulk actions
  bulkActions?: Array<{
    key: string;
    label: string;
    icon?: ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary";
    action: (selectedItems: T[]) => Promise<void> | void;
    disabled?: boolean;
  }>;

  // Filter components
  filterComponents?: ReactNode;

  // Additional content after refresh button
  rightContent?: ReactNode;

  // Row interaction
  onRowClick?: (item: T) => void;

  // Loading skeleton
  skeletonRows?: number;

  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

/**
 * OPTIMIZED AdminTable component following best practices
 * ✅ React.memo for re-render optimization
 * ✅ Comprehensive accessibility features
 * ✅ Loading skeleton patterns
 * ✅ Consistent error handling
 * ✅ Standardized pagination and sorting
 * ✅ Bulk operations support
 * ✅ Enhanced keyboard navigation
 */
function AdminTableStandardizedComponent<T extends TableDataItem = TableDataItem, TFilters = Record<string, unknown>>({
  state,
  actions,
  columns,
  getItemId = (item: T) => (item.id || item._id) as string,
  title,
  description,
  emptyState,
  errorState,
  className = "",
  enableSearch = true,
  enableSelection = false,
  enableBulkActions = false,
  enablePagination = true,
  enableRefresh = true,
  enableFilters = true,
  enableAutoClearFilters = true,
  searchPlaceholder = "Search...",
  pageSizeOptions = [5, 10, 25, 50, -1],
  showPageSizeSelector = true,
  showPaginationInfo = true,
  enableResponsive = true,
  responsiveBreakpoint = 1200,
  mobileCardRender,
  bulkActions = [],
  filterComponents,
  rightContent,
  onRowClick,
  skeletonRows = 5,
  ariaLabel = "Data table",
  ariaDescription,
}: AdminTableProps<T, TFilters>) {

  // ========================================
  // RESPONSIVE BREAKPOINT DETECTION (following gold standard 1200px)
  // ========================================

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (!enableResponsive) return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth > responsiveBreakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enableResponsive, responsiveBreakpoint]);

  // ========================================
  // MEMOIZED COMPONENTS
  // ========================================

  // Memoized table headers
  const tableHeaders = useMemo(() => (
    <thead className="border-b bg-gray-50 dark:bg-gray-800">
      <tr className="text-left">
        {enableSelection && (
          <th className="w-12 p-4" scope="col">
            <Checkbox
              checked={state.isAllSelected ? true : state.isIndeterminate ? "indeterminate" : false}
              onCheckedChange={actions.handleSelectAll}
              aria-label="Select all rows"
              className="sr-only md:not-sr-only"
            />
          </th>
        )}

        {columns.map((column) => (
          <th
            key={column.key}
            className={`p-4 font-medium transition-colors ${
              column.sortable
                ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                : ""
            } ${
              column.align === "center"
                ? "text-center"
                : column.align === "right"
                ? "text-right"
                : "text-left"
            } ${column.headerClassName || ""}`}
            style={{ width: column.width }}
            scope="col"
            tabIndex={column.sortable ? 0 : undefined}
            role={column.sortable ? "button" : undefined}
            aria-sort={
              column.sortable && state.sortField === column.key
                ? state.sortDirection === "asc" ? "ascending" : "descending"
                : undefined
            }
            onClick={() => column.sortable && actions.handleSort(column.key)}
            onKeyDown={(e) => {
              if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                actions.handleSort(column.key);
              }
            }}
          >
            <div className={`flex items-center gap-1 ${
              column.align === "center"
                ? "justify-center"
                : column.align === "right"
                ? "justify-end"
                : "justify-start"
            }`}>
              {column.header}
              {column.sortable && state.sortField === column.key && (
                state.sortDirection === "asc" ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  ), [columns, enableSelection, state.isAllSelected, state.isIndeterminate, state.sortField, state.sortDirection, actions.handleSelectAll, actions.handleSort]);

  // Memoized skeleton rows
  const skeletonContent = useMemo(() => (
    <tbody>
      {Array.from({ length: skeletonRows }, (_, index) => (
        <tr key={`skeleton-${index}`} className="border-t">
          {enableSelection && (
            <td className="p-4">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </td>
          )}
          {columns.map((column) => (
            <td key={`skeleton-${index}-${column.key}`} className="p-4">
              <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${
                column.key === 'actions' ? 'h-8 w-24' : 'h-4 w-full'
              }`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  ), [skeletonRows, enableSelection, columns]);

  // Memoized table rows
  const tableRows = useMemo(() => (
    <tbody>
      {state.paginatedData.map((item, index) => {
        const itemId = getItemId(item);
        const isSelected = state.selectedItems.includes(itemId);

        return (
          <tr
            key={itemId}
            className={`border-t transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
              onRowClick ? 'cursor-pointer' : 'cursor-default'
            } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            role="row"
            aria-selected={enableSelection ? isSelected : undefined}
          >
            {enableSelection && (
              <td className="p-4" role="gridcell" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => actions.handleSelectItem(itemId)}
                  aria-label={`Select row ${index + 1}`}
                />
              </td>
            )}

            {columns.map((column) => (
              <td
                key={column.key}
                className={`p-4 ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                    ? "text-right"
                    : "text-left"
                } ${column.className || ""}`}
                role="gridcell"
              >
                {column.render
                  ? column.render(item, index)
                  : String((item as Record<string, unknown>)[column.key] ?? '')
                }
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  ), [state.paginatedData, state.selectedItems, columns, enableSelection, getItemId, actions.handleSelectItem, onRowClick]);

  // Default mobile card render function
  const defaultMobileCardRender = useMemo(() => (item: T, index: number) => {
    const itemId = getItemId(item);
    const isSelected = state.selectedItems.includes(itemId);

    return (
      <div
        key={itemId}
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
        }`}
        onClick={onRowClick ? () => onRowClick(item) : undefined}
      >
        <div className="flex items-start gap-3">
          {enableSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => actions.handleSelectItem(itemId)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Primary content - show first few important columns */}
            {columns.slice(enableSelection ? 1 : 0, 3).map((column) => (
              <div key={column.key} className="mb-2">
                {column.key !== 'actions' && (
                  <div className="text-sm text-muted-foreground">{column.header}:</div>
                )}
                <div className={column.key === 'actions' ? 'mt-2' : ''}>
                  {column.render
                    ? column.render(item, index)
                    : String((item as Record<string, unknown>)[column.key] ?? '')
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary content in grid */}
        {columns.length > 3 && (
          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
            {columns.slice(3).filter(col => col.key !== 'actions').map((column) => (
              <div key={column.key}>
                <span className="font-medium text-muted-foreground">{column.header}:</span>
                <div className="mt-1">
                  {column.render
                    ? column.render(item, index)
                    : String((item as Record<string, unknown>)[column.key] ?? '')
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions at bottom if not already shown */}
        {columns.some(col => col.key === 'actions') && !columns.slice(0, 3).some(col => col.key === 'actions') && (
          <div className="border-t pt-3">
            {columns.find(col => col.key === 'actions')?.render?.(item, index)}
          </div>
        )}
      </div>
    );
  }, [columns, enableSelection, getItemId, state.selectedItems, actions.handleSelectItem, onRowClick]);

  // Mobile card skeleton
  const mobileSkeletonContent = useMemo(() => (
    <div className="space-y-4">
      {Array.from({ length: skeletonRows }, (_, index) => (
        <div key={`mobile-skeleton-${index}`} className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3">
          <div className="flex items-start gap-3">
            {enableSelection && (
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  ), [skeletonRows, enableSelection]);

  // Mobile card content
  const mobileCardContent = useMemo(() => (
    <div className="space-y-4">
      {state.paginatedData.map((item, index) => {
        const cardRender = mobileCardRender || defaultMobileCardRender;
        const itemId = getItemId(item);
        return (
          <div key={itemId}>
            {cardRender(item, index)}
          </div>
        );
      })}
    </div>
  ), [state.paginatedData, mobileCardRender, defaultMobileCardRender, getItemId]);

  // Error state
  if (state.error && errorState) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-8 ${className}`}>
        {errorState}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-8 text-center ${className}`}>
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-red-800">Error Loading Data</h3>
        <p className="mb-4 text-red-700">{state.error}</p>
        <Button
          onClick={() => actions.refreshData(true)}
          variant="outline"
          disabled={state.refreshing}
        >
          {state.refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Filter Bar Section */}
      <AdminFilterBar
        // Search props
        searchValue={state.search}
        onSearchChange={enableSearch ? actions.setSearch : undefined}
        searchPlaceholder={searchPlaceholder}
        enableSearch={enableSearch}

        // Filter props
        filterComponents={filterComponents}
        hasActiveFilters={state.hasActiveFilters}
        onClearFilters={actions.clearFilters}
        enableFilters={enableFilters}

        // Refresh props
        onRefresh={enableRefresh ? async () => { await actions.refreshData(true); } : undefined}
        refreshing={state.refreshing}
        enableRefresh={enableRefresh}

        // Count props
        totalItems={state.totalItems}
        selectedCount={state.selectedItems.length}
        itemLabel="items"

        // Selection props
        onSelectAll={enableSelection ? actions.handleSelectAll : undefined}
        onUnselectAll={enableSelection ? actions.clearSelection : undefined}
        isAllSelected={state.isAllSelected}
        enableSelection={enableSelection}

        // Bulk action props
        onBulkDelete={enableBulkActions && bulkActions.find(a => a.variant === 'destructive')
          ? () => bulkActions.find(a => a.variant === 'destructive')?.action(actions.getSelectedData())
          : undefined}
        bulkDeleteLabel={bulkActions.find(a => a.variant === 'destructive')?.label}
        enableBulkDelete={enableBulkActions && bulkActions.some(a => a.variant === 'destructive')}
        bulkActionLoading={state.bulkActionLoading}

        // Additional content
        rightContent={rightContent}
      />

      {/* Table/Card Section - Responsive */}
      {enableResponsive && !isDesktop ? (
        // Mobile Card View
        <div className="space-y-4">
          {/* Loading State */}
          {state.loading && mobileSkeletonContent}

          {/* Data Cards */}
          {!state.loading && mobileCardContent}

          {/* Empty State */}
          {!state.loading && state.paginatedData.length === 0 && (
            <div className="p-8 text-center">
              {emptyState || (
                <>
                  <div className="mb-4 text-4xl">📄</div>
                  <h3 className="mb-2 text-lg font-semibold">No data found</h3>
                  <p className="text-muted-foreground">
                    {state.hasActiveFilters
                      ? "No results match your current filters."
                      : "No data available to display."
                    }
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        // Desktop Table View
        <div className="overflow-hidden rounded-lg border">
          <table
            className="w-full text-sm"
            role="table"
            aria-label={ariaLabel}
            aria-description={ariaDescription}
          >
            {tableHeaders}

            {/* Loading State */}
            {state.loading && skeletonContent}

            {/* Data Rows */}
            {!state.loading && tableRows}
          </table>

          {/* Empty State */}
          {!state.loading && state.paginatedData.length === 0 && (
            <div className="p-8 text-center">
              {emptyState || (
                <>
                  <div className="mb-4 text-4xl">📄</div>
                  <h3 className="mb-2 text-lg font-semibold">No data found</h3>
                  <p className="text-muted-foreground">
                    {state.hasActiveFilters
                      ? "No results match your current filters."
                      : "No data available to display."
                    }
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination Section */}
      {enablePagination && (
        <AdminPaginationStandardized
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          itemsPerPage={state.itemsPerPage}
          totalItems={state.totalItems}
          startIndex={state.startIndex}
          endIndex={state.endIndex}
          onPageChange={actions.handlePageChange}
          onPageSizeChange={actions.handlePageSizeChange}
          onFirstPage={actions.goToFirstPage}
          onLastPage={actions.goToLastPage}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelector={showPageSizeSelector}
          showPaginationInfo={showPaginationInfo}
          hasActiveFilters={state.hasActiveFilters}
          totalUnfilteredItems={state.data.length}
        />
      )}
    </div>
  );
}

// Export memoized component for optimal re-render performance
export const AdminTableStandardized = memo(AdminTableStandardizedComponent) as typeof AdminTableStandardizedComponent;

// ========================================
// CONVENIENCE COMPONENTS
// ========================================

/**
 * Pre-configured table for common admin use cases
 */
export const AdminTableBasic = memo(<T extends TableDataItem,>(props: Omit<AdminTableProps<T>, 'enableSearch' | 'enableSelection' | 'enablePagination'>) => (
  <AdminTableStandardized
    enableSearch
    enableSelection
    enablePagination
    {...props}
  />
));

/**
 * Pre-configured table with bulk actions
 */
export const AdminTableWithBulkActions = memo(<T extends TableDataItem,>(props: AdminTableProps<T>) => (
  <AdminTableStandardized
    enableSearch
    enableSelection
    enableBulkActions
    enablePagination
    {...props}
  />
));
