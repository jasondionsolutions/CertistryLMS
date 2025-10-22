# AWS S3 Setup Guide - File Storage for CertistryLMS

## Overview

This guide walks through setting up AWS S3 for secure file storage with a dedicated IAM user, custom policies, and proper CORS configuration for the CertistryLMS application.

---

## Bucket Information

- **Bucket Name**: `certistrylms`
- **Region**: `us-east-1` (or your preferred region)
- **Access**: Private (pre-signed URLs required)
- **Structure**: Environment-based folders

---

## Folder Structure

```
certistrylms/
├── dev/
│   ├── videos/
│   ├── pdfs/
│   ├── images/
│   └── thumbnails/
├── staging/
│   ├── videos/
│   ├── pdfs/
│   ├── images/
│   └── thumbnails/
└── prod/
    ├── videos/
    ├── pdfs/
    ├── images/
    └── thumbnails/
```

---

## File Size Limits

| File Type | Max Size | Purpose |
|-----------|----------|---------|
| Videos | 1 GB (1024 MB) | Course videos, lectures |
| PDFs | 50 MB | Study materials, guides |
| Images | 10 MB | Thumbnails, diagrams |

---

## Step 1: Create S3 Bucket

### 1.1 Navigate to S3
1. Sign in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3** service
3. Click **Create bucket**

### 1.2 Configure Bucket
**Basic Settings:**
- **Bucket name**: `certistrylms`
- **AWS Region**: `us-east-1` (or your region)

**Object Ownership:**
- ✅ **ACLs disabled** (recommended)

**Block Public Access:**
- ✅ **Block all public access** (we'll use pre-signed URLs)

**Bucket Versioning:**
- ✅ **Enable** (allows content updates and rollback)

**Default Encryption:**
- ✅ **Enable** server-side encryption (SSE-S3)

**Object Lock:**
- ❌ Disable (not needed for MVP)

Click **Create bucket**

---

## Step 2: Configure CORS

CORS allows your Next.js app to upload files directly from the browser.

### 2.1 Open Bucket Settings
1. Click on `certistrylms` bucket
2. Go to **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**

### 2.2 Add CORS Configuration

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.vercel.app",
      "https://certistry.com",
      "https://www.certistry.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-custom-header"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Update** `AllowedOrigins` with your production domain when deployed.

Click **Save changes**

---

## Step 3: Create IAM User

### 3.1 Navigate to IAM
1. Go to **IAM** service
2. Click **Users** in left sidebar
3. Click **Add users**

### 3.2 Configure User
**User name**: `certistry-lms-app`

**Access type:**
- ❌ AWS Management Console access (not needed)
- ✅ Programmatic access (we need Access Keys)

Click **Next: Permissions**

---

## Step 4: Create Custom IAM Policy

Instead of using default policies, we'll create a **least privilege** policy.

### 4.1 Create Policy
1. In the permissions screen, click **Attach policies directly**
2. Click **Create policy**
3. Switch to **JSON** tab

### 4.2 Paste Custom Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::certistrylms"
    },
    {
      "Sid": "ReadWriteDeleteObjects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectAttributes"
      ],
      "Resource": "arn:aws:s3:::certistrylms/*"
    },
    {
      "Sid": "GeneratePresignedUrls",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::certistrylms/*"
    }
  ]
}
```

### 4.3 Name the Policy
- **Policy name**: `CertistryLMS-S3-Access`
- **Description**: "S3 access for CertistryLMS app - upload, download, delete files"

Click **Create policy**

### 4.4 Attach Policy to User
1. Go back to the user creation screen
2. Search for `CertistryLMS-S3-Access`
3. ✅ Select the policy
4. Click **Next: Tags** (skip tags)
5. Click **Next: Review**
6. Click **Create user**

---

## Step 5: Save Access Keys

⚠️ **IMPORTANT**: You only see these once!

### 5.1 Download Credentials
After creating the user, you'll see:
- **Access key ID**: `AKIA...` (copy this)
- **Secret access key**: `wJalr...` (copy this)

**Click "Download .csv"** to save a backup.

### 5.2 Add to .env File

Add these to your `.env` file (NOT `.env.example`):

```bash
AWS_S3_REGION="us-east-1"
AWS_S3_BUCKET_NAME="certistrylms"
AWS_S3_ACCESS_KEY_ID="AKIA..."
AWS_S3_SECRET_ACCESS_KEY="wJalr..."
AWS_S3_FOLDER="dev"  # or "staging" or "prod"
```

⚠️ **Never commit `.env` to git!** It's already in `.gitignore`.

---

## Step 6: Set Lifecycle Rules (Cost Optimization)

Automatically delete incomplete multipart uploads to save costs.

### 6.1 Create Lifecycle Rule
1. Go to bucket → **Management** tab
2. Click **Create lifecycle rule**

### 6.2 Configure Rule
**Rule name**: `delete-incomplete-uploads`

**Rule scope:**
- ✅ Apply to all objects in the bucket

**Lifecycle rule actions:**
- ✅ Delete expired object delete markers or incomplete multipart uploads

**Days after initiation**: `7`

Click **Create rule**

---

## Step 7: Verify Setup

### 7.1 Test Upload (via AWS Console)
1. Go to bucket → **Objects** tab
2. Click **Upload**
3. Add a test file
4. Confirm it uploads successfully

### 7.2 Test with Application
After implementing the upload utilities (next step), test:
```bash
yarn dev
# Upload a file via the app
# Verify it appears in S3 bucket
```

---

## Security Best Practices

✅ **Do:**
- Use pre-signed URLs for all file access
- Rotate access keys every 90 days
- Enable bucket versioning for content recovery
- Use server-side encryption (enabled by default)
- Monitor CloudWatch for unusual activity

❌ **Don't:**
- Make bucket public
- Commit AWS credentials to git
- Share access keys in Slack/Discord
- Use root account credentials
- Give broader permissions than needed

---

## Monitoring Costs

### S3 Pricing (us-east-1)
- **Storage**: $0.023/GB/month
- **PUT/POST**: $0.005 per 1,000 requests
- **GET**: $0.0004 per 1,000 requests
- **Data Transfer OUT**: $0.09/GB (first 10 TB/month)

### Estimations
**For 100 students with 50 videos (10 GB total):**
- Storage: $0.23/month
- Requests: ~$0.50/month
- Transfer (100 students × 10 GB): ~$90/month

**💡 Tip**: Add CloudFront later to reduce transfer costs by 50%+

---

## Folder Naming Convention

### Environment Folders
```
dev/       - Development environment
staging/   - Staging/testing environment
prod/      - Production environment
```

### File Paths
```
dev/videos/certification-security-plus/module-1/intro.mp4
dev/pdfs/study-guides/security-plus-cheatsheet.pdf
dev/images/thumbnails/security-plus-thumb.jpg
dev/thumbnails/videos/intro-thumb-001.jpg
```

### Naming Rules
- Use lowercase
- Use hyphens instead of spaces
- Include descriptive names
- Add version numbers if needed: `guide-v2.pdf`

---

## Troubleshooting

### Issue: CORS Error
**Symptom**: "CORS policy" error in browser console

**Solution**:
1. Verify CORS configuration in S3
2. Check `AllowedOrigins` includes your domain
3. Ensure you're using the correct HTTP method

### Issue: Access Denied
**Symptom**: "Access Denied" when uploading

**Solution**:
1. Verify IAM policy is attached to user
2. Check access keys are correct in `.env`
3. Ensure bucket name matches exactly

### Issue: Pre-signed URL Expired
**Symptom**: URL returns 403 after some time

**Solution**:
- Pre-signed URLs expire after set time (default: 1 hour)
- Generate new URL for access
- Don't cache pre-signed URLs long-term

---

## Next Steps

After completing S3 setup:
1. ✅ Update `.env` with credentials
2. ✅ Implement upload utilities (`lib/aws/s3.ts`)
3. ✅ Create upload server actions
4. ✅ Test file upload/download
5. ✅ Add file tracking to database

---

## Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Pricing Calculator](https://calculator.aws/#/addService/S3)
- [Pre-signed URLs Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Status**: Ready for implementation
