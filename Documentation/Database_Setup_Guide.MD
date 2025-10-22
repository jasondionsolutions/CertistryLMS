# Database Setup Guide - Neon.tech PostgreSQL

## Overview

CertistryLMS uses **PostgreSQL** hosted on **Neon.tech** as a serverless database solution. Neon provides instant branching, autoscaling, and scale-to-zero capabilities perfect for modern development workflows.

---

## Why Neon.tech?

| Feature | Benefit |
|---------|---------|
| **Serverless** | Pay only for what you use, scales to zero when inactive |
| **Instant Branching** | Create database branches for each PR automatically |
| **Autoscaling** | Automatically scales based on load |
| **Vercel Integration** | Native integration with Vercel deployments |
| **Connection Pooling** | Built-in pooling for serverless functions |
| **Point-in-Time Recovery** | Restore to any point in time |

---

## Prerequisites

- [ ] GitHub account (for Neon.tech sign-up)
- [ ] Vercel account (for deployment)
- [ ] Node.js and Yarn installed locally

---

## Step 1: Create Neon.tech Account

### 1.1 Sign Up
1. Visit [https://neon.tech](https://neon.tech)
2. Click **Sign Up**
3. Choose **Continue with GitHub** (recommended for seamless integration)
4. Authorize Neon.tech to access your GitHub account

### 1.2 Create New Project
1. Click **Create a project**
2. Configure project:
   - **Project Name**: `CertistryLMS`
   - **Region**: Choose closest to your users (recommended: `us-east-2` for US East Coast)
   - **PostgreSQL Version**: Latest (currently 16)
   - **Compute Size**: Shared (free tier is sufficient for development)
3. Click **Create Project**

---

## Step 2: Get Database Connection Strings

### 2.1 Access Connection Details
1. In your Neon project dashboard, navigate to **Connection Details**
2. You'll see two types of connection strings:

#### Pooled Connection (DATABASE_URL)
- Used for application queries
- Routes through connection pooler
- Required for serverless environments (Vercel)
- Format: `postgresql://user:password@ep-xxx.aws.neon.tech:5432/neondb?sslmode=require`

#### Direct Connection (DIRECT_URL)
- Used for Prisma migrations
- Bypasses connection pooler
- Required for schema changes
- Toggle **"Direct connection"** to see this URL

### 2.2 Copy Connection Strings
```bash
# Pooled connection (for DATABASE_URL)
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Direct connection (for DIRECT_URL)
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=10
```

**Important**: Keep these credentials secure! Never commit them to git.

---

## Step 3: Configure Local Development

### 3.1 Update .env.local
Open `.env.local` and replace the placeholder values:

```bash
# Replace with your actual Neon connection strings
DATABASE_URL="postgresql://[your-user]:[your-password]@ep-[your-project].us-east-2.aws.neon.tech/neondb?sslmode=require"

DIRECT_URL="postgresql://[your-user]:[your-password]@ep-[your-project].us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=10"
```

### 3.2 Generate Prisma Client
```bash
yarn db:generate
```

Expected output:
```
✔ Generated Prisma Client (v6.16.3) to ./node_modules/@prisma/client
```

### 3.3 Push Schema to Database
```bash
yarn db:push
```

Expected output:
```
Your database is now in sync with your Prisma schema. Done in Xms
```

### 3.4 Verify with Prisma Studio
```bash
yarn db:studio
```

This will open Prisma Studio at `http://localhost:5555` where you can:
- View database tables
- Browse data
- Execute queries
- Test CRUD operations

---

## Step 4: Configure Vercel (Production)

### 4.1 Add Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **CertistryLMS** project
3. Navigate to **Settings** > **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your pooled connection string | Production, Preview, Development |
| `DIRECT_URL` | Your direct connection string | Production, Preview, Development |

### 4.2 Redeploy
After adding environment variables, trigger a new deployment:
```bash
git push origin main
```

Vercel will automatically redeploy with the new environment variables.

---

## Step 5: Enable Neon Branch Databases (Optional but Recommended)

Neon's killer feature: **automatic database branches for each PR!**

### 5.1 Install Neon GitHub App
1. Visit [Neon GitHub Integration](https://neon.tech/docs/guides/vercel)
2. Install the Neon GitHub App to your repository
3. Grant permissions for branch creation

### 5.2 Configure Vercel Integration
1. In Neon dashboard, go to **Integrations**
2. Click **Add Integration** > **Vercel**
3. Select your Vercel project
4. Enable **"Create branch database for each preview deployment"**

### 5.3 How It Works
```
Main Branch (production)
├── DATABASE_URL → neon-production.aws.neon.tech
│
PR #123 (preview)
├── DATABASE_URL → neon-pr-123.aws.neon.tech (auto-created branch)
│
PR #124 (preview)
└── DATABASE_URL → neon-pr-124.aws.neon.tech (auto-created branch)
```

**Benefits:**
- ✅ Isolated database per preview deployment
- ✅ Test schema migrations safely in PRs
- ✅ No data conflicts between developers
- ✅ Automatic cleanup when PR closes

---

## Step 6: Test Database Connection

### 6.1 Create a Test Script
Create `scripts/test-db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

### 6.2 Run Test
```bash
npx tsx scripts/test-db.ts
```

Expected output:
```
✅ Database connection successful!
📊 Users in database: 0
```

---

## Common Issues & Troubleshooting

### Issue: "Can't reach database server"
**Solution:**
- Verify your IP is not blocked (Neon allows all IPs by default)
- Check your connection string format
- Ensure `?sslmode=require` is included

### Issue: "P1001: Connection timeout"
**Solution:**
- Use `DIRECT_URL` for migrations
- Add `connect_timeout=10` to connection string
- Check if Neon project is paused (free tier auto-pauses after inactivity)

### Issue: Migrations fail in production
**Solution:**
- Ensure `DIRECT_URL` is set in Vercel environment variables
- Use `prisma migrate deploy` instead of `prisma db push` in production
- Check Vercel build logs for detailed error messages

### Issue: "SSL connection required"
**Solution:**
- Always include `?sslmode=require` in connection strings
- Neon requires SSL for all connections

---

## Database Management Commands

### Development
```bash
# Generate Prisma Client after schema changes
yarn db:generate

# Push schema changes to database (development only)
yarn db:push

# Open Prisma Studio (database GUI)
yarn db:studio
```

### Production Migrations
```bash
# Create migration file
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

---

## Security Best Practices

### ✅ DO
- ✅ Store credentials in `.env.local` (gitignored)
- ✅ Use Vercel environment variables for production
- ✅ Rotate database passwords regularly
- ✅ Use connection pooling (`DATABASE_URL`)
- ✅ Enable SSL (`?sslmode=require`)

### ❌ DON'T
- ❌ Commit `.env.local` to git
- ❌ Share database credentials in Slack/Discord
- ❌ Use production credentials in development
- ❌ Hardcode credentials in source code
- ❌ Expose `DIRECT_URL` to client-side code

---

## Neon.tech Free Tier Limits

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| **Storage** | 0.5 GB | Sufficient for MVP development |
| **Compute** | Shared CPU | Auto-scales, auto-pauses |
| **Branches** | 10 | Enough for simultaneous PRs |
| **History** | 7 days | Point-in-time recovery |
| **Projects** | 1 | One project per account |

**Upgrade Trigger**: When you need more storage, dedicated compute, or longer history retention.

---

## Monitoring & Maintenance

### View Metrics
1. Neon Dashboard > **Monitoring**
2. Track:
   - Database size
   - Active connections
   - Query performance
   - Storage usage

### Auto-Pause Behavior (Free Tier)
- Database auto-pauses after **5 minutes** of inactivity
- Resumes in **~1 second** on next query
- No data loss during pause
- Useful for development cost savings

---

## Next Steps

After completing database setup:
1. ✅ Verify connection with `yarn db:studio`
2. ✅ Create first migration (Phase 0, Issue #2)
3. ✅ Configure AWS Cognito (Phase 0, Issue #3)
4. ✅ Build Phase 1 features

---

## Resources

- **Neon Documentation**: https://neon.tech/docs
- **Prisma + Neon Guide**: https://neon.tech/docs/guides/prisma
- **Vercel + Neon Integration**: https://neon.tech/docs/guides/vercel
- **Neon Discord Community**: https://discord.gg/neon

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Status**: Ready for setup
