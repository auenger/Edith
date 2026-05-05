"use client";

import { useState } from "react";
import type { TimelineEvent } from "@/lib/api";
import {
  getEventConfig,
  formatEventTime,
  formatTimeAgo,
  getFileSummary,
} from "./timeline-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

// -- Event type color mapping for Badge variants --------------------------

const EVENT_TYPE_BADGE_COLORS: Record<string, string> = {
  scan: "bg-blue-50 text-blue-700 border-blue-200",
  distill: "bg-purple-50 text-purple-700 border-purple-200",
  ingest: "bg-green-50 text-green-700 border-green-200",
  graphify: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

// -- TimelineEventItem Props ----------------------------------------------

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

// -- TimelineEventItem Component ------------------------------------------

export function TimelineEventItem({ event, isLast }: TimelineEventItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = getEventConfig(event.type);
  const timeStr = formatEventTime(event.date);
  const timeAgo = formatTimeAgo(event.date);
  const fileSummary = getFileSummary(event.files);
  const badgeColorClass =
    EVENT_TYPE_BADGE_COLORS[event.type] || EVENT_TYPE_BADGE_COLORS.other;

  return (
    <div className="flex items-stretch gap-0 relative">
      {/* Timeline axis (left) */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        {/* Event dot with icon */}
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full text-xs z-10 ${config.iconBg} ring-2 ring-background`}
        >
          {config.icon}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1"
            style={{
              background:
                "linear-gradient(to bottom, var(--brand-start), var(--brand-end))",
              opacity: 0.3,
            }}
          />
        )}
      </div>

      {/* Event card (right) */}
      <div className="flex-1 pb-4 pl-2 min-w-0">
        <Card
          className={`bento-card bento-card-hover cursor-pointer py-0 transition-all duration-200 ${
            expanded ? "ring-1 ring-ring/20" : ""
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          <CardContent className="p-3.5 space-y-1.5">
            {/* Row 1: message + badge */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground leading-snug line-clamp-2 flex-1">
                {event.message}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 shrink-0 border ${badgeColorClass}`}
              >
                {config.label}
              </Badge>
            </div>

            {/* Row 2: metadata */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-mono">{timeStr}</span>
              <span className="text-border">|</span>
              <span>{timeAgo}</span>
              {event.author && (
                <>
                  <span className="text-border">|</span>
                  <span>{event.author}</span>
                </>
              )}
              {fileSummary && (
                <>
                  <span className="text-border">|</span>
                  <span>{fileSummary}</span>
                </>
              )}
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div className="pt-2 mt-1 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Type: </span>
                  {config.icon} {config.label}
                </div>
                <div>
                  <span className="font-medium text-foreground">Hash: </span>
                  <code className="font-mono">
                    {event.hash.slice(0, 8)}
                  </code>
                </div>
                {event.files.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">
                      Files:
                    </span>
                    <ul className="mt-1 ml-3 space-y-0.5 list-disc">
                      {event.files.map((f, i) => (
                        <li key={i} className="font-mono break-all">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Expand indicator */}
            {!expanded && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 pt-0.5">
                <ChevronRight className="h-3 w-3" />
                <span>click for details</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
