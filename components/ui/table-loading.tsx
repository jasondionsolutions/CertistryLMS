// components/ui/table-loading.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TableLoadingProps {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
}

// Table loading skeleton
function TableLoading({
  columns = 4,
  rows = 5,
  className,
  showHeader = true
}: TableLoadingProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      role="status"
      aria-label="Loading table data"
    >
      <table className="w-full">
        {showHeader && (
          <thead className="border-b bg-muted/50">
            <tr>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="p-4 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="border-t">
              {Array.from({ length: columns }, (_, j) => (
                <td key={j} className="p-4">
                  <Skeleton
                    className={cn(
                      "h-4",
                      // Vary widths for more realistic appearance
                      j === 0 ? "w-32" : // First column wider (usually names/titles)
                      j === columns - 1 ? "w-20" : // Last column narrower (usually actions)
                      "w-full"
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Grid loading for card layouts
interface GridLoadingProps {
  items?: number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

function GridLoading({
  items = 6,
  columns = 3,
  className
}: GridLoadingProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-6"
  };

  return (
    <div
      className={cn("grid gap-6", gridClass[columns], className)}
      role="status"
      aria-label="Loading grid data"
    >
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4" aria-hidden="true">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats grid loading
function StatsGridLoading({
  items = 4,
  columns = 4,
  className
}: GridLoadingProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-6"
  };

  return (
    <div
      className={cn("grid gap-6", gridClass[columns], className)}
      role="status"
      aria-label="Loading statistics"
    >
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="rounded-lg border p-6" aria-hidden="true">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  TableLoading,
  GridLoading,
  StatsGridLoading
}
