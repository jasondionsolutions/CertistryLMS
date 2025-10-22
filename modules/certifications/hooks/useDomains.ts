"use client";

import { useQuery } from "@tanstack/react-query";
import { getDomains } from "../serverActions/domain.action";

/**
 * Hook for fetching domains with full nested structure
 */
export function useDomains(certificationId: string) {
  return useQuery({
    queryKey: ["domains", certificationId],
    queryFn: () => getDomains(certificationId),
    enabled: !!certificationId,
  });
}
