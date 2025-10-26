// components/admin/AIGenerationModal.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Brain, Loader2, RotateCcw, User, Target } from "lucide-react";
import { toast } from "sonner";
import { useAIGeneration } from "@/modules/admin/questions/hooks";
import { useRandomName } from "@/modules/shared/names/hooks/useNames";

interface AIGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (generatedData: GeneratedQuestionData) => void;
  examName?: string;
  domainNumber?: string;
  domainName?: string;
  objectiveNumber?: string;
  objectiveName?: string;
  questionType:
    | "multiple_choice"
    | "multi_select"
    | "ordering"
    | "categorization";
}

export interface GeneratedQuestionData {
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export default function AIGenerationModal({
  open,
  onClose,
  onGenerate,
  examName = "",
  domainNumber = "",
  domainName = "",
  objectiveNumber = "",
  objectiveName = "",
  questionType,
}: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [keepPrompt, setKeepPrompt] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [focus, setFocus] = useState("");

  const { generating, generateAIQuestion } = useAIGeneration();
  const { data: randomNameData, refetch: getNewRandomName, isLoading: loadingName } = useRandomName();

  // Generate the default prompt based on your specifications
  const generateDefaultPrompt = () => {
    const questionTypeText =
      questionType === "multiple_choice"
        ? "multiple-choice"
        : questionType === "multi_select"
          ? "multiple-select"
          : questionType;

    const cleanExamName = examName
      ? examName.replace(/\s*-\s*\d+\s*Questions?/i, "").trim()
      : "certification exam";

    return `Create a ${questionTypeText} question for the ${cleanExamName}, Domain ${domainNumber || "X"} and Objective ${objectiveNumber || "X.X"} (${objectiveName || "the specified objective"}). The question should be written so that the right answer (if a term or service) is not included in the question itself. The question should be written at Blooms Level 2. A good question should be 1-3 sentences in length.

I expect the format to look like this:

<Question being asked>

a) <Option A>

Explanation of why option A is right or wrong.

b) <Option B>

Explanation of why option B is right or wrong.

c) <Option C>

Explanation of why option C is right or wrong.

d) <Option D>

Explanation of why option D is right or wrong.

Answer: <Capital letter of correct option>

Here is a sample format that can be used when asking about a specific command, technology, or service:

<name>, a <position> at Certistry, wants <describe the situation or objective they are dealing with>. Which of the following commands should be used to accomplish this?`;
  };

  // Load saved prompt from localStorage when modal opens
  useEffect(() => {
    if (open) {
      const savedPrompt = localStorage.getItem("ai-generation-prompt");
      const shouldKeep =
        localStorage.getItem("ai-generation-keep-prompt") === "true";

      if (shouldKeep && savedPrompt) {
        setPrompt(savedPrompt);
        setKeepPrompt(true);
      } else {
        // Set default prompt based on context
        const defaultPrompt = generateDefaultPrompt();
        setPrompt(defaultPrompt);
        setKeepPrompt(false);
      }
    }
  }, [
    open,
    examName,
    domainNumber,
    domainName,
    objectiveNumber,
    objectiveName,
    questionType,
  ]);

  const handleGenerate = async () => {
    try {
      // Save prompt preferences
      if (keepPrompt) {
        localStorage.setItem("ai-generation-prompt", prompt);
        localStorage.setItem("ai-generation-keep-prompt", "true");
      } else {
        localStorage.removeItem("ai-generation-prompt");
        localStorage.removeItem("ai-generation-keep-prompt");
      }

      // Build enhanced prompt with name and focus
      let enhancedPrompt = prompt;

      if (selectedName.trim()) {
        enhancedPrompt += `\n\nThe name to use in the question scenario is: ${selectedName.trim()}`;
      }

      if (focus.trim()) {
        enhancedPrompt += `\n\nThe focus of this question should be on: ${focus.trim()}`;
      }

      // Use the hook to generate the question
      const generatedData = await generateAIQuestion({
        prompt: enhancedPrompt,
        questionType,
        examName,
        domainNumber,
        domainName,
        objectiveNumber,
        objectiveName,
      });

      if (generatedData.success && generatedData.data) {
        onGenerate(generatedData.data);
        onClose();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDefaultPrompt = () => {
    const defaultPrompt = generateDefaultPrompt();
    setPrompt(defaultPrompt);
    setKeepPrompt(false);
    // Clear saved prompt when user clicks default
    localStorage.removeItem("ai-generation-prompt");
    localStorage.removeItem("ai-generation-keep-prompt");
  };

  // Generate a new random name when modal opens
  useEffect(() => {
    if (open) {
      getNewRandomName();
    }
  }, [open, getNewRandomName]);

  // Update selectedName when random name data arrives
  useEffect(() => {
    if (randomNameData?.success && randomNameData.data) {
      const nameData = Array.isArray(randomNameData.data)
        ? randomNameData.data[0]
        : randomNameData.data;
      setSelectedName(nameData.name);
    }
  }, [randomNameData]);

  const handleGetNewName = () => {
    getNewRandomName();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="overflow-y-auto"
        style={{
          width: '90vw',
          height: '85vh',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Question Generation
          </DialogTitle>
          <DialogDescription>
            Generate questions using AI with custom names and focused prompts for better question quality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Context Display */}
          <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-purple-800 dark:from-purple-950/30 dark:to-blue-950/30">
            <h4 className="mb-2 font-semibold text-purple-900 dark:text-purple-100">
              Generation Context
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Exam:</span>{" "}
                {examName || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Question Type:</span>{" "}
                {questionType.replace("_", " ")}
              </div>
              <div>
                <span className="font-medium">Domain:</span>{" "}
                {domainNumber
                  ? `${domainNumber} - ${domainName}`
                  : "Not specified"}
              </div>
              <div>
                <span className="font-medium">Objective:</span>{" "}
                {objectiveNumber
                  ? `${objectiveNumber} - ${objectiveName}`
                  : "Not specified"}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="selected-name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Name for Question
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetNewName}
                disabled={loadingName || generating}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {loadingName ? 'Loading...' : 'New Name'}
              </Button>
            </div>
            <Input
              id="selected-name"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              placeholder="Name to use in the question scenario..."
              disabled={generating}
            />
          </div>

          {/* Focus Field */}
          <div className="space-y-2">
            <Label htmlFor="question-focus" className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Question Focus
            </Label>
            <Textarea
              id="question-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Describe the specific focus or emphasis for this question..."
              className="resize-none"
              rows={2}
              disabled={generating}
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-prompt" className="text-lg font-semibold">
                AI Prompt
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDefaultPrompt}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Default Prompt
              </Button>
            </div>

            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your AI generation prompt..."
              className="min-h-[375px] resize-none font-mono text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
              rows={15}
              disabled={generating}
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="keep-prompt"
                checked={keepPrompt}
                onChange={(e) => setKeepPrompt(e.target.checked)}
                className="h-4 w-4"
                disabled={generating}
              />
              <Label htmlFor="keep-prompt" className="cursor-pointer text-sm">
                Remember this prompt for future generations
              </Label>
            </div>
          </div>

          {/* Expected Format Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              AI will generate:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• A complete question with realistic scenario</li>
              <li>
                • {questionType === "multiple_choice" ? "4" : "6"} answer
                options (
                {questionType === "multiple_choice"
                  ? "A, B, C, D"
                  : "A, B, C, D, E, F"}
                )
              </li>
              <li>
                •{" "}
                {questionType === "multiple_choice"
                  ? "1 correct answer"
                  : "Multiple correct answers allowed"}
              </li>
              <li>• Detailed explanations for each option</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Question
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
