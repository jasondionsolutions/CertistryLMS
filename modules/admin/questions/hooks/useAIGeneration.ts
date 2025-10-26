// Admin Questions - AI Generation Hook
// PORTED FROM CERTISTRY-APP - FULL CODE
"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateQuestion } from '../serverActions/questionAI.action';

// SECURE ARCHITECTURE: Standardized error handling
import {
  executeWithErrorHandling,
  createSuccessResult,
  type ApiResult
} from '@/lib/error-handling';

export interface AIGenerationInput {
  prompt: string;
  questionType: "multiple_choice" | "multi_select" | "ordering" | "categorization";
  examName?: string;
  domainNumber?: string;
  domainName?: string;
  objectiveNumber?: string;
  objectiveName?: string;
}

export interface GeneratedQuestionData {
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export interface UseAIGenerationReturn {
  generating: boolean;
  generateAIQuestion: (input: AIGenerationInput) => Promise<ApiResult<GeneratedQuestionData>>;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [generating, setGenerating] = useState(false);

  const generateAIQuestion = useCallback(async (input: AIGenerationInput): Promise<ApiResult<GeneratedQuestionData>> => {
    // Pre-validation
    if (!input.prompt.trim()) {
      toast.error("Please enter a prompt for AI generation");
      return { success: false, error: 'Prompt is required for AI generation', errorType: 'ValidationError' };
    }

    // SECURE ARCHITECTURE: Standardized error handling with loading states
    return executeWithErrorHandling(
      async () => {
        const result = await generateQuestion(input);

        if (!(result as any)?.success) {
          throw new Error((result as any)?.error || "Failed to generate question");
        }

        if (!(result as any)?.data) {
          throw new Error("No question data received");
        }

      const generatedData = (result as any)?.data;

      // Validate the response structure
      if (!generatedData.text || !Array.isArray(generatedData.options)) {
        throw new Error("Invalid response format from AI");
      }

      // Ensure we have the right number of options
      const expectedOptionCount = input.questionType === "multiple_choice" ? 4 : 6;
      if (generatedData.options.length !== expectedOptionCount) {
        throw new Error(
          `AI generated wrong number of options (expected ${expectedOptionCount}, got ${generatedData.options.length})`,
        );
      }

        // For multiple choice, ensure only one correct answer
        if (input.questionType === "multiple_choice") {
          const correctCount = generatedData.options.filter(
            (opt: any) => opt.isCorrect,
          ).length;
          if (correctCount !== 1) {
            throw new Error(
              "Multiple choice questions must have exactly one correct answer",
            );
          }
        }

        toast.success("Question generated successfully!");
        return generatedData;
      },
      {
        setLoading: setGenerating,
        errorConfig: {
          operationName: 'AI Question Generation',
          showToast: true,
          logToConsole: true,
          context: {
            prompt: input.prompt.substring(0, 50),
            questionType: input.questionType,
            examName: input.examName
          }
        }
      }
    );
  }, []);

  return {
    generating,
    generateAIQuestion,
  };
}
