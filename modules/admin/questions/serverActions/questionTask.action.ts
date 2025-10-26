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

export async function getActiveTasksForDashboard(): Promise<{
  success: boolean;
  data?: {
    tasks: SerializedQuestionTask[];
    summary: TaskProgressSummary;
  };
  error?: string;
}> {
  try {
    // Get all question tasks with active or paused status
    const tasks = await prisma.questionTask.findMany({
      where: {
        status: {
          in: ["active", "paused"],
        },
      },
      include: {
        certification: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // active first
        { createdAt: "desc" },
      ],
    });

    // Get overall statistics
    const [totalTasks, activeTasks, completedTasks] = await Promise.all([
      prisma.questionTask.count(),
      prisma.questionTask.count({ where: { status: "active" } }),
      prisma.questionTask.count({ where: { status: "completed" } }),
    ]);

    // Serialize tasks with progress calculation
    const serializedTasks: SerializedQuestionTask[] = tasks.map((task) => {
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

    // Calculate summary statistics
    const totalTargetQuestions = serializedTasks.reduce(
      (sum, task) => sum + task.targetTotal,
      0
    );
    const totalCompletedQuestions = serializedTasks.reduce(
      (sum, task) => sum + task.completedTotal,
      0
    );
    const overallProgress =
      totalTargetQuestions > 0
        ? Math.round((totalCompletedQuestions / totalTargetQuestions) * 100)
        : 0;

    const summary: TaskProgressSummary = {
      totalTasks,
      activeTasks,
      completedTasks,
      totalTargetQuestions,
      totalCompletedQuestions,
      overallProgress,
    };

    return {
      success: true,
      data: {
        tasks: serializedTasks,
        summary,
      },
    };
  } catch (error) {
    console.error("Error fetching active tasks for dashboard:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch active tasks",
    };
  }
}

export async function calculateQuestionDistribution(
  certificationId: string
): Promise<{
  success: boolean;
  data?: {
    totalQuestions: number;
    domainDistribution: Record<string, { existing: number; target: number; needed: number }>;
    objectiveDistribution: Record<string, { existing: number; target: number; needed: number; domainNumber: string }>;
  };
  error?: string;
}> {
  try {
    // Get certification with domains and objectives
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

    if (!certification) {
      return {
        success: false,
        error: "Certification not found",
      };
    }

    // Count total questions for this certification
    const totalQuestions = await prisma.question.count({
      where: {
        OR: [
          {
            objective: {
              domain: {
                certificationId,
              },
            },
          },
          {
            bullet: {
              objective: {
                domain: {
                  certificationId,
                },
              },
            },
          },
          {
            subBullet: {
              bullet: {
                objective: {
                  domain: {
                    certificationId,
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Build distribution maps
    const domainDistribution: Record<
      string,
      { existing: number; target: number; needed: number }
    > = {};
    const objectiveDistribution: Record<
      string,
      { existing: number; target: number; needed: number; domainNumber: string }
    > = {};

    // Initialize with certification domains structure
    for (const domain of certification.domains) {
      const domainKey = domain.name; // Use domain name as key

      domainDistribution[domainKey] = {
        existing: 0,
        target: 0, // Could add targetQuestions field to Domain model if needed
        needed: 0,
      };

      // Initialize objectives within domain
      for (const objective of domain.objectives) {
        objectiveDistribution[objective.code] = {
          existing: 0,
          target: 0, // Could add targetQuestions field to Objective model if needed
          needed: 0,
          domainNumber: domainKey,
        };
      }
    }

    // Get existing question counts per objective
    const questionCounts = await prisma.question.groupBy({
      by: ["objectiveId"],
      where: {
        objectiveId: {
          not: null,
        },
        objective: {
          domain: {
            certificationId,
          },
        },
      },
      _count: {
        _all: true,
      },
    });

    // Update distribution with actual counts
    for (const { objectiveId, _count } of questionCounts) {
      if (!objectiveId) continue;

      const count = _count._all;

      // Find the objective to get its code and domain
      const objective = certification.domains
        .flatMap((d) => d.objectives)
        .find((obj) => obj.id === objectiveId);

      if (objective) {
        const domain = certification.domains.find(
          (d) => d.id === objective.domainId
        );

        if (domain) {
          const domainKey = domain.name; // Use domain name as key

          // Update objective distribution
          if (objectiveDistribution[objective.code]) {
            objectiveDistribution[objective.code].existing = count;
            objectiveDistribution[objective.code].needed = Math.max(
              0,
              objectiveDistribution[objective.code].target - count
            );
          }

          // Update domain distribution
          if (domainDistribution[domainKey]) {
            domainDistribution[domainKey].existing += count;
            domainDistribution[domainKey].needed = Math.max(
              0,
              domainDistribution[domainKey].target -
                domainDistribution[domainKey].existing
            );
          }
        }
      }
    }

    return {
      success: true,
      data: {
        totalQuestions,
        domainDistribution,
        objectiveDistribution,
      },
    };
  } catch (error) {
    console.error("Error calculating question distribution:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate distribution",
    };
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
