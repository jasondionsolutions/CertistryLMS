import { cookies } from "next/headers";
import { VisitorForm } from "@/modules/example/ui/VisitorForm";

export default async function Home() {
  const cookieStore = await cookies();
  const name = cookieStore.get("visitor_name")?.value || "";

  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 grid place-items-center font-[family-name:var(--font-geist-sans)] bg-background text-foreground">
      <main className="w-full max-w-xl space-y-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          ✅ Modular Architecture Ready
        </h1>

        <p className="text-muted-foreground leading-relaxed text-base">
          This project uses a <strong>modular architecture</strong> with Server Actions, Hooks,
          Prisma + MongoDB, Zod validation, TanStack Query, and RBAC middleware.
        </p>

        <div className="bg-muted/40 border rounded-lg px-6 py-6 text-left space-y-4">
          <h2 className="text-lg font-medium">🏗️ Modular Server Action Example</h2>

          <VisitorForm />

          <p className="text-sm text-muted-foreground">
            Your saved name:{" "}
            <span className="font-semibold text-foreground">{name || "none saved yet"}</span>
          </p>

          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>✅ Server Action: <code>modules/example/serverActions/visitor.action.ts</code></p>
            <p>✅ Hook: <code>modules/example/hooks/useSubmitName.ts</code></p>
            <p>✅ Component: <code>modules/example/ui/VisitorForm.tsx</code></p>
            <p>✅ Middleware: <code>lib/middleware/withAccess.ts</code></p>
          </div>
        </div>

        <footer className="pt-12 text-xs text-muted-foreground">
          <p>
            Built with Next.js 15, Modular Architecture, and ❤️ by you.
          </p>
        </footer>
      </main>
    </div>
  );
}
