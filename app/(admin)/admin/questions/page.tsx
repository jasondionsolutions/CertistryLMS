// app/(admin)/admin/questions/page.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE

"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
// import { useQuestionManagement } from "@/modules/admin/questions/hooks/useQuestionManagement"; // TODO: Add loadActiveTasksForDashboard method
import { useAdminQuestions } from "@/modules/admin/questions/hooks/useAdminQuestions";
import {
  type SerializedQuestionWithHierarchy
} from "@/modules/admin/questions/types";
import { listCertifications } from "@/modules/certifications/serverActions/certification.action";
// import { TaskWorkspace } from "@/modules/admin/questions/ui"; // TODO: Port TaskWorkspace
import { AdminAuthWrapper } from "@/modules/admin/shared/ui";
import { logger } from "@/lib/utils/secure-logger";
import { ErrorBoundary } from "@/modules/shared/ui/error-boundary";
import { AdminTableStandardized, type AdminTableColumn } from "@/modules/admin/shared/ui";
import { useAdminTableStandardized, type AdminTableConfig } from "@/modules/admin/shared/hooks";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QuestionFilterModal, type FilterState } from "@/modules/admin/questions/ui";
import {
  Eye,
  Pencil,
  Trash2,
  Filter,
  Plus,
  Target,
  Zap,
  Clock,
  TrendingUp,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  X,
  CheckSquare,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import { getQuestionsWithHierarchy } from "@/modules/admin/questions/serverActions";

// Use the serialized type
type QuestionWithHierarchyData = SerializedQuestionWithHierarchy;

interface ActiveTask {
  id: string;
  name: string;
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  createdAt: string;
}

interface Certification {
  id: string;
  name: string;
  code: string;
  domains?: Domain[];
}

interface Domain {
  id: string;
  name: string;
  objectives?: Objective[];
}

interface Objective {
  id: string;
  code: string;
  description: string;
}

function QuestionsDashboardPageContent() {
  const { deleteQuestion, bulkDeleteQuestions } = useAdminQuestions();
  const [questions, setQuestions] = useState<QuestionWithHierarchyData[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed'>('active');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; text: string } | null>(null);

  const router = useRouter();

  // Load all data with proper error handling
  useEffect(() => {
    async function loadData() {
      try {
        setDataLoading(true);

        // Load questions directly from server action
        const questionsData = await getQuestionsWithHierarchy();

        // Load certifications directly from server action
        const certificationsResult = await listCertifications();
        const certificationsData = certificationsResult.success && certificationsResult.data ? certificationsResult.data : [];

        // TODO: Load tasks using hook when loadActiveTasksForDashboard is available
        const tasksData: ActiveTask[] = [];

        // Validate data format
        if (!Array.isArray(questionsData)) {
          logger.error("Questions data is not an array", null, { component: 'AdminQuestions', action: 'validateData', dataType: typeof questionsData });
          setQuestions([]);
        } else {
          setQuestions(questionsData);
        }

        if (!Array.isArray(certificationsData)) {
          logger.error("Certifications data is not an array", null, { component: 'AdminQuestions', action: 'validateData', dataType: typeof certificationsData });
          setCertifications([]);
        } else {
          setCertifications(certificationsData);
        }

        if (!Array.isArray(tasksData)) {
          logger.error("Tasks data is not an array", null, {
            component: 'AdminQuestions',
            action: 'validateData',
            dataType: typeof tasksData
          });
          setActiveTasks([]);
        } else {
          setActiveTasks(tasksData);
        }

      } catch (error) {
        logger.error("Error loading questions data", error, { component: 'AdminQuestions', action: 'loadData' });
        toast.error("Failed to load questions data");
        setQuestions([]);
        setCertifications([]);
        setActiveTasks([]);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const customFilterFunction = useCallback((items: SerializedQuestionWithHierarchy[], searchTerm: string, filterState: FilterState) => {
    return items.filter((item) => {
      // Apply search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          (item.text || '').toLowerCase().includes(searchLower) ||
          (item.certificationName || '').toLowerCase().includes(searchLower) ||
          (item.domainName || '').toLowerCase().includes(searchLower) ||
          (item.objectiveName || '').toLowerCase().includes(searchLower) ||
          (item.objectiveCode || '').includes(searchTerm) ||
          (item.id || '').toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Apply objective filter
      if (filterState.objectiveId && filterState.domainId) {
        const questionObjectiveId = item.objectiveId || '';
        if (questionObjectiveId !== filterState.objectiveId) return false;
      }

      // Apply question type filter
      if (filterState.questionTypes.length > 0) {
        const questionType = item.type || '';
        const matchesTypeFilter = filterState.questionTypes.includes(questionType);

        if (filterState.questionTypeMode === 'include') {
          if (!matchesTypeFilter) return false;
        } else {
          if (matchesTypeFilter) return false;
        }
      }

      return true;
    });
  }, []);

  const onRefresh = useCallback(async (): Promise<SerializedQuestionWithHierarchy[]> => {
    try {
      const questionsData = await getQuestionsWithHierarchy();

      if (questionsData) {
        setQuestions(questionsData);
        // TODO: Load tasks when hook is available
        return questionsData;
      }

      return [];
    } catch (error) {
      logger.error("Error refreshing data", error, { component: 'AdminQuestions', action: 'refresh' });
      return [];
    }
  }, []);

  const tableConfig: AdminTableConfig<SerializedQuestionWithHierarchy, FilterState> = useMemo(() => ({
    getItemId: (item) => item.id,
    initialData: questions,
    initialFilters: {
      certificationIds: [],
      certificationMode: 'include',
      domainId: '',
      objectiveId: '',
      questionTypes: [],
      questionTypeMode: 'include',
      search: ''
    },
    initialItemsPerPage: 10,
    initialSortField: "createdAt",
    initialSortDirection: "desc",
    filterFunction: customFilterFunction,
    refreshFunction: onRefresh,
    persistSelection: false,
    resetPageOnFilter: true,
    cacheData: false,
    showErrorToasts: true,
  }), [questions, customFilterFunction, onRefresh]);

  const [tableState, tableActions] = useAdminTableStandardized(tableConfig);

  // SYNC: Update table data when external prop changes
  useEffect(() => {
    tableActions.setData(questions);
  }, [questions, tableActions]);

  // Use table filters as the single source of truth
  const currentFilters = tableState.filters;

  // Action handlers
  const handleView = useCallback((item: QuestionWithHierarchyData) => {
    router.push(`/admin/questions/${item.id}/view`);
  }, [router]);

  const handleEdit = useCallback((item: QuestionWithHierarchyData) => {
    router.push(`/admin/questions/${item.id}/edit`);
  }, [router]);

  const handleDelete = useCallback((item: QuestionWithHierarchyData) => {
    setQuestionToDelete({ id: item.id, text: item.text || 'Untitled Question' });
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!questionToDelete) return;

    try {
      const result = await deleteQuestion(questionToDelete.id);
      if (result.success) {
        toast.success("Question deleted successfully");
        setQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
        setDeleteModalOpen(false);
        setQuestionToDelete(null);
      } else {
        throw new Error(result.error || "Failed to delete question");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      logger.error("Error deleting question", error instanceof Error ? error : new Error(message));
    }
  }, [questionToDelete, deleteQuestion]);

  const handleBulkDelete = useCallback(async (selectedQuestions: SerializedQuestionWithHierarchy[]) => {
    const selectedIds = selectedQuestions.map(q => q.id);
    const result = await bulkDeleteQuestions(selectedIds);
    if (result.success) {
      toast.success(`Successfully deleted ${selectedIds.length} questions`);
      setQuestions(prev => prev.filter(q => !selectedIds.includes(q.id)));
    } else {
      toast.error(result.error || "Failed to delete questions");
    }
  }, [bulkDeleteQuestions]);

  const getQuestionTypeAbbreviation = useCallback((type: string) => {
    switch (type) {
      case 'multiple_choice': return 'MC';
      case 'multi_select': return 'MS';
      case 'ordering': return 'ORD';
      case 'categorization': return 'CAT';
      default: return type?.toUpperCase() || 'UNK';
    }
  }, []);

  // Task filtering and counts
  const activeTasksCount = activeTasks.filter(task => task.progress < 100).length;
  const completedTasksCount = activeTasks.filter(task => task.progress >= 100).length;

  const filteredTasks = activeTasks.filter(task => {
    if (taskFilter === 'active') return task.progress < 100;
    return task.progress >= 100;
  });

  // Active filters check
  const hasActiveFilters = !!(currentFilters.certificationIds.length > 0 || currentFilters.domainId || currentFilters.objectiveId || currentFilters.questionTypes.length > 0 || currentFilters.search.trim());

  const activeFilterCount = (
    (currentFilters.certificationIds.length > 0 ? 1 : 0) +
    (currentFilters.domainId ? 1 : 0) +
    (currentFilters.objectiveId ? 1 : 0) +
    (currentFilters.questionTypes.length > 0 ? 1 : 0) +
    (currentFilters.search ? 1 : 0)
  );

  // Table columns
  const columns: AdminTableColumn<SerializedQuestionWithHierarchy>[] = useMemo(() => [
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "120px",
      render: (item: QuestionWithHierarchyData) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleView(item);
            }}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            aria-label={`View ${item.text}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
            aria-label={`Edit ${item.text}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            aria-label={`Delete ${item.text}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      key: "question",
      header: "Question",
      render: (item: QuestionWithHierarchyData) => (
        <div className="max-w-[400px] cursor-default">
          <div className="truncate font-medium text-gray-900 dark:text-gray-100">
            {item.text || 'No text'}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {item.domainName && `${item.domainName} • `}{item.objectiveName || 'No objective'}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "80px",
      align: "center",
      render: (item: QuestionWithHierarchyData) => (
        <Badge variant="secondary" className="font-normal cursor-default">
          {getQuestionTypeAbbreviation(item.type)}
        </Badge>
      ),
    },
    {
      key: "certification",
      header: "Certification",
      width: "200px",
      render: (item: QuestionWithHierarchyData) => (
        <div className="cursor-default">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {item.certificationName || "Unknown"}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.certificationCode || ''}
          </div>
        </div>
      ),
    },
    {
      key: "objective",
      header: "Objective",
      width: "120px",
      render: (item: QuestionWithHierarchyData) => (
        <div className="cursor-default">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {item.objectiveCode || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.domainName || 'N/A'}
          </div>
        </div>
      ),
    },
  ], [getQuestionTypeAbbreviation, handleView, handleEdit, handleDelete]);

  const bulkActions = useMemo(() => [
    {
      key: 'select-all',
      label: 'Select All',
      icon: <CheckSquare className="h-4 w-4" />,
      variant: 'outline' as const,
      action: () => tableActions.handleSelectAll(),
      disabled: tableState.selectedItems.length === questions.length && questions.length > 0,
    },
    {
      key: 'unselect-all',
      label: 'Unselect All',
      icon: <X className="h-4 w-4" />,
      variant: 'outline' as const,
      action: () => tableActions.clearSelection(),
      disabled: tableState.selectedItems.length === 0,
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      action: handleBulkDelete,
      disabled: tableState.selectedItems.length === 0,
    }
  ], [handleBulkDelete, tableActions, tableState.selectedItems.length, questions.length]);

  const mobileCardRender = useCallback((question: SerializedQuestionWithHierarchy) => {
    return (
      <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {question.text || 'No text'}
            </h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <Badge variant="secondary" className="font-normal">
                {getQuestionTypeAbbreviation(question.type)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleView(question);
              }}
              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(question);
              }}
              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(question);
              }}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Certification:</span>
            <div className="font-medium">{question.certificationName || 'Unknown'}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Objective:</span>
            <div className="font-medium">{question.objectiveCode || 'N/A'}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
          ID: {question.id}
        </div>
      </div>
    );
  }, [getQuestionTypeAbbreviation, handleView, handleEdit, handleDelete]);

  // Empty state
  const emptyState = useMemo(() => (
    <div className="text-center">
      <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No questions found</h3>
      <p className="text-muted-foreground">
        {hasActiveFilters
          ? "No questions match your search criteria."
          : "Get started by creating your first question."}
      </p>
    </div>
  ), [hasActiveFilters]);

  // Calculate statistics with safe fallbacks
  const stats = useMemo(() => ({
    totalQuestions: questions.length,
    totalCertifications: new Set(questions.map(q => q.certificationName).filter(Boolean)).size,
    activeTasks: activeTasks.length,
    completedTasks: activeTasks.filter(t => t.progress >= 100).length,
    multipleChoice: questions.filter(q => q.type === 'multiple_choice').length,
    multiSelect: questions.filter(q => q.type === 'multi_select').length,
    ordering: questions.filter(q => q.type === 'ordering').length
  }), [questions, activeTasks]);

  const openTaskWorkspace = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const closeTaskWorkspace = async () => {
    setSelectedTaskId(null);
    try {
      const questionsData = await getQuestionsWithHierarchy();

      if (Array.isArray(questionsData)) {
        setQuestions(questionsData);
      }
      // TODO: Load tasks when hook is available
    } catch (error) {
      logger.error("Error refreshing data", error, { component: 'AdminQuestions', action: 'refreshData' });
    }
  };

  // Apply filters callback for QuestionFilterModal
  const handleApplyFilters = useCallback((filters: FilterState) => {
    tableActions.setFilters(filters);
    setFilterModalOpen(false);
  }, [tableActions]);

  // Clear filters callback for QuestionFilterModal
  const handleClearFilters = useCallback(() => {
    tableActions.setFilters({
      certificationIds: [],
      certificationMode: 'include',
      domainId: '',
      objectiveId: '',
      questionTypes: [],
      questionTypeMode: 'include',
      search: ''
    });
    setFilterModalOpen(false);
  }, [tableActions]);

  // If task workspace is open, show it instead of main dashboard
  // TODO: Uncomment when TaskWorkspace is ported
  // if (selectedTaskId) {
  //   return (
  //     <TaskWorkspace
  //       taskId={selectedTaskId}
  //       onBack={closeTaskWorkspace}
  //     />
  //   );
  // }

  return (
    <ErrorBoundary level="page">
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin")}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Return to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <HelpCircle className="w-8 h-8 mr-3 text-indigo-600" />
                Question Bank
                {dataLoading && (
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin ml-3" />
                )}
              </h1>
              <p className="text-muted-foreground mt-2 text-xl">
                Manage questions systematically with task-based creation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/questions/create-task">
                <Button className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Create Question Task
                </Button>
              </Link>
              <Link href="/admin/questions/new/edit">
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Single Question
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Tasks Section */}
        {activeTasks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Question Tasks
                <span className="text-sm text-muted-foreground font-normal">
                  (
                  <button
                    onClick={() => setTaskFilter('active')}
                    className={`hover:text-primary transition-colors ${taskFilter === 'active' ? 'text-primary font-medium' : ''}`}
                  >
                    {activeTasksCount} Active
                  </button>
                  {', '}
                  <button
                    onClick={() => setTaskFilter('completed')}
                    className={`hover:text-primary transition-colors ${taskFilter === 'completed' ? 'text-primary font-medium' : ''}`}
                  >
                    {completedTasksCount} Completed
                  </button>
                  )
                </span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowAllTasks(!showAllTasks)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showAllTasks ? 'Hide All Tasks' : 'Show All Tasks'}
              </Button>
            </div>

            {showAllTasks && (
              <>
                <div className="relative">
                  {filteredTasks.length > 0 ? (
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-6 min-w-max">
                        {filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className="group bg-white dark:bg-slate-800 rounded-lg border p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer w-80 flex-shrink-0"
                            onClick={() => openTaskWorkspace(task.id)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                  {task.name}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {task.completedQuestions}/{task.totalQuestions}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-shrink-0 ml-3">
                                {task.progress >= 100 ? (
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : task.progress > 0 ? (
                                  <PlayCircle className="w-6 h-6 text-blue-500" />
                                ) : (
                                  <AlertCircle className="w-6 h-6 text-orange-500" />
                                )}
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">Progress</span>
                                <Progress value={task.progress} className="h-2 flex-1" />
                                <span className="text-sm font-medium">{task.progress}%</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                                {task.progress >= 100 ? 'Review' : 'Continue'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No {taskFilter} tasks found
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* No Active Tasks State */}
        {activeTasks.length === 0 && !dataLoading && (
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Your First Question Task</h3>
              <p className="text-muted-foreground mb-6">
                Create systematic question sets with progress tracking and team collaboration.
              </p>
              <Link href="/admin/questions/create-task">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Your First Task
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Statistics Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Total Questions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalCertifications}</div>
            <div className="text-xs text-muted-foreground">Certifications</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.activeTasks}</div>
            <div className="text-xs text-muted-foreground">Active Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.multipleChoice}</div>
            <div className="text-xs text-muted-foreground">Multiple Choice</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-pink-600">{stats.multiSelect}</div>
            <div className="text-xs text-muted-foreground">Multi-Select</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.ordering}</div>
            <div className="text-xs text-muted-foreground">Ordering</div>
          </div>
        </section>

        {/* Questions Table Section */}
        <section className="space-y-6">
          <AdminTableStandardized
            state={{ ...tableState, loading: dataLoading }}
            actions={tableActions}
            columns={columns}
            getItemId={(item) => item.id}
            emptyState={emptyState}
            enableSearch={true}
            enableSelection={true}
            enableBulkActions={true}
            enablePagination={true}
            enableRefresh={true}
            enableResponsive={true}
            mobileCardRender={mobileCardRender}
            pageSizeOptions={[5, 10, 25, 50, -1]}
            showPageSizeSelector={true}
            showPaginationInfo={true}
            bulkActions={bulkActions}
            onRowClick={handleView}
            ariaLabel="Questions data table"
            ariaDescription="Table containing all questions with options to view, edit, and delete"
            filterComponents={
              <Button
                variant="outline"
                onClick={() => setFilterModalOpen(true)}
                className={hasActiveFilters ? "border-primary text-primary" : ""}
                disabled={dataLoading}
                data-testid="filters-button"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
          />
        </section>

        {/* Question Filter Modal */}
        <QuestionFilterModal
          open={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          currentFilters={currentFilters}
          certifications={certifications}
          loading={dataLoading}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 p-6 shadow-lg border rounded-lg">
            <DialogHeader>
              <DialogTitle>Delete Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{questionToDelete?.text}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setQuestionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={confirmDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </ErrorBoundary>
  );
}

export default function QuestionsDashboardPage() {
  return (
    <AdminAuthWrapper>
      <QuestionsDashboardPageContent />
    </AdminAuthWrapper>
  );
}
