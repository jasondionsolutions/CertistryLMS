# 🎓 CertistryLMS - AI-First Certification Learning Management System

[![CI](https://github.com/jasondionsolutions/CertistryLMS/actions/workflows/ci.yml/badge.svg)](https://github.com/jasondionsolutions/CertistryLMS/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Tested%20with-Playwright-45ba63?logo=playwright&logoColor=white)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An **AI-powered Learning Management System** designed specifically for professional certification exam preparation (Security+, PMP, CISSP, CPA, etc.). Built with **Next.js 15**, **React 19**, and **Tailwind CSS v4**.

## 🎯 Core Features

- 🤖 **AI-First Learning**: 24/7 AI tutor powered by advanced LLMs
- 📊 **Strategic Study Plans**: 45-day accelerated programs optimized for working professionals
- 🎯 **Pattern Recognition Training**: Master the 7 universal question types
- ⚡ **50% Time Reduction**: Evidence-based learning science for maximum efficiency
- 🔍 **Precision Diagnostics**: Beyond scoring - automated question autopsy and performance analytics
- 🧠 **Question Deconstruction Method**: Systematic 4-step framework for exam success
- 📈 **Adaptive Learning Engine**: Personalized content based on your weaknesses
- ⏱️ **Exam Day Performance Coach**: Time management and mental preparation tools

## 🛠️ Tech Stack

- ✨ Radix UI + `class-variance-authority` (CVA)
- 🌗 Dark mode support via `next-themes`
- 🌀 Fully configured Tailwind CSS v4 (JIT, semantic colors, font vars)
- 🎨 Custom UI components and utility functions
- 🧪 Playwright for end-to-end testing
- 🎯 Prettier + Tailwind plugin + ESLint Flat Config
- ⚙️ Modern Server Actions — cleanly integrated and working out of the box

> Strategic certification prep for busy professionals - pass in half the time with AI-powered learning.
---

## 📦 Stack Overview

| Layer              | Tech                                               |
|-------------------|----------------------------------------------------|
| Framework         | [Next.js 15](https://nextjs.org/docs)              |
| UI Primitives     | [Radix UI](https://www.radix-ui.com/primitives)    |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com/docs)    |
| Fonts             | Geist Sans + Mono via `next/font/google`           |
| Dark Mode         | [`next-themes`](https://github.com/pacocoursey/next-themes) |
| Buttons + Variants| `class-variance-authority` + `clsx` + `tailwind-merge` |
| Testing           | [Playwright](https://playwright.dev/)              |
| Linting/Formatting| ESLint Flat Config + Prettier + Tailwind Plugin    |

---

## 🚀 Getting Started

```bash
yarn install            # install dependencies
yarn dev                # start dev server (Turbopack)
yarn build              # production build
yarn lint               # run ESLint
yarn typecheck          # run TypeScript checks
yarn test               # run Playwright e2e tests
yarn test:unit          # run Jest unit tests
yarn test:unit:watch    # run Jest in watch mode
yarn test:unit:coverage # run Jest with coverage
yarn test:all           # run both unit and e2e tests
```

---

## 🚢 Deployment

### Platform: Vercel

The application is deployed on Vercel with automatic deployments configured for multiple environments:

- **Production**: `main` branch → [Production URL]
- **Staging**: `staging` branch → [Staging URL]
- **Preview**: Pull requests → Automatic preview deployments

### Branch Workflow

```bash
# Local development
git checkout main
git pull origin main
# Make changes, commit

# Deploy to staging
git checkout staging
git merge main
git push origin staging
# Vercel automatically deploys to staging environment

# Deploy to production (after staging verification)
git checkout main
git push origin main
# Vercel automatically deploys to production environment
```

### Environment Variables Setup

Required environment variables must be configured in Vercel dashboard:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add the following secrets (refer to `.env.example` for descriptions):

**Database (Neon.tech)**:
- `DATABASE_URL` - Pooled connection string
- `DIRECT_URL` - Direct connection string for migrations

**Authentication (AWS Cognito)**:
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_CLIENT_ID` - Cognito App Client ID
- `NEXTAUTH_SECRET` - Session encryption secret (generate with: `openssl rand -base64 32`)

**File Storage (AWS S3)**:
- `AWS_S3_REGION` - S3 bucket region
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_S3_ACCESS_KEY_ID` - IAM user access key
- `AWS_S3_SECRET_ACCESS_KEY` - IAM user secret key
- `AWS_S3_FOLDER` - Environment folder (dev/staging/prod)

**Public Variables** (set for all environments):
- `NEXT_PUBLIC_APP_NAME` - Application name (CertistryLMS)
- `NEXT_PUBLIC_APP_URL` - Application URL (auto-set by Vercel)

### Branch-Specific Environment Variables

Configure different values per environment:

- **Production** (`main` branch):
  - `AWS_S3_FOLDER=prod`
  - Use production Neon branch database

- **Staging** (`staging` branch):
  - `AWS_S3_FOLDER=staging`
  - Use staging Neon branch database

- **Preview** (PR deployments):
  - `AWS_S3_FOLDER=dev`
  - Use development Neon branch database

### Database Branching (Neon.tech)

Neon supports database branching for preview deployments:

1. Create database branches in Neon dashboard for staging/preview
2. Configure branch-specific `DATABASE_URL` in Vercel
3. Each preview deployment can use isolated database branch

### Health Check

Monitor deployment health at `/api/health`:

```bash
curl https://your-domain.vercel.app/api/health
```

Response includes:
- System status
- Database connectivity
- Service configuration
- Response time metrics

### CI/CD Pipeline

GitHub Actions runs on every push and PR:

1. ✅ TypeScript type checking
2. ✅ ESLint code quality checks
3. ✅ Jest unit tests
4. ✅ Next.js production build
5. ✅ Playwright e2e tests

All checks must pass before merging to `main` or `staging`.

### Manual Deployment Steps (First Time)

1. **Connect Repository to Vercel**:
   - Import project from GitHub
   - Select `jasondionsolutions/CertistryLMS`
   - Configure production branch: `main`

2. **Configure Environment Variables**:
   - Add all required secrets (see above)
   - Set production values for `main` branch
   - Set staging values for `staging` branch

3. **Configure Branch Deployments**:
   - Enable automatic deployments for `main` and `staging`
   - Enable preview deployments for pull requests
   - Configure build settings (handled by `vercel.json`)

4. **Set Up Database**:
   - Create Neon branches for staging/preview
   - Configure connection strings per environment
   - Run migrations: `yarn db:push`

5. **Verify Deployment**:
   - Check health endpoint: `/api/health`
   - Test authentication flow
   - Verify S3 file uploads
   - Run smoke tests

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally (`yarn test:all`)
- [ ] Build succeeds (`yarn build`)
- [ ] Changes tested on staging environment
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] CI/CD pipeline passing

---

## 🧪 Tailwind CSS v4 Confirmation

This repo ships with a homepage that **visually proves** Tailwind CSS v4 is working:

- Typography, spacing, color, layout, and dark mode all tested
- Custom utility classes, font variables, and semantic tokens verified
- Button variants use `cva` + Radix UI + Tailwind with full theming support

> No guessing — if the homepage renders correctly, your Tailwind setup is fully functional.

---

## ⚡ Server Action Example

The homepage also includes a real, working Server Action:

- Accepts a name input
- Saves to a cookie
- Renders the result with zero JavaScript hydration

```ts
// lib/actions/example.action.ts
"use server";

export async function submitName(formData: FormData) {
  const name = formData.get("name");
  // cookie logic, revalidatePath
}
```

Used directly in `app/page.tsx` via:

```tsx
<form action={submitName}>
```

---

## 📁 Project Structure

```
.
├── app/                   # App Router (Next.js 15)
│   ├── layout.tsx
│   ├── page.tsx
│   └── loading.tsx
├── components/            # Reusable UI components
├── lib/                   # Server actions + utilities
│   └── actions/
├── docs/                  # Project documentation
│   └── UserStories.MD     # Full system design & user stories
├── Documentation/         # Source materials & research
│   └── AIStudy/           # Strategic Test-Taking book (5 parts)
├── tests/                 # Playwright e2e tests
├── public/                # Static assets
├── types/                 # Global TypeScript types
├── schema/                # Database schemas (future)
├── modules/               # Feature modules (future)
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🧠 Customization Tips

- Change your fonts in `app/layout.tsx`
- Add global metadata in `lib/seo.ts`
- Extend button variants via `cva`
- Write your own server actions under `lib/actions/`

---

## 🛡️ Playwright Setup

```bash
yarn test       # run headless tests
yarn test:ui    # interactive runner
```

Add specs under `tests/`.

---

## 📜 License

MIT — yours to hack, ship, and scale. Contributions welcome.

---

## 📚 Documentation

- **[UserStories.MD](./docs/UserStories.MD)** - Complete system design, user stories, and technical architecture
- **[AIStudy/](./Documentation/AIStudy/)** - Strategic Test-Taking methodology (5-part book series)

### Key Concepts

The system is built on proven test-taking frameworks:
- **4-Step Question Deconstruction Method**
- **7 Universal Question Types**
- **Strategic vs. Comprehensive Learning** (80/20 principle)
- **Evidence-Based Learning Science** (Active recall, spaced repetition, interleaving)
- **45-Day Accelerated Study System**

---

## 🎯 Project Goals

1. **50% Time Reduction**: Help professionals pass certifications in half the traditional study time
2. **AI-First Architecture**: Build AI into every aspect, not as an afterthought
3. **Strategic Over Comprehensive**: Focus on patterns and high-yield content
4. **Working Professional Optimized**: Respect limited time and competing priorities
5. **Precision Diagnostics**: Go beyond scoring to understand knowledge gaps

---

## 🚧 Current Status

**Phase**: Initial Setup & Planning
**Next Steps**: MVP development for 3-5 target certifications

---

## ✨ Created By

**Jason Dion Solutions** - Strategic certification preparation systems
Based on proven test-taking methodologies serving thousands of professionals

---

## 📦 Getting Started with Development

```bash
cd CertistryLMS
yarn install
yarn dev
```

Visit http://localhost:3000 to see the application.
