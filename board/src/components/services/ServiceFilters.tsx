"use client";

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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>

        {/* Stack Filter */}
        <select
          value={filters.stack}
          onChange={(e) =>
            onFiltersChange({ ...filters, stack: e.target.value })
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="all">All Stacks</option>
          {stacks.map((stack) => (
            <option key={stack} value={stack}>
              {stack}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value as StatusFilter })
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="all">All Status</option>
          <option value="complete">✓ Complete</option>
          <option value="partial">⚠ Partial</option>
          <option value="minimal">○ Minimal</option>
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
              onFiltersChange({ stack: "all", status: "all", search: "" })
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
