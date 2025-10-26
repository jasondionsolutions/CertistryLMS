/**
 * Question Form Component
 *
 * Simplified form for creating/editing questions with AI assistance.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateQuestion } from "../hooks/useQuestions";
import { useGenerateQuestion } from "../hooks/useQuestionAI";
import type { QuestionData, QuestionOption } from "../types";
import { Wand2, Plus, X, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function QuestionForm() {
  const router = useRouter();
  const createQuestion = useCreateQuestion();
  const generateAI = useGenerateQuestion();

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<
    "multiple_choice" | "multi_select"
  >("multiple_choice");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: "", isCorrect: false, explanation: "" },
    { text: "", isCorrect: false, explanation: "" },
    { text: "", isCorrect: false, explanation: "" },
    { text: "", isCorrect: false, explanation: "" },
  ]);

  // For AI generation
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  // Add option
  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false, explanation: "" }]);
  };

  // Remove option
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Must have at least 2 options");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // Update option
  const updateOption = (
    index: number,
    field: keyof QuestionOption,
    value: string | boolean
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For multiple choice, ensure only one correct answer
    if (field === "isCorrect" && value === true && questionType === "multiple_choice") {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setOptions(newOptions);
  };

  // Generate with AI
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for AI generation");
      return;
    }

    const generated = await generateAI.mutateAsync({
      prompt: aiPrompt,
      questionType,
    });

    if (generated) {
      setQuestionText(generated.text);
      setOptions(generated.options);
      setShowAIPrompt(false);
      toast.success("Question generated! Review and adjust as needed.");
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (options.some((opt) => !opt.text.trim())) {
      toast.error("All options must have text");
      return;
    }

    if (!options.some((opt) => opt.isCorrect)) {
      toast.error("At least one option must be marked as correct");
      return;
    }

    const correctAnswers = options
      .map((opt, idx) => (opt.isCorrect ? idx.toString() : null))
      .filter(Boolean)
      .join(",");

    const questionData: QuestionData = {
      text: questionText,
      type: questionType,
      difficulty,
      choices: options,
      correctAnswer: correctAnswers,
      explanation,
      // Note: In a real implementation, you'd select these from dropdowns
      objectiveId: undefined,
      bulletId: undefined,
      subBulletId: undefined,
    };

    await createQuestion.mutateAsync(questionData);
    router.push("/admin/questions");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* AI Generation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>AI-Assisted Generation</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAIPrompt(!showAIPrompt)}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {showAIPrompt ? "Hide AI" : "Generate with AI"}
              </Button>
            </div>

            {showAIPrompt && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label htmlFor="ai-prompt">
                  Describe the question you want to create
                </Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Example: Create a question about TCP three-way handshake for the Security+ exam"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                />
                <Button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={generateAI.isPending}
                >
                  {generateAI.isPending ? "Generating..." : "Generate Question"}
                </Button>
              </div>
            )}
          </div>

          {/* Question Type & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={questionType}
                onValueChange={(value: any) => setQuestionType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">
                    Multiple Choice
                  </SelectItem>
                  <SelectItem value="multi_select">Multi-Select</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value: any) => setDifficulty(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              placeholder="Enter your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            {options.map((option, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        updateOption(index, "isCorrect", checked === true)
                      }
                    />
                    <Label>Option {index + 1}</Label>
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Option text"
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                  required
                />

                <Textarea
                  placeholder="Explanation for this option (optional)"
                  value={option.explanation}
                  onChange={(e) =>
                    updateOption(index, "explanation", e.target.value)
                  }
                  rows={2}
                />
              </div>
            ))}
          </div>

          {/* Overall Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Overall Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              placeholder="Provide additional context or explanation..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Link href="/admin/questions">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={createQuestion.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {createQuestion.isPending ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </form>
  );
}
