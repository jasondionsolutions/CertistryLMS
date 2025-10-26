/**
 * Create Question Page
 *
 * Interface for creating new questions with AI assistance.
 */

"use client";

import { QuestionForm } from "@/modules/admin/questions/ui/QuestionForm";

export default function CreateQuestionPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Question</h1>
        <p className="text-muted-foreground">
          Create a new question for your question bank
        </p>
      </div>

      <QuestionForm />
    </div>
  );
}
