/**
 * Embedding Status Badge Component
 *
 * Displays the AI mapping readiness status for a certification
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmbeddingStatus } from "../serverActions/embeddingStatus.action";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

interface EmbeddingStatusBadgeProps {
  certificationId: string;
}

export function EmbeddingStatusBadge({
  certificationId,
}: EmbeddingStatusBadgeProps) {
  const { data: result, isLoading } = useQuery({
    queryKey: ["embeddingStatus", certificationId],
    queryFn: async () => {
      const res = await getEmbeddingStatus(certificationId);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch embedding status");
      }
      return res.data;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds to catch ongoing generation
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!result) return null;

  // Complete - all embeddings generated
  if (result.status === "complete") {
    return (
      <Badge
        variant="default"
        className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      >
        <Sparkles className="h-3 w-3" />
        AI Ready
      </Badge>
    );
  }

  // Partial - some embeddings exist
  if (result.status === "partial") {
    return (
      <Badge
        variant="secondary"
        className="text-xs gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing {result.percentageComplete}%
      </Badge>
    );
  }

  // None - no embeddings
  return (
    <Badge
      variant="outline"
      className="text-xs gap-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      <AlertCircle className="h-3 w-3" />
      No AI Data
    </Badge>
  );
}
