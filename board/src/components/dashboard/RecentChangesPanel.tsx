"use client";

import type { TimelineEvent } from "@/lib/api";

interface RecentChangesPanelProps {
  timeline: TimelineEvent[];
  loading: boolean;
}

export function RecentChangesPanel({ timeline, loading }: RecentChangesPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Recent Changes
        </h3>
        <a
          href="/timeline"
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          View all
        </a>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && timeline.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No recent changes</p>
          <p className="text-xs text-gray-400 mt-1">
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
  const icon = getTypeIcon(event.type);
  const timeStr = formatTime(event.date);
  const fileSummary = getFileSummary(event.files);

  return (
    <div className="flex items-start gap-3 relative pb-4">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs ${
          getIconBg(event.type)
        }`}>
          {icon}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2">
          <p className="text-sm text-gray-900 truncate">
            {event.message}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{timeStr}</span>
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
    </div>
  );
}

// ── Type Helpers ────────────────────────────────────────────────

function getTypeIcon(type: TimelineEvent["type"]): string {
  switch (type) {
    case "scan": return "\u{1F50D}";
    case "distill": return "\u{1F4E6}";
    case "ingest": return "\u{1F4E5}";
    case "graphify": return "\u{1F578}";
    default: return "\u{1F4CB}";
  }
}

function getIconBg(type: TimelineEvent["type"]): string {
  switch (type) {
    case "scan": return "bg-blue-50 text-blue-600";
    case "distill": return "bg-purple-50 text-purple-600";
    case "ingest": return "bg-green-50 text-green-600";
    case "graphify": return "bg-orange-50 text-orange-600";
    default: return "bg-gray-50 text-gray-600";
  }
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    // Show date for older entries
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getFileSummary(files: string[]): string | null {
  if (files.length === 0) return null;
  if (files.length <= 2) return files.join(", ");
  return `${files.length} files`;
}
