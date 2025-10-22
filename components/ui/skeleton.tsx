// components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

/**
 * Reusable skeleton loader component
 * Used to show loading placeholders while content is being fetched
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
