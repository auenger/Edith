"use client";

import { formatMonthLabel } from "./timeline-helpers";

// ── MonthGroupHeader Props ────────────────────────────────────────

interface MonthGroupHeaderProps {
  monthKey: string;
  eventCount: number;
}

// ── MonthGroupHeader Component ────────────────────────────────────

export function MonthGroupHeader({
  monthKey,
  eventCount,
}: MonthGroupHeaderProps) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-gray-800">
          {formatMonthLabel(monthKey)}
        </h3>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
