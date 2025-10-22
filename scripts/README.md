# Scripts

Utility scripts for CertistryLMS development and deployment.

---

## S3 Setup Script

**File**: `setup-s3-folders.ts`

Automatically creates the folder structure in your AWS S3 bucket and verifies your configuration.

### Prerequisites

1. Complete AWS S3 setup following `Documentation/AWS_S3_Setup_Guide.MD`
2. Add AWS credentials to your `.env` file:
   ```bash
   AWS_S3_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="certistrylms"
   AWS_S3_ACCESS_KEY_ID="AKIA..."
   AWS_S3_SECRET_ACCESS_KEY="wJalr..."
   ```

### Usage

```bash
yarn s3:setup
```

### What It Does

1. ✅ **Tests S3 connection** - Verifies your AWS credentials are valid
2. ✅ **Checks bucket access** - Confirms your IAM user has proper permissions
3. ✅ **Creates folder structure** - Sets up environment folders:
   ```
   certistrylms/
   ├── dev/
   │   ├── videos/
   │   ├── pdfs/
   │   ├── images/
   │   └── thumbnails/
   ├── staging/
   │   └── (same structure)
   └── prod/
       └── (same structure)
   ```
4. ✅ **Displays summary** - Shows created folders and next steps

### Example Output

```
🚀 CertistryLMS S3 Setup Script

==================================================

🔍 Testing S3 connection...
✅ Successfully connected to AWS S3
✅ Bucket 'certistrylms' found

🔍 Checking bucket permissions...
✅ You have access to bucket 'certistrylms'

📁 Creating folder structure...

📂 Environment: dev
  ✅ dev/videos/.placeholder
  ✅ dev/pdfs/.placeholder
  ✅ dev/images/.placeholder
  ✅ dev/thumbnails/.placeholder

📂 Environment: staging
  ✅ staging/videos/.placeholder
  ✅ staging/pdfs/.placeholder
  ✅ staging/images/.placeholder
  ✅ staging/thumbnails/.placeholder

📂 Environment: prod
  ✅ prod/videos/.placeholder
  ✅ prod/pdfs/.placeholder
  ✅ prod/images/.placeholder
  ✅ prod/thumbnails/.placeholder

📊 Summary:
  ✅ Created: 12 folders

📋 Your S3 bucket structure:

certistrylms/
├── dev/
│   ├── videos/
│   ├── pdfs/
│   ├── images/
│   └── thumbnails/
│
├── staging/
│   ├── videos/
│   ├── pdfs/
│   ├── images/
│   └── thumbnails/
│
└── prod/
    ├── videos/
    ├── pdfs/
    ├── images/
    └── thumbnails/

==================================================

✅ S3 setup complete!

Next steps:
  1. Visit AWS S3 Console: https://s3.console.aws.amazon.com/s3/buckets/certistrylms
  2. Verify the folder structure was created
  3. You can now upload files using the server actions

💡 Tip: You can safely delete the .placeholder files later
    (they're only needed to create the folder structure)
```

### Troubleshooting

#### ❌ Missing environment variables

**Error**: `Missing required environment variable: AWS_S3_ACCESS_KEY_ID`

**Solution**: Add the missing variable to your `.env` file.

---

#### ❌ Bucket not found

**Error**: `Bucket 'certistrylms' not found`

**Solution**:
- Create the bucket in AWS S3 Console
- OR update `AWS_S3_BUCKET_NAME` in `.env` to match your existing bucket

---

#### ❌ Invalid credentials

**Error**: `Invalid Access Key ID`

**Solution**:
- Verify `AWS_S3_ACCESS_KEY_ID` is correct
- Regenerate access keys if needed (AWS IAM Console)

---

#### ❌ Access denied

**Error**: `Your IAM user doesn't have permission to access this bucket`

**Solution**:
- Verify the IAM policy is attached to your IAM user
- Check the policy includes `s3:PutObject` and `s3:ListBucket` permissions
- See `Documentation/AWS_S3_Setup_Guide.MD` for the correct policy

---

### Notes

- **Placeholder files**: The script creates `.placeholder` files to establish the folder structure. These can be safely deleted later.
- **Re-running**: Safe to run multiple times - will skip existing folders
- **Manual creation**: Not required! S3 automatically creates folders when you upload files. This script is just for convenience and verification.

---

## Future Scripts

Additional scripts will be added here for:
- Database seeding
- Data migrations
- Deployment automation
- Cleanup utilities
