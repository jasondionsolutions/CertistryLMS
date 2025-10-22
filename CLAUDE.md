# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `yarn dev` - Start development server with Turbopack
- `yarn build` - Create production build
- `yarn start` - Start production server

### Code Quality
- `yarn lint` - Run ESLint
- `yarn typecheck` - Run TypeScript checks without emitting files

### Testing
- `yarn test` - Run Playwright e2e tests (headless)
- `yarn test:ui` - Run Playwright tests with interactive UI runner
- Tests are located in `tests/` directory
- Base URL for tests: `http://localhost:3000`

### Database (Prisma)
- `yarn db:generate` - Generate Prisma Client
- `yarn db:push` - Push schema changes to database (development)
- `yarn db:studio` - Open Prisma Studio GUI
- Schema location: `schema/schema.prisma`
- Database: MongoDB Atlas (connection string in `.env`)

### Deployment
- **Platform**: Vercel (automatic deployments on main branch push)
- **Environment Variables**: Managed in Vercel project settings
- **Database**: MongoDB Atlas connection via `DATABASE_URL` env var
- **Preview Deployments**: Automatic for all pull requests
- **Production URL**: [To be configured]

## Architecture

### Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4 with JIT compilation
- **UI Components**: Radix UI primitives + class-variance-authority (CVA)
- **Theming**: next-themes for dark mode support
- **Fonts**: Geist Sans and Geist Mono via next/font/google
- **Authentication**: AWS Cognito with RBAC
- **Database**: Prisma ORM + MongoDB Atlas
- **State Management**: Zustand (optional - only for complex client UI state, not server data)
- **Validation**: Zod schemas
- **Testing**: Playwright for e2e

### Modular Architecture

**NO APIs - Server Actions Only**: This codebase uses ONLY Next.js Server Actions for all backend operations. No REST or API routes.

**Feature Modules**: All features are isolated under `/modules/[feature]/` with:
- `/ui` - Feature-local components
- `/hooks` - Client hooks (bridge between components and server actions)
- `/serverActions` - All CRUD operations, business logic, calculations
- `/types` - Zod schemas, TypeScript types, enums
- `/lib` - Feature-local utilities
- `/services` - Business logic orchestration (if needed)

**Architecture Layers** (strict separation):
1. **Components (UI only)** - Consume data from hooks, no direct server action calls
2. **Hooks** - Bridge layer that calls server actions and manages client state
3. **Server Actions** - All calculations, algorithms, processing, database operations
4. **Store Slices** - Pure state management (sync operations only, no calculations)

### Key Patterns

**Server Actions with RBAC**: All server actions must be wrapped with access control middleware.

```typescript
// Start with withAccess() for basic auth
export const createBook = withAccess(async (
  user: AuthContext,
  input: CreateBookInput
) => {
  const validated = createBookSchema.parse(input);
  const book = await prisma.book.create({
    data: { ...validated, createdById: user.userId }
  });
  return { data: book, success: true };
});

// Upgrade to withPermission() for strict RBAC
export const deleteBook = withPermission('books.delete')(async (
  user: AuthContext,
  bookId: string
) => {
  await prisma.book.delete({ where: { id: bookId } });
  return { success: true };
});
```

**Server Action Naming Convention**:
- Location: `/modules/[feature]/serverActions/[feature].action.ts`
- File: `book.action.ts`, `exam.action.ts`, `user.action.ts`
- Exports: `createBook`, `updateBook`, `deleteBook`, `getBook`, `listBooks`
- Always include `"use server"` directive at top of file
- Return type: `Promise<{ success: boolean; data?: T; error?: string }>`

**AuthContext Type**: All server actions receive authenticated user context as first parameter.

```typescript
// lib/auth/types.ts
export interface AuthContext {
  userId: string;      // Unique user identifier
  email: string;       // User email
  name?: string;       // Optional display name
  roles: string[];     // User roles (e.g., ['user', 'admin'])
  permissions: string[]; // Granular permissions (e.g., ['books.delete'])
}
```

All server actions automatically receive this context as the first parameter when wrapped with `withAccess()` or `withPermission()`.

**Client Hooks Pattern**: All components access server actions through typed hooks.

```typescript
// hooks/useCreateBook.ts
export function useCreateBook() {
  return useMutation({
    mutationFn: (input: CreateBookInput) => createBook(input),
    onError: (e) => toast.error(e.message),
    onSuccess: () => toast.success("Book created")
  });
}

// Component usage
function BookForm() {
  const { mutate: createBook, isPending } = useCreateBook();
  // UI only - no direct server action imports
}
```

**Database Rules**: Always consider user context and permissions in queries.

```typescript
// ✅ User-specific data
await prisma.examSession.findMany({
  where: { userId: user.userId }
});

// ✅ Admin operations with permission check
await prisma.book.findMany({
  where: user.roles.includes('admin') ? {} : { status: 'active' }
});
```

**Component Variants**: UI components use CVA for type-safe variant props. The `cn()` utility (from `lib/utils.ts`) combines clsx and tailwind-merge.

**Theme System**: Dark mode via ThemeProvider wrapping the app layout. All semantic color tokens automatically support dark mode.

**Session Management**: Server-side, cookie-based sessions only.

```typescript
// ✅ CORRECT: Server-side session storage
const session = await getServerSession();

// ✅ CORRECT: httpOnly cookies
cookies().set('session', token, { httpOnly: true, secure: true });

// ❌ WRONG: Never use localStorage for auth
localStorage.setItem('token', jwt); // FORBIDDEN

// ❌ WRONG: Never expose tokens to client
const token = session.accessToken; // FORBIDDEN in client components
```

**UI Standards**:
- **Layout**: Max width 1920px, centered with fluid scaling
- **Breakpoints**: Tailwind responsive (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Mobile**: Min 44px touch targets, progressive disclosure (use `md:hidden` for complex UI)
- **Loading States**: Skeletons for data fetching, spinners for actions, optimistic updates
- **Feedback**: Toast notifications via Sonner (success, error, warning)
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation support

```typescript
// Component loading state example
function BookList() {
  const { data: books, isLoading } = useBooks();

  if (isLoading) return <BookListSkeleton />;

  return <div>{books.map(book => <BookCard key={book.id} book={book} />)}</div>;
}
```

### Directory Structure

**Modular Structure** (current implementation):
- `app/` - Next.js App Router pages and layouts
- `config/` - Environment configuration and constants
- `modules/[feature]/` - Feature-isolated domains
  - `modules/[feature]/ui/` - Feature components (client components)
  - `modules/[feature]/hooks/` - Client hooks (TanStack Query)
  - `modules/[feature]/serverActions/` - Server actions (RBAC-wrapped)
  - `modules/[feature]/types/` - Zod schemas, TS types
  - `modules/[feature]/lib/` - Feature utilities
  - `modules/[feature]/services/` - Business logic orchestration
- `components/ui/` - Global UI primitives (shadcn components)
- `components/` - Global providers (QueryProvider, ThemeProvider)
- `lib/` - Global utilities
- `lib/middleware/` - Access control (withAccess, withPermission)
- `lib/auth/` - Authentication helpers and types
- `schema/` - Prisma schema and DB logic
- `tests/` - Playwright e2e tests
- `public/` - Static assets

### Architecture Compliance Rules

**Critical Violations to Avoid**:
- ❌ Complex calculations in client components or store slices
- ❌ setState in render cycles
- ❌ Direct server action imports in components (use hooks)
- ❌ Business logic in UI components
- ❌ Async operations in store slices

**Required Patterns**:
- ✅ Store Slices: Pure state management only (sync operations)
- ✅ Server Actions: All calculations, algorithms, database operations
- ✅ Hooks: Bridge between components and server actions/store
- ✅ Components: UI only, consume data from hooks
- ✅ Proper async/sync separation
- ✅ RBAC enforcement on all server actions

### Development Workflow

1. Define Prisma model in `schema/schema.prisma`
2. Create Zod schema in `modules/[feature]/types/`
3. Create RBAC-wrapped server actions in `modules/[feature]/serverActions/`
4. Create typed client hooks in `modules/[feature]/hooks/`
5. Build UI components that consume hooks
6. Write Playwright tests

### Error Handling

```typescript
// Standard error classes
class ValidationError extends Error {}
class PermissionError extends Error {}
class ConflictError extends Error {}
class NotFoundError extends Error {}
class UnauthorizedError extends Error {}
```

### Philosophy
- **Security First**: Always RBAC + user context validation
- **Modular Design**: Features are isolated and self-contained
- **Server-Only Logic**: Never expose core logic to client
- **Type-Safe Stack**: End-to-end Zod + TypeScript strict mode
- **No APIs**: Server Actions only for all backend operations
- **Proper Separation**: Strict client/server boundary enforcement
