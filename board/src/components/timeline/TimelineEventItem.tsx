"use client";

import { useState } from "react";
import type { TimelineEvent } from "@/lib/api";
import {
  getEventConfig,
  formatEventTime,
  formatTimeAgo,
  getFileSummary,
} from "./timeline-helpers";

// ── TimelineEventItem Props ───────────────────────────────────────

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

// ── TimelineEventItem Component ───────────────────────────────────

export function TimelineEventItem({ event, isLast }: TimelineEventItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = getEventConfig(event.type);
  const timeStr = formatEventTime(event.date);
  const timeAgo = formatTimeAgo(event.date);
  const fileSummary = getFileSummary(event.files);

  return (
    <div className="flex items-start gap-3 relative pb-4">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full text-xs ${config.iconBg}`}
        >
          {config.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-baseline gap-2">
            <p className="text-sm text-gray-900 truncate">{event.message}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{timeStr}</span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
            {event.author && (
              <>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-500">{event.author}</span>
              </>
            )}
            {fileSummary && (
              <>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400">{fileSummary}</span>
              </>
            )}
          </div>
        </div>

        {/* Expanded Detail */}
        {expanded && (
          <div className="mt-2 rounded-md border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600 space-y-1.5">
            <div>
              <span className="font-medium text-gray-700">Type: </span>
              {config.icon} {config.label}
            </div>
            <div>
              <span className="font-medium text-gray-700">Hash: </span>
              <code className="font-mono text-gray-500">{event.hash.slice(0, 8)}</code>
            </div>
            {event.files.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Files:</span>
                <ul className="mt-1 ml-3 space-y-0.5 list-disc">
                  {event.files.map((f, i) => (
                    <li key={i} className="font-mono text-gray-500 break-all">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
