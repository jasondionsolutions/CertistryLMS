// app/admin/loading.tsx
import { AdminDashboardSkeleton } from "@/components/skeletons/auth-skeletons";

/**
 * Loading state for admin dashboard page
 * Shown while page is being rendered server-side
 */
export default function AdminLoading() {
  return <AdminDashboardSkeleton />;
}
