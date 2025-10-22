# Vercel Deployment Setup - Manual Steps

This document outlines the manual steps required to complete the Vercel deployment configuration for CertistryLMS.

## ✅ Already Completed (Automated)

- [x] Jest unit testing configured
- [x] Health check endpoint created (`/api/health`)
- [x] CI/CD pipeline updated with unit tests
- [x] `vercel.json` configuration created
- [x] `staging` branch created and pushed
- [x] Build status badge added to README
- [x] Deployment documentation added to README

## 🔧 Manual Steps Required

### 1. Connect GitHub Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `jasondionsolutions/CertistryLMS`
4. Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `yarn build` (from vercel.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `yarn install` (from vercel.json)

### 2. Configure Production Branch

1. In Project Settings → Git
2. Set **Production Branch**: `main`
3. Enable **Automatic Deployments** for `main` branch

### 3. Configure Staging Branch

1. In Project Settings → Git → Branch Deployments
2. Add branch: `staging`
3. Enable **Automatic Deployments** for `staging` branch
4. This will create a dedicated staging environment URL

### 4. Configure Environment Variables

Go to Project Settings → Environment Variables and add the following:

#### Database (Neon.tech)

**For Production (`main` branch)**:
```
DATABASE_URL = [Your production Neon pooled connection string]
DIRECT_URL = [Your production Neon direct connection string]
```

**For Staging (`staging` branch)**:
```
DATABASE_URL = [Your staging Neon pooled connection string]
DIRECT_URL = [Your staging Neon direct connection string]
```

**For Preview (Pull Requests)**:
```
DATABASE_URL = [Your development Neon connection string]
DIRECT_URL = [Your development Neon connection string]
```

#### Authentication (AWS Cognito)

Add for **All Environments** (Production, Staging, Preview):
```
AWS_REGION = us-east-1 (or your region)
COGNITO_USER_POOL_ID = [Your Cognito User Pool ID]
COGNITO_CLIENT_ID = [Your Cognito App Client ID]
```

#### Session Secret

Generate a new secret for each environment:
```bash
openssl rand -base64 32
```

**For Production**:
```
NEXTAUTH_SECRET = [Generated secret for production]
```

**For Staging**:
```
NEXTAUTH_SECRET = [Generated secret for staging]
```

**For Preview**:
```
NEXTAUTH_SECRET = [Generated secret for preview]
```

#### File Storage (AWS S3)

**For All Environments**:
```
AWS_S3_REGION = us-east-1 (or your region)
AWS_S3_BUCKET_NAME = [Your S3 bucket name]
AWS_S3_ACCESS_KEY_ID = [Your IAM access key]
AWS_S3_SECRET_ACCESS_KEY = [Your IAM secret key]
```

**Environment-Specific**:

- **Production**: `AWS_S3_FOLDER = prod`
- **Staging**: `AWS_S3_FOLDER = staging`
- **Preview**: `AWS_S3_FOLDER = dev`

#### Public Variables

**For All Environments**:
```
NEXT_PUBLIC_APP_NAME = CertistryLMS
NEXT_PUBLIC_APP_URL = [Will be auto-set by Vercel]
```

### 5. Set Up Neon Database Branches

1. Go to your [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. Create branches:
   - Keep `main` branch for production
   - Create `staging` branch from `main`
   - Create `preview` branch for PR deployments (optional)
4. Copy the connection strings for each branch
5. Add them to Vercel environment variables (step 4 above)

### 6. Deploy and Verify

1. **Trigger Initial Deployment**:
   - Push a commit to `main` branch
   - Vercel will automatically deploy

2. **Check Deployment Status**:
   - Go to Vercel Dashboard → Deployments
   - Verify build succeeded
   - Check deployment logs for any errors

3. **Verify Health Endpoint**:
   ```bash
   curl https://your-production-url.vercel.app/api/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "environment": "production",
     "database": {
       "status": "connected",
       "latency": 50
     },
     "services": {
       "cognito": "configured",
       "s3": "configured"
     }
   }
   ```

4. **Test Authentication**:
   - Visit your production URL
   - Try logging in with Cognito
   - Verify user session works

5. **Test File Upload**:
   - Upload a test file
   - Verify it appears in S3 under `prod/` folder

### 7. Configure Preview Deployments

1. In Project Settings → Git
2. Enable **Automatic Preview Deployments** for pull requests
3. Each PR will get a unique preview URL
4. Preview deployments use the "Preview" environment variables

### 8. Set Up Domain (Optional)

1. In Project Settings → Domains
2. Add your custom domain (e.g., `app.certistrylms.com`)
3. Configure DNS:
   - Add CNAME record pointing to Vercel
   - Vercel will auto-provision SSL certificate
4. Set production domain
5. Set staging domain (e.g., `staging.certistrylms.com`)

### 9. Configure Notifications (Optional)

1. In Project Settings → Notifications
2. Add Slack/Discord webhook for deployment notifications
3. Configure GitHub commit status checks

## 🧪 Testing Your Setup

After completing the manual steps:

1. **Test Staging Deployment**:
   ```bash
   git checkout staging
   git merge main
   git push origin staging
   ```
   Verify staging URL updates

2. **Test PR Preview**:
   - Create a new branch and PR
   - Verify preview deployment is created
   - Check preview URL works

3. **Test Production Deployment**:
   ```bash
   git checkout main
   git push origin main
   ```
   Verify production URL updates

## 📋 Post-Deployment Checklist

- [ ] Production deployment successful
- [ ] Staging deployment successful
- [ ] Health endpoint responding on both environments
- [ ] Database connectivity verified
- [ ] Cognito authentication working
- [ ] S3 file uploads working
- [ ] CI/CD pipeline passing
- [ ] Environment variables configured correctly
- [ ] Domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring/alerts configured (if applicable)

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech
- **GitHub Actions**: https://github.com/jasondionsolutions/CertistryLMS/actions
- **AWS Cognito Console**: https://console.aws.amazon.com/cognito
- **AWS S3 Console**: https://s3.console.aws.amazon.com

## 🆘 Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify all environment variables are set
- Ensure `yarn build` works locally

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for database status
- Ensure IP allowlist includes Vercel IPs (0.0.0.0/0 for serverless)

### Authentication Not Working
- Verify Cognito credentials in environment variables
- Check AWS Cognito console for user pool status
- Ensure `NEXTAUTH_SECRET` is set and different per environment

### S3 Uploads Failing
- Verify IAM credentials have correct permissions
- Check S3 bucket CORS configuration
- Ensure `AWS_S3_FOLDER` matches environment

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check GitHub Actions logs
3. Review environment variable configuration
4. Test health endpoint for system status
5. Check Neon database connectivity

---

**Note**: Keep this document updated as you configure additional services or change deployment settings.
