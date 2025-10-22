# Database Schema Overview - CertistryLMS

## Overview

This document provides a comprehensive overview of the CertistryLMS database schema designed for a dynamic, multi-certification learning platform.

**Database**: PostgreSQL on Neon.tech
**ORM**: Prisma 6.16.3
**Total Models**: 17
**Schema Version**: 1.0
**Last Updated**: 2025-10-21

---

## Schema Architecture

The database is organized into 5 major functional areas:

1. **User & Authentication** - User accounts and AWS Cognito integration
2. **Certification Structure** - Certifications, Domains, and Objectives
3. **Content** - Videos, Documents, and Objective Mappings
4. **Assessments** - Questions, PBQs, and Quiz Attempts
5. **Student Progress** - Learning paths, progress tracking, and spaced repetition

---

## 1. User & Authentication

### User
Stores user accounts with AWS Cognito integration and current learning context.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `email` | String (unique) | User email address |
| `name` | String? | User display name |
| `roles` | String[] | User roles (default: ["user"]) |
| `cognitoId` | String? (unique) | AWS Cognito user ID |
| `cognitoUsername` | String? | AWS Cognito username |
| `currentCertificationId` | String? | Currently enrolled certification |
| `studyPlanDuration` | Int? | Study plan length (30/45/60 days) |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `email`, `cognitoId`

**Relationships**:
- Has many: diagnostics, learningPaths, progress, quizAttempts, flashcards, practiceExams, videoCompletions, pbqAttempts
- Belongs to: currentCertification (optional)

---

## 2. Certification Structure

### Certification
Top-level certification configuration (e.g., CompTIA Security+, Network+).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String | Certification name |
| `description` | String? | Detailed description |
| `blueprint` | Json? | Uploaded exam blueprint structure |
| `passingScore` | Int | Required score to pass (e.g., 750/900) |
| `defaultStudyDuration` | Int | Default study plan (default: 45 days) |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `isActive`

**Relationships**:
- Has many: domains, diagnostics, learningPaths, currentStudents

---

### CertificationDomain
Major content areas within a certification (e.g., "Threats, Attacks, and Vulnerabilities").

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `certificationId` | String | Foreign key to Certification |
| `name` | String | Domain name |
| `weight` | Float | Percentage weight on exam (0.24 = 24%) |
| `order` | Int | Display order within certification |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Unique Constraints**: `[certificationId, order]`
**Indexes**: `certificationId`
**Cascading Delete**: Yes (when Certification is deleted)

**Relationships**:
- Belongs to: certification
- Has many: objectives

---

### CertificationObjective
Specific learning objectives within a domain (e.g., "1.1 Compare and contrast social engineering techniques").

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `domainId` | String | Foreign key to CertificationDomain |
| `code` | String | Objective code (e.g., "1.1", "2.3") |
| `description` | String (Text) | Full objective description |
| `difficulty` | String | "beginner", "intermediate", "advanced" |
| `order` | Int | Order within domain |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Unique Constraints**: `[domainId, code]`
**Indexes**: `domainId`, `difficulty`
**Cascading Delete**: Yes (when Domain is deleted)

**Relationships**:
- Belongs to: domain
- Has many: videoMappings, documents, questions, pbqs, progress

---

## 3. Content (Videos & Documents)

### Video
Video content with transcription and metadata.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `title` | String | Video title |
| `url` | String | S3/CloudFront URL or external URL |
| `transcript` | String? (Text) | Video transcript (auto-generated) |
| `duration` | Int? | Duration in seconds |
| `difficultyLevel` | String | "beginner", "intermediate", "advanced" |
| `isProcessed` | Boolean | Transcription complete (default: false) |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `isActive`, `difficultyLevel`

**Relationships**:
- Has many: objectiveMappings, completions

---

### VideoObjectiveMapping
Many-to-many relationship between videos and objectives.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `videoId` | String | Foreign key to Video |
| `objectiveId` | String | Foreign key to CertificationObjective |
| `isPrimary` | Boolean | Is this the main objective? (default: false) |
| `createdAt` | DateTime | Creation timestamp |

**Unique Constraints**: `[videoId, objectiveId]`
**Indexes**: `videoId`, `objectiveId`
**Cascading Delete**: Yes (when Video or Objective is deleted)

**Relationships**:
- Belongs to: video, objective

---

### Document
PDF documents and supplemental materials.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `title` | String | Document title |
| `url` | String | S3 URL for PDF/document |
| `type` | String | "pdf", "markdown", "link" |
| `objectiveId` | String | Foreign key to CertificationObjective |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `objectiveId`, `isActive`
**Cascading Delete**: Yes (when Objective is deleted)

**Relationships**:
- Belongs to: objective

---

## 4. Assessments (Questions & PBQs)

### Question
Multiple-choice and scenario-based quiz questions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `type` | String | "multiple_choice", "multiple_select", "scenario" |
| `difficulty` | String | "easy", "medium", "hard" |
| `text` | String (Text) | Question text |
| `choices` | Json | Array of answer choices |
| `correctAnswer` | String | Correct answer(s) in JSON format |
| `explanation` | String (Text) | Explanation of correct answer |
| `objectiveId` | String | Foreign key to CertificationObjective |
| `questionType` | String? | "scenario", "recall", "best_practice", etc. |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `objectiveId`, `difficulty`, `questionType`, `isActive`
**Cascading Delete**: Yes (when Objective is deleted)

**Relationships**:
- Belongs to: objective
- Has many: quizAttempts

---

### PBQ (Performance-Based Question)
Interactive lab simulations and performance-based questions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `type` | String | "firewall", "logs", "drag_drop", "image_labeling" |
| `title` | String | PBQ title |
| `objectiveId` | String | Foreign key to CertificationObjective |
| `config` | Json | PBQ configuration (varies by type) |
| `scoringRubric` | Json | Scoring rubric for attempts |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `objectiveId`, `type`, `isActive`
**Cascading Delete**: Yes (when Objective is deleted)

**Relationships**:
- Belongs to: objective
- Has many: attempts

---

## 5. Student Progress & Learning Path

### StudentDiagnostic
Results from baseline diagnostic exams.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `certificationId` | String | Foreign key to Certification |
| `overallScore` | Float | Overall percentage score |
| `domainScores` | Json | Domain-level breakdown |
| `completedAt` | DateTime | Completion timestamp |
| `createdAt` | DateTime | Creation timestamp |

**Indexes**: `studentId`, `certificationId`, `completedAt`
**Cascading Delete**: Yes (when User or Certification is deleted)

**Relationships**:
- Belongs to: student (User), certification

---

### StudentLearningPath
Personalized learning path based on diagnostic results.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `certificationId` | String | Foreign key to Certification |
| `skippedObjectives` | String[] | ObjectiveIds student can skip |
| `priorityObjectives` | String[] | ObjectiveIds requiring focus |
| `estimatedCompletionDate` | DateTime? | Projected completion date |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Unique Constraints**: `[studentId, certificationId]`
**Indexes**: `studentId`, `certificationId`
**Cascading Delete**: Yes (when User or Certification is deleted)

**Relationships**:
- Belongs to: student (User), certification

---

### StudentProgress
Tracks student progress per objective.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `objectiveId` | String | Foreign key to CertificationObjective |
| `status` | String | "not_started", "in_progress", "completed", "mastered" |
| `quizScores` | Json? | Array of quiz scores for this objective |
| `videoCompletionIds` | String[] | IDs of completed videos |
| `lastAccessed` | DateTime? | Last access timestamp |
| `completedAt` | DateTime? | Completion timestamp |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Unique Constraints**: `[studentId, objectiveId]`
**Indexes**: `studentId`, `objectiveId`, `status`
**Cascading Delete**: Yes (when User or Objective is deleted)

**Relationships**:
- Belongs to: student (User), objective

---

### VideoCompletion
Tracks individual video completion and watch time.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `videoId` | String | Foreign key to Video |
| `watchedSeconds` | Int | Total seconds watched |
| `completed` | Boolean | Watched >90% (default: false) |
| `completedAt` | DateTime? | Completion timestamp |
| `createdAt` | DateTime | Creation timestamp |

**Unique Constraints**: `[studentId, videoId]`
**Indexes**: `studentId`, `videoId`
**Cascading Delete**: Yes (when User or Video is deleted)

**Relationships**:
- Belongs to: student (User), video

---

### StudentQuizAttempt
Tracks individual quiz question attempts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `questionId` | String | Foreign key to Question |
| `score` | Float | Score (0.0 to 1.0) |
| `answers` | Json | User's answers |
| `errorTypes` | Json? | "knowledge_gap", "misreading", "logic_error" |
| `attemptedAt` | DateTime | Attempt timestamp |

**Indexes**: `studentId`, `questionId`, `attemptedAt`
**Cascading Delete**: Yes (when User or Question is deleted)

**Relationships**:
- Belongs to: student (User), question

---

### PBQAttempt
Tracks PBQ (Performance-Based Question) attempts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `pbqId` | String | Foreign key to PBQ |
| `score` | Float | Score (0.0 to 1.0) |
| `response` | Json | User's configuration/answer |
| `completedAt` | DateTime | Completion timestamp |

**Indexes**: `studentId`, `pbqId`
**Cascading Delete**: Yes (when User or PBQ is deleted)

**Relationships**:
- Belongs to: student (User), pbq

---

### Flashcard
Spaced repetition flashcards for retention.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `objectiveId` | String | Related objective |
| `front` | String (Text) | Flashcard front (question) |
| `back` | String (Text) | Flashcard back (answer) |
| `nextReviewDate` | DateTime | Next scheduled review |
| `difficultyRating` | Int | 1-5 difficulty scale (default: 3) |
| `reviewCount` | Int | Number of reviews (default: 0) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**: `studentId`, `nextReviewDate`
**Cascading Delete**: Yes (when User is deleted)

**Relationships**:
- Belongs to: student (User)

**Spaced Repetition Schedule**: 1-3-7-14-21 day cycle

---

### PracticeExam
Weekly practice exam results and readiness tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `studentId` | String | Foreign key to User |
| `score` | Float | Overall score |
| `domainBreakdown` | Json | Score breakdown by domain |
| `readinessScore` | Float? | Predicted pass probability |
| `examType` | String | "diagnostic", "weekly", "final" |
| `completedAt` | DateTime | Completion timestamp |

**Indexes**: `studentId`, `completedAt`, `examType`
**Cascading Delete**: Yes (when User is deleted)

**Relationships**:
- Belongs to: student (User)

---

## Cascading Delete Relationships

All models implement proper cascading deletes to maintain referential integrity:

### Certification Hierarchy
```
Certification (delete)
  ↓ CASCADE
CertificationDomain (delete)
  ↓ CASCADE
CertificationObjective (delete)
  ↓ CASCADE
VideoObjectiveMapping, Document, Question, PBQ, StudentProgress (all delete)
```

### User Data
```
User (delete)
  ↓ CASCADE
All student data: diagnostics, learningPaths, progress, quizAttempts,
flashcards, practiceExams, videoCompletions, pbqAttempts (all delete)
```

### Content
```
Video (delete)
  ↓ CASCADE
VideoObjectiveMapping, VideoCompletion (delete)

Question (delete)
  ↓ CASCADE
StudentQuizAttempt (delete)

PBQ (delete)
  ↓ CASCADE
PBQAttempt (delete)
```

---

## Performance Optimizations

### Indexes
Strategic indexes on frequently queried fields:
- User: `email`, `cognitoId`
- Certification: `isActive`
- Domain: `certificationId`
- Objective: `domainId`, `difficulty`
- Video: `isActive`, `difficultyLevel`
- Progress tracking: `studentId`, `objectiveId`, `status`
- Temporal queries: `completedAt`, `attemptedAt`, `nextReviewDate`

### Query Patterns
Common query patterns optimized:
- User lookup by email or Cognito ID
- Student progress by certification/objective
- Content by difficulty level
- Practice exam history by date range
- Flashcard reviews by due date

---

## Data Types

### Primary Keys
All models use **CUID** (Collision-resistant Unique Identifier) for primary keys:
- Better performance than UUID in PostgreSQL
- Sortable (contains timestamp component)
- URL-safe
- Shorter than UUID (25 vs 36 characters)

### Timestamps
All models include:
- `createdAt` - Automatically set on creation
- `updatedAt` - Automatically updated on modification

### JSON Fields
Used for flexible, structured data:
- `blueprint` - Exam structure (varies by certification)
- `domainScores` - Domain-level scores
- `choices` - Question answer choices
- `config` - PBQ configuration (varies by type)
- `quizScores` - Array of quiz scores
- `errorTypes` - Categorized error analysis

---

## Migration Strategy

### Development (Current)
- Using `prisma db push` for rapid iteration
- Direct schema synchronization without migration files

### Production (Future)
- Will use `prisma migrate` for versioned migrations
- Migration history tracked in `_prisma_migrations` table
- Rollback capabilities via migration files

---

## Future Enhancements

Planned schema additions for V2:

1. **Discussion Forums**
   - ForumPost, ForumComment models

2. **Gamification**
   - Achievements, Badges, Leaderboards

3. **Content Recommendations**
   - ML-based content suggestions

4. **Multi-tenancy**
   - Organization, Team models for enterprise

5. **Analytics**
   - Detailed event tracking and analytics tables

---

## Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Schema Best Practices**: https://www.prisma.io/docs/guides/performance-and-optimization
- **Neon PostgreSQL**: https://neon.tech/docs

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Schema File**: `schema/schema.prisma`
**Total Tables**: 17
**Total Relationships**: 30+
