// components/admin/AIFeedbackModal.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { useAIGeneration } from "@/modules/admin/questions/hooks";

interface QuestionOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface CurrentQuestion {
  text: string;
  options: QuestionOption[];
  type: "multiple_choice" | "multi_select" | "ordering" | "categorization";
}

interface AIFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onFeedbackApplied: (generatedData: { text: string; options: QuestionOption[] }) => void;
  currentQuestion: CurrentQuestion;
  examName?: string;
  domainNumber?: string;
  domainName?: string;
  objectiveNumber?: string;
  objectiveName?: string;
}

export default function AIFeedbackModal({
  open,
  onClose,
  onFeedbackApplied,
  currentQuestion,
  examName = "",
  domainNumber = "",
  domainName = "",
  objectiveNumber = "",
  objectiveName = "",
}: AIFeedbackModalProps) {
  const [feedback, setFeedback] = useState("");

  const { generating, generateAIQuestion } = useAIGeneration();

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;

    try {
      // Build a prompt that includes the current question and feedback
      const currentQuestionText = `Current Question:
"${currentQuestion.text}"

Options:
${currentQuestion.options.map((opt, idx) =>
  `${String.fromCharCode(97 + idx).toUpperCase()}) ${opt.text}${opt.isCorrect ? ' (CORRECT)' : ''}${opt.explanation ? `\n  Explanation: ${opt.explanation}` : ''}`
).join('\n')}

User Feedback: ${feedback.trim()}

Please modify the question based on the feedback above while maintaining the same structure and format.`;

      // Use the existing AI generation hook
      const generatedData = await generateAIQuestion({
        prompt: currentQuestionText,
        questionType: currentQuestion.type,
        examName,
        domainNumber,
        domainName,
        objectiveNumber,
        objectiveName,
      });

      if (generatedData.success && generatedData.data) {
        onFeedbackApplied(generatedData.data);
        setFeedback(""); // Clear feedback
        onClose();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            AI Feedback
          </DialogTitle>
          <DialogDescription>
            Provide feedback to improve the generated question. Be specific about what you&apos;d like to change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Question Preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Current Question:
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              &quot;{currentQuestion.text}&quot;
            </p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className={option.isCorrect ? "font-medium text-green-700 dark:text-green-400" : ""}>
                  {String.fromCharCode(97 + idx).toUpperCase()}) {option.text}
                  {option.isCorrect && " ✓"}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback-input" className="text-sm font-medium">
              What would you like to change?
            </Label>
            <Textarea
              id="feedback-input"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., 'Option C is too easy, please make it harder' or 'Change Option D to make it longer and less obvious'"
              className="min-h-[120px] resize-none"
              rows={5}
              disabled={generating}
            />
          </div>

          {/* Examples */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              Example feedback:
            </h4>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>• &quot;Option C is too obvious, make it more challenging&quot;</li>
              <li>• &quot;Make all options longer and more detailed&quot;</li>
              <li>• &quot;Change the correct answer to focus on a different concept&quot;</li>
              <li>• &quot;The question is too easy, increase the difficulty level&quot;</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmitFeedback}
            disabled={generating || !feedback.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying Feedback...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Apply Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
