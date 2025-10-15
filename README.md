# 🎓 CertistryLMS - AI-First Certification Learning Management System

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
yarn install        # install dependencies
yarn dev            # start dev server (Turbopack)
yarn build          # production build
yarn lint           # run ESLint
yarn typecheck      # run TypeScript checks
yarn test           # run Playwright e2e tests
```

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
