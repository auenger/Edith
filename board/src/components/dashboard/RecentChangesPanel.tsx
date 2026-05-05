"use client";

import Link from "next/link";
import type { TimelineEvent } from "@/lib/api";
import { getEventConfig } from "@/components/timeline/timeline-helpers";
import { formatTimeAgo, getFileSummary } from "@/components/timeline/timeline-helpers";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentChangesPanelProps {
  timeline: TimelineEvent[];
  loading: boolean;
}

export function RecentChangesPanel({ timeline, loading }: RecentChangesPanelProps) {
  return (
    <div className="bento-card bento-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Recent Changes
        </h3>
        <Link
          href="/timeline"
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && timeline.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No recent changes</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Changes will appear here when knowledge artifacts are updated
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && timeline.length > 0 && (
        <div className="space-y-0">
          {timeline.map((event, idx) => (
            <TimelineRow key={event.hash} event={event} isLast={idx === timeline.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timeline Row ────────────────────────────────────────────────

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const config = getEventConfig(event.type);
  const timeStr = formatTimeAgo(event.date);
  const fileSummary = getFileSummary(event.files);

  return (
    <div className="flex items-start gap-3 relative pb-4">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs ${config.iconBg}`}>
          {config.icon}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2">
          <p className="text-sm text-foreground truncate">
            {event.message}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          {event.author && (
            <>
              <span className="text-xs text-border">|</span>
              <span className="text-xs text-muted-foreground">{event.author}</span>
            </>
          )}
          {fileSummary && (
            <>
              <span className="text-xs text-border">|</span>
              <span className="text-xs text-muted-foreground/70">{fileSummary}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
