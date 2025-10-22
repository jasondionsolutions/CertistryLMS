// components/skeletons/auth-skeletons.tsx
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for AuthButton component
 */
export function AuthButtonSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Loading skeleton for user info card on homepage
 */
export function UserInfoSkeleton() {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-6 space-y-3 text-left">
      <Skeleton className="h-7 w-48 mx-auto mb-4" />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      <div className="pt-3 border-t mt-4">
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* User info card skeleton */}
        <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
          <Skeleton className="h-6 w-32" />

          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
          <Skeleton className="h-6 w-32" />

          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-background border rounded-lg space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for admin page
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-10 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Admin info card skeleton */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-6 py-6 space-y-4">
          <Skeleton className="h-6 w-48" />

          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* Management sections skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((section) => (
            <div key={section} className="bg-muted/40 border rounded-lg px-6 py-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-background border rounded-lg space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
