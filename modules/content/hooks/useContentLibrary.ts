"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchContentLibrary,
  getCertifications,
} from "../serverActions/contentLibrary.action";
import type {
  ContentSearchInput,
  ContentSearchResult,
} from "../types/contentLibrary.types";

/**
 * Hook to search and filter content library
 */
export function useContentLibrary(input: ContentSearchInput) {
  return useQuery<ContentSearchResult>({
    queryKey: ["contentLibrary", input],
    queryFn: async () => {
      const result = await searchContentLibrary(input);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch content");
      }
      return result.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get available certifications for filtering
 */
export function useCertifications() {
  return useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const result = await getCertifications();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to fetch certifications");
      }
      return result.data;
    },
    staleTime: 300000, // 5 minutes (certifications change rarely)
  });
}
