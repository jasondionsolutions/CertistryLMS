/**
 * ManualMappingCombobox Component
 *
 * Search and select combobox for manually adding content mappings
 */

"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchContent } from "../hooks/useSearchContent";
import { useAddManualMapping } from "../hooks/useManualMapping";
import type { ContentSearchResult } from "../types/mapping.types";
import { Search, Plus, Loader2 } from "lucide-react";

interface ManualMappingComboboxProps {
  videoId: string;
  certificationId: string;
}

export function ManualMappingCombobox({
  videoId,
  certificationId,
}: ManualMappingComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: results = [], isLoading } = useSearchContent(
    query,
    certificationId
  );
  const { mutate: addMapping, isPending: isAdding } = useAddManualMapping();

  const handleSelect = (result: ContentSearchResult) => {
    const input: any = { videoId, isPrimary: false };

    // Set the appropriate ID based on content type
    if (result.type === "objective") {
      input.objectiveId = result.id;
    } else if (result.type === "bullet") {
      input.bulletId = result.id;
    } else if (result.type === "sub_bullet") {
      input.subBulletId = result.id;
    }

    addMapping(input, {
      onSuccess: () => {
        setQuery("");
        setIsOpen(false);
      },
    });
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search objectives, bullets, or sub-bullets..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <Card className="absolute z-50 mt-2 w-full border shadow-lg">
          <ScrollArea className="max-h-[300px]">
            {results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}

            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                disabled={isAdding}
                className="flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted disabled:opacity-50 last:border-b-0"
              >
                {/* Type badge */}
                <Badge variant="outline" className="mt-1 text-xs capitalize">
                  {result.type.replace("_", " ")}
                </Badge>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  {/* Hierarchy */}
                  <div className="text-sm font-medium">{result.hierarchy}</div>

                  {/* Domain */}
                  <div className="text-xs text-muted-foreground">
                    {result.domainName}
                  </div>
                </div>

                {/* Add icon */}
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
