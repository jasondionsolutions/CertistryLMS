// modules/shared/names/hooks/useNames.ts
// PORTED FROM CERTISTRY-APP - FULL CODE
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRandomNames,
  createName,
  bulkCreateNames,
  getAllNames,
  getNameStats,
  deleteName
} from "@/modules/shared/names/serverActions/names.actions";
import type {
  CreateNameInput,
  NameFilters,
  BulkCreateNameInput
} from "@/modules/shared/names/types/names.types";

// Hook for getting random names (public, no auth required)
export function useRandomNames(filters?: NameFilters) {
  return useQuery({
    queryKey: ['random-names', filters],
    queryFn: () => getRandomNames(filters),
    staleTime: 0, // Always fetch fresh random names
    enabled: false // Only fetch when explicitly called
  });
}

// Hook for getting a single random name
export function useRandomName(filters?: Omit<NameFilters, 'limit'>) {
  const filtersWithLimit = { ...filters, limit: 1 };

  return useQuery({
    queryKey: ['random-name', filters],
    queryFn: async () => {
      const result = await getRandomNames(filtersWithLimit);
      if (result.success && result.data) {
        // Return single name from array or the single name directly
        return {
          ...result,
          data: Array.isArray(result.data) ? result.data[0] : result.data
        };
      }
      return result;
    },
    staleTime: 0, // Always fetch fresh random names
    enabled: false // Only fetch when explicitly called
  });
}

// Hook for creating a single name (admin only)
export function useCreateName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNameInput) => createName(input),
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success("Name created successfully");
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['names'] });
        queryClient.invalidateQueries({ queryKey: ['name-stats'] });
      } else {
        toast.error(result.error || "Failed to create name");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create name");
    }
  });
}

// Hook for bulk creating names (admin only)
export function useBulkCreateNames() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkCreateNameInput) => bulkCreateNames(input),
    onSuccess: (result: any) => {
      if (result.success && result.data) {
        const { created, skipped, errors } = result.data;
        if (created > 0) {
          toast.success(`Successfully created ${created} names${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`);
        }
        if (errors.length > 0) {
          toast.error(`${errors.length} errors occurred during import`);
        }
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['names'] });
        queryClient.invalidateQueries({ queryKey: ['name-stats'] });
      } else {
        toast.error(result.error || "Failed to bulk create names");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to bulk create names");
    }
  });
}

// Hook for getting all names (admin only)
export function useAllNames(filters?: NameFilters) {
  return useQuery({
    queryKey: ['names', filters],
    queryFn: () => getAllNames(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: any) => data.success ? data.data : []
  });
}

// Hook for getting name statistics (admin only)
export function useNameStats() {
  return useQuery({
    queryKey: ['name-stats'],
    queryFn: () => getNameStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: any) => data.success ? data.data : null
  });
}

// Hook for deleting a name (admin only)
export function useDeleteName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nameId: string) => deleteName(nameId),
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success("Name deleted successfully");
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['names'] });
        queryClient.invalidateQueries({ queryKey: ['name-stats'] });
      } else {
        toast.error(result.error || "Failed to delete name");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete name");
    }
  });
}

// Utility hook for common name operations
export function useNameOperations() {
  const createNameMutation = useCreateName();
  const bulkCreateMutation = useBulkCreateNames();
  const deleteNameMutation = useDeleteName();

  return {
    createName: createNameMutation.mutate,
    bulkCreateNames: bulkCreateMutation.mutate,
    deleteName: deleteNameMutation.mutate,
    isCreating: createNameMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    isDeleting: deleteNameMutation.isPending,
    isLoading: createNameMutation.isPending || bulkCreateMutation.isPending || deleteNameMutation.isPending
  };
}
