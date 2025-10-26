/**
 * Question Query Hooks
 *
 * Client hooks for fetching and managing question data.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getQuestions,
  getQuestionsWithHierarchy,
  getQuestionById,
  getQuestionWithHierarchy,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
} from "../serverActions/question.action";
import type { QuestionData } from "../types";

/**
 * Fetch list of all questions
 */
export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const questions = await getQuestions();
      return questions;
    },
  });
}

/**
 * Fetch list of questions with hierarchy data (certification, domain, objective, bullet, sub-bullet)
 */
export function useQuestionsWithHierarchy() {
  return useQuery({
    queryKey: ["questions", "with-hierarchy"],
    queryFn: async () => {
      const questions = await getQuestionsWithHierarchy();
      return questions;
    },
  });
}

/**
 * Fetch single question by ID
 */
export function useQuestion(questionId: string | null) {
  return useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      if (!questionId) return null;
      const question = await getQuestionById(questionId);
      return question;
    },
    enabled: !!questionId,
  });
}

/**
 * Fetch single question with hierarchy data
 */
export function useQuestionWithHierarchy(questionId: string | null) {
  return useQuery({
    queryKey: ["question", questionId, "with-hierarchy"],
    queryFn: async () => {
      if (!questionId) return null;
      const question = await getQuestionWithHierarchy(questionId);
      return question;
    },
    enabled: !!questionId,
  });
}

/**
 * Create new question
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionData: QuestionData) => {
      const result = await createQuestion(questionData);
      if (!result) {
        throw new Error("Failed to create question");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Question created successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create question");
    },
  });
}

/**
 * Update existing question
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<QuestionData>;
    }) => {
      const result = await updateQuestion(id, data);
      if (!result) {
        throw new Error("Failed to update question");
      }
      return result;
    },
    onSuccess: (_, variables) => {
      toast.success("Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["question", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update question");
    },
  });
}

/**
 * Delete question
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      const result = await deleteQuestion(questionId);
      if (!result.success) {
        throw new Error("Failed to delete question");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete question");
    },
  });
}

/**
 * Bulk delete questions
 */
export function useBulkDeleteQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionIds: string[]) => {
      const result = await bulkDeleteQuestions(questionIds);
      if (!result.success) {
        throw new Error("Failed to delete questions");
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success(`${result.count} question(s) deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete questions");
    },
  });
}
