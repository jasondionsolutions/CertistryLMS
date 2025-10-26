// Admin Questions AI - Server Actions
"use server";

import OpenAI from "openai";
import { withPermission } from "@/lib/middleware/withPermission";
import type { AuthContext } from "@/lib/auth/types";
import type {
  GenerateQuestionRequest,
  QuestionOption,
  GeneratedQuestion,
  ActionResult,
  AIFeedbackResponse,
  AIFeedbackSuggestion,
} from "../types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// AI QUESTION GENERATION
// ============================================================================

async function _generateQuestion(
  currentUser: AuthContext,
  request: GenerateQuestionRequest
): Promise<ActionResult<GeneratedQuestion>> {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return {
        success: false,
        error: "AI service not configured. Please contact support.",
      };
    }

    // Validate input
    const validation = validateRequest(request);
    if (!validation.success) {
      return validation as ActionResult<GeneratedQuestion>;
    }

    const {
      prompt,
      questionType,
      certificationName,
      domainName,
      objectiveCode,
      objectiveName,
      bulletText,
      subBulletText,
    } = request;

    // Build messages
    const systemMessage = buildSystemMessage(
      questionType,
      certificationName,
      domainName,
      objectiveCode,
      objectiveName,
      bulletText,
      subBulletText
    );
    const userMessage = buildUserMessage(prompt, questionType);

    // Call OpenAI with retry logic
    let completion;
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        completion = (await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
          // 30 second timeout
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("OpenAI request timeout")), 30000)
          ),
        ])) as OpenAI.Chat.Completions.ChatCompletion;

        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        console.warn(`OpenAI attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * attempt)
          );
        }
      }
    }

    if (!completion) {
      console.error("All OpenAI attempts failed:", lastError);
      return {
        success: false,
        error: "AI service temporarily unavailable. Please try again.",
      };
    }

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.error("Empty response from OpenAI");
      return {
        success: false,
        error: "AI service returned an empty response. Please try again.",
      };
    }

    // Parse and validate the response
    let generatedQuestion: GeneratedQuestion;
    try {
      generatedQuestion = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return {
        success: false,
        error: "AI service returned invalid data. Please try again.",
      };
    }

    // Validate the generated question
    const validationError = validateGeneratedQuestion(
      generatedQuestion,
      questionType
    );
    if (validationError) {
      console.error("Generated question validation failed:", validationError);
      return {
        success: false,
        error: `AI generated invalid question: ${validationError}`,
      };
    }

    return {
      success: true,
      data: generatedQuestion,
    };
  } catch (error) {
    console.error("AI Generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: `Failed to generate question: ${errorMessage}`,
    };
  }
}

export const generateQuestion = withPermission("questions.create")(
  _generateQuestion
);

// ============================================================================
// AI QUESTION FEEDBACK
// ============================================================================

async function _getQuestionFeedback(
  currentUser: AuthContext,
  questionText: string,
  options: QuestionOption[],
  questionType: "multiple_choice" | "multi_select"
): Promise<ActionResult<AIFeedbackResponse>> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "AI service not configured. Please contact support.",
      };
    }

    const systemMessage = `You are an expert at evaluating certification exam questions. Analyze the provided question and provide constructive feedback.

Focus on:
1. Question clarity and wording
2. Distractor quality (incorrect answers)
3. Difficulty level estimation
4. Explanation quality

Respond with valid JSON in this format:
{
  "overallScore": 85,
  "estimatedDifficulty": "medium",
  "confidenceScore": 0.92,
  "suggestions": [
    {
      "type": "question_clarity",
      "severity": "low",
      "suggestion": "Consider rewording for clarity...",
      "currentText": "Current phrasing...",
      "suggestedText": "Suggested phrasing..."
    }
  ]
}

Suggestion types: "question_clarity", "distractor_quality", "difficulty", "explanation"
Severity levels: "low", "medium", "high"
Overall score: 0-100
Difficulty: "easy", "medium", "hard"
Confidence: 0.0-1.0`;

    const userMessage = `Analyze this ${questionType.replace("_", " ")} question:

Question: ${questionText}

Options:
${options.map((opt, i) => `${i + 1}. ${opt.text} ${opt.isCorrect ? "(CORRECT)" : "(INCORRECT)"}\n   Explanation: ${opt.explanation}`).join("\n\n")}

Provide detailed feedback.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return {
        success: false,
        error: "AI service returned an empty response.",
      };
    }

    const feedback: AIFeedbackResponse = JSON.parse(response);

    return {
      success: true,
      data: feedback,
    };
  } catch (error) {
    console.error("AI Feedback error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get AI feedback",
    };
  }
}

export const getQuestionFeedback = withPermission("questions.create")(
  _getQuestionFeedback
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateRequest(
  request: GenerateQuestionRequest
): { success: boolean; error?: string } {
  if (!request.prompt?.trim()) {
    return {
      success: false,
      error: "Question prompt is required",
    };
  }

  if (request.prompt.length < 10) {
    return {
      success: false,
      error: "Question prompt must be at least 10 characters long",
    };
  }

  if (request.prompt.length > 5000) {
    return {
      success: false,
      error: "Question prompt must be less than 5000 characters",
    };
  }

  const validTypes = ["multiple_choice", "multi_select"];
  if (!validTypes.includes(request.questionType)) {
    return {
      success: false,
      error: "Invalid question type specified",
    };
  }

  return { success: true };
}

function buildSystemMessage(
  questionType: string,
  certificationName?: string,
  domainName?: string,
  objectiveCode?: string,
  objectiveName?: string,
  bulletText?: string,
  subBulletText?: string
): string {
  const context = [
    certificationName && `Certification: ${certificationName}`,
    domainName && `Domain: ${domainName}`,
    objectiveCode &&
      `Objective: ${objectiveCode}${objectiveName ? ` - ${objectiveName}` : ""}`,
    bulletText && `Bullet: ${bulletText}`,
    subBulletText && `Sub-bullet: ${subBulletText}`,
  ]
    .filter(Boolean)
    .join(", ");

  const questionTypeText =
    questionType === "multiple_choice" ? "multiple choice" : "multi-select";
  const correctAnswerRule =
    questionType === "multiple_choice"
      ? "exactly one correct answer"
      : "one or more correct answers";

  const optionCount = questionType === "multiple_choice" ? 4 : 6;
  const optionLetters =
    questionType === "multiple_choice"
      ? ["A", "B", "C", "D"]
      : ["A", "B", "C", "D", "E", "F"];

  const optionTemplate = optionLetters
    .map(
      (letter) => `    {
      "text": "Option ${letter} text",
      "isCorrect": ${letter === "A" ? "true" : "false"},
      "explanation": "Detailed explanation of why this is correct/incorrect"
    }`
    )
    .join(",\n");

  return `You are an expert exam question writer specializing in professional certification exams. ${context ? `Context: ${context}.` : ""}

Create a high-quality ${questionTypeText} question with ${correctAnswerRule}.

Requirements:
1. Question must be practical and scenario-based at Bloom's Level 2 (Understanding/Application)
2. Include exactly ${optionCount} answer options (${optionLetters.join(", ")})
3. Each option must have a detailed explanation (2-3 sentences)
4. For multiple choice: exactly 1 correct answer
5. For multi-select: 1-3 correct answers (clearly indicate which are correct)
6. Explanations should explain WHY each option is correct or incorrect
7. Use professional, clear language appropriate for certification exams
8. Focus on real-world application and practical scenarios
9. Do not include the correct answer term/service in the question text itself
10. Keep question text to 1-3 sentences for clarity

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "text": "Your question text here",
  "options": [
${optionTemplate}
  ]
}`;
}

function buildUserMessage(prompt: string, questionType: string): string {
  return `Generate a ${questionType.replace("_", " ")} question based on this prompt:

${prompt}

Remember to respond with valid JSON only, following the specified format exactly.`;
}

function validateGeneratedQuestion(
  question: any,
  questionType: string
): string | null {
  // Check basic structure
  if (!question.text || typeof question.text !== "string") {
    return "Missing or invalid question text";
  }

  if (question.text.length < 20) {
    return "Question text too short";
  }

  if (!Array.isArray(question.options)) {
    return "Missing or invalid options array";
  }

  const expectedOptionCount = questionType === "multiple_choice" ? 4 : 6;
  if (question.options.length !== expectedOptionCount) {
    return `Must have exactly ${expectedOptionCount} options for ${questionType}`;
  }

  // Validate each option
  for (let i = 0; i < question.options.length; i++) {
    const option = question.options[i];

    if (!option.text || typeof option.text !== "string") {
      return `Option ${i + 1}: Missing or invalid text`;
    }

    if (option.text.length < 5) {
      return `Option ${i + 1}: Text too short`;
    }

    if (typeof option.isCorrect !== "boolean") {
      return `Option ${i + 1}: Missing or invalid isCorrect field`;
    }

    if (!option.explanation || typeof option.explanation !== "string") {
      return `Option ${i + 1}: Missing or invalid explanation`;
    }

    // Check minimum explanation length
    if (option.explanation.length < 20) {
      return `Option ${i + 1}: Explanation too short (minimum 20 characters)`;
    }
  }

  // Validate correct answer count based on question type
  const correctCount = question.options.filter(
    (opt: any) => opt.isCorrect
  ).length;

  if (questionType === "multiple_choice" && correctCount !== 1) {
    return "Multiple choice questions must have exactly 1 correct answer";
  }

  if (questionType === "multi_select" && correctCount === 0) {
    return "Multi-select questions must have at least 1 correct answer";
  }

  if (questionType === "multi_select" && correctCount > 4) {
    return "Multi-select questions should not have more than 4 correct answers";
  }

  return null; // No validation errors
}
