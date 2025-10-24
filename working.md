# Phase 2: Content Upload & Objective Mapping - Working Document

**Last Updated**: 2025-10-23 (Issue #16 COMPLETED & DEPLOYED ✅)
**Status**: Issue #16 Complete - Ready for Issue #17
**Current Issue**: #17 - TBD
**Next Action**: Begin next issue in Phase 2
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

🚀 **Next**:
- **Issue #17**: TBD - Continue Phase 2

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
- [ ] Write Playwright E2E tests
- [ ] Write Jest component tests

**Files to Create**:
- `modules/content/serverActions/transcription.action.ts` - Queue job creation
- `modules/content/services/whisper.service.ts` - Whisper API calls
- `modules/content/hooks/useTranscriptionStatus.ts` - Poll status
- `modules/content/ui/TranscriptionStatus.tsx` - Status display
- `app/api/workers/transcription/route.ts` - BullMQ worker
- `lib/queue/transcriptionQueue.ts` - Queue setup
- `tests/transcription.spec.ts` - E2E tests

---

### 🎯 Issue #17: Content-to-Objective Mapping (Est: 4 hours)
**Goal**: Map videos/documents to multiple exam objectives (many-to-many)

**Tasks**:
- [ ] Create objective picker component (multi-select)
- [ ] Implement search/filter by domain or keyword
- [ ] Display visual hierarchy (Domain → Objective → Sub-objective)
- [ ] Bulk mapping (one video → multiple objectives)
- [ ] Remove mappings
- [ ] Preview mapped content per objective
- [ ] Difficulty level tagging
- [ ] Optimistic updates for fast UX
- [ ] Validation (at least 1 objective required)
- [ ] Write Playwright E2E tests
- [ ] Write Jest component tests

**Files to Create**:
- `modules/content/types/mapping.types.ts` - Mapping schemas
- `modules/content/serverActions/mapping.action.ts` - CRUD operations
- `modules/content/hooks/useObjectiveMappings.ts` - Client hook
- `modules/content/ui/ObjectivePicker.tsx` - Multi-select component
- `modules/content/ui/ObjectiveTree.tsx` - Hierarchical display
- `modules/content/ui/MappingPreview.tsx` - Preview component
- `tests/objective-mapping.spec.ts` - E2E tests

---

### 📄 Issue #18: PDF/Document Upload (Est: 3 hours)
**Goal**: Upload and manage PDF/DOCX/TXT documents with objective mapping

**Tasks**:
- [ ] Create document upload server action (reuse S3 infrastructure)
- [ ] File validation (PDF, DOCX, TXT)
- [ ] Document metadata form (title, description, type)
- [ ] Map documents to objectives (reuse mapping UI)
- [ ] In-browser PDF viewer (react-pdf)
- [ ] Download toggle (instructor can enable/disable per doc)
- [ ] Document versioning support (v1, v2)
- [ ] Text extraction from DOCX/TXT for search
- [ ] Write Playwright E2E tests
- [ ] Write Jest component tests

**Files to Create**:
- `modules/content/types/document.types.ts` - Document schemas
- `modules/content/serverActions/document.action.ts` - Document CRUD
- `modules/content/hooks/useUploadDocument.ts` - Upload hook
- `modules/content/ui/DocumentUploadForm.tsx` - Upload component
- `modules/content/ui/DocumentViewer.tsx` - PDF viewer
- `tests/document-upload.spec.ts` - E2E tests

---

### 📚 Issue #19: Content Library Management (Est: 4 hours)
**Goal**: Comprehensive library for browsing, searching, and managing content

**Tasks**:
- [ ] Build content list with thumbnails (videos) and icons (docs)
- [ ] Implement search (title, transcript, objectives)
- [ ] Filter by content type, difficulty, certification
- [ ] Sort by date, duration, alphabetically
- [ ] Bulk operations (delete, re-map, tag)
- [ ] Content statistics dashboard (total videos, duration, etc.)
- [ ] Inline preview (video player, PDF viewer)
- [ ] Server-side pagination (50 items per page)
- [ ] Virtual scrolling for performance
- [ ] Full-text search (Postgres or Algolia)
- [ ] Write Playwright E2E tests
- [ ] Write Jest component tests

**Files to Create**:
- `app/(admin)/admin/content/page.tsx` - Content library page
- `modules/content/serverActions/contentLibrary.action.ts` - Search/filter
- `modules/content/hooks/useContentLibrary.ts` - Client hook
- `modules/content/ui/ContentLibrary.tsx` - Main library component
- `modules/content/ui/ContentGrid.tsx` - Grid view
- `modules/content/ui/ContentFilters.tsx` - Filter controls
- `modules/content/ui/BulkActions.tsx` - Bulk operations
- `modules/content/ui/ContentStats.tsx` - Statistics dashboard
- `tests/content-library.spec.ts` - E2E tests

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
- [ ] All Playwright E2E tests passing
- [ ] All Jest component tests passing
- [ ] ESLint errors resolved
- [ ] TypeScript strict mode passing

---

## Next Phase

After Phase 2 completion → **Phase 3: AI-Assisted Quiz Creator**
