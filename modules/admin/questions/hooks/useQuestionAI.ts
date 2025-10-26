/**
 * Question AI Hooks
 *
 * Client hooks for AI-powered question generation and feedback.
 */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateQuestion, getQuestionFeedback } from "../serverActions/questionAI.action";
import type { GenerateQuestionRequest, QuestionOption } from "../types";

/**
 * Generate question using AI
 */
export function useGenerateQuestion() {
  return useMutation({
    mutationFn: async (request: GenerateQuestionRequest) => {
      const result = await generateQuestion(request);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate question");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Question generated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate question");
    },
  });
}

/**
 * Get AI feedback for a question
 */
export function useQuestionFeedback() {
  return useMutation({
    mutationFn: async ({
      questionText,
      options,
      questionType,
    }: {
      questionText: string;
      options: QuestionOption[];
      questionType: "multiple_choice" | "multi_select";
    }) => {
      const result = await getQuestionFeedback(
        questionText,
        options,
        questionType
      );
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to get question feedback");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("AI feedback generated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to get AI feedback");
    },
  });
}
