"use client";

import { useQuery } from "@tanstack/react-query";
import { getVisitorName } from "../serverActions/visitor.action";

/**
 * Hook for fetching visitor name from cookie
 */
export function useVisitorName() {
  return useQuery({
    queryKey: ["visitorName"],
    queryFn: () => getVisitorName(),
  });
}
