"use client";

import { useState } from "react";
import type { UnifiedContentItem } from "../types/contentLibrary.types";

/**
 * Hook to manage content preview panel state
 */
export function useContentPreview() {
  const [selectedContent, setSelectedContent] =
    useState<UnifiedContentItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (content: UnifiedContentItem) => {
    setSelectedContent(content);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    // Don't clear selectedContent immediately to allow smooth transitions
    setTimeout(() => setSelectedContent(null), 300);
  };

  const togglePreview = (content: UnifiedContentItem) => {
    if (selectedContent?.id === content.id && isPreviewOpen) {
      closePreview();
    } else {
      openPreview(content);
    }
  };

  return {
    selectedContent,
    isPreviewOpen,
    openPreview,
    closePreview,
    togglePreview,
  };
}
