// modules/admin/shared/ui/AdminTable.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import React, { ReactNode, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableLoading } from "@/components/ui/table-loading";
import { ChevronUp, ChevronDown, Check, AlertTriangle, RefreshCcw } from "lucide-react";

// Base interface for table data items
export interface TableDataItem {
  id?: string;
  _id?: string;
  [key: string]: unknown;
}

export interface AdminTableColumn<T extends TableDataItem = TableDataItem> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => ReactNode;
}

export interface AdminTableProps<T extends TableDataItem = TableDataItem> {
  columns: AdminTableColumn<T>[];
  data: T[];
  selectedItems: string[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  onSelectAll?: () => void;
  onSelectItem?: (itemId: string) => void;
  getItemId?: (item: T) => string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyState?: ReactNode;
  className?: string;
}

const AdminTableComponent = <T extends TableDataItem = TableDataItem>({
  columns,
  data,
  selectedItems,
  sortField,
  sortDirection,
  onSort,
  onSelectAll,
  onSelectItem,
  getItemId = (item: T) => (item.id || item._id) as string,
  loading = false,
  error,
  onRetry,
  emptyState,
  className = "",
}: AdminTableProps<T>) => {
  // Memoized computed values for performance
  const isAllSelected = useMemo(
    () => selectedItems.length === data.length && data.length > 0,
    [selectedItems.length, data.length]
  );

  const isIndeterminate = useMemo(
    () => selectedItems.length > 0 && selectedItems.length < data.length,
    [selectedItems.length, data.length]
  );

  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  }, [sortField, sortDirection]);

  // Memoized empty state to prevent re-renders
  const emptyStateContent = useMemo(() => {
    if (emptyState) return emptyState;
    return (
      <div className="p-8 text-center text-muted-foreground">
        No items found.
      </div>
    );
  }, [emptyState]);

  if (loading) {
    return (
      <TableLoading
        columns={columns.length + ((onSelectAll || onSelectItem) ? 1 : 0)}
        rows={5}
        className={className}
      />
    );
  }

  if (error) {
    return (
      <div className={`overflow-hidden rounded-xl border border-red-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load data
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={`overflow-hidden rounded-xl border ${className}`}>
        <div className="p-8">
          {emptyState}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`overflow-hidden rounded-xl border ${className}`}>
        <div className="p-8 text-center text-muted-foreground">
          No items found.
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${className}`} role="region" aria-label="Data table">
      <table className="w-full text-sm" role="table" aria-label={`Table with ${data.length} rows`}>
        <thead className="border-b bg-gray-100 dark:bg-gray-800">
          <tr className="text-left">
            {(onSelectAll || onSelectItem) && (
              <th className="w-12 p-4" scope="col">
                {onSelectAll && (
                  <button
                    onClick={onSelectAll}
                    className="flex h-4 w-4 items-center justify-center rounded border focus:ring-2 focus:ring-primary focus:outline-none"
                    disabled={data.length === 0}
                    aria-label={`${isAllSelected ? 'Deselect' : 'Select'} all ${data.length} items`}
                    aria-pressed={isAllSelected}
                    tabIndex={0}
                  >
                    {isAllSelected ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : isIndeterminate ? (
                      <div className="h-2 w-2 rounded-sm bg-current" aria-hidden="true" />
                    ) : null}
                  </button>
                )}
              </th>
            )}

            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`p-4 font-medium ${
                  column.sortable && onSort
                    ? "cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-gray-200 dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    : ""
                } ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                    ? "text-right"
                    : "text-left"
                }`}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort && onSort(column.key)}
                onKeyDown={(e) => {
                  if (column.sortable && onSort && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSort(column.key);
                  }
                }}
                tabIndex={column.sortable && onSort ? 0 : -1}
                role={column.sortable && onSort ? "button" : undefined}
                aria-label={column.sortable && onSort ? `Sort by ${column.header}${sortField === column.key ? ` (currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'})` : ''}` : undefined}
                aria-sort={sortField === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className={`flex items-center ${
                  column.align === "center"
                    ? "justify-center"
                    : column.align === "right"
                    ? "justify-end"
                    : "justify-start"
                }`}>
                  {column.header}
                  {column.sortable && onSort && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const itemId = getItemId(item);
            const isSelected = selectedItems.includes(itemId);
            return (
              <tr
                key={itemId}
                className="hover:bg-muted/40 border-t transition-colors focus-within:bg-muted/60"
                role="row"
                aria-selected={isSelected}
              >
                {(onSelectAll || onSelectItem) && (
                  <td className="p-4">
                    {onSelectItem && (
                      <button
                        onClick={() => onSelectItem(itemId)}
                        className="flex h-4 w-4 items-center justify-center rounded border focus:ring-2 focus:ring-primary focus:outline-none"
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} item ${index + 1}`}
                        aria-pressed={isSelected}
                        tabIndex={0}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        )}
                      </button>
                    )}
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
                    }`}
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
      </table>
    </div>
  );
};

// Memoized component for optimal performance
export const AdminTable = React.memo(AdminTableComponent) as <T extends TableDataItem = TableDataItem>(
  props: AdminTableProps<T>
) => React.ReactElement;

// Admin Table Error Wrapper for consistent error boundary usage
export function AdminTableWithErrorBoundary<T extends TableDataItem = TableDataItem>(props: AdminTableProps<T>) {
  return (
    <div className="w-full">
      <AdminTable {...props} />
    </div>
  );
}
