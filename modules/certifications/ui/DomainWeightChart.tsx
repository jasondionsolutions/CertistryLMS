"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomains } from "../hooks/useDomains";

interface DomainWeightChartProps {
  certificationId: string;
  size?: number;
}

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

export function DomainWeightChart({ certificationId, size = 120 }: DomainWeightChartProps) {
  const { data: response, isLoading } = useDomains(certificationId);
  const domains = response?.data || [];
  const [isHovering, setIsHovering] = React.useState(false);

  // Transform domain data for chart
  const chartData = domains.map((domain) => ({
    name: domain.name,
    value: domain.weight * 100, // Convert to percentage
    weight: domain.weight,
  }));

  // Calculate if weights are valid
  const totalWeight = domains.reduce((sum, d) => sum + (d.weight || 0), 0);
  const isWeightValid = totalWeight >= 0.995 && totalWeight <= 1.005;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Skeleton className="rounded-full" style={{ width: size, height: size }} />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-muted/30 border-2 border-dashed"
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-muted-foreground text-center px-2">No domains</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{ zIndex: 50 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-lg z-50">
                    <p className="text-xs font-medium">{data.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(data.value * 10) / 10}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text showing domain count - fades when hovering */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isHovering ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-2xl font-bold">{domains.length}</p>
        <p className="text-[10px] text-muted-foreground uppercase">
          Domain{domains.length !== 1 ? "s" : ""}
        </p>
        {!isWeightValid && (
          <p className="text-[9px] text-destructive font-medium mt-0.5">Invalid</p>
        )}
      </div>
    </div>
  );
}
