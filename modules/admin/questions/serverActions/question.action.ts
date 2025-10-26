// Admin Questions - Server Actions
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { withPermission } from "@/lib/middleware/withPermission";
import type { AuthContext } from "@/lib/auth/types";
import type {
  SerializedQuestion,
  SerializedQuestionWithHierarchy,
  QuestionData,
  BulkEditData,
  QuestionOption,
} from "../types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to safely parse JSON fields
function safeParseJSON(field: any, fallback: any = []): any {
  if (Array.isArray(field)) return field;
  if (typeof field === "object" && field !== null) return field;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Helper to get hierarchy info for a question
async function getQuestionHierarchy(question: any) {
  const hierarchy: any = {};

  // Get certification (always try to find from relations)
  if (question.objectiveId || question.bulletId || question.subBulletId) {
    let certificationQuery: any = {};

    if (question.subBulletId) {
      const subBullet = await prisma.subBullet.findUnique({
        where: { id: question.subBulletId },
        include: {
          bullet: {
            include: {
              objective: {
                include: {
                  domain: {
                    include: { certification: true },
                  },
                },
              },
            },
          },
        },
      });

      if (subBullet) {
        hierarchy.subBulletText = subBullet.text;
        hierarchy.bulletText = subBullet.bullet.text;
        hierarchy.objectiveCode = subBullet.bullet.objective.code;
        hierarchy.objectiveName = subBullet.bullet.objective.description;
        hierarchy.domainName = subBullet.bullet.objective.domain.name;
        hierarchy.certificationName = subBullet.bullet.objective.domain.certification.name;
        hierarchy.certificationCode = subBullet.bullet.objective.domain.certification.code;
      }
    } else if (question.bulletId) {
      const bullet = await prisma.bullet.findUnique({
        where: { id: question.bulletId },
        include: {
          objective: {
            include: {
              domain: {
                include: { certification: true },
              },
            },
          },
        },
      });

      if (bullet) {
        hierarchy.bulletText = bullet.text;
        hierarchy.objectiveCode = bullet.objective.code;
        hierarchy.objectiveName = bullet.objective.description;
        hierarchy.domainName = bullet.objective.domain.name;
        hierarchy.certificationName = bullet.objective.domain.certification.name;
        hierarchy.certificationCode = bullet.objective.domain.certification.code;
      }
    } else if (question.objectiveId) {
      const objective = await prisma.certificationObjective.findUnique({
        where: { id: question.objectiveId },
        include: {
          domain: {
            include: { certification: true },
          },
        },
      });

      if (objective) {
        hierarchy.objectiveCode = objective.code;
        hierarchy.objectiveName = objective.description;
        hierarchy.domainName = objective.domain.name;
        hierarchy.certificationName = objective.domain.certification.name;
        hierarchy.certificationCode = objective.domain.certification.code;
      }
    }
  }

  return hierarchy;
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getQuestions(): Promise<SerializedQuestion[]> {
  try {
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        choices: true,
        correctAnswer: true,
        explanation: true,
        questionType: true,
        objectiveId: true,
        bulletId: true,
        subBulletId: true,
        taskId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return questions.map((question) => ({
      id: question.id,
      text: question.text || "",
      type: question.type || "multiple_choice",
      difficulty: question.difficulty || "medium",
      choices: safeParseJSON(question.choices, []),
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      questionType: question.questionType || undefined,
      objectiveId: question.objectiveId || undefined,
      bulletId: question.bulletId || undefined,
      subBulletId: question.subBulletId || undefined,
      taskId: question.taskId || undefined,
      isActive: question.isActive,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}

export async function getQuestionsWithHierarchy(): Promise<
  SerializedQuestionWithHierarchy[]
> {
  try {
    const questions = await getQuestions();

    // Enrich with hierarchy data
    const enriched = await Promise.all(
      questions.map(async (question) => {
        const hierarchy = await getQuestionHierarchy(question);
        return {
          ...question,
          ...hierarchy,
        };
      })
    );

    return enriched;
  } catch (error) {
    console.error("Error fetching questions with hierarchy:", error);
    return [];
  }
}

export async function getQuestionById(
  id: string
): Promise<SerializedQuestion | null> {
  try {
    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        choices: true,
        correctAnswer: true,
        explanation: true,
        questionType: true,
        objectiveId: true,
        bulletId: true,
        subBulletId: true,
        taskId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!question) return null;

    return {
      id: question.id,
      text: question.text || "",
      type: question.type || "multiple_choice",
      difficulty: question.difficulty || "medium",
      choices: safeParseJSON(question.choices, []),
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      questionType: question.questionType || undefined,
      objectiveId: question.objectiveId || undefined,
      bulletId: question.bulletId || undefined,
      subBulletId: question.subBulletId || undefined,
      taskId: question.taskId || undefined,
      isActive: question.isActive,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    return null;
  }
}

export async function getQuestionWithHierarchy(
  id: string
): Promise<SerializedQuestionWithHierarchy | null> {
  try {
    const question = await getQuestionById(id);
    if (!question) return null;

    const hierarchy = await getQuestionHierarchy(question);

    return {
      ...question,
      ...hierarchy,
    };
  } catch (error) {
    console.error("Error fetching question with hierarchy:", error);
    return null;
  }
}

// ============================================================================
// CREATE OPERATIONS (with RBAC)
// ============================================================================

async function _createQuestion(
  currentUser: AuthContext,
  questionData: QuestionData
): Promise<SerializedQuestion | null> {
  try {
    // Validate that only ONE of objectiveId, bulletId, subBulletId is populated
    const mappingCount = [
      questionData.objectiveId,
      questionData.bulletId,
      questionData.subBulletId,
    ].filter(Boolean).length;

    if (mappingCount === 0) {
      throw new Error(
        "Question must map to at least one of: objective, bullet, or sub-bullet"
      );
    }

    if (mappingCount > 1) {
      throw new Error(
        "Question can only map to ONE of: objective, bullet, or sub-bullet"
      );
    }

    const question = await prisma.question.create({
      data: {
        text: questionData.text,
        type: questionData.type,
        difficulty: questionData.difficulty,
        choices: questionData.choices as any,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        questionType: questionData.questionType || null,
        objectiveId: questionData.objectiveId || null,
        bulletId: questionData.bulletId || null,
        subBulletId: questionData.subBulletId || null,
        taskId: questionData.taskId || null,
      },
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        choices: true,
        correctAnswer: true,
        explanation: true,
        questionType: true,
        objectiveId: true,
        bulletId: true,
        subBulletId: true,
        taskId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update task progress if associated with a task
    if (questionData.taskId) {
      await updateTaskProgress(questionData.taskId);
    }

    revalidatePath("/admin/questions");

    return {
      id: question.id,
      text: question.text || "",
      type: question.type || "multiple_choice",
      difficulty: question.difficulty || "medium",
      choices: safeParseJSON(question.choices, []),
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      questionType: question.questionType || undefined,
      objectiveId: question.objectiveId || undefined,
      bulletId: question.bulletId || undefined,
      subBulletId: question.subBulletId || undefined,
      taskId: question.taskId || undefined,
      isActive: question.isActive,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
}

export const createQuestion = withPermission("questions.create")(
  _createQuestion
);

// ============================================================================
// UPDATE OPERATIONS (with RBAC)
// ============================================================================

async function _updateQuestion(
  currentUser: AuthContext,
  id: string,
  questionData: Partial<QuestionData>
): Promise<SerializedQuestion | null> {
  try {
    // Validate mapping exclusivity if any mapping field is being updated
    if (
      questionData.objectiveId !== undefined ||
      questionData.bulletId !== undefined ||
      questionData.subBulletId !== undefined
    ) {
      const newMappingCount = [
        questionData.objectiveId,
        questionData.bulletId,
        questionData.subBulletId,
      ].filter(Boolean).length;

      if (newMappingCount > 1) {
        throw new Error(
          "Question can only map to ONE of: objective, bullet, or sub-bullet"
        );
      }
    }

    const updateData: any = {};
    if (questionData.text !== undefined) updateData.text = questionData.text;
    if (questionData.type !== undefined) updateData.type = questionData.type;
    if (questionData.difficulty !== undefined)
      updateData.difficulty = questionData.difficulty;
    if (questionData.choices !== undefined)
      updateData.choices = questionData.choices;
    if (questionData.correctAnswer !== undefined)
      updateData.correctAnswer = questionData.correctAnswer;
    if (questionData.explanation !== undefined)
      updateData.explanation = questionData.explanation;
    if (questionData.questionType !== undefined)
      updateData.questionType = questionData.questionType;
    if (questionData.objectiveId !== undefined)
      updateData.objectiveId = questionData.objectiveId;
    if (questionData.bulletId !== undefined)
      updateData.bulletId = questionData.bulletId;
    if (questionData.subBulletId !== undefined)
      updateData.subBulletId = questionData.subBulletId;

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        choices: true,
        correctAnswer: true,
        explanation: true,
        questionType: true,
        objectiveId: true,
        bulletId: true,
        subBulletId: true,
        taskId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/admin/questions");

    return {
      id: question.id,
      text: question.text || "",
      type: question.type || "multiple_choice",
      difficulty: question.difficulty || "medium",
      choices: safeParseJSON(question.choices, []),
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      questionType: question.questionType || undefined,
      objectiveId: question.objectiveId || undefined,
      bulletId: question.bulletId || undefined,
      subBulletId: question.subBulletId || undefined,
      taskId: question.taskId || undefined,
      isActive: question.isActive,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
}

export const updateQuestion = withPermission("questions.edit")(
  _updateQuestion
);

// ============================================================================
// DELETE OPERATIONS (with RBAC)
// ============================================================================

async function _deleteQuestion(
  currentUser: AuthContext,
  id: string
): Promise<{ success: boolean }> {
  try {
    // Get question to check if it's part of a task
    const question = await prisma.question.findUnique({
      where: { id },
      select: { taskId: true },
    });

    await prisma.question.delete({
      where: { id },
    });

    // Update task progress if question was part of a task
    if (question?.taskId) {
      await updateTaskProgress(question.taskId);
    }

    revalidatePath("/admin/questions");

    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
}

export const deleteQuestion = withPermission("questions.delete")(
  _deleteQuestion
);

// ============================================================================
// BULK OPERATIONS (with RBAC)
// ============================================================================

async function _bulkUpdateQuestions(
  currentUser: AuthContext,
  questionIds: string[],
  updateData: BulkEditData
): Promise<boolean> {
  try {
    const bulkUpdateData: Record<string, unknown> = {};

    // Handle certification update
    if (updateData.certificationId) {
      bulkUpdateData.certificationId = updateData.certificationId;
    }

    // Handle objective/bullet/subBullet updates
    if (updateData.objectiveId) {
      bulkUpdateData.objectiveId = updateData.objectiveId;
      bulkUpdateData.bulletId = null;
      bulkUpdateData.subBulletId = null;
    } else if (updateData.bulletId) {
      bulkUpdateData.bulletId = updateData.bulletId;
      bulkUpdateData.objectiveId = null;
      bulkUpdateData.subBulletId = null;
    } else if (updateData.subBulletId) {
      bulkUpdateData.subBulletId = updateData.subBulletId;
      bulkUpdateData.objectiveId = null;
      bulkUpdateData.bulletId = null;
    }

    // Handle difficulty update
    if (updateData.difficulty) {
      bulkUpdateData.difficulty = updateData.difficulty;
    }

    // Handle questionType update
    if (updateData.questionType) {
      bulkUpdateData.questionType = updateData.questionType;
    }

    if (Object.keys(bulkUpdateData).length === 0) {
      console.warn("No valid update data provided for bulk update");
      return false;
    }

    const result = await prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: bulkUpdateData,
    });

    revalidatePath("/admin/questions");
    console.error("Bulk updated questions:", result.count);

    return true;
  } catch (error) {
    console.error("Error bulk updating questions:", error);
    throw error;
  }
}

export const bulkUpdateQuestions = withPermission("questions.edit")(
  _bulkUpdateQuestions
);

async function _bulkDeleteQuestions(
  currentUser: AuthContext,
  ids: string[]
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all task IDs for affected questions
    const questions = await prisma.question.findMany({
      where: { id: { in: ids } },
      select: { taskId: true },
    });

    const taskIds = Array.from(
      new Set(questions.map((q) => q.taskId).filter(Boolean))
    );

    const result = await prisma.question.deleteMany({
      where: { id: { in: ids } },
    });

    // Update all affected tasks
    for (const taskId of taskIds) {
      if (taskId) {
        await updateTaskProgress(taskId);
      }
    }

    revalidatePath("/admin/questions");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error bulk deleting questions:", error);
    throw error;
  }
}

export const bulkDeleteQuestions = withPermission("questions.delete")(
  _bulkDeleteQuestions
);

// ============================================================================
// TASK PROGRESS HELPER
// ============================================================================

async function updateTaskProgress(taskId: string): Promise<void> {
  try {
    // Count questions for this task
    const count = await prisma.question.count({
      where: { taskId },
    });

    // Update task completedTotal
    await prisma.questionTask.update({
      where: { id: taskId },
      data: { completedTotal: count },
    });
  } catch (error) {
    console.error("Error updating task progress:", error);
  }
}
