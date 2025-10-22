// app/dashboard/loading.tsx
import { DashboardSkeleton } from "@/components/skeletons/auth-skeletons";

/**
 * Loading state for dashboard page
 * Shown while page is being rendered server-side
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
