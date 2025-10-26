// Admin Question Tasks - Server Actions
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { withPermission } from "@/lib/middleware/withPermission";
import type { AuthContext } from "@/lib/auth/types";
import type {
  CreateQuestionTaskData,
  SerializedQuestionTask,
  TaskProgressSummary,
  TaskProgressWithObjectives,
  ObjectiveProgress,
} from "../types";

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

async function _createQuestionTask(
  currentUser: AuthContext,
  taskData: CreateQuestionTaskData
): Promise<{
  success: boolean;
  data?: SerializedQuestionTask;
  error?: string;
}> {
  try {
    // Validate certification exists
    const certification = await prisma.certification.findUnique({
      where: { id: taskData.certificationId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!certification) {
      return {
        success: false,
        error: "Certification not found",
      };
    }

    // Count existing questions if requested
    let completedTotal = 0;
    if (taskData.countExisting) {
      completedTotal = await getExistingQuestionCount(
        taskData.certificationId,
        taskData.objectives
      );
    }

    // Create the question task
    const questionTask = await prisma.questionTask.create({
      data: {
        name: taskData.name,
        certificationId: taskData.certificationId,
        targetTotal: taskData.targetTotal,
        countExisting: taskData.countExisting,
        status: "active",
        createdBy: currentUser.userId,
        objectives: taskData.objectives,
        completedTotal,
      },
    });

    // Calculate progress
    const progress =
      questionTask.targetTotal > 0
        ? Math.round(
            (questionTask.completedTotal / questionTask.targetTotal) * 100
          )
        : 0;

    const serializedTask: SerializedQuestionTask = {
      id: questionTask.id,
      name: questionTask.name,
      certificationId: questionTask.certificationId,
      certificationName: certification.name,
      certificationCode: certification.code,
      targetTotal: questionTask.targetTotal,
      completedTotal: questionTask.completedTotal,
      countExisting: questionTask.countExisting,
      status: questionTask.status,
      createdBy: questionTask.createdBy,
      objectives: questionTask.objectives as Record<string, number>,
      createdAt: questionTask.createdAt.toISOString(),
      updatedAt: questionTask.updatedAt.toISOString(),
      progress,
    };

    revalidatePath("/admin/questions");

    return {
      success: true,
      data: serializedTask,
    };
  } catch (error) {
    console.error("Error creating question task:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create question task",
    };
  }
}

export const createQuestionTask = withPermission("questions.tasks.create")(
  _createQuestionTask
);

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getQuestionTasks(): Promise<SerializedQuestionTask[]> {
  try {
    const tasks = await prisma.questionTask.findMany({
      include: {
        certification: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((task) => {
      const progress =
        task.targetTotal > 0
          ? Math.round((task.completedTotal / task.targetTotal) * 100)
          : 0;

      return {
        id: task.id,
        name: task.name,
        certificationId: task.certificationId,
        certificationName: task.certification.name,
        certificationCode: task.certification.code,
        targetTotal: task.targetTotal,
        completedTotal: task.completedTotal,
        countExisting: task.countExisting,
        status: task.status,
        createdBy: task.createdBy,
        objectives: task.objectives as Record<string, number>,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        progress,
      };
    });
  } catch (error) {
    console.error("Error fetching question tasks:", error);
    return [];
  }
}

export async function getQuestionTaskById(
  id: string
): Promise<SerializedQuestionTask | null> {
  try {
    const task = await prisma.questionTask.findUnique({
      where: { id },
      include: {
        certification: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!task) return null;

    const progress =
      task.targetTotal > 0
        ? Math.round((task.completedTotal / task.targetTotal) * 100)
        : 0;

    return {
      id: task.id,
      name: task.name,
      certificationId: task.certificationId,
      certificationName: task.certification.name,
      certificationCode: task.certification.code,
      targetTotal: task.targetTotal,
      completedTotal: task.completedTotal,
      countExisting: task.countExisting,
      status: task.status,
      createdBy: task.createdBy,
      objectives: task.objectives as Record<string, number>,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      progress,
    };
  } catch (error) {
    console.error("Error fetching question task:", error);
    return null;
  }
}

export async function getTaskProgressSummary(): Promise<TaskProgressSummary> {
  try {
    const tasks = await prisma.questionTask.findMany({
      select: {
        id: true,
        status: true,
        targetTotal: true,
        completedTotal: true,
      },
    });

    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((t) => t.status === "active").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalTargetQuestions = tasks.reduce(
      (sum, t) => sum + t.targetTotal,
      0
    );
    const totalCompletedQuestions = tasks.reduce(
      (sum, t) => sum + t.completedTotal,
      0
    );
    const overallProgress =
      totalTargetQuestions > 0
        ? Math.round(
            (totalCompletedQuestions / totalTargetQuestions) * 100
          )
        : 0;

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      totalTargetQuestions,
      totalCompletedQuestions,
      overallProgress,
    };
  } catch (error) {
    console.error("Error getting task progress summary:", error);
    return {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalTargetQuestions: 0,
      totalCompletedQuestions: 0,
      overallProgress: 0,
    };
  }
}

export async function getTaskProgressWithObjectives(
  taskId: string
): Promise<TaskProgressWithObjectives | null> {
  try {
    const task = await getQuestionTaskById(taskId);
    if (!task) return null;

    // Get certification structure to build objective progress
    const certification = await prisma.certification.findUnique({
      where: { id: task.certificationId },
      include: {
        domains: {
          include: {
            objectives: true,
          },
        },
      },
    });

    if (!certification) return null;

    // Count questions per objective for this task
    const questions = await prisma.question.findMany({
      where: { taskId },
      select: {
        objectiveId: true,
        bulletId: true,
        subBulletId: true,
      },
    });

    // Build objective progress array
    const objectiveProgress: ObjectiveProgress[] = [];
    const objectives = task.objectives as Record<string, number>;

    for (const [objectiveCode, targetCount] of Object.entries(objectives)) {
      // Find the objective in the certification structure
      let objective = null;
      let domainName = "";
      for (const domain of certification.domains) {
        const found = domain.objectives.find((obj) => obj.code === objectiveCode);
        if (found) {
          objective = found;
          domainName = domain.name;
          break;
        }
      }

      if (!objective) continue;

      // Count questions for this objective (including bullets and sub-bullets)
      const currentCount = questions.filter((q) => {
        if (q.objectiveId === objective.id) return true;
        // Check if bulletId or subBulletId belongs to this objective (would need more complex query in real app)
        return false;
      }).length;

      const progress =
        targetCount > 0 ? Math.round((currentCount / targetCount) * 100) : 0;

      objectiveProgress.push({
        objectiveId: objective.id,
        objectiveCode: objective.code,
        domainId: objective.domainId,
        domainName,
        objectiveName: objective.description,
        targetCount,
        currentCount,
        progress,
        isComplete: currentCount >= targetCount,
      });
    }

    const summary = await getTaskProgressSummary();

    return {
      ...summary,
      objectiveProgress,
      totalCurrent: task.completedTotal,
      totalTarget: task.targetTotal,
    };
  } catch (error) {
    console.error("Error getting task progress with objectives:", error);
    return null;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

async function _updateQuestionTask(
  currentUser: AuthContext,
  id: string,
  updates: Partial<CreateQuestionTaskData> & { status?: "active" | "completed" | "paused" }
): Promise<{
  success: boolean;
  data?: SerializedQuestionTask;
  error?: string;
}> {
  try {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.targetTotal !== undefined)
      updateData.targetTotal = updates.targetTotal;
    if (updates.objectives) updateData.objectives = updates.objectives;
    if (updates.status) updateData.status = updates.status;

    const task = await prisma.questionTask.update({
      where: { id },
      data: updateData,
      include: {
        certification: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const progress =
      task.targetTotal > 0
        ? Math.round((task.completedTotal / task.targetTotal) * 100)
        : 0;

    revalidatePath("/admin/questions");

    return {
      success: true,
      data: {
        id: task.id,
        name: task.name,
        certificationId: task.certificationId,
        certificationName: task.certification.name,
        certificationCode: task.certification.code,
        targetTotal: task.targetTotal,
        completedTotal: task.completedTotal,
        countExisting: task.countExisting,
        status: task.status,
        createdBy: task.createdBy,
        objectives: task.objectives as Record<string, number>,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        progress,
      },
    };
  } catch (error) {
    console.error("Error updating question task:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update question task",
    };
  }
}

export const updateQuestionTask = withPermission("questions.tasks.manage")(
  _updateQuestionTask
);

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

async function _deleteQuestionTask(
  currentUser: AuthContext,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.questionTask.delete({
      where: { id },
    });

    revalidatePath("/admin/questions");

    return { success: true };
  } catch (error) {
    console.error("Error deleting question task:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete question task",
    };
  }
}

export const deleteQuestionTask = withPermission("questions.tasks.delete")(
  _deleteQuestionTask
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getExistingQuestionCount(
  certificationId: string,
  objectives: Record<string, number>
): Promise<number> {
  try {
    // Get all objective IDs for the certification
    const certification = await prisma.certification.findUnique({
      where: { id: certificationId },
      include: {
        domains: {
          include: {
            objectives: true,
          },
        },
      },
    });

    if (!certification) return 0;

    // Build list of objective IDs from the objective codes
    const objectiveCodes = Object.keys(objectives);
    const objectiveIds: string[] = [];

    for (const domain of certification.domains) {
      for (const objective of domain.objectives) {
        if (objectiveCodes.includes(objective.code)) {
          objectiveIds.push(objective.id);
        }
      }
    }

    // Count questions for these objectives
    const count = await prisma.question.count({
      where: {
        objectiveId: {
          in: objectiveIds,
        },
      },
    });

    return count;
  } catch (error) {
    console.error("Error counting existing questions:", error);
    return 0;
  }
}
