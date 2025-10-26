// app/(admin)/admin/questions/[id]/page.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuestionData } from "@/modules/admin/questions/hooks/useQuestionData";
import { SerializedQuestionWithDomainData } from "@/modules/admin/questions/types/question.types";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AdminAuthWrapper } from "@/modules/admin/shared/ui";

function QuestionViewPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { loading, loadQuestionWithDomain } = useQuestionData();
  const [question, setQuestion] = useState<SerializedQuestionWithDomainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id || typeof id !== "string") {
        setError("Invalid question ID");
        return;
      }

      setError(null);

      // Get question with domain data using hook
      const questionResult = await loadQuestionWithDomain(id);

      if (!questionResult.success || !questionResult.data) {
        setError(!questionResult.success ? questionResult.error : "Question not found");
        return;
      }

      setQuestion(questionResult.data);
    }

    fetchData();
  }, [id, loadQuestionWithDomain]);

  const handleCopyId = () => {
    if (question?.id) {
      navigator.clipboard.writeText(question.id);
      toast.success("Question ID copied!");
    }
  };

  const handleBack = () => {
    router.push("/admin/questions");
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading question...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !question) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Question Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The question you're looking for doesn't exist or couldn't be loaded."}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Button>
        </div>
      </main>
    );
  }

  const letters = ["a", "b", "c", "d", "e", "f"];

  // Safely get explanation from choices
  const getExplanationParagraph = () => {
    if (!question.choices || !Array.isArray(question.choices)) {
      return "";
    }

    const explanations = [
      ...question.choices.filter((opt) => opt.isCorrect).map((opt) => opt.explanation),
      ...question.choices.filter((opt) => !opt.isCorrect).map((opt) => opt.explanation),
    ]
      .filter(Boolean)
      .join(" ");

    return explanations;
  };

  const explanationParagraph = getExplanationParagraph();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between border-b pb-4">
        <Button onClick={handleBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{question.id}</span>
          <button
            onClick={handleCopyId}
            title="Copy Question ID"
            className="hover:text-foreground transition-colors"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Question Metadata */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Type:</span>{" "}
            <span className="capitalize">{question.type?.replace('_', ' ') || 'Unknown'}</span>
          </div>
          <div>
            <span className="font-medium">Certification:</span>{" "}
            <span>{question.certificationName || 'Unknown'}</span>
            {question.certificationCode && <span className="text-muted-foreground"> ({question.certificationCode})</span>}
          </div>
          <div>
            <span className="font-medium">Domain:</span>{" "}
            <span>{question.domainName || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium">Objective:</span>{" "}
            <span>{question.objectiveCode || 'N/A'}</span>
            {question.objectiveName && <span className="text-muted-foreground"> – {question.objectiveName}</span>}
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Question</h2>
        <h1 className="text-xl font-semibold leading-relaxed">{question.text || 'No question text available'}</h1>
      </div>

      {/* Answer Options */}
      {question.choices && Array.isArray(question.choices) && question.choices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Answer Options</h2>
          <div className="space-y-3">
            {question.choices.map((opt, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 transition-all ${
                  opt.isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                    opt.isCorrect
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-border text-muted-foreground"
                  }`}>
                    {letters[index]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{opt.text || 'No option text'}</p>
                    {opt.explanation && (
                      <p className="text-sm text-muted-foreground italic">
                        {opt.explanation}
                      </p>
                    )}
                  </div>
                  {opt.isCorrect && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Correct
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Explanation */}
      {(explanationParagraph || question.explanation) && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Explanation</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              {question.explanation || explanationParagraph}
            </p>
          </div>
        </div>
      )}

      {/* Additional Metadata */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span>{" "}
            <span>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div>
            <span className="font-medium">Question ID:</span>{" "}
            <span className="font-mono">{question.id}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
      </div>
    </main>
  );
}

export default function QuestionViewPage() {
  return (
    <AdminAuthWrapper>
      <QuestionViewPageContent />
    </AdminAuthWrapper>
  );
}
