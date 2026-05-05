"use client";

import { SearchBar } from "@/components/shared/SearchBar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, AlertTriangleIcon, CircleIcon } from "lucide-react";

type StackFilter = "all" | string;
type StatusFilter = "all" | "complete" | "partial" | "minimal";

interface FilterState {
  stack: StackFilter;
  status: StatusFilter;
  search: string;
}

interface ServiceFiltersProps {
  stacks: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
  totalCount: number;
}

export function ServiceFilters({
  stacks,
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
}: ServiceFiltersProps) {
  const hasActiveFilters =
    filters.stack !== "all" ||
    filters.status !== "all" ||
    filters.search !== "";

  return (
    <div className="bento-card bento-span-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <SearchBar
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search services..."
        />

        {/* Stack Filter */}
        <Select
          value={filters.stack}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, stack: value as StackFilter })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Stacks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stacks</SelectItem>
            {stacks.map((stack) => (
              <SelectItem key={stack} value={stack}>
                {stack}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as StatusFilter })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="complete">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3 text-success" />
                Complete
              </span>
            </SelectItem>
            <SelectItem value="partial">
              <span className="flex items-center gap-1.5">
                <AlertTriangleIcon className="size-3 text-warning" />
                Partial
              </span>
            </SelectItem>
            <SelectItem value="minimal">
              <span className="flex items-center gap-1.5">
                <CircleIcon className="size-3 text-muted-foreground" />
                Minimal
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Result Count */}
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            {resultCount}/{totalCount} shown
          </Badge>
        )}

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({ stack: "all", status: "all", search: "" })
            }
            className="text-xs text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
