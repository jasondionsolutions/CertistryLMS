// Admin Questions - Question Management Hook
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)
"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getQuestionTaskById,
  getTaskProgressWithObjectives,
  updateQuestionTask,
  createQuestionTask
} from '../serverActions/questionTask.action';
import type {
  SerializedQuestionTask,
  TaskProgressWithObjectives,
  CreateQuestionTaskData
} from '../types';
import { createQuestion } from '../serverActions/question.action';
import type { QuestionData } from '../types';

// SECURE ARCHITECTURE: Standardized error handling
import {
  executeWithErrorHandling,
  createSuccessResult,
  type ApiResult
} from '@/lib/error-handling';

export interface UseQuestionManagementReturn {
  // Loading states
  loading: boolean;
  saving: boolean;

  // Task operations
  loadTaskById: (taskId: string) => Promise<ApiResult<SerializedQuestionTask>>;
  loadTaskProgress: (taskId: string) => Promise<ApiResult<TaskProgressWithObjectives>>;
  updateTaskStatus: (taskId: string, status: "active" | "completed" | "paused") => Promise<ApiResult<boolean>>;
  createTask: (taskData: CreateQuestionTaskData) => Promise<{success: boolean; data?: SerializedQuestionTask; error?: string}>;

  // Question operations
  saveQuestion: (questionData: QuestionData) => Promise<ApiResult<boolean>>;
}

export function useQuestionManagement(): UseQuestionManagementReturn {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTaskById = useCallback(async (taskId: string): Promise<ApiResult<SerializedQuestionTask>> => {
    // SECURE ARCHITECTURE: Standardized error handling with loading states
    return executeWithErrorHandling(
      async () => {
        const result = await getQuestionTaskById(taskId);

        if (!result) {
          throw new Error('Task not found');
        }

        return result;
      },
      {
        setLoading,
        errorConfig: {
          operationName: 'Load Task',
          showToast: true,
          logToConsole: true,
          context: { taskId }
        }
      }
    );
  }, []);

  const loadTaskProgress = useCallback(async (taskId: string): Promise<ApiResult<TaskProgressWithObjectives>> => {
    // SECURE ARCHITECTURE: Standardized error handling (silent for progress)
    return executeWithErrorHandling(
      async () => {
        const result = await getTaskProgressWithObjectives(taskId);

        if (!result) {
          throw new Error('Progress not available');
        }

        return result;
      },
      {
        errorConfig: {
          operationName: 'Load Task Progress',
          showToast: false, // Progress loading fails silently
          logToConsole: true,
          context: { taskId }
        }
      }
    );
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: "active" | "completed" | "paused"): Promise<ApiResult<boolean>> => {
    // SECURE ARCHITECTURE: Standardized error handling with loading states
    return executeWithErrorHandling(
      async () => {
        const result = await updateQuestionTask(taskId, { status });

        if (result.success) {
          const statusText = status === 'paused' ? 'paused' : status === 'completed' ? 'completed' : 'resumed';
          toast.success(`Task ${statusText}`);
          return true;
        } else {
          throw new Error('Failed to update task status');
        }
      },
      {
        errorConfig: {
          operationName: 'Update Task Status',
          showToast: true,
          logToConsole: true,
          context: { taskId, status }
        }
      }
    );
  }, []);

  const saveQuestion = useCallback(async (questionData: QuestionData): Promise<ApiResult<boolean>> => {
    // Validation (pre-flight checks)
    if (!questionData.text.trim()) {
      toast.error("Question text is required");
      return { success: false, error: 'Question text is required', errorType: 'ValidationError' };
    }

    if (questionData.choices.some(opt => !opt.text.trim())) {
      toast.error("All options must have text");
      return { success: false, error: 'All options must have text', errorType: 'ValidationError' };
    }

    if (questionData.type !== "ordering" && !questionData.choices.some(opt => opt.isCorrect)) {
      toast.error("Please select at least one correct answer");
      return { success: false, error: 'Please select at least one correct answer', errorType: 'ValidationError' };
    }

    // SECURE ARCHITECTURE: Standardized error handling with loading states
    return executeWithErrorHandling(
      async () => {
        const result = await createQuestion(questionData);

        if (result) {
          toast.success("Question saved successfully!");
          return true;
        } else {
          throw new Error('Failed to save question');
        }
      },
      {
        setLoading: setSaving,
        errorConfig: {
          operationName: 'Save Question',
          showToast: true,
          logToConsole: true,
          context: { questionType: questionData.type, optionsCount: questionData.choices.length }
        }
      }
    );
  }, []);

  const createTask = useCallback(async (taskData: CreateQuestionTaskData): Promise<{success: boolean; data?: SerializedQuestionTask; error?: string}> => {
    setLoading(true);
    try {
      const result = await createQuestionTask(taskData);

      if (result.success && result.data) {
        toast.success('Question task created successfully!');
        return { success: true, data: result.data };
      } else {
        const errorMessage = result.error || 'Failed to create question task';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create question task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    saving,
    loadTaskById,
    loadTaskProgress,
    updateTaskStatus,
    createTask,
    saveQuestion,
  };
}
