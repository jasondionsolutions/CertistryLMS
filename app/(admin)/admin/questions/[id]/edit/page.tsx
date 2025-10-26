// app/(admin)/admin/questions/[id]/edit/page.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminAuthWrapper } from "@/modules/admin/shared/ui";
import { ErrorBoundary } from "@/modules/shared/ui/error-boundary";
import { useQuestionData } from "@/modules/admin/questions/hooks/useQuestionData";
import { listCertifications } from "@/modules/certifications/serverActions/certification.action";
import { useAdminQuestions } from "@/modules/admin/questions/hooks/useAdminQuestions";
import {
  QuestionData,
  QuestionOption
} from "@/modules/admin/questions/types";
import type { Certification, CertificationDomain, CertificationObjective } from "@prisma/client";
import { AIGenerationModal } from "@/modules/admin/questions/ui";
import type { GeneratedQuestionData } from "@/modules/admin/questions/ui";
import { Pencil, Copy, Trash2, Plus, ArrowLeft, Brain, HelpCircle } from "lucide-react";
import { logger } from "@/lib/utils/secure-logger";

type CertificationWithDomains = Certification & {
  domains: (CertificationDomain & { objectives: CertificationObjective[] })[];
};

interface QuestionForm {
  id: string;
  certificationId: string;
  domainId: string;
  objectiveId: string;
  text: string;
  type: "multiple_choice" | "multi_select";
  options: QuestionOption[];
  explanation: string;
}

const EMPTY_OPTION: QuestionOption = {
  text: "",
  isCorrect: false,
  explanation: "",
};

const getDefaultOptions = (type: string) => {
  switch (type) {
    case "multiple_choice":
      return Array(4).fill(null).map(() => ({
        ...EMPTY_OPTION,
        isCorrect: false
      }));
    case "multi_select":
      return Array(6).fill(null).map(() => ({ ...EMPTY_OPTION }));
    default:
      return [{ ...EMPTY_OPTION }];
  }
};

function QuestionEditPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";
  const { loadQuestionWithDomain } = useQuestionData();
  const { createQuestion: createQuestionHook, updateQuestion: updateQuestionHook } = useAdminQuestions();

  const [question, setQuestion] = useState<QuestionForm>({
    id: "",
    certificationId: "",
    domainId: "",
    objectiveId: "",
    text: "",
    type: "multiple_choice",
    options: getDefaultOptions("multiple_choice"),
    explanation: "",
  });

  const [certifications, setCertifications] = useState<CertificationWithDomains[]>([]);
  const [selectedCertification, setSelectedCertification] = useState<CertificationWithDomains | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCertificationDropdown, setShowCertificationDropdown] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showObjectiveDropdown, setShowObjectiveDropdown] = useState(false);

  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load certifications
      const certsResult = await listCertifications();
      if (!certsResult.success || !certsResult.data) {
        logger.error("Failed to load certifications", null, { component: 'AdminQuestionsEdit', action: 'loadCertifications' });
        setCertifications([]);
        return;
      }
      setCertifications(certsResult.data as unknown as CertificationWithDomains[]);

      // Load existing question if editing
      if (!isNew && typeof id === "string") {
        const questionResult = await loadQuestionWithDomain(id);

        if (questionResult.success && questionResult.data) {
          const questionData = questionResult.data;

          setQuestion({
            id: questionData.id,
            certificationId: questionData.certificationId || "",
            domainId: questionData.domainId || "",
            objectiveId: questionData.objectiveId || "",
            text: questionData.text || "",
            type: (questionData.type as "multiple_choice" | "multi_select") || "multiple_choice",
            options: Array.isArray(questionData.choices) ? questionData.choices : getDefaultOptions("multiple_choice"),
            explanation: questionData.explanation || "",
          });

          // Load certification data
          if (questionData.certificationId) {
            const cert = (certsResult.data as unknown as CertificationWithDomains[]).find(
              c => c.id === questionData.certificationId
            );
            if (cert) {
              setSelectedCertification(cert);
            }
          }
        } else {
          logger.error("Question not found", null, { component: 'AdminQuestionsEdit', action: 'loadQuestion', questionId: id });
          toast.error("Question not found");
          setTimeout(() => router.push("/admin/questions"), 100);
          return;
        }
      }
    } catch (error) {
      logger.error("Failed to load question data", error, { component: 'AdminQuestionsEdit', action: 'loadData', questionId: id });
      toast.error("Failed to load data");
      setTimeout(() => router.push("/admin/questions"), 100);
    } finally {
      setLoading(false);
    }
  }, [id, isNew, router, loadQuestionWithDomain]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCertificationChange = async (certificationId: string) => {
    setQuestion(prev => ({
      ...prev,
      certificationId,
      domainId: "",
      objectiveId: ""
    }));

    if (certificationId) {
      const cert = certifications.find(c => c.id === certificationId);
      if (cert) {
        setSelectedCertification(cert);
      } else {
        setSelectedCertification(null);
      }
    } else {
      setSelectedCertification(null);
    }
    setShowCertificationDropdown(false);
  };

  const handleDomainChange = (domainId: string) => {
    setQuestion(prev => ({
      ...prev,
      domainId,
      objectiveId: ""
    }));
    setShowDomainDropdown(false);
  };

  const handleObjectiveChange = (objectiveId: string) => {
    setQuestion(prev => ({
      ...prev,
      objectiveId
    }));
    setShowObjectiveDropdown(false);
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...question.options];
    if (field === "isCorrect" && value === true && question.type === "multiple_choice") {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      if (field === "text" && typeof value === "string") {
        newOptions[index].text = value;
      } else if (field === "explanation" && typeof value === "string") {
        newOptions[index].explanation = value;
      } else if (field === "isCorrect" && typeof value === "boolean") {
        newOptions[index].isCorrect = value;
      }
    }
    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleAddOption = () => {
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, { ...EMPTY_OPTION }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    if (question.options.length <= 2) {
      toast.error("Questions must have at least 2 options");
      return;
    }

    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleAIGenerate = (generatedData: GeneratedQuestionData) => {
    setQuestion(prev => ({
      ...prev,
      text: generatedData.text,
      options: generatedData.options,
      explanation: ""
    }));

    toast.success("Question generated successfully! Review and edit as needed.");
  };

  const handleOptionLetterClick = (index: number) => {
    if (question.type === "multiple_choice") {
      const newOptions = question.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index ? !opt.isCorrect : false
      }));
      setQuestion(prev => ({ ...prev, options: newOptions }));
    } else {
      // For multi-select, toggle the option
      handleOptionChange(index, "isCorrect", !question.options[index].isCorrect);
    }
  };

  const handleSave = async () => {
    if (!question.text.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (!question.certificationId) {
      toast.error("Please select a certification");
      return;
    }
    if (!question.domainId) {
      toast.error("Please select a domain");
      return;
    }
    if (!question.objectiveId) {
      toast.error("Please select an objective");
      return;
    }
    if (question.options.length === 0) {
      toast.error("Question must have at least one option");
      return;
    }
    if (question.options.some(opt => !opt.text.trim())) {
      toast.error("All options must have text");
      return;
    }

    if (!question.options.some(opt => opt.isCorrect)) {
      toast.error("Please select at least one correct answer before saving");
      return;
    }

    setSaving(true);
    try {
      const questionData: QuestionData = {
        certificationId: question.certificationId,
        objectiveId: question.objectiveId,
        text: question.text,
        type: question.type,
        difficulty: "medium",
        choices: question.options,
        correctAnswer: question.options.filter(c => c.isCorrect).map(c => c.text).join(", "),
        explanation: question.explanation || ""
      };

      if (isNew) {
        const result = await createQuestionHook(questionData);
        if (result.success && result.data) {
          toast.success("Question created successfully!");
          router.push("/admin/questions");
        } else {
          toast.error(result.error || "Failed to create question");
        }
      } else {
        const result = await updateQuestionHook(question.id, questionData);
        if (result.success) {
          toast.success("Question updated successfully!");
          router.push(`/admin/questions/${question.id}/view`);
        } else {
          toast.error(result.error || "Failed to update question");
        }
      }
    } catch (error) {
      logger.error("Failed to save question", error, { component: 'AdminQuestionsEdit', action: 'saveQuestion', questionId: question.id });
      toast.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const getAvailableDomains = () => {
    return selectedCertification?.domains || [];
  };

  const getAvailableObjectives = () => {
    if (!question.domainId || !selectedCertification?.domains) return [];
    const domain = selectedCertification.domains.find(d => d.id === question.domainId);
    return domain?.objectives || [];
  };

  const getCurrentCertificationName = () => {
    const cert = certifications.find(c => c.id === question.certificationId);
    return cert ? cert.name : "Select Certification";
  };

  const getCurrentDomainName = () => {
    const domains = getAvailableDomains();
    const domain = domains.find(d => d.id === question.domainId);
    return domain ? `Domain ${domain.name}` : "Select Domain";
  };

  const getCurrentObjectiveName = () => {
    const objectives = getAvailableObjectives();
    const objective = objectives.find(o => o.id === question.objectiveId);
    return objective ? `Objective ${objective.code}` : "Select Objective";
  };

  const getCurrentDomain = () => {
    return getAvailableDomains().find(d => d.id === question.domainId);
  };

  const getCurrentObjective = () => {
    return getAvailableObjectives().find(o => o.id === question.objectiveId);
  };

  const generateExplanation = () => {
    const correctOptions = question.options.filter(opt => opt.isCorrect);
    const incorrectOptions = question.options.filter(opt => !opt.isCorrect);

    const explanations = [
      ...correctOptions.map(opt => opt.explanation).filter(Boolean),
      ...incorrectOptions.map(opt => opt.explanation).filter(Boolean)
    ];

    return explanations.join(' ');
  };

  const getOptionLetter = (index: number) => {
    if (index < 26) {
      return String.fromCharCode(97 + index);
    } else {
      const letterIndex = index % 26;
      const repeatCount = Math.floor(index / 26) + 1;
      return String.fromCharCode(97 + letterIndex).repeat(repeatCount);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">
            {isNew ? "Preparing editor..." : "Loading question..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/questions")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Return to Questions
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <HelpCircle className="w-8 h-8 mr-3 text-indigo-600" />
              {isNew ? "Create Question" : "Edit Question"}
            </h1>
            <p className="text-muted-foreground mt-2 text-xl">
              {isNew ? "Build comprehensive questions with AI assistance" : "Modify question content and metadata"}
            </p>
          </div>

          {!isNew && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <span className="font-mono">{question.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(question.id);
                  toast.success("Question ID copied!");
                }}
                title="Copy Question ID"
                className="hover:text-foreground transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Certification Context Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Question Context</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            disabled={!question.certificationId || !question.domainId || !question.objectiveId}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Certification */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Certification</span>
            <div className="relative">
              <button
                onClick={() => setShowCertificationDropdown(!showCertificationDropdown)}
                className="flex items-center gap-2 hover:text-primary w-full p-2 border rounded-md bg-background"
              >
                <span className="flex-1 text-left font-medium">{getCurrentCertificationName()}</span>
                <Pencil size={14} />
              </button>
              {showCertificationDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 w-full min-w-[250px]">
                  {certifications
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map(cert => (
                      <button
                        key={cert.id}
                        onClick={() => handleCertificationChange(cert.id)}
                        className="block w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      >
                        {cert.name} ({cert.code})
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Domain</span>
            <div className="relative">
              <button
                onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                className="flex items-center gap-2 hover:text-primary w-full p-2 border rounded-md bg-background"
                disabled={!question.certificationId}
              >
                <span className="flex-1 text-left font-medium">{getCurrentDomainName()}</span>
                <Pencil size={12} />
              </button>
              {showDomainDropdown && question.certificationId && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 w-full min-w-[250px]">
                  {getAvailableDomains().map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => handleDomainChange(domain.id)}
                      className="block w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    >
                      {domain.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Objective</span>
            <div className="relative">
              <button
                onClick={() => setShowObjectiveDropdown(!showObjectiveDropdown)}
                className="flex items-center gap-2 hover:text-primary w-full p-2 border rounded-md bg-background"
                disabled={!question.domainId}
              >
                <span className="flex-1 text-left font-medium">{getCurrentObjectiveName()}</span>
                <Pencil size={12} />
              </button>
              {showObjectiveDropdown && question.domainId && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 w-full min-w-[300px]">
                  {getAvailableObjectives().map((objective) => (
                    <button
                      key={objective.id}
                      onClick={() => handleObjectiveChange(objective.id)}
                      className="block w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    >
                      {objective.code}: {objective.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Question Type</span>
          <div className="flex gap-6">
            {[
              { value: "multiple_choice", label: "Multiple Choice" },
              { value: "multi_select", label: "Multi-Select" }
            ].map((type) => (
              <label key={type.value} className="flex items-center space-x-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="questionType"
                  value={type.value}
                  checked={question.type === type.value}
                  onChange={(e) => {
                    const newType = e.target.value as "multiple_choice" | "multi_select";
                    setQuestion(prev => {
                      let updatedOptions = [...prev.options];

                      if (newType === "multiple_choice" && updatedOptions.length > 4) {
                        updatedOptions = updatedOptions.slice(0, 4);
                      } else if (newType === "multi_select" && updatedOptions.length < 6) {
                        while (updatedOptions.length < 6) {
                          updatedOptions.push({ ...EMPTY_OPTION });
                        }
                      }

                      if (newType === "multiple_choice" && prev.type === "multi_select") {
                        const firstCorrectIndex = updatedOptions.findIndex(opt => opt.isCorrect);
                        updatedOptions = updatedOptions.map((opt, i) => ({
                          ...opt,
                          isCorrect: i === firstCorrectIndex && firstCorrectIndex !== -1
                        }));
                      }

                      return {
                        ...prev,
                        type: newType,
                        options: updatedOptions
                      };
                    });
                  }}
                  className="w-3 h-3"
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            QUESTION
          </h3>
          <textarea
            value={question.text}
            onChange={(e) => {
              setQuestion(prev => ({ ...prev, text: e.target.value }));
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="Enter your question..."
            className="w-full border-0 bg-transparent resize-none p-0 focus:ring-0 focus:outline-none text-xl font-semibold leading-relaxed overflow-hidden"
            rows={6}
            style={{ fontSize: '20px', fontWeight: '600', minHeight: '144px' }}
          />
        </div>

        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            ANSWER OPTIONS
          </h3>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const letter = getOptionLetter(index);
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 transition-all ${
                    option.isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-border bg-background hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      onClick={() => handleOptionLetterClick(index)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                        option.isCorrect
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-border text-muted-foreground hover:border-green-500"
                      }`}
                    >
                      {letter}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium mb-2">
                        <textarea
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                          placeholder={`${letter.toUpperCase()}) Option text...`}
                          className="w-full border-0 bg-transparent resize-none p-0 focus:ring-0 focus:outline-none font-medium"
                          rows={1}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground italic">
                        <textarea
                          value={option.explanation || ""}
                          onChange={(e) => handleOptionChange(index, "explanation", e.target.value)}
                          placeholder="Explanation (optional)..."
                          className="w-full border-0 bg-transparent resize-none p-0 focus:ring-0 focus:outline-none"
                          rows={2}
                        />
                      </div>
                      {option.isCorrect && (
                        <span className="inline-flex items-center text-green-500 text-sm font-medium mt-2">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                    {question.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="flex-shrink-0 w-8 h-8 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                        title="Remove this option"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleAddOption}
              className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={16} />
              <span className="font-medium">Add Option</span>
            </button>
          </div>
        </div>

        {generateExplanation() && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              EXPLANATION
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm leading-relaxed">{generateExplanation()}</p>
            </div>
          </div>
        )}

        {question.domainId && selectedCertification && (
          <div className="text-sm text-muted-foreground space-y-1 pt-6 border-t">
            <div>
              Domain {getCurrentDomain()?.name || "Unknown Domain"}
            </div>
            <div>
              Objective {getCurrentObjective()?.code} – {getCurrentObjective()?.description || "Unknown Objective"}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={() => router.push("/admin/questions")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-black hover:bg-black/90 text-white"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {isNew ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>
              {isNew ? "Create Question" : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      {/* AI Generation Modal */}
      <AIGenerationModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        examName={selectedCertification?.name}
        domainNumber={question.domainId}
        domainName={getCurrentDomain()?.name}
        objectiveNumber={question.objectiveId}
        objectiveName={getCurrentObjective()?.description}
        questionType={question.type}
      />
    </main>
  );
}

export default function QuestionEditPage() {
  return (
    <AdminAuthWrapper>
      <ErrorBoundary level="page">
        <QuestionEditPageContent />
      </ErrorBoundary>
    </AdminAuthWrapper>
  );
}
