"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCertifications } from "../hooks/useContentLibrary";
import type { ContentSearchInput } from "../types/contentLibrary.types";

interface ContentFiltersProps {
  filters: ContentSearchInput;
  onFiltersChange: (filters: Partial<ContentSearchInput>) => void;
}

/**
 * Content filters component
 * Search bar + filters for content type, certification, difficulty, date range, mapped status
 */
export function ContentFilters({
  filters,
  onFiltersChange,
}: ContentFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query ?? "");
  const { data: certifications } = useCertifications();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ query: searchQuery, page: 1 });
  };

  const handleFilterChange = (key: keyof ContentSearchInput, value: any) => {
    onFiltersChange({ [key]: value, page: 1 }); // Reset to page 1 when filters change
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    onFiltersChange({
      query: undefined,
      contentType: undefined,
      certificationId: undefined,
      difficulty: undefined,
      mappedStatus: undefined,
      page: 1,
    });
  };

  const hasActiveFilters =
    searchQuery ||
    filters.contentType ||
    filters.certificationId ||
    filters.difficulty ||
    filters.mappedStatus !== "all";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, description, transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        {hasActiveFilters && (
          <Button type="button" variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        )}
      </form>

      {/* Filter controls */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Content Type */}
        <Select
          value={filters.contentType ?? "all"}
          onValueChange={(value) =>
            handleFilterChange(
              "contentType",
              value === "all" ? undefined : value
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        {/* Certification */}
        <Select
          value={filters.certificationId ?? "all"}
          onValueChange={(value) =>
            handleFilterChange(
              "certificationId",
              value === "all" ? undefined : value
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Certification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Certifications</SelectItem>
            {certifications?.map((cert) => (
              <SelectItem key={cert.id} value={cert.id}>
                {cert.code} - {cert.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty */}
        <Select
          value={filters.difficulty ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("difficulty", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        {/* Mapped Status */}
        <Select
          value={filters.mappedStatus ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("mappedStatus", value === "all" ? "all" : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Mapping Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="mapped">Mapped Only</SelectItem>
            <SelectItem value="unmapped">Unmapped Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={filters.sortBy ?? "createdAt"}
          onValueChange={(value) => handleFilterChange("sortBy", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="updatedAt">Date Updated</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="fileSize">File Size</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
