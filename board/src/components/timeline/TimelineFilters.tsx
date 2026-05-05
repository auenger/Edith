"use client";

import {
  ALL_EVENT_TYPES,
  getEventConfig,
} from "./timeline-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// -- Filter Types ---------------------------------------------------------

export interface TimelineFilterState {
  type: string;
  service: string;
}

interface TimelineFiltersProps {
  filters: TimelineFilterState;
  onFiltersChange: (filters: TimelineFilterState) => void;
  availableServices: string[];
  resultCount: number;
  totalCount: number;
}

// -- TimelineFilters Component --------------------------------------------

export function TimelineFilters({
  filters,
  onFiltersChange,
  availableServices,
  resultCount,
  totalCount,
}: TimelineFiltersProps) {
  const hasActiveFilters =
    filters.type !== "all" || filters.service !== "all";

  return (
    <div className="bento-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Event Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, type: value })
          }
        >
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ALL_EVENT_TYPES.map((type) => {
              const cfg = getEventConfig(type);
              return (
                <SelectItem key={type} value={type}>
                  <span className="flex items-center gap-1.5">
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Service Filter */}
        <Select
          value={filters.service}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, service: value })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {availableServices.map((svc) => (
              <SelectItem key={svc} value={svc}>
                {svc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Result Count */}
        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground">
            {resultCount}/{totalCount} shown
          </span>
        )}

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              onFiltersChange({ type: "all", service: "all" })
            }
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
