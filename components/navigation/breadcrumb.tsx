"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";
import { useBreadcrumb } from "./breadcrumb-context";

/**
 * Convert URL segment to readable label
 */
function segmentToLabel(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Check if a segment looks like a CUID (database ID)
 * CUIDs typically start with 'c' followed by 24 alphanumeric characters
 */
function isCuid(segment: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(segment);
}

/**
 * Breadcrumb Navigation Component
 * Automatically generates breadcrumbs from current URL path
 * Uses custom labels from BreadcrumbContext if available
 * Skips ID segments (CUIDs) to avoid creating links to non-existent pages
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const { customLabels } = useBreadcrumb();

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on home page
  if (segments.length === 0) {
    return null;
  }

  // Build breadcrumb items, skipping ID segments
  const breadcrumbs = segments
    .filter((segment) => !isCuid(segment)) // Skip database IDs
    .map((segment, index, filteredSegments) => {
      // Build href using original segments up to this filtered segment
      const originalIndex = segments.indexOf(segment);
      const href = "/" + segments.slice(0, originalIndex + 1).join("/");

      // Use custom label if available, otherwise convert segment to label
      const label = customLabels[segment] || segmentToLabel(segment);
      const isLast = index === filteredSegments.length - 1;

      return {
        href,
        label,
        isLast,
      };
    });

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {/* Home Link */}
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              {crumb.isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
