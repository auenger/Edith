/**
 * Timeline shared helpers
 *
 * Event type definitions, icon/color mappings, and date formatting
 * used by both the Timeline page and the Dashboard RecentChangesPanel.
 */

import type { TimelineEvent } from "@/lib/api";

// ── Event Type Config ─────────────────────────────────────────────

export interface EventTypeConfig {
  icon: string;
  label: string;
  dotClass: string;
  iconBg: string;
}

export const EVENT_TYPE_CONFIG: Record<string, EventTypeConfig> = {
  scan: {
    icon: "\u{1F50D}",
    label: "Scan",
    dotClass: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600",
  },
  distill: {
    icon: "\u{1F4E6}",
    label: "Distill",
    dotClass: "bg-purple-500",
    iconBg: "bg-purple-50 text-purple-600",
  },
  ingest: {
    icon: "\u{1F4E5}",
    label: "Ingest",
    dotClass: "bg-green-500",
    iconBg: "bg-green-50 text-green-600",
  },
  graphify: {
    icon: "\u{1F578}",
    label: "Graphify",
    dotClass: "bg-orange-500",
    iconBg: "bg-orange-50 text-orange-600",
  },
  other: {
    icon: "\u{1F4CB}",
    label: "Other",
    dotClass: "bg-gray-400",
    iconBg: "bg-gray-50 text-gray-600",
  },
};

export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG) as Array<
  TimelineEvent["type"]
>;

export function getEventConfig(type: TimelineEvent["type"]): EventTypeConfig {
  return EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other;
}

// ── Date Formatting ───────────────────────────────────────────────

/**
 * Format a date string into a month group key like "2026-04".
 */
export function toMonthKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return "unknown";
  }
}

/**
 * Format a month key into a display label like "2026年04月".
 */
export function formatMonthLabel(monthKey: string): string {
  if (monthKey === "unknown") return "Unknown";
  const [year, month] = monthKey.split("-");
  return `${year}年${month}月`;
}

/**
 * Format a date string for display (e.g. "04-27 14:30").
 */
export function formatEventTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hour}:${min}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a relative time string (e.g. "2h ago").
 */
export function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

/**
 * Get a short summary of affected files.
 */
export function getFileSummary(files: string[]): string | null {
  if (files.length === 0) return null;
  if (files.length <= 2) return files.join(", ");
  return `${files.length} files`;
}

/**
 * Group timeline events by month (descending order).
 */
export function groupByMonth(
  events: TimelineEvent[],
): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const key = toMonthKey(event.date);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }

  // Sort keys descending (newest first)
  const sorted = new Map(
    [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)),
  );

  return sorted;
}
