/**
 * Question Task Hooks
 *
 * Client hooks for managing question creation tasks.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getQuestionTasks,
  getQuestionTaskById,
  getTaskProgressSummary,
  getTaskProgressWithObjectives,
  createQuestionTask,
  updateQuestionTask,
  deleteQuestionTask,
} from "../serverActions/questionTask.action";
import type { CreateQuestionTaskData } from "../types";

/**
 * Fetch all question tasks
 */
export function useQuestionTasks() {
  return useQuery({
    queryKey: ["question-tasks"],
    queryFn: async () => {
      const tasks = await getQuestionTasks();
      return tasks;
    },
  });
}

/**
 * Fetch single question task by ID
 */
export function useQuestionTask(taskId: string | null) {
  return useQuery({
    queryKey: ["question-task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const task = await getQuestionTaskById(taskId);
      return task;
    },
    enabled: !!taskId,
  });
}

/**
 * Fetch task progress summary (all tasks)
 */
export function useTaskProgressSummary() {
  return useQuery({
    queryKey: ["task-progress-summary"],
    queryFn: async () => {
      const summary = await getTaskProgressSummary();
      return summary;
    },
  });
}

/**
 * Fetch task progress with objectives breakdown
 */
export function useTaskProgressWithObjectives(taskId: string | null) {
  return useQuery({
    queryKey: ["task-progress", taskId, "objectives"],
    queryFn: async () => {
      if (!taskId) return null;
      const progress = await getTaskProgressWithObjectives(taskId);
      return progress;
    },
    enabled: !!taskId,
  });
}

/**
 * Create new question task
 */
export function useCreateQuestionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateQuestionTaskData) => {
      const result = await createQuestionTask(taskData);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create question task");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Question task created successfully");
      queryClient.invalidateQueries({ queryKey: ["question-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-progress-summary"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create question task");
    },
  });
}

/**
 * Update question task
 */
export function useUpdateQuestionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateQuestionTaskData> & {
        status?: "active" | "completed" | "paused";
      };
    }) => {
      const result = await updateQuestionTask(id, updates);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to update question task");
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      const statusText =
        variables.updates.status === "paused"
          ? "paused"
          : variables.updates.status === "completed"
            ? "completed"
            : "updated";
      toast.success(`Question task ${statusText}`);
      queryClient.invalidateQueries({
        queryKey: ["question-task", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["question-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-progress-summary"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update question task");
    },
  });
}

/**
 * Delete question task
 */
export function useDeleteQuestionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await deleteQuestionTask(taskId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete question task");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Question task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["question-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-progress-summary"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete question task");
    },
  });
}
