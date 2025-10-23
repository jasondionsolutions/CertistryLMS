"use client";

import * as React from "react";

interface BreadcrumbContextType {
  customLabels: Record<string, string>;
  setCustomLabel: (segment: string, label: string) => void;
  clearCustomLabels: () => void;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setCustomLabels] = React.useState<Record<string, string>>({});

  const setCustomLabel = React.useCallback((segment: string, label: string) => {
    setCustomLabels((prev) => ({ ...prev, [segment]: label }));
  }, []);

  const clearCustomLabels = React.useCallback(() => {
    setCustomLabels({});
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ customLabels, setCustomLabel, clearCustomLabels }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  }
  return context;
}
