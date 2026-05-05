"use client";

import {
  ALL_EVENT_TYPES,
  getEventConfig,
} from "./timeline-helpers";

// ── Filter Types ──────────────────────────────────────────────────

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

// ── TimelineFilters Component ─────────────────────────────────────

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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Event Type Filter */}
        <select
          value={filters.type}
          onChange={(e) =>
            onFiltersChange({ ...filters, type: e.target.value })
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="all">All Types</option>
          {ALL_EVENT_TYPES.map((type) => {
            const cfg = getEventConfig(type);
            return (
              <option key={type} value={type}>
                {cfg.icon} {cfg.label}
              </option>
            );
          })}
        </select>

        {/* Service Filter */}
        <select
          value={filters.service}
          onChange={(e) =>
            onFiltersChange({ ...filters, service: e.target.value })
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="all">All Services</option>
          {availableServices.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </select>

        {/* Result Count */}
        {hasActiveFilters && (
          <span className="text-xs text-gray-500">
            {resultCount}/{totalCount} shown
          </span>
        )}

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({ type: "all", service: "all" })
            }
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
