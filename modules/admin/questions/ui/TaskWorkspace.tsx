// components/admin/TaskWorkspace.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  Circle,
  Target,
  Brain,
  Plus,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Square,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { useQuestionManagement } from '@/modules/admin/questions/hooks';
import type { SerializedQuestionTask, TaskProgressWithObjectives, QuestionData } from '@/modules/admin/questions/types';
import { toast } from 'sonner';
import AIGenerationModal, { type GeneratedQuestionData } from '@/modules/admin/questions/ui/AIGenerationModal';
import AIFeedbackModal from '@/modules/admin/questions/ui/AIFeedbackModal';

interface TaskWorkspaceProps {
  taskId: string;
  onBack: () => void;
}

interface ObjectiveProgress {
  domainNumber: string;
  objectiveNumber: string;
  domainName: string;
  objectiveName: string;
  targetCount: number;
  currentCount: number;
  progress: number;
  isComplete: boolean;
}

interface SelectedObjective {
  domainNumber: string;
  objectiveNumber: string;
  domainName: string;
  objectiveName: string;
  targetCount: number;
  progress: ObjectiveProgress;
}

interface QuestionOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuestionForm {
  text: string;
  type: "multiple_choice" | "multi_select" | "ordering" | "categorization";
  options: QuestionOption[];
  explanation: string;
}

const EMPTY_OPTION: QuestionOption = {
  text: "",
  isCorrect: false,
  explanation: "",
};

const getDefaultOptions = (type: string): QuestionOption[] => {
  switch (type) {
    case "multiple_choice":
      return Array(4).fill(null).map(() => ({ ...EMPTY_OPTION }));
    case "multi_select":
      return Array(6).fill(null).map(() => ({ ...EMPTY_OPTION }));
    case "ordering":
      return Array(4).fill(null).map(() => ({ ...EMPTY_OPTION }));
    default:
      return [{ ...EMPTY_OPTION }];
  }
};

export default function TaskWorkspace({ taskId, onBack }: TaskWorkspaceProps) {
  const [task, setTask] = useState<SerializedQuestionTask | null>(null);
  const [progress, setProgress] = useState<TaskProgressWithObjectives | null>(null);
  const [showEndTaskModal, setShowEndTaskModal] = useState(false);
  const [endingTask, setEndingTask] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIFeedbackModal, setShowAIFeedbackModal] = useState(false);
  const [hasAIGeneratedContent, setHasAIGeneratedContent] = useState(false);
  const [hideCompletedObjectives, setHideCompletedObjectives] = useState(false);

  // Use hooks
  const { loading, saving, loadTaskById, loadTaskProgress, updateTaskStatus, saveQuestion } = useQuestionManagement();

  // Current selection
  const [selectedObjective, setSelectedObjective] = useState<SelectedObjective | null>(null);

  // Question form
  const [question, setQuestion] = useState<QuestionForm>({
    text: "",
    type: "multiple_choice",
    options: getDefaultOptions("multiple_choice"),
    explanation: "",
  });

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  useEffect(() => {
    // Auto-refresh progress every 10 seconds
    const interval = setInterval(() => {
      loadProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      const [taskData, progressData] = await Promise.all([
        loadTaskById(taskId),
        loadTaskProgress(taskId)
      ]);

      if (!taskData.success || !taskData.data) {
        return;
      }

      if (!progressData.success || !progressData.data) {
        toast.error('Failed to load task progress');
        return;
      }

      setTask(taskData.data);
      setProgress(progressData.data);

      // Auto-select first incomplete objective
      const incompleteObjective = (progressData.data as any).objectiveProgress?.find((obj: any) => !obj.isComplete);
      if (incompleteObjective) {
        selectObjective(incompleteObjective);
      }
    } catch (error) {
      toast.error('Failed to load task data');
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await loadTaskProgress(taskId);
      if (progressData.success && progressData.data) {
        setProgress(progressData.data);
      }
    } catch (error) {
      // Progress loading failed silently
    }
  };

  const selectObjective = (objectiveProgress: ObjectiveProgress) => {
    if (!task) return;

    // task.objectives is a Record<string, number>, not an array
    const objectiveKey = objectiveProgress.objectiveNumber;
    let targetCount = (task as any).objectives[objectiveKey];

    // If direct match fails, use the target count from the progress data
    if (targetCount === undefined) {
      targetCount = objectiveProgress.targetCount;
    }

    // Always set the selected objective
    const selectedObj = {
      domainNumber: objectiveProgress.domainNumber,
      objectiveNumber: objectiveProgress.objectiveNumber,
      domainName: objectiveProgress.domainName,
      objectiveName: objectiveProgress.objectiveName,
      targetCount: targetCount || objectiveProgress.targetCount || 1,
      progress: objectiveProgress
    };

    setSelectedObjective(selectedObj);

    // Reset question form
    setQuestion({
      text: "",
      type: "multiple_choice",
      options: getDefaultOptions("multiple_choice"),
      explanation: "",
    });

    // Reset AI-generated state
    setHasAIGeneratedContent(false);
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...question.options];
    if (field === "isCorrect" && value === true && question.type === "multiple_choice") {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      (newOptions[index] as any)[field] = value;
    }
    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleSaveQuestion = async () => {
    if (!selectedObjective || !task) return;

    const questionData: QuestionData = {
      certificationId: (task as any).certificationId,
      text: question.text,
      type: question.type as "multiple_choice" | "multi_select" | "ordering" | "categorization",
      difficulty: "medium", // Default difficulty
      choices: question.options,
      correctAnswer: question.options.filter(o => o.isCorrect).map((_, i) => String.fromCharCode(65 + i)).join(','),
      explanation: question.options.map(o => o.explanation || '').filter(Boolean).join(' '),
      objectiveId: selectedObjective.objectiveName, // This would need to be resolved from the hierarchy
      taskId: taskId
    };

    const success = await saveQuestion(questionData);

    if (success) {
      // Reset form
      setQuestion({
        text: "",
        type: question.type,
        options: getDefaultOptions(question.type),
        explanation: "",
      });

      // Reset AI-generated state
      setHasAIGeneratedContent(false);

      // Reload progress
      await loadProgress();
    }
  };

  const handleUpdateTaskStatus = async (newStatus: "active" | "completed" | "paused") => {
    if (!task) return;

    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleEndTask = async () => {
    if (!task) return;

    setEndingTask(true);
    try {
      const success = await updateTaskStatus(taskId, 'completed');
      if (success) {
        toast.success('Task completed successfully! All questions remain in the database.');
        setShowEndTaskModal(false);
        onBack();
      }
    } catch (error) {
      toast.error('Failed to end task');
    } finally {
      setEndingTask(false);
    }
  };

  const handleAIGenerate = (generatedData: GeneratedQuestionData) => {
    const transformedOptions: QuestionOption[] = generatedData.options.map(option => ({
      text: option.text,
      isCorrect: option.isCorrect,
      explanation: option.explanation
    }));

    setQuestion(prev => ({
      ...prev,
      text: generatedData.text,
      options: transformedOptions,
      explanation: ""
    }));

    setHasAIGeneratedContent(true);
    toast.success("Question generated successfully! Review and edit as needed.");
  };

  const handleAIFeedback = (generatedData: GeneratedQuestionData) => {
    const transformedOptions: QuestionOption[] = generatedData.options.map(option => ({
      text: option.text,
      isCorrect: option.isCorrect,
      explanation: option.explanation
    }));

    setQuestion(prev => ({
      ...prev,
      text: generatedData.text,
      options: transformedOptions,
      explanation: ""
    }));

    toast.success("Question updated based on your feedback!");
  };

  const handleAIFeedbackFromModal = (data: { text: string; options: QuestionOption[] }) => {
    const generatedData: GeneratedQuestionData = {
      text: data.text,
      options: data.options.map(option => ({
        text: option.text,
        isCorrect: option.isCorrect,
        explanation: option.explanation || ""
      }))
    };
    handleAIFeedback(generatedData);
  };

  const getObjectiveStatusIcon = (objectiveProgress: ObjectiveProgress) => {
    if (objectiveProgress.isComplete) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (objectiveProgress.currentCount > 0) {
      return <Circle className="w-4 h-4 text-orange-500 fill-orange-100" />;
    } else {
      return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatObjectiveNumber = (objectiveNumber: string, domainNumber: string, allObjectives: any[]) => {
    const parts = objectiveNumber.split('.');
    if (parts.length >= 2) {
      const objectivesInSameDomain = allObjectives
        .filter(obj => obj.domainNumber === domainNumber)
        .sort((a, b) => a.objectiveNumber.localeCompare(b.objectiveNumber));

      const sequentialIndex = objectivesInSameDomain.findIndex(obj => obj.objectiveNumber === objectiveNumber) + 1;
      return `${parseInt(domainNumber).toString()}.${sequentialIndex}`;
    }
    return objectiveNumber;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading task...</span>
        </div>
      </div>
    );
  }

  if (!task || !progress || !(progress as any)?.objectiveProgress) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-muted-foreground">
            {!task ? "Task not found" :
             !progress ? "Failed to load progress" :
             "Invalid task structure"}
          </div>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const objectiveProgress = (progress as any)?.objectiveProgress || [];
  const filteredObjectives = hideCompletedObjectives
    ? objectiveProgress.filter((obj: any) => !obj.isComplete)
    : objectiveProgress;

  const letters = ["a", "b", "c", "d", "e", "f"];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{(task as any).name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Task Progress</span>
                <span>{(progress as any).totalCurrent}/{(progress as any).totalTarget} questions</span>
                <span>{(progress as any).overallProgress}% complete</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideCompletedObjectives(!hideCompletedObjectives)}
              className={hideCompletedObjectives ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {hideCompletedObjectives ? "Show All" : "Hide Completed"}
            </Button>
            {(task as any).status === 'active' ? (
              <Button variant="outline" size="sm" onClick={() => handleUpdateTaskStatus('paused')}>
                <Pause className="w-4 h-4 mr-2" />
                Pause Task
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleUpdateTaskStatus('active')}>
                <Play className="w-4 h-4 mr-2" />
                Resume Task
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndTaskModal(true)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <Square className="w-4 h-4 mr-2" />
              End Task
            </Button>
            <Button variant="outline" size="sm" onClick={loadProgress}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{(progress as any).overallProgress}%</span>
          </div>
          <Progress value={(progress as any).overallProgress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Progress Tracker */}
        <div className="w-80 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Progress Tracker
              {hideCompletedObjectives && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {filteredObjectives.length} of {objectiveProgress.length}
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {filteredObjectives.map((objProgress: any, index: number) => {
                const isSelected = selectedObjective &&
                  selectedObjective.domainNumber === objProgress.domainNumber &&
                  selectedObjective.objectiveNumber === objProgress.objectiveNumber;

                const formattedObjectiveNumber = formatObjectiveNumber(
                  objProgress.objectiveNumber,
                  objProgress.domainNumber,
                  objectiveProgress
                );

                return (
                  <button
                    key={`obj-${objProgress.domainNumber}-${objProgress.objectiveNumber}-${index}`}
                    onClick={() => selectObjective(objProgress)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getObjectiveStatusIcon(objProgress)}
                        <span className="font-medium text-sm">
                          Objective {formattedObjectiveNumber}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {objProgress.currentCount}/{objProgress.targetCount}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {objProgress.objectiveName || objProgress.name || 'No description'}
                    </div>

                    <div className="flex items-center justify-between">
                      <Progress value={objProgress.progress} className="h-1 flex-1 mr-2" />
                      <span className="text-xs font-medium">
                        {objProgress.progress}%
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredObjectives.length === 0 && hideCompletedObjectives && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All objectives completed!</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHideCompletedObjectives(false)}
                    className="mt-2"
                  >
                    Show completed objectives
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Question Form */}
        <div className="flex-1 overflow-y-auto">
          {selectedObjective ? (
            <div className="p-6 max-w-4xl mx-auto">
              {/* Objective Context */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">
                    {selectedObjective.domainName} • Objective {formatObjectiveNumber(selectedObjective.objectiveNumber, selectedObjective.domainNumber, filteredObjectives)}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {selectedObjective.progress.currentCount}/{selectedObjective.progress.targetCount} completed
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedObjective.objectiveName && !selectedObjective.objectiveName.startsWith('Objective ')
                    ? selectedObjective.objectiveName
                    : 'Loading objective description...'}
                </p>
                <Progress value={selectedObjective.progress.progress} className="h-2 mt-2" />
              </div>

              {/* Question Type Selection */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-6">
                  {[
                    { value: "multiple_choice" as const, label: "Multiple Choice" },
                    { value: "multi_select" as const, label: "Multi-Select" },
                    { value: "ordering" as const, label: "Ordering" }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="questionType"
                        value={type.value}
                        checked={question.type === type.value}
                        onChange={(e) => {
                          const newType = e.target.value as "multiple_choice" | "multi_select" | "ordering" | "categorization";
                          setQuestion(prev => ({
                            ...prev,
                            type: newType,
                            options: getDefaultOptions(newType)
                          }));
                        }}
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  {/* AI Feedback Button */}
                  {hasAIGeneratedContent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIFeedbackModal(true)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      AI Feedback
                    </Button>
                  )}

                  {/* AI Generate Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Question Text</label>
                <textarea
                  value={question.text}
                  onChange={(e) => setQuestion(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter your question..."
                  className="w-full border rounded-md p-3 min-h-24 resize-none"
                  rows={3}
                />
              </div>

              {/* Answer Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Answer Options</label>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 transition-all ${
                        option.isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (question.type === "multiple_choice") {
                              handleOptionChange(index, "isCorrect", !option.isCorrect);
                            } else {
                              handleOptionChange(index, "isCorrect", !option.isCorrect);
                            }
                          }}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                            option.isCorrect
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-border text-muted-foreground hover:border-green-500"
                          }`}
                        >
                          {letters[index]}
                        </button>

                        <div className="flex-1">
                          <Input
                            value={option.text}
                            onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                            placeholder={`${letters[index].toUpperCase()}) Option text...`}
                            className="mb-2"
                          />

                          {(question.type === "multiple_choice" || question.type === "multi_select") && (
                            <textarea
                              value={option.explanation || ""}
                              onChange={(e) => handleOptionChange(index, "explanation", e.target.value)}
                              placeholder="Explanation (optional)..."
                              className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                              rows={2}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Explanation Preview */}
              {(() => {
                const correctOptions = question.options.filter(opt => opt.isCorrect);
                const incorrectOptions = question.options.filter(opt => !opt.isCorrect);

                const explanations = [
                  ...correctOptions.map(opt => opt.explanation).filter(Boolean),
                  ...incorrectOptions.map(opt => opt.explanation).filter(Boolean)
                ];

                const combinedExplanation = explanations.join(' ');

                return combinedExplanation ? (
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      EXPLANATION
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">{combinedExplanation}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex items-center gap-4">
                  {/* Space reserved for future features */}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuestion({
                        text: "",
                        type: question.type,
                        options: getDefaultOptions(question.type),
                        explanation: "",
                      });
                      setHasAIGeneratedContent(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSaveQuestion}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Question
                        <Plus className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Objective</h3>
                <p className="text-muted-foreground">
                  Choose an objective from the progress tracker to start creating questions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      <AIGenerationModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        examName={(task as any).name}
        domainNumber={selectedObjective?.domainNumber}
        domainName={selectedObjective?.domainName}
        objectiveNumber={selectedObjective?.objectiveNumber}
        objectiveName={selectedObjective?.objectiveName}
        questionType={question.type}
      />

      {/* AI Feedback Modal */}
      <AIFeedbackModal
        open={showAIFeedbackModal}
        onClose={() => setShowAIFeedbackModal(false)}
        onFeedbackApplied={handleAIFeedbackFromModal}
        currentQuestion={question}
        examName={(task as any).name}
        domainNumber={selectedObjective?.domainNumber}
        domainName={selectedObjective?.domainName}
        objectiveNumber={selectedObjective?.objectiveNumber}
        objectiveName={selectedObjective?.objectiveName}
      />

      {/* End Task Confirmation Modal */}
      <Dialog open={showEndTaskModal} onOpenChange={setShowEndTaskModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              End Task Confirmation
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to end this task?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">
                  ℹ️
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    What happens when you end the task:
                  </p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• All created questions will remain in the database</li>
                    <li>• The task will be marked as completed</li>
                    <li>• You can view the questions in the Question Bank</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndTaskModal(false)}
              disabled={endingTask}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndTask}
              disabled={endingTask}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {endingTask ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Ending Task...
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Yes, End Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
