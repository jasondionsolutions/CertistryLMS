"use client";

import { useQuery } from "@tanstack/react-query";
import { listCertifications } from "../serverActions/certification.action";
import type { ListCertificationsInput } from "../types/certification.schema";

/**
 * Hook for fetching list of certifications
 */
export function useCertifications(filters?: ListCertificationsInput) {
  return useQuery({
    queryKey: ["certifications", filters],
    queryFn: () => listCertifications(filters),
  });
}
