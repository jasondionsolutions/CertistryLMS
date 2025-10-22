# File Upload Guide - Server Actions & S3 Integration

## Overview

This guide explains how to use the file upload server actions to securely upload, replace, and manage files in CertistryLMS. All files are stored in AWS S3 with private access, tracked in the database, and protected with role-based access control (RBAC).

---

## Architecture

### File Upload Flow

```
Client Component
    ↓ (calls hook)
Custom Hook (useUploadFile)
    ↓ (calls server action)
Server Action (uploadFileAction) ← RBAC Protection (admin/instructor only)
    ↓
S3 Upload (lib/aws/s3.ts)
    ↓
Database Tracking (Prisma File model)
    ↓
Return { success, data }
```

### Security Layers

1. **Authentication**: All actions require valid session (withAccess/withRole)
2. **Authorization**: Upload/Replace/Delete restricted to admin/instructor roles
3. **Private Files**: All files require pre-signed URLs (no public access)
4. **File Tracking**: Database tracks all uploads to prevent orphans
5. **Size Validation**: Enforced at application layer (1 GB videos, 50 MB PDFs, 10 MB images)

---

## File Categories

| Category | Max Size | Allowed Types | Purpose |
|----------|----------|---------------|---------|
| `videos` | 1 GB | video/mp4, video/webm | Course videos, lectures |
| `pdfs` | 50 MB | application/pdf | Study guides, documents |
| `images` | 10 MB | image/jpeg, image/png, image/webp | Diagrams, screenshots |
| `thumbnails` | 10 MB | image/jpeg, image/png, image/webp | Video thumbnails, previews |

---

## Server Actions Reference

### 1. Upload File

**Action**: `uploadFileAction`
**Access**: Admin, Instructor
**Purpose**: Upload a new file to S3 and track in database

**Function Signature**:
```typescript
uploadFileAction(
  fileData: Buffer,
  input: FileUploadInput
): Promise<FileUploadResponse>
```

**Input Schema**:
```typescript
{
  fileName: string;          // Original file name (e.g., "intro-video.mp4")
  category: "videos" | "pdfs" | "images" | "thumbnails";
  contentType: string;       // MIME type (e.g., "video/mp4")
  subfolder?: string;        // Optional subfolder (e.g., "security-plus/module-1")
  referencedBy?: string;     // Optional: ID of parent resource (e.g., videoId)
  referenceType?: string;    // Optional: Type of parent (e.g., "video")
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    id: string;              // Database file ID
    key: string;             // S3 key (e.g., "dev/videos/1234-intro.mp4")
    url: string;             // S3 URL (requires pre-signed URL for access)
    fileName: string;        // Original file name
    fileSize: number;        // Size in bytes
    category: string;        // File category
  };
  error?: string;
}
```

**Example Usage in Hook**:
```typescript
// hooks/useUploadVideo.ts
import { useMutation } from "@tanstack/react-query";
import { uploadFileAction } from "@/modules/fileUpload/serverActions/fileUpload.action";

export function useUploadVideo() {
  return useMutation({
    mutationFn: async (file: File) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      return uploadFileAction(buffer, {
        fileName: file.name,
        category: "videos",
        contentType: file.type,
        subfolder: "security-plus/module-1",
      });
    },
    onError: (error) => {
      console.error("Upload failed:", error);
    },
    onSuccess: (response) => {
      if (response.success) {
        console.warn("File uploaded:", response.data);
      }
    },
  });
}
```

**Example Usage in Component**:
```typescript
// components/VideoUploadForm.tsx
"use client";

import { useUploadVideo } from "@/hooks/useUploadVideo";

export function VideoUploadForm() {
  const { mutate: uploadVideo, isPending } = useUploadVideo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isPending}
      />
      {isPending && <p>Uploading...</p>}
    </div>
  );
}
```

---

### 2. Replace File

**Action**: `replaceFileAction`
**Access**: Admin, Instructor
**Purpose**: Replace an existing file with automatic cleanup of old file

**Function Signature**:
```typescript
replaceFileAction(
  fileData: Buffer,
  input: FileReplaceInput
): Promise<FileReplaceResponse>
```

**Input Schema**:
```typescript
{
  oldFileId: string;         // Database ID of file to replace
  fileName: string;          // New file name
  category: "videos" | "pdfs" | "images" | "thumbnails";
  contentType: string;       // MIME type
  subfolder?: string;        // Optional subfolder
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    id: string;              // Same database ID (updated)
    key: string;             // New S3 key
    url: string;             // New S3 URL
    fileName: string;        // New file name
  };
  error?: string;
}
```

**Example Usage**:
```typescript
// hooks/useReplaceVideo.ts
export function useReplaceVideo() {
  return useMutation({
    mutationFn: async ({ oldFileId, newFile }: { oldFileId: string; newFile: File }) => {
      const buffer = Buffer.from(await newFile.arrayBuffer());

      return replaceFileAction(buffer, {
        oldFileId,
        fileName: newFile.name,
        category: "videos",
        contentType: newFile.type,
      });
    },
  });
}
```

**Use Case**: When a video needs to be updated (e.g., fixing typos in slides), this automatically:
1. Uploads the new file to S3
2. Updates the database record
3. Deletes the old file from S3 (prevents orphan files)

---

### 3. Delete File

**Action**: `deleteFileAction`
**Access**: Admin only
**Purpose**: Permanently delete a file from S3 and database

**Function Signature**:
```typescript
deleteFileAction(
  input: FileDeleteInput
): Promise<FileDeleteResponse>
```

**Input Schema**:
```typescript
{
  fileId: string;            // Database ID of file to delete
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example Usage**:
```typescript
// hooks/useDeleteFile.ts
export function useDeleteFile() {
  return useMutation({
    mutationFn: (fileId: string) => deleteFileAction({ fileId }),
  });
}
```

---

### 4. Get Pre-signed Download URL

**Action**: `getPresignedUrlAction`
**Access**: All authenticated users
**Purpose**: Generate a temporary download URL for private files

**Function Signature**:
```typescript
getPresignedUrlAction(
  input: PresignedUrlInput
): Promise<PresignedUrlResponse>
```

**Input Schema**:
```typescript
{
  fileId: string;            // Database ID of file
  expiresIn?: number;        // Optional: Expiration in seconds (default: 3600 = 1 hour)
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    url: string;             // Pre-signed URL (valid for expiresIn seconds)
    expiresIn: number;       // Expiration duration
  };
  error?: string;
}
```

**Example Usage**:
```typescript
// hooks/useVideoUrl.ts
import { useQuery } from "@tanstack/react-query";
import { getPresignedUrlAction } from "@/modules/fileUpload/serverActions/fileUpload.action";

export function useVideoUrl(fileId: string | null) {
  return useQuery({
    queryKey: ["video-url", fileId],
    queryFn: () => getPresignedUrlAction({ fileId: fileId! }),
    enabled: !!fileId,
    staleTime: 30 * 60 * 1000, // 30 minutes (refresh before expiration)
  });
}

// Component usage
function VideoPlayer({ fileId }: { fileId: string }) {
  const { data: urlResponse, isLoading } = useVideoUrl(fileId);

  if (isLoading) return <p>Loading video...</p>;
  if (!urlResponse?.success) return <p>Failed to load video</p>;

  return <video src={urlResponse.data.url} controls />;
}
```

---

### 5. List Files

**Action**: `listFilesAction`
**Access**: Admin, Instructor
**Purpose**: List all files with optional filters

**Function Signature**:
```typescript
listFilesAction(
  category?: string,
  referencedBy?: string
): Promise<FileListResponse>
```

**Response**:
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    referencedBy?: string | null;
    referenceType?: string | null;
    uploadedBy?: string | null;
    createdAt: Date;
  }>;
  error?: string;
}
```

**Example Usage**:
```typescript
// List all videos
const videos = await listFilesAction("videos");

// List files for a specific video (thumbnails, PDFs, etc.)
const relatedFiles = await listFilesAction(undefined, videoId);
```

---

### 6. Get File

**Action**: `getFileAction`
**Access**: All authenticated users
**Purpose**: Get file metadata by ID

**Function Signature**:
```typescript
getFileAction(fileId: string): Promise<{
  success: boolean;
  data?: File;
  error?: string;
}>
```

**Example Usage**:
```typescript
const fileMetadata = await getFileAction("file_123");
```

---

## File Upload Best Practices

### 1. Always Track References

When uploading files for specific resources (videos, documents, etc.), always provide `referencedBy` and `referenceType`:

```typescript
uploadFileAction(buffer, {
  fileName: "thumbnail.jpg",
  category: "thumbnails",
  contentType: "image/jpeg",
  referencedBy: videoId,        // ✅ Track parent resource
  referenceType: "video",       // ✅ Specify resource type
});
```

This prevents orphan files and helps with cleanup when deleting resources.

---

### 2. Use Replace Instead of Delete + Upload

❌ **Wrong** (leaves orphan files if upload fails):
```typescript
await deleteFileAction({ fileId: oldFileId });
await uploadFileAction(buffer, input);  // If this fails, old file is gone!
```

✅ **Correct** (atomic operation):
```typescript
await replaceFileAction(buffer, {
  oldFileId,
  fileName: "new-file.mp4",
  category: "videos",
  contentType: "video/mp4",
});
```

---

### 3. Refresh Pre-signed URLs Before Expiration

Pre-signed URLs expire (default: 1 hour). Use React Query's `staleTime` to refresh automatically:

```typescript
useQuery({
  queryKey: ["video-url", fileId],
  queryFn: () => getPresignedUrlAction({ fileId }),
  staleTime: 30 * 60 * 1000, // Refresh after 30 min (before 1 hour expiration)
});
```

---

### 4. Validate File Types on Client

Add client-side validation before uploading:

```typescript
function validateVideoFile(file: File): string | null {
  const maxSize = 1024 * 1024 * 1024; // 1 GB
  const allowedTypes = ["video/mp4", "video/webm"];

  if (!allowedTypes.includes(file.type)) {
    return "Only MP4 and WebM videos are allowed";
  }

  if (file.size > maxSize) {
    return "Video must be smaller than 1 GB";
  }

  return null; // Valid
}
```

---

### 5. Handle Upload Progress

For large files, show upload progress:

```typescript
export function useUploadVideoWithProgress() {
  const [progress, setProgress] = useState(0);

  const upload = async (file: File) => {
    const chunks = 100; // Simulate progress
    for (let i = 0; i <= chunks; i++) {
      setProgress((i / chunks) * 100);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    return uploadFileAction(buffer, { /* ... */ });
  };

  return { upload, progress };
}
```

---

## Error Handling

All server actions return a consistent response format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

**Handle errors in components**:

```typescript
const { mutate: uploadVideo } = useUploadVideo();

uploadVideo(file, {
  onSuccess: (response) => {
    if (response.success) {
      toast.success("Video uploaded successfully");
    } else {
      toast.error(response.error || "Upload failed");
    }
  },
  onError: (error) => {
    toast.error("Network error: " + error.message);
  },
});
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Authentication required" | User not logged in | Redirect to login |
| "Access denied. Required role(s): admin or instructor" | User doesn't have permission | Show permission error page |
| "File size exceeds maximum allowed size" | File too large | Compress or split file |
| "File not found" | Invalid file ID | Check file exists before accessing |
| "File not found in storage" | File deleted from S3 but exists in DB | Delete database record |

---

## File Cleanup Strategy

### Automatic Cleanup

The `replaceFileAction` automatically deletes old files when replacing:
```typescript
// Old file is deleted AFTER new file uploads successfully
await replaceFileAction(buffer, { oldFileId, ... });
```

### Manual Cleanup (Admin Only)

Delete orphan files that are no longer referenced:
```typescript
// Find files without references
const orphans = await prisma.file.findMany({
  where: {
    referencedBy: null,
    createdAt: { lt: thirtyDaysAgo }
  }
});

// Delete each orphan
for (const orphan of orphans) {
  await deleteFileAction({ fileId: orphan.id });
}
```

---

## Testing File Uploads

### 1. Test Upload

```bash
# Create test video file
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 test-video.mp4
```

Upload via your application and verify:
- ✅ File appears in S3 bucket (`dev/videos/`)
- ✅ Database record created in `files` table
- ✅ Pre-signed URL works for download

### 2. Test Replace

Upload a file, then replace it with a new version. Verify:
- ✅ Old S3 file is deleted
- ✅ New S3 file is uploaded
- ✅ Database record is updated (same ID, new key)

### 3. Test Delete

Delete a file and verify:
- ✅ S3 file is removed
- ✅ Database record is removed

---

## Production Considerations

### 1. CloudFront Integration (Future)

For production scale, add CloudFront CDN:
- Faster video delivery globally
- Reduced S3 transfer costs (50%+ savings)
- Edge caching for frequently accessed files

### 2. Video Transcoding (Future)

For adaptive streaming:
- Use AWS MediaConvert to create HLS/DASH streams
- Generate multiple resolutions (360p, 720p, 1080p)
- Enable adaptive bitrate streaming

### 3. File Compression

Optimize before uploading:
- **Videos**: Use H.264 codec with CRF 23 (good quality, smaller size)
- **PDFs**: Compress with Ghostscript
- **Images**: Use WebP format (30% smaller than JPEG)

---

## Troubleshooting

### Issue: "CORS policy" error in browser console

**Solution**: Verify CORS configuration in S3 bucket settings includes your domain.

### Issue: "Access Denied" when uploading

**Solution**:
1. Check IAM user has correct policy attached
2. Verify credentials in `.env` file
3. Ensure bucket name is correct

### Issue: Pre-signed URL returns 403

**Solution**:
- URLs expire (default 1 hour) - regenerate URL
- File may have been deleted - verify file exists

---

## Next Steps

After implementing file uploads:
1. ✅ Create admin dashboard for file management
2. ✅ Add file upload UI components
3. ✅ Implement video player with adaptive streaming
4. ✅ Add thumbnail generation for videos
5. ✅ Set up CloudFront for production

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Status**: Ready for implementation
