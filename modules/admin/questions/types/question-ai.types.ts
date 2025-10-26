// Admin Questions AI - Type Definitions

export interface GenerateQuestionRequest {
  prompt: string;
  questionType: "multiple_choice" | "multi_select" | "ordering" | "categorization";
  certificationName?: string;
  domainId?: string;
  domainName?: string;
  objectiveId?: string;
  objectiveCode?: string;
  objectiveName?: string;
  bulletText?: string;
  subBulletText?: string;
}

// QuestionOption is imported from question.types.ts to avoid duplication
import type { QuestionOption } from "./question.types";
export type { QuestionOption };

export interface GeneratedQuestion {
  text: string;
  options: QuestionOption[];
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AIFeedbackSuggestion {
  type: "question_clarity" | "distractor_quality" | "difficulty" | "explanation";
  severity: "low" | "medium" | "high";
  suggestion: string;
  currentText?: string;
  suggestedText?: string;
}

export interface AIFeedbackResponse {
  overallScore: number; // 0-100
  suggestions: AIFeedbackSuggestion[];
  estimatedDifficulty: "easy" | "medium" | "hard";
  confidenceScore: number; // 0-1
}
