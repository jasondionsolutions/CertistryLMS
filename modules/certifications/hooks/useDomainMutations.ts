"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDomain,
  updateDomain,
  deleteDomain,
  createObjective,
  updateObjective,
  deleteObjective,
  createBullet,
  updateBullet,
  deleteBullet,
  createSubBullet,
  updateSubBullet,
  deleteSubBullet,
  bulkImportDomains,
} from "../serverActions/domain.action";
import type {
  CreateDomainInput,
  UpdateDomainInput,
  DeleteDomainInput,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  DeleteObjectiveInput,
  CreateBulletInput,
  UpdateBulletInput,
  DeleteBulletInput,
  CreateSubBulletInput,
  UpdateSubBulletInput,
  DeleteSubBulletInput,
  BulkImportDomainInput,
} from "../types/domain.schema";

// =============================================================================
// DOMAIN HOOKS
// =============================================================================

export function useCreateDomain(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDomainInput) => createDomain(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Domain created successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to create domain");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useUpdateDomain(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDomainInput) => updateDomain(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Domain updated successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to update domain");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useDeleteDomain(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteDomainInput) => deleteDomain(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Domain deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to delete domain");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

// =============================================================================
// OBJECTIVE HOOKS
// =============================================================================

export function useCreateObjective(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateObjectiveInput) => createObjective(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Objective created successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to create objective");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useUpdateObjective(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateObjectiveInput) => updateObjective(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Objective updated successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to update objective");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useDeleteObjective(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteObjectiveInput) => deleteObjective(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Objective deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to delete objective");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

// =============================================================================
// BULLET HOOKS
// =============================================================================

export function useCreateBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBulletInput) => createBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Bullet created successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to create bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useUpdateBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBulletInput) => updateBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Bullet updated successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to update bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useDeleteBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteBulletInput) => deleteBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Bullet deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to delete bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

// =============================================================================
// SUB-BULLET HOOKS
// =============================================================================

export function useCreateSubBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubBulletInput) => createSubBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Sub-bullet created successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to create sub-bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useUpdateSubBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSubBulletInput) => updateSubBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Sub-bullet updated successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to update sub-bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useDeleteSubBullet(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteSubBulletInput) => deleteSubBullet(input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Sub-bullet deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to delete sub-bullet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

// =============================================================================
// BULK IMPORT HOOK
// =============================================================================

export function useBulkImportDomains(certificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkImportDomainInput) => bulkImportDomains(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success(
          `Successfully imported ${response.data.domainsCreated} domains, ${response.data.objectivesCreated} objectives, ${response.data.bulletsCreated} bullets, and ${response.data.subBulletsCreated} sub-bullets`
        );
        queryClient.invalidateQueries({ queryKey: ["domains", certificationId] });
      } else {
        toast.error(response.error || "Failed to import domains");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}
