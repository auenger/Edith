/**
 * EDITH SubAgent Status Panel Renderer
 *
 * Renders status indicators for sub-agent execution:
 *   - starting: "Dispatching N agent(s)..."
 *   - completed: "All agents completed"
 *   - failed: "Agent execution failed"
 */

import type { ColorSupport } from "./color-engine.js";

type PanelStatus = "starting" | "completed" | "failed";
type ExecutionMode = "single" | "parallel" | "chain";

const STATUS_ICON: Record<PanelStatus, string> = {
  starting: "◎",
  completed: "✓",
  failed: "✗",
};

const STATUS_LABEL: Record<PanelStatus, string> = {
  starting: "Dispatching",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_COLOR: Record<PanelStatus, string> = {
  starting: "\x1b[36m", // cyan
  completed: "\x1b[32m", // green
  failed: "\x1b[31m",    // red
};

const MODE_LABEL: Record<ExecutionMode, string> = {
  single: "Single",
  parallel: "Parallel",
  chain: "Chain",
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

export function renderSubAgentPanel(
  status: PanelStatus,
  agentCount: number,
  mode: ExecutionMode,
  _colorSupport: ColorSupport,
): string {
  const icon = STATUS_ICON[status];
  const label = STATUS_LABEL[status];
  const color = STATUS_COLOR[status];
  const modeLabel = MODE_LABEL[mode];

  const countStr = agentCount === 1 ? "1 agent" : `${agentCount} agents`;

  const lines: string[] = [
    `${DIM}── SubAgent ──${RESET}`,
    `${color}${icon} ${label}: ${countStr} (${modeLabel})${RESET}`,
    `${DIM}─────────────${RESET}`,
  ];

  return lines.join("\n");
}
