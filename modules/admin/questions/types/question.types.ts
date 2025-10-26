// Admin Questions - Type Definitions
import { TaskStatus } from "@prisma/client";

// Question option structure (stored in choices JSON field)
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

// Serialized interfaces for client-side use
export interface SerializedQuestion {
  id: string;
  certificationId?: string;

  // Flexible mapping - only ONE should be populated
  objectiveId?: string;
  bulletId?: string;
  subBulletId?: string;

  text: string;
  type: string;
  difficulty: string;
  choices: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  questionType?: string;
  taskId?: string;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedQuestionWithHierarchy extends SerializedQuestion {
  certificationName?: string;
  certificationCode?: string;
  domainName?: string;
  objectiveName?: string;
  objectiveCode?: string;
  bulletText?: string;
  subBulletText?: string;
  [key: string]: unknown;
}

export interface QuestionData {
  certificationId?: string;
  text: string;
  type: string; // "multiple_choice", "multiple_select", "scenario"
  difficulty: string; // "easy", "medium", "hard"
  choices: QuestionOption[];
  correctAnswer: string;
  explanation: string;

  // Flexible mapping - only ONE should be populated
  objectiveId?: string;
  bulletId?: string;
  subBulletId?: string;

  questionType?: string; // "scenario", "recall", "best_practice", etc.
  taskId?: string; // Optional - for associating questions with tasks
}

export interface SerializedQuestionWithDomainData {
  id: string;
  certificationId: string;
  certificationName: string;
  certificationCode: string;
  domainId: string;
  domainName: string;
  objectiveId: string;
  objectiveCode: string;
  objectiveName: string;
  text: string;
  type: string;
  questionType?: string;
  difficulty: string;
  choices: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkEditData {
  certificationId?: string;
  objectiveId?: string;
  bulletId?: string;
  subBulletId?: string;
  difficulty?: string;
  questionType?: string;
}

// Question Task Types
export interface CreateQuestionTaskData {
  name: string;
  certificationId: string;
  targetTotal: number;
  countExisting: boolean;
  objectives: Record<string, number>; // objectiveCode -> target count (e.g., "1.1": 10)
}

export interface SerializedQuestionTask {
  id: string;
  name: string;
  certificationId: string;
  certificationName?: string;
  certificationCode?: string;
  targetTotal: number;
  completedTotal: number;
  countExisting: boolean;
  status: TaskStatus;
  createdBy: string;
  objectives: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  progress: number; // calculated percentage
}

export interface QuestionDistribution {
  totalQuestions: number;
  domainDistribution: Record<string, {
    existing: number;
    target: number;
    needed: number;
  }>;
  objectiveDistribution: Record<string, {
    existing: number;
    target: number;
    needed: number;
    domainId: string;
  }>;
}

export interface TaskProgressSummary {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalTargetQuestions: number;
  totalCompletedQuestions: number;
  overallProgress: number;
}

export interface ObjectiveProgress {
  objectiveId: string;
  objectiveCode: string;
  domainId: string;
  domainName: string;
  objectiveName: string;
  targetCount: number;
  currentCount: number;
  progress: number;
  isComplete: boolean;
}

export interface TaskProgressWithObjectives extends TaskProgressSummary {
  objectiveProgress: ObjectiveProgress[];
  totalCurrent: number;
  totalTarget: number;
}
