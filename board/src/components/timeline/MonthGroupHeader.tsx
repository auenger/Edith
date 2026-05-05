"use client";

import { useState } from "react";
import { formatMonthLabel } from "./timeline-helpers";
import { ChevronDown } from "lucide-react";

// -- MonthGroupHeader Props -----------------------------------------------

interface MonthGroupHeaderProps {
  monthKey: string;
  eventCount: number;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

// -- MonthGroupHeader Component -------------------------------------------

export function MonthGroupHeader({
  monthKey,
  eventCount,
  defaultOpen = true,
  children,
}: MonthGroupHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 last:mb-0">
      {/* Month header with toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 py-2 group cursor-pointer"
      >
        <h3 className="text-base font-semibold text-foreground">
          {formatMonthLabel(monthKey)}
        </h3>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
