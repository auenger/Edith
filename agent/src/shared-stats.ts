import type { SessionStats, ContextUsage } from "./theme/context-panel.js";

let latestStats: SessionStats | null = null;
let latestUsage: ContextUsage | null = null;

export function setSharedStats(
  stats: SessionStats | null,
  usage: ContextUsage | null,
): void {
  latestStats = stats;
  latestUsage = usage;
}

export function getSharedStats(): {
  stats: SessionStats | null;
  usage: ContextUsage | null;
} {
  return { stats: latestStats, usage: latestUsage };
}
