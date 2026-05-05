/**
 * Shared Formatting Utilities
 *
 * Common formatting functions used across Dashboard panels and pages.
 * Consolidated from duplicated implementations in HealthPanel.tsx and page.tsx.
 */

/**
 * Format a date string into a relative time string (e.g. "2h ago", "just now").
 */
export function formatTimeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
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
