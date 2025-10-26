// modules/admin/questions/hooks/useAdminQuestions.ts
// PORTED FROM CERTISTRY-APP - FULL CODE
"use client";

import { useState, useCallback } from 'react';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpdateQuestions,
  bulkDeleteQuestions,
} from '@/modules/admin/questions/serverActions';
import type { QuestionData, SerializedQuestion, BulkEditData } from '@/modules/admin/questions/types';

export interface UseAdminQuestionsReturn {
  // Loading states
  loading: boolean;

  // Question operations
  createQuestion: (questionData: QuestionData) => Promise<{success: boolean; data?: SerializedQuestion; error?: string}>;
  updateQuestion: (id: string, questionData: Partial<QuestionData>) => Promise<{success: boolean; data?: SerializedQuestion; error?: string}>;
  deleteQuestion: (id: string) => Promise<{success: boolean; data?: unknown; error?: string}>;
  bulkUpdateQuestions: (questionIds: string[], updateData: BulkEditData) => Promise<{success: boolean; data?: unknown; error?: string}>;
  bulkDeleteQuestions: (questionIds: string[]) => Promise<{success: boolean; data?: unknown; error?: string}>;
}

export function useAdminQuestions(): UseAdminQuestionsReturn {
  const [loading, setLoading] = useState(false);

  const createQuestionHook = useCallback(async (questionData: QuestionData): Promise<{success: boolean; data?: SerializedQuestion; error?: string}> => {
    setLoading(true);
    try {
      const result = await createQuestion(questionData) as SerializedQuestion | null;
      if (result) {
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to create question' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create question';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuestionHook = useCallback(async (id: string, questionData: Partial<QuestionData>): Promise<{success: boolean; data?: SerializedQuestion; error?: string}> => {
    setLoading(true);
    try {
      const result = await updateQuestion(id, questionData);
      if (result) {
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to update question' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuestionHook = useCallback(async (id: string): Promise<{success: boolean; data?: unknown; error?: string}> => {
    setLoading(true);
    try {
      const result = await deleteQuestion(id);
      if (result) {
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to delete question' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete question';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateQuestionsHook = useCallback(async (questionIds: string[], updateData: BulkEditData): Promise<{success: boolean; data?: unknown; error?: string}> => {
    setLoading(true);
    try {
      const result = await bulkUpdateQuestions(questionIds, updateData);
      if (result) {
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to update questions' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update questions';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteQuestionsHook = useCallback(async (questionIds: string[]): Promise<{success: boolean; data?: unknown; error?: string}> => {
    setLoading(true);
    try {
      const result = await bulkDeleteQuestions(questionIds);
      if (result) {
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to delete questions' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete questions';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createQuestion: createQuestionHook,
    updateQuestion: updateQuestionHook,
    deleteQuestion: deleteQuestionHook,
    bulkUpdateQuestions: bulkUpdateQuestionsHook,
    bulkDeleteQuestions: bulkDeleteQuestionsHook,
  };
}
