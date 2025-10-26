# Phase 2: Content Upload & Objective Mapping - Working Document

**Last Updated**: 2025-10-25 (Issue #18 COMPLETED ✅)
**Status**: Issue #18 - PDF/Document Upload with AI-Powered Mapping (Complete)
**Current Issue**: #18 - CLOSED ✅
**Next Action**: Ready for Issue #19 (Content Library)
**GitHub Milestone**: [Phase 2](https://github.com/jasondionsolutions/CertistryLMS/milestone/2)

---

## ⚡ Current Status Summary

✅ **Completed & Closed**:
- **Pre-work**: Tech stack decisions, Prisma schema, dependencies, config
- **[Issue #15](https://github.com/jasondionsolutions/CertistryLMS/issues/15)**: Video Upload to S3 ✅ **CLOSED**
  - Video types and Zod schemas
  - S3 utilities (pre-signed URLs, upload helpers)
  - Thumbnail generation (default placeholders)
  - Video upload server actions with RBAC
  - Client hooks (useUploadVideo, useVideos)
  - VideoUploadForm component with drag-drop
  - VideoUploadProgress component
  - Admin pages (/admin/content/videos, /admin/content/videos/upload)
  - Video code extraction & intelligent filename parsing
  - Transcription & AI description checkboxes
  - Build passing ✅

- **[Issue #16](https://github.com/jasondionsolutions/CertistryLMS/issues/16)**: Video Transcription with Whisper API ✅ **WORKING IN PRODUCTION**
  - Whisper API integration (sends video files directly, no audio extraction)
  - AI description generation (GPT-3.5-turbo, 100 words)
  - BullMQ + Upstash Redis queue system
  - Vercel cron worker (runs every 2 minutes)
  - VTT closed captions format for video player
  - Transcription status tracking (pending/processing/completed/failed/skipped)
  - Manual transcript upload option (VTT format)
  - Timeout protection and error handling
  - VideoList component with transcription status badges
  - Retry functionality for failed transcriptions
  - Auto-refresh video list after upload
  - **Deployment Fixes:**
    - Removed ffmpeg dependency (not available in Vercel serverless)
    - Fixed parameter order bug in worker (videoId vs s3Key)
    - Increased worker timeout to 4 minutes (requires Vercel Pro)
    - Fixed BullMQ Redis configuration
  - **Current Limitations:**
    - Max video file size: 25MB (Whisper API limit)
    - Max transcription time: ~4 minutes (Vercel Pro function timeout)
    - Videos >10-15 minutes may timeout and retry automatically
  - Deployed to production ✅

✅ **Recently Completed**:
- **Issue #17**: Content-to-Objective Mapping with AI Suggestions - COMPLETED ✅
  - AI-powered semantic similarity mapping
  - Flexible polymorphic mapping to objectives/bullets/sub-bullets
  - Complete UI with suggestions, manual mapping, and management
  - 20 files created, ~1,500 lines of code
  - Build successful, TypeScript clean

---

## Phase 2 Overview

Building content management system for videos and documents with AI transcription, objective mapping, and searchable library.

---

## Tech Stack Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Transcription** | OpenAI Whisper API | 4x cheaper ($0.006/min vs $0.024/min), better technical accuracy |
| **Queue System** | Upstash Redis + BullMQ | Leverage existing Upstash account, industry standard, Vercel-compatible |
| **Storage** | AWS S3 (existing) | Already configured from Phase 0 |
| **Thumbnails** | Auto-generate + manual upload | Default thumbnail with option to customize |
| **Document Viewer** | react-pdf | In-browser PDF viewing |
| **Implementation** | Linear (Issues #15-19) | Each builds on previous |

---

## Implementation Order

### ✅ Pre-Work (COMPLETED)
- [x] Review issues #15-20
- [x] Make tech stack decisions
- [x] Update Prisma schema with new Video/Document fields
- [x] Create DocumentObjectiveMapping junction table
- [x] Push schema changes to database
- [x] Set up BullMQ + Upstash configuration files
- [x] Install dependencies (bullmq, openai, @aws-sdk/client-s3, react-pdf)
- [x] Add OPENAI_API_KEY to .env
- [x] Add UPSTASH_REDIS_URL to .env (verify connection string format)

### ✅ Issue #15: Video Upload to S3 (COMPLETED & CLOSED)
**Status**: Complete & Closed
**Completion Date**: 2025-10-23
**GitHub Issue**: [#15](https://github.com/jasondionsolutions/CertistryLMS/issues/15) - CLOSED
**Goal**: Upload videos to S3 with progress tracking and validation

**Tasks Completed**:
- [x] Create video upload server action with RBAC (`withPermission('content.create')`)
- [x] Generate pre-signed S3 URLs for secure upload
- [x] Build video upload UI component (drag-drop)
- [x] Implement progress bar during upload
- [x] File validation (MP4, MOV, AVI, max 2GB)
- [x] Generate unique S3 keys (`dev/videos/{timestamp}-{filename}`)
- [x] Store video metadata in database
- [x] Auto-generate default thumbnail (placeholder service)
- [x] Manual thumbnail upload capability (upload function created)
- [x] Error handling and validation
- [x] Build passing with no errors

**Files Created**:
- ✅ `modules/content/types/video.types.ts` - Zod schemas
- ✅ `modules/content/serverActions/video.action.ts` - Upload server actions
- ✅ `modules/content/hooks/useUploadVideo.ts` - Client upload hook
- ✅ `modules/content/hooks/useVideos.ts` - Client query hooks
- ✅ `modules/content/ui/VideoUploadForm.tsx` - Upload component
- ✅ `modules/content/ui/VideoUploadProgress.tsx` - Progress UI
- ✅ `lib/s3/config.ts` - S3 configuration
- ✅ `lib/s3/presignedUrl.ts` - Pre-signed URL generation
- ✅ `lib/s3/thumbnail.ts` - Thumbnail utilities
- ✅ `components/ui/progress.tsx` - Progress bar component
- ✅ `app/(admin)/admin/content/videos/page.tsx` - Video list page
- ✅ `app/(admin)/admin/content/videos/upload/page.tsx` - Upload page

**Notes**:
- Video frame extraction for thumbnails marked as TODO (can enhance later)
- RBAC permissions already exist (content.create, content.read, content.update, content.delete)
- Upload triggers transcription job queue (will be processed in Issue #16)

**Updates (Post-Completion)**:
- ✅ Added `videoCode` field to Video model (e.g., "SY7_01_01")
- ✅ Intelligent filename parsing:
  - Extracts code pattern: `SY7_01_01_Introduction_to_Security+.mp4` → Code: "SY7_01_01", Title: "Introduction to Security+"
  - Converts underscores to spaces in title
- ✅ Changed `allowDownload` default to `false` (unchecked by default)
- ✅ **Transcription & AI Control (Checkbox Method)**:
  - Added `aiDescriptionGenerated` field to Video model
  - Added `"skipped"` to TranscriptionStatus enum
  - Two new checkboxes in upload form:
    - ☑ "Enable video transcription" (default: checked)
    - ☑ "Generate AI description (100 words)" (default: checked, disabled if transcription off)
  - Description field always visible (manual entry supported)
  - Logic: AI description only generates if both checkboxes are checked
  - Videos with transcription disabled: `transcriptionStatus = "skipped"`, marked as `isProcessed = true`
  - Transcription queue receives `generateDescription` flag

---

### 🎙️ Issue #16: Video Transcription with Whisper (Est: 3 hours)
**Goal**: Auto-transcribe videos using OpenAI Whisper API with background job queue

**Tasks**:
- [ ] Set up BullMQ transcription queue
- [ ] Create transcription worker at `/api/workers/transcription`
- [ ] Implement OpenAI Whisper API integration
- [ ] Handle file chunking for videos >25MB
- [ ] Update video transcription status (pending→processing→complete/failed)
- [ ] Store transcript with timestamp markers (SRT format)
- [ ] Add manual transcript upload option
- [ ] Display transcription status in UI
- [ ] Error handling and retry logic (3 attempts)
- [ ] Cost optimization: cache transcripts


**Files to Create**:
- `modules/content/serverActions/transcription.action.ts` - Queue job creation
- `modules/content/services/whisper.service.ts` - Whisper API calls
- `modules/content/hooks/useTranscriptionStatus.ts` - Poll status
- `modules/content/ui/TranscriptionStatus.tsx` - Status display
- `app/api/workers/transcription/route.ts` - BullMQ worker
- `lib/queue/transcriptionQueue.ts` - Queue setup
- `tests/transcription.spec.ts` - E2E tests

---

### 🎯 Issue #17: AI-Assisted Content-to-Objective Mapping ✅ COMPLETED
**Status**: Complete & Closed
**Started**: 2025-10-25
**Completed**: 2025-10-25
**GitHub Issue**: [#17](https://github.com/jasondionsolutions/CertistryLMS/issues/17) - CLOSED
**Goal**: Map videos to bullets/sub-bullets with AI suggestions based on transcript analysis

## 🤖 AI-Assisted Mapping Strategy

**Key Innovation**: Instead of just mapping to objectives, we map to the **lowest level possible** (bullets/sub-bullets) for precise learning recommendations when students fail quiz questions.

### Architecture Decisions
1. **AI Approach**: Semantic similarity using OpenAI text-embedding-3-small
   - Cost: ~$0.0003 per video (extremely cheap)
   - Speed: 1-2 seconds per video
   - Accuracy: High - understands context and synonyms

2. **Mapping Levels**: Flexible polymorphic mapping to ANY level
   - Videos can map to: Objective, Bullet, OR Sub-bullet
   - Prefer lowest level (sub-bullet > bullet > objective)
   - Automatic upward hierarchy (bullet → objective → domain)

3. **Workflow**: Hybrid Auto + Manual
   - Auto: AI analyzes transcript, suggests top 5 matches (≥70% confidence)
   - Manual: Instructor reviews, accepts/rejects/adds more
   - Primary flag: Instructor marks main focus

4. **Embedding Cache**: Store vector embeddings in database
   - Cache domains, objectives, bullets, sub-bullets
   - Process once per certification, reuse forever
   - Massive cost savings (one-time $0.01 vs $0.01 per video)

### Database Schema Changes ✅ COMPLETED

**New Model**: `VideoContentMapping` (replaces `VideoObjectiveMapping`)
```prisma
model VideoContentMapping {
  id      String @id @default(cuid())
  videoId String

  // Flexible mapping (only ONE populated)
  objectiveId String?
  bulletId    String?
  subBulletId String?

  isPrimary      Boolean @default(false)
  confidence     Float   @default(1.0)  // AI score or 1.0 for manual
  mappingSource  String  @default("manual") // "ai_suggested" | "ai_confirmed" | "manual"

  createdAt DateTime @default(now())
}
```

**Embedding Cache Fields** added to:
- `CertificationDomain.embedding` (Bytes, nullable)
- `CertificationObjective.embedding` (Bytes, nullable)
- `Bullet.embedding` (Bytes, nullable)
- `SubBullet.embedding` (Bytes, nullable)
- All with `embeddingUpdatedAt` timestamp

### Implementation Tasks

**Database & Schema**:
- [x] Update Prisma schema with VideoContentMapping
- [x] Add embedding cache fields to all hierarchy levels
- [x] Run `yarn db:generate`
- [x] Push schema changes to database with `yarn db:push`

**Backend Services**:
- [x] Create OpenAI embedding service (`modules/content/services/embedding.service.ts`)
- [x] Build AI mapping service (`modules/content/services/aiMapping.service.ts`)
- [x] Create cosine similarity utility (integrated in embedding service)
- [ ] Build embedding cache population script (deferred - optional)

**Server Actions**:
- [x] `suggestMappings` - Trigger AI analysis for a video
- [x] `applyMappingSuggestions` - Accept/confirm AI suggestions (bulk)
- [x] `addManualMapping` - Manually add mapping
- [x] `removeMapping` - Remove mapping
- [x] `updatePrimaryMapping` - Set/unset primary flag
- [x] `getVideoMappings` - Get all mappings for a video
- [x] `searchContent` - Search objectives/bullets/sub-bullets for manual mapping

**UI Components**:
- [x] `/videos/[id]/map-objectives` - Dedicated mapping page
- [x] `SuggestedMappingCard` - Display AI suggestions with confidence
- [x] `MappingHierarchy` - Show Domain → Objective → Bullet → Sub-bullet
- [x] `ManualMappingCombobox` - Search combobox (shadcn style)
- [x] `VideoMappingClient` - Main client interface with all mapping functionality

**Client Hooks**:
- [x] `useMappingSuggestions` - Get AI suggestions
- [x] `useApplyMappings` - Bulk accept suggestions
- [x] `useManualMapping` - Add/remove mappings
- [x] `useVideoMappings` - Query current mappings
- [x] `useSearchContent` - Search content for manual mapping

**Background Jobs**:
- [ ] Trigger AI suggestions after transcription completes (moved to separate issue - optional enhancement)

**Testing**:
- [ ] Playwright E2E tests for mapping workflow (not required per user request)
- [ ] Jest tests for embedding service (not required per user request)
- [ ] Jest tests for AI mapping algorithm (not required per user request)

**Files Created** (20 files, ~1,500 lines of code):
- ✅ `modules/content/types/mapping.types.ts` - Mapping Zod schemas (171 lines)
- ✅ `modules/content/services/embedding.service.ts` - OpenAI embeddings (155 lines)
- ✅ `modules/content/services/aiMapping.service.ts` - AI suggestion engine (243 lines)
- ✅ `modules/content/serverActions/mapping.action.ts` - CRUD operations (528 lines)
- ✅ `modules/content/hooks/useMappingSuggestions.ts` - Suggestions hook
- ✅ `modules/content/hooks/useApplyMappings.ts` - Apply mappings hook
- ✅ `modules/content/hooks/useManualMapping.ts` - Manual mapping hooks
- ✅ `modules/content/hooks/useVideoMappings.ts` - Mappings query hook
- ✅ `modules/content/hooks/useSearchContent.ts` - Search content hook
- ✅ `modules/content/ui/SuggestedMappingCard.tsx` - AI suggestion card
- ✅ `modules/content/ui/ManualMappingCombobox.tsx` - Search combobox
- ✅ `modules/content/ui/MappingHierarchy.tsx` - Hierarchy display
- ✅ `app/(admin)/admin/content/videos/[id]/map-objectives/page.tsx` - Mapping page
- ✅ `app/(admin)/admin/content/videos/[id]/map-objectives/VideoMappingClient.tsx` - Client interface
- ✅ `components/ui/scroll-area.tsx` - Scroll area component
- ✅ `components/ui/separator.tsx` - Separator component

**Files Updated** (3 files):
- ✅ `schema/schema.prisma` - Added VideoContentMapping + embedding fields
- ✅ `modules/content/types/video.types.ts` - Updated VideoWithRelations
- ✅ `modules/content/serverActions/video.action.ts` - Updated to use contentMappings

### ✅ Implementation Summary

**What Works:**
- ✅ AI-powered semantic similarity mapping
- ✅ Flexible polymorphic mapping (objective/bullet/sub-bullet)
- ✅ Confidence scoring with visual badges
- ✅ Manual mapping via search combobox
- ✅ Primary mapping designation
- ✅ Full CRUD operations on mappings
- ✅ Embedding cache for cost optimization
- ✅ Complete UI with loading states, error handling, toast notifications

**Key Features:**
- Maps to lowest level possible for precision
- Cost: ~$0.0003 per video
- Top 5 suggestions with ≥70% confidence
- Manual override and additions supported
- Clean, intuitive UI/UX

**Build Status:**
- TypeScript: Clean ✅
- Next.js Build: Successful ✅
- ESLint: 2 pre-existing warnings only

**Optional Enhancements Deferred:**
- Background job integration (moved to separate issue)
- Embedding cache population script (embeddings generated on-demand)
- E2E and unit tests (not required per user)

### UI/UX Flow

```
Video List → Click "Map Objectives" → Mapping Page
                                         ↓
                          ┌──────────────────────────────┐
                          │ 🎥 Video: "Intro to Malware" │
                          │ 📝 Transcript: Available ✅   │
                          └──────────────────────────────┘
                                         ↓
                          ┌──────────────────────────────┐
                          │ 🤖 AI Suggested Mappings (5) │
                          │                              │
                          │ ☑️ 1.1 → Malware attacks     │
                          │    → Trojan.Generic chars... │
                          │    📊 94% ⭐ Primary         │
                          │                              │
                          │ ☑️ 1.2 → Indicators...       │
                          │    📊 87%                    │
                          │                              │
                          │ [Accept Selected] [Reject]   │
                          └──────────────────────────────┘
                                         ↓
                          ┌──────────────────────────────┐
                          │ ➕ Add More Manually          │
                          │                              │
                          │ 🔍 Search bullets...         │
                          │ → 1.1 | Malware | Worms      │
                          │ → 1.3 | Phishing | Email...  │
                          └──────────────────────────────┘
                                         ↓
                          [Save Mappings] → Done ✅
```

### Technical Notes

**Confidence Scoring**:
- 90-100%: 🟢 High confidence (very likely correct)
- 70-89%: 🟡 Medium confidence (probably correct)
- <70%: Not shown (too low to suggest)

**Primary Objective Logic**:
- AI suggests highest confidence as primary
- Instructor can override
- Only one primary per video
- Primary used for navigation (main topic)

**Edge Cases Handled**:
- Videos with no transcript: No AI suggestions (manual only)
- Videos with 0 mappings: Allowed (intro/outro videos)
- Failed transcriptions: Manual mapping still available
- Long transcripts: Chunked for embedding (max 8k tokens)

**Cost Analysis**:
- **Per Video**: ~$0.0003 (for embedding transcript)
- **Per Certification** (one-time): ~$0.01 (embed all objectives/bullets)
- **100 videos**: ~$0.04 total
- **Extremely cost-effective!**

---

### 📄 Issue #18: PDF/Document Upload with AI-Powered Mapping ✅ COMPLETED
**Status**: Complete & Closed
**Started**: 2025-10-25
**Completed**: 2025-10-25
**GitHub Issue**: [#18](https://github.com/jasondionsolutions/CertistryLMS/issues/18) - CLOSED
**Goal**: Upload and manage PDF/DOCX/TXT documents with AI-powered mapping to objectives/bullets/sub-bullets

## Implementation Strategy

**Key Decisions:**
- ✅ Reuse Video upload patterns for S3 upload
- ✅ Reuse Issue #17 mapping components (MappingHierarchy, ManualMappingCombobox)
- ✅ Documents map to LOWEST LEVEL (sub-bullets > bullets > objectives)
- ✅ AI-powered mapping using Claude API (active model from database)
- ✅ Text extraction from PDF/DOCX/TXT for semantic analysis
- ✅ Manual mapping via search combobox for additional mappings
- ✅ Support PDF (in-browser viewer), DOCX, TXT (download only)

## Files Created (18 files, ~1,800 lines of code)

### Types & Schemas (2 files)
- ✅ `modules/content/types/document.types.ts` - Document types & Zod schemas
- ✅ `modules/content/types/documentMapping.types.ts` - Document mapping types with full hierarchy

### Server Actions (2 files)
- ✅ `modules/content/serverActions/document.action.ts` - Document CRUD with RBAC
- ✅ `modules/content/serverActions/documentMapping.action.ts` - AI + manual mapping CRUD

### Services (2 files)
- ✅ `modules/content/services/textExtraction.service.ts` - PDF/DOCX/TXT text extraction
- ✅ `modules/content/services/documentAIMapping.service.ts` - Claude AI semantic analysis with dynamic model selection

### Client Hooks (4 files)
- ✅ `modules/content/hooks/useUploadDocument.ts` - Upload with progress tracking
- ✅ `modules/content/hooks/useDocuments.ts` - Query/update/delete documents
- ✅ `modules/content/hooks/useDocumentMappings.ts` - Query mappings with hierarchy
- ✅ `modules/content/hooks/useDocumentMappingSuggestions.ts` - AI suggestions

### UI Components (5 files)
- ✅ `modules/content/ui/DocumentUploadForm.tsx` - Drag-drop upload with validation
- ✅ `modules/content/ui/DocumentUploadProgress.tsx` - Progress bar
- ✅ `modules/content/ui/DocumentList.tsx` - Document table with actions
- ✅ `modules/content/ui/DocumentViewer.tsx` - react-pdf viewer with navigation
- ✅ `modules/content/ui/ManualMappingCombobox.tsx` - Updated to support documents (contentType prop)

### Admin Pages (3 files)
- ✅ `app/(admin)/admin/content/documents/page.tsx` - Document library
- ✅ `app/(admin)/admin/content/documents/upload/page.tsx` - Upload page
- ✅ `app/(admin)/admin/content/documents/[id]/map-objectives/page.tsx` - Mapping page
- ✅ `app/(admin)/admin/content/documents/[id]/map-objectives/DocumentMappingClient.tsx` - Client interface

## Implementation Tasks ✅ ALL COMPLETE

### Schema Changes
- [x] Update Prisma schema with DocumentContentMapping
- [x] Replace DocumentObjectiveMapping with flexible polymorphic mapping
- [x] Add objectiveId, bulletId, subBulletId fields (only ONE populated)
- [x] Add confidence, mappingSource, isPrimary fields
- [x] Run `yarn db:push` - successful migration

### Backend - Text Extraction
- [x] Install pdf-parse and mammoth dependencies
- [x] Create textExtraction.service.ts (PDF/DOCX/TXT extraction)
- [x] S3 integration with text extraction
- [x] Handle dynamic import for pdf-parse (CommonJS compatibility)
- [x] Text truncation for AI context limits (50k chars)

### Backend - AI Mapping
- [x] Create documentAIMapping.service.ts
- [x] Implement Claude API integration
- [x] Dynamic AI model selection from database (getActiveAIModel)
- [x] Build semantic analysis prompt
- [x] Parse Claude JSON response
- [x] Confidence scoring (≥60% threshold)
- [x] Top 5 suggestions with primary designation

### Backend - Server Actions
- [x] document.action.ts (CRUD with RBAC)
- [x] documentMapping.action.ts (suggest, apply, add, remove, update primary)
- [x] Update getDocument to include contentMappings with full hierarchy

### Client Hooks
- [x] useUploadDocument.ts (upload flow with progress)
- [x] useDocuments.ts (query documents list)
- [x] useDocumentMappings.ts (query mappings)
- [x] useDocumentMappingSuggestions.ts (AI suggestions)

### UI Components
- [x] DocumentUploadProgress.tsx (progress bar)
- [x] DocumentUploadForm.tsx (drag-drop, validation, metadata form)
- [x] DocumentList.tsx (table with actions)
- [x] DocumentViewer.tsx (react-pdf with page navigation)
- [x] Update ManualMappingCombobox to support documents (contentType prop)
- [x] Update MappingHierarchy to support DocumentContentMappingWithHierarchy
- [x] DocumentMappingClient.tsx (AI suggestions + manual mapping interface)

### Admin Pages
- [x] documents/page.tsx (library)
- [x] documents/upload/page.tsx (upload)
- [x] documents/[id]/map-objectives/page.tsx (mapping page)

### Testing & Polish
- [x] Fix type detection in MappingHierarchy (MappingSuggestion first)
- [x] Fix pdf-parse import (dynamic import)
- [x] Fix mimeType type assertion
- [x] Fix hardcoded AI model (use active model from database)
- [x] Run build - successful ✅
- [x] TypeScript clean ✅

### Additional Features (Post-Issue)
- [x] Modal dialogs for View, Edit, Delete (not system prompts)
- [x] ViewDocumentDialog - metadata view with download button
- [x] EditDocumentDialog - modal form for metadata editing
- [x] DeleteDocumentDialog - confirmation modal
- [x] AI description generation (like videos)
- [x] Text extraction from PDF/DOCX/TXT
- [x] AI description service with GPT-3.5-turbo (100 words)
- [x] Presigned S3 download URLs
- [x] Download button in document list action bar
- [x] Download button in view modal
- [x] Drag-and-drop file upload with browser prevention
- [x] Fixed PDF text extraction (switched to unpdf library)
- [x] Date formatting with date-fns
- [x] Installed dependencies: date-fns, unpdf

## Key Features

**Upload:**
- Drag-drop support with browser default prevention
- File validation: PDF, DOCX, TXT only, max 100MB
- Metadata form: title, description, type, version, allowDownload
- Progress tracking
- S3 storage: `dev/documents/{timestamp}-{filename}`
- AI description generation checkbox (defaults to checked)
- Text extraction using unpdf (PDF), mammoth (DOCX), buffer.toString (TXT)
- AI description with GPT-3.5-turbo (100 words)

**Library:**
- List all documents with metadata
- Search by title/description
- Filter by type (PDF/DOCX/TXT)
- Sort by date, title, size
- Actions: View (eye icon), Edit (pencil), Download (download icon), Map Objectives (link), Delete (trash)
- Modal dialogs for all actions (not system prompts)

**View Document Modal:**
- Read-only metadata view
- Document icon with type badge and version
- Description with AI-generated indicator
- File size and download permission status
- Created/updated timestamps (relative format)
- Objective mapping count
- Download button (presigned S3 URL)

**Edit Document Modal:**
- Form for editing title, description, version
- Toggle for allowDownload permission
- Save/Cancel buttons with loading states

**Delete Document Modal:**
- Confirmation dialog with document title
- Warning about cascade deletion of mappings
- Delete/Cancel buttons with loading states

**Download Functionality:**
- Presigned S3 download URLs (1-hour expiration)
- Download button in document list action bar
- Download button in view modal
- Permission check (only if allowDownload = true)
- Error handling with toast notifications

**Objective Mapping:**
- AI-powered mapping to objectives/bullets/sub-bullets (Claude API)
- Dynamic model selection from database (not hardcoded)
- Manual mapping via search combobox
- Primary mapping designation
- Add/remove mappings
- Display hierarchy: Domain → Objective → Bullet → Sub-bullet

## Document Mapping vs Video Mapping

**Similarities:**
- Reuse MappingHierarchy component
- Reuse ManualMappingCombobox
- Same CRUD operations (add, remove, update primary)

**Differences:**
- Documents: Map to objectives ONLY (simpler)
- Videos: Map to objectives/bullets/sub-bullets (complex)
- Documents: No AI suggestions (no transcript)
- Videos: AI suggestions via embeddings

---

### 📚 Issue #19: Content Library Management ✅ COMPLETED
**Status**: Complete (Started & Completed 2025-10-25)
**GitHub Issue**: [#19](https://github.com/jasondionsolutions/CertistryLMS/issues/19)
**Goal**: Comprehensive library for browsing, searching, and managing content

## 🎨 UX Design Decision: Sidebar Preview (Desktop) + Expandable Rows (Mobile)

**Desktop Layout** (Option A - Sidebar):
```
┌──────────────────────────────────┬────────────────────────────────┐
│ CONTENT LIST                     │ PREVIEW PANEL                  │
├──────────────────────────────────┤                                │
│ ☑ [📹] Video Title               │  📹 Video Player               │
│ ☐ [📄] Document Title            │  📊 Mappings                   │
│ ...                              │  📝 Metadata                   │
└──────────────────────────────────┴────────────────────────────────┘
```

**Mobile Layout** (Expandable Rows):
```
▼ [📹] Video Title
  ┌─────────────────────────────────┐
  │ [Video Player]                  │
  │ Metadata + Actions              │
  └─────────────────────────────────┘
▶ [📄] Document Title
```

**Preview Content**:
- Videos: Inline HTML5 video player
- PDFs: react-pdf viewer with page navigation
- DOCX/TXT: First 500 words text preview

## Implementation Plan

### Schema Changes
- [ ] Add `difficultyLevel` field to Document model (beginner/intermediate/advanced)
- [ ] Add PostgreSQL full-text search indexes (to_tsvector) for Video and Document
  - Video: title, description, transcript
  - Document: title, description

### Backend Services & Actions
- [ ] Update `textExtraction.service.ts` for preview (first 500 words)
- [ ] Create `contentLibrary.action.ts` - Unified search/filter/pagination
  - PostgreSQL full-text search (pg_search)
  - Server-side pagination (10 items per page)
  - Filters: content type, certification, difficulty, date range, mapped/unmapped
  - Sort: date, duration, title (alphabetical)
- [ ] Create `bulkOperations.action.ts` - Bulk delete, bulk re-map to certifications
- [ ] Create `contentStats.action.ts` - Statistics aggregation
  - Total videos/documents count
  - Total video duration
  - Breakdown by content type
  - Breakdown by certification (via mappings)
  - Total storage usage (file sizes)

### Types & Schemas
- [ ] Create `modules/content/types/contentLibrary.types.ts`
  - Unified content type (Video + Document union)
  - Search/filter/pagination schemas (Zod)
  - Statistics types

### Client Hooks
- [ ] `useContentLibrary` - Search, filter, pagination
- [ ] `useContentStats` - Statistics dashboard
- [ ] `useBulkOperations` - Bulk delete, bulk re-map
- [ ] `useContentPreview` - Preview panel state management

### UI Components
- [ ] `ContentStats.tsx` - Statistics dashboard (top of page)
- [ ] `ContentFilters.tsx` - Search bar + filters (type, cert, difficulty, date, mapped)
- [ ] `ContentGrid.tsx` - Grid view with thumbnails/icons
- [ ] `ContentList.tsx` - Table/list view
- [ ] `ContentPreviewSidebar.tsx` - Desktop sidebar (video/PDF/text preview)
- [ ] `ContentPreviewExpandable.tsx` - Mobile expandable rows
- [ ] `BulkActionsBar.tsx` - Bulk operations UI (delete, re-map)
- [ ] `ViewToggle.tsx` - Grid/list toggle button

### Admin Pages
- [ ] `app/(admin)/admin/content/page.tsx` - Main content library page
  - Responsive layout (desktop sidebar, mobile expandable)
  - Grid/list view toggle
  - Bulk selection checkboxes
  - Pagination controls

### Testing (Optional)
- [ ] Write Playwright E2E tests (if time permits)
- [ ] Write Jest component tests (if time permits)

## Files to Create (~15-20 files)

### Types (1 file)
- `modules/content/types/contentLibrary.types.ts`

### Services (1 file - update existing)
- Update: `modules/content/services/textExtraction.service.ts`

### Server Actions (3 files)
- `modules/content/serverActions/contentLibrary.action.ts`
- `modules/content/serverActions/bulkOperations.action.ts`
- `modules/content/serverActions/contentStats.action.ts`

### Client Hooks (4 files)
- `modules/content/hooks/useContentLibrary.ts`
- `modules/content/hooks/useContentStats.ts`
- `modules/content/hooks/useBulkOperations.ts`
- `modules/content/hooks/useContentPreview.ts`

### UI Components (8 files)
- `modules/content/ui/ContentStats.tsx`
- `modules/content/ui/ContentFilters.tsx`
- `modules/content/ui/ContentGrid.tsx`
- `modules/content/ui/ContentList.tsx`
- `modules/content/ui/ContentPreviewSidebar.tsx`
- `modules/content/ui/ContentPreviewExpandable.tsx`
- `modules/content/ui/BulkActionsBar.tsx`
- `modules/content/ui/ViewToggle.tsx`

### Admin Pages (1 file)
- `app/(admin)/admin/content/page.tsx`

## Technical Implementation Details

**PostgreSQL Full-Text Search**:
```sql
-- Create tsvector indexes for fast full-text search
CREATE INDEX videos_search_idx ON videos
  USING gin(to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || coalesce(transcript, '')));

CREATE INDEX documents_search_idx ON documents
  USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
```

**Unified Content Query**:
```typescript
// Fetch videos and documents in a single query with unified interface
const videos = await prisma.video.findMany({ ... });
const documents = await prisma.document.findMany({ ... });
const content = [...videos.map(v => ({ ...v, contentType: 'video' })),
                 ...documents.map(d => ({ ...d, contentType: 'document' }))];
```

**Bulk Operations**:
- Bulk delete: Cascade delete videos/documents with confirmations
- Bulk re-map: Update certification associations for selected items

**Statistics Aggregation**:
```typescript
// Efficient aggregation queries
const stats = {
  totalVideos: await prisma.video.count(),
  totalDocuments: await prisma.document.count(),
  totalDuration: await prisma.video.aggregate({ _sum: { duration: true } }),
  totalStorage: await prisma.$queryRaw`SELECT SUM(file_size) FROM videos UNION ALL SELECT SUM(file_size) FROM documents`,
  byCertification: await prisma.video.groupBy({ by: ['certificationId'], _count: true }),
};
```

## Estimated Time
~4-5 hours

## ✅ Completion Summary

**All Tasks Completed:**
- [x] Schema updates (added difficultyLevel to Document model)
- [x] Backend services and server actions (3 files)
- [x] Client hooks (4 files)
- [x] UI components (8 files: grid, list, preview, filters, stats, bulk actions, view toggle)
- [x] Main content library page with responsive layout
- [x] Testing and bug fixes (build successful ✅)

**Files Created:** 18 files (~2,200 lines of code)

**Build Status:**
- TypeScript: Clean ✅
- Next.js Build: Successful ✅
- ESLint: Only pre-existing warnings

**Features Implemented:**
- ✅ Unified content search (videos + documents)
- ✅ Advanced filters (type, cert, difficulty, date, mapped status)
- ✅ Server-side pagination (10 items per page)
- ✅ Grid and list view toggle
- ✅ Desktop sidebar preview with video player placeholder
- ✅ Mobile expandable row previews
- ✅ Comprehensive statistics dashboard
- ✅ Bulk delete operation (with cascade confirmation)
- ✅ Bulk re-map to certifications (videos only)
- ✅ Responsive layout (desktop/mobile optimized)
- ✅ Checkbox selection with bulk actions bar
- ✅ Sort by date, title, duration, file size

**Route:** `/admin/content` (main content library)

---

## Database Schema Changes

### New Models

#### DocumentObjectiveMapping (NEW - Many-to-Many)
```prisma
model DocumentObjectiveMapping {
  id          String @id @default(cuid())
  documentId  String @map("document_id")
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  objectiveId String @map("objective_id")
  objective   CertificationObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)

  isPrimary   Boolean @default(false) @map("is_primary")

  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([documentId, objectiveId])
  @@index([documentId])
  @@index([objectiveId])
  @@map("document_objective_mappings")
}
```

### Updated Models

#### Video (UPDATED)
**New Fields**:
- `description` - Rich metadata for search
- `s3Key` - S3 object key (unique)
- `thumbnailUrl` - Thumbnail URL (auto or custom)
- `thumbnailS3Key` - Custom thumbnail S3 key
- `transcriptionStatus` - pending/processing/completed/failed
- `transcriptionError` - Error message if failed
- `fileSize` - File size in bytes
- `mimeType` - video/mp4, etc.
- `uploadedBy` - User ID who uploaded
- `allowDownload` - Can students download?

#### Document (UPDATED)
**Changes**:
- Remove `objectiveId` (moving to junction table)
- Add `description` - Document description
- Add `s3Key` - S3 object key
- Add `fileSize` - File size in bytes
- Add `mimeType` - application/pdf, etc.
- Add `uploadedBy` - User ID who uploaded
- Add `allowDownload` - Downloadable toggle
- Add `version` - Document versioning

---

## Environment Variables Needed

```env
# Existing (confirmed in .env)
AWS_S3_BUCKET_NAME=certistrylms
AWS_S3_FOLDER=dev
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_REGION=***

# Need to add
OPENAI_API_KEY=*** # For Whisper API
UPSTASH_REDIS_URL=*** # For BullMQ
```

---

## RBAC Permissions to Define

```typescript
// lib/auth/permissions.ts
export const PERMISSIONS = {
  // Content Management
  'content.upload': ['admin', 'instructor'],
  'content.manage': ['admin', 'instructor'],
  'content.delete': ['admin'],
  'content.view': ['admin', 'instructor', 'user'], // Students can view in LMS

  // Content Library (Admin area only)
  'content.library.access': ['admin', 'instructor'],
} as const;
```

---

## Testing Requirements

Each issue MUST have:
1. **Playwright E2E Tests**: UI interactions, CRUD operations, form submissions
2. **Jest Component Tests**: Hooks, utilities, business logic
3. **Test Coverage**: Success cases, error states, edge cases, validation

---

## Future Improvements: Long Video Support

**Current Limitation:** Videos >10-15 minutes may timeout (Vercel Pro 5-minute function limit)

### Problem
- Whisper API processes in real-time (~1 minute per 1 minute of video)
- 60-minute video = ~60 minutes of transcription time
- 3-hour video = ~3 hours of transcription time
- Vercel Pro max: 5 minutes (300 seconds)

### Long-term Solutions (Prioritized)

#### Option 1: Background Worker Service (RECOMMENDED)
**Use a dedicated long-running worker outside Vercel:**
- **AWS Lambda** (15-minute timeout) - $0.20 per 1M requests
- **Railway** - Always-on workers, unlimited runtime
- **Render** - Background workers with long timeouts
- **Modal.com** - Serverless GPU workers (fast transcription)

**Architecture:**
```
1. User uploads video → S3
2. Vercel app adds job to queue (BullMQ/Upstash)
3. External worker picks up job (polling or webhook)
4. Worker transcribes (unlimited time)
5. Worker updates Neon database when complete
6. UI shows real-time status via polling
```

**Pros:**
- ✅ Handles videos of any length (hours)
- ✅ No Vercel timeout limitations
- ✅ Can scale independently
- ✅ Keep existing queue system

**Cons:**
- ❌ Additional service to manage
- ❌ Small additional cost (~$5-10/month)

**Implementation Complexity:** Medium (1-2 hours)

---

#### Option 2: Alternative Transcription API (EASIER)
**Use Assembly AI or Deepgram** (async APIs with webhooks):

**Assembly AI:**
- Submit video URL → Get job ID instantly
- Webhook callback when done (no timeout)
- Supports files up to 5GB
- $0.008/min (slightly more expensive than Whisper)

**Deepgram:**
- Similar async model
- $0.0043/min (cheaper than Whisper!)
- Supports streaming and batch

**Architecture:**
```
1. User uploads video → S3
2. Vercel submits S3 URL to Assembly AI
3. Assembly AI calls webhook when done
4. Webhook endpoint updates database
5. No timeout issues!
```

**Pros:**
- ✅ No timeout limitations
- ✅ Built for async processing
- ✅ Webhook-based (fire and forget)
- ✅ Minimal code changes

**Cons:**
- ❌ Slightly more expensive (but not much)
- ❌ Different API (need to rewrite whisper.service.ts)

**Implementation Complexity:** Low (30 minutes)

---

#### Option 3: Video Chunking (COMPLEX)
**Split long videos into smaller segments:**
- Use ffmpeg to split video into 5-minute chunks
- Transcribe each chunk separately
- Combine transcripts with proper timestamps

**Pros:**
- ✅ Works within Vercel limits
- ✅ Keep using Whisper API

**Cons:**
- ❌ Requires ffmpeg (not available in Vercel!)
- ❌ Would need separate chunking service anyway
- ❌ Complex timestamp alignment
- ❌ More API calls = higher cost

**Implementation Complexity:** High (4-6 hours)

---

#### Option 4: BullMQ Job Splitting (HACKY)
**Let job timeout and resume:**
- Configure BullMQ to retry on timeout
- Each retry processes next segment
- Track progress in job data

**Pros:**
- ✅ Minimal code changes
- ✅ Use existing infrastructure

**Cons:**
- ❌ Very inefficient (many timeouts)
- ❌ High cost (multiple Whisper API calls)
- ❌ Poor UX (takes forever)
- ❌ Not reliable

**Implementation Complexity:** Low but not recommended

---

### Recommended Path Forward

**For Now (MVP):**
- ✅ Current solution works for videos <10-15 minutes
- ✅ 80% of educational videos are <15 minutes
- ✅ Manual transcript upload for longer videos

**Phase 3 (After MVP):**
- Implement **Option 1** (Background Worker Service)
- Use Railway or AWS Lambda for unlimited processing time
- Keep Vercel for web app, move heavy processing to workers

**Phase 4 (Optional Optimization):**
- Switch to **Option 2** (Assembly AI/Deepgram)
- Better async model, built for this use case
- Similar cost, better reliability

---

## Definition of Done (Phase 2)

- [x] All tech stack decisions made
- [ ] Prisma schema updated and migrated
- [ ] BullMQ + Upstash configured
- [ ] Videos can be uploaded to S3 with progress tracking
- [ ] Video transcripts generated automatically via Whisper
- [ ] Videos/docs mapped to exam objectives (many-to-many)
- [ ] Content library searchable and filterable
- [ ] At least 10 test videos uploaded for Security+
- [ ] Objective mapping validated
- [ ] ESLint errors resolved
- [ ] TypeScript strict mode passing

---

## Next Phase

After Phase 2 completion → **Phase 3: AI-Assisted Quiz Creator**
