/**
 * EDITH Context Panel
 *
 * Renders a formatted context status panel for the /context command.
 * Shows token usage with progress bar, conversation stats, and cost.
 */

import {
  type ColorSupport,
  type RGB,
  ARC_REACTOR_PALETTE,
  renderColored,
  detectTerminalWidth,
} from "./color-engine.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface SessionStats {
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  toolResults: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  cost: number;
}

export interface ContextUsage {
  tokens: number | null;
  contextWindow: number | null;
  percent: number | null;
}

// ── Number Formatting ─────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return `${n.toFixed(1)}%`;
}

function fmtCost(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return `$${n.toFixed(3)}`;
}

// ── Progress Bar ──────────────────────────────────────────────────

function progressBar(percent: number, width: number, support: ColorSupport): string {
  const filled = Math.round(width * Math.min(percent, 1));
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  if (support === "none") return bar;

  const P = ARC_REACTOR_PALETTE;
  let color: RGB;
  if (percent < 0.5) {
    color = P.coreGlow;
  } else if (percent < 0.8) {
    color = P.innerRing;
  } else {
    color = { r: 255, g: 100, b: 50 };
  }

  return renderColored(bar, color, support);
}

// ── Panel Rendering ───────────────────────────────────────────────

export function renderContextPanel(
  stats: SessionStats | null | undefined,
  usage: ContextUsage | null | undefined,
  support: ColorSupport,
): string {
  const width = Math.min(detectTerminalWidth(), 56);
  const inner = width - 4;

  const lines: string[] = [];

  // Header
  const title = " Context ";
  const padL = Math.max(0, Math.floor((inner - title.length) / 2));
  const padR = Math.max(0, inner - padL - title.length);
  lines.push(`╭${"─".repeat(padL)}${title}${"─".repeat(padR)}╮`);
  lines.push(`│${" ".repeat(inner)}│`);

  // Token usage
  if (usage?.tokens != null && usage.contextWindow) {
    const pct = usage.percent ?? usage.tokens / usage.contextWindow;
    const tokenText = `${fmt(usage.tokens)} / ${fmt(usage.contextWindow)}`;
    const barW = Math.max(10, inner - tokenText.length - 12);
    const bar = progressBar(pct, barW, support);
    const line1 = `  Tokens  ${bar}  ${tokenText}`;
    lines.push(`│${line1.padEnd(inner)}│`);
    lines.push(`│${`  Usage   ${fmtPct(usage.percent)}`.padEnd(inner)}│`);
  } else {
    lines.push(`│${"  Tokens  N/A".padEnd(inner)}│`);
  }

  lines.push(`│${" ".repeat(inner)}│`);

  // Messages & Tools
  const uMsg = stats?.userMessages ?? 0;
  const aMsg = stats?.assistantMessages ?? 0;
  lines.push(`│${`  Messages  User: ${uMsg}   Assistant: ${aMsg}`.padEnd(inner)}│`);

  const calls = stats?.toolCalls ?? 0;
  const results = stats?.toolResults ?? 0;
  lines.push(`│${`  Tools     Calls: ${calls}   Results: ${results}`.padEnd(inner)}│`);

  lines.push(`│${" ".repeat(inner)}│`);

  // Token detail
  lines.push(`│${"  Token Detail".padEnd(inner)}│`);
  const inp = fmt(stats?.tokens?.input);
  const out = fmt(stats?.tokens?.output);
  lines.push(`│${`    Input:   ${inp}  Output: ${out}`.padEnd(inner)}│`);
  const cr = fmt(stats?.tokens?.cacheRead);
  const cw = fmt(stats?.tokens?.cacheWrite);
  lines.push(`│${`    Cache:   R: ${cr}  W: ${cw}`.padEnd(inner)}│`);
  lines.push(`│${`    Cost:    ${fmtCost(stats?.cost)}`.padEnd(inner)}│`);

  lines.push(`│${" ".repeat(inner)}│`);
  lines.push(`╰${"─".repeat(inner)}╯`);

  return lines.join("\n");
}
