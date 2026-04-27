/**
 * JARVIS Arc Reactor Banner
 *
 * Generates the Arc Reactor ASCII art LOGO with gradient coloring.
 * The LOGO features:
 *   - Concentric arc rings simulating Iron Man's Arc Reactor
 *   - A glowing core with bright cyan/white highlights
 *   - "JARVIS" text integrated into the design
 *   - "AI Knowledge Infrastructure" subtitle
 *
 * All colors use the ANSI gradient engine with graceful degradation.
 */

import {
  type RGB,
  type ColorSupport,
  ARC_REACTOR_PALETTE,
  interpolateColor,
  renderColored,
  renderColoredLine,
  detectTerminalWidth,
} from "./color-engine.js";

// ── Arc Reactor ASCII Art ────────────────────────────────────────
//
// Design: concentric arcs around a glowing core with JARVIS text.
// Each row has a "zone" (outer / middle / inner / core) that determines color.
// The design fits within 60 columns to be safe on 80-col terminals.

interface BannerLine {
  text: string;     // The ASCII art characters for this line
  zone: "outer" | "middle" | "inner" | "core" | "text" | "empty";
}

// JARVIS bold block letters with gradient
const JARVIS_TEXT = `
·  ✦  ·               ·  ✦  ·                ·  ✦  ·
  ████▓▒░    █████▓▒░  ██████▓▒░ ███▓▒░ ██╗ ███▓▒░ ███████▓▒░
  ╚══██╔══╝ ██╔══██╗   ██╔══██╗  ██║    ██║ ██║    ██╔════░░
     ██║ ·  ███████║   ██████╔╝  ██║    ██║ ██║    ███████╗ ✦
 ██╗ ██║    ██╔══██║   ██╔══██╗  ╚████╔═╝   ██║    ╚════██║
 ╚█████╔╝ ✦ ██║  ██║   ██║  ██║   ╚███╔╝    ██║    ███████║ ·
  ╚════╝    ╚═╝  ╚═╝   ╚═╝  ╚═╝    ╚══╝     ╚═╝    ╚══════╝
    ·  ✦  ·              ·  ✦  ·               ·  ✦  ·
`;

// 建议加上颜色，效果更好（需要安装 chalk）

const SUBTITLE_LINE = "       AI Knowledge Infrastructure";
const MINIMAL_BANNER = "JARVIS — AI Knowledge Infrastructure";

// ── Color Zone Mapping ───────────────────────────────────────────

const ZONE_COLORS: Record<string, RGB> = {
  outer:  ARC_REACTOR_PALETTE.outerRing,   // #003355 deep blue
  middle: ARC_REACTOR_PALETTE.middleRing,  // #0066aa medium blue
  inner:  ARC_REACTOR_PALETTE.innerRing,   // #00d4ff ice blue
  core:   ARC_REACTOR_PALETTE.coreGlow,    // #00ffff bright cyan
  text:   ARC_REACTOR_PALETTE.coreWhite,   // #ffffff white
  empty:  ARC_REACTOR_PALETTE.outerRing,   // fallback
};

// Special character color overrides for enhanced visual effect
const CHAR_COLOR_OVERRIDES: Record<string, RGB> = {
  "╭": ARC_REACTOR_PALETTE.coreGlow,       // Box corners glow cyan
  "╮": ARC_REACTOR_PALETTE.coreGlow,
  "╰": ARC_REACTOR_PALETTE.coreGlow,
  "╯": ARC_REACTOR_PALETTE.coreGlow,
  "─": ARC_REACTOR_PALETTE.innerRing,       // Horizontal lines ice blue
  "│": ARC_REACTOR_PALETTE.coreWhite,       // Vertical bars white
  "╱": ARC_REACTOR_PALETTE.coreGlow,        // Triangle slashes bright cyan
  "╲": ARC_REACTOR_PALETTE.coreGlow,
  "█": ARC_REACTOR_PALETTE.coreWhite,       // Block chars white (JARVIS bold)
  "▀": ARC_REACTOR_PALETTE.coreWhite,
  "▄": ARC_REACTOR_PALETTE.coreWhite,
  "▌": ARC_REACTOR_PALETTE.coreWhite,
  "▐": ARC_REACTOR_PALETTE.coreWhite,
};

// ── No-Color Density Map ────────────────────────────────────────
// When terminal has no color support, use character density to express depth.
const ZONE_DENSITY: Record<string, string> = {
  outer:  "·",   // Light dot
  middle: "░",   // Light shade
  inner:  "▒",   // Medium shade
  core:   "█",   // Full block
  text:   " ",   // Space (text stands on its own)
  empty:  " ",
};

/**
 * Generate a no-color version of a banner line by replacing block characters
 * with density-appropriate characters to express depth without ANSI codes.
 */
function applyDensityMapping(text: string, zone: string): string {
  return text
    .replace(/█/g, ZONE_DENSITY[zone] || "█")
    .replace(/╱/g, "/")
    .replace(/╲/g, "\\");
}

// ── Banner Generation ────────────────────────────────────────────

/**
 * Build a color array for each character in a line.
 * Uses zone color as base, then applies per-character overrides.
 */
function buildLineColors(text: string, zone: string): RGB[] {
  const baseColor = ZONE_COLORS[zone] || ZONE_COLORS.empty;
  return text.split("").map((ch) => {
    if (CHAR_COLOR_OVERRIDES[ch]) {
      return CHAR_COLOR_OVERRIDES[ch];
    }
    // Space characters don't need color
    if (ch === " ") {
      return baseColor; // Spaces won't be visible anyway
    }
    return baseColor;
  });
}

/**
 * Generate the Arc Reactor banner with ANSI colors.
 *
 * @param support - Terminal color support level
 * @returns Formatted banner string ready for console output
 */
export function generateBanner(support: ColorSupport): string {
  // Check terminal width — use minimal banner for narrow terminals
  const termWidth = detectTerminalWidth();
  if (termWidth < 50) {
    return generateMinimalBanner(support);
  }

  const lines: string[] = [];
  const P = ARC_REACTOR_PALETTE;

  // Bold uppercase JARVIS text with gradient
  const jarvisLines = JARVIS_TEXT.split("\n");
  for (const line of jarvisLines) {
    if (support === "none") {
      lines.push(line);
    } else {
      const chars = line.split("");
      const colors = interpolateColor(P.coreGlow, P.innerRing, chars.length);
      lines.push(renderColoredLine(chars, colors, support));
    }
  }

  // Subtitle with gradient
  const subtitleColors = interpolateColor(P.innerRing, P.outerRing, SUBTITLE_LINE.length);
  if (support === "none") {
    lines.push(SUBTITLE_LINE);
  } else {
    const chars = SUBTITLE_LINE.split("");
    lines.push(renderColoredLine(chars, subtitleColors, support));
  }

  return lines.join("\n");
}

/**
 * Generate a minimal banner for narrow terminals (< 50 columns).
 * Just displays "JARVIS — AI Knowledge Infrastructure" with basic styling.
 */
function generateMinimalBanner(support: ColorSupport): string {
  const P = ARC_REACTOR_PALETTE;

  if (support === "none") {
    return MINIMAL_BANNER;
  }

  const titleColor = interpolateColor(P.coreGlow, P.innerRing, 6);
  const jarvis = renderColoredLine("JARVIS".split(""), titleColor, support);
  const dash = renderColored(" — ", P.middleRing, support);
  const sub = renderColored("AI Knowledge Infrastructure", P.outerRing, support);

  return `${jarvis}${dash}${sub}`;
}

/**
 * Generate the JARVIS> prompt string.
 * Uses cyan highlight for "JARVIS" and dim for ">".
 */
export function generatePrompt(support: ColorSupport): string {
  const P = ARC_REACTOR_PALETTE;

  if (support === "none") {
    return "JARVIS> ";
  }

  const name = renderColored("JARVIS", P.coreGlow, support);
  const arrow = renderColored(">", P.innerRing, support);

  return `${name}${arrow} `;
}

/**
 * Generate the status bar line.
 * Format: "workspace_path │ N services │ M artifacts"
 *
 * @param workspacePath - The workspace root path
 * @param serviceCount - Number of services in the knowledge base
 * @param artifactCount - Number of artifacts in the knowledge base
 * @param support - Terminal color support level
 */
export function generateStatusBar(
  workspacePath: string,
  serviceCount: number,
  artifactCount: number,
  support: ColorSupport
): string {
  const P = ARC_REACTOR_PALETTE;
  const separator = " │ ";

  const barContent = `${workspacePath}${separator}${serviceCount} services${separator}${artifactCount} artifacts`;

  if (support === "none") {
    return barContent;
  }

  return renderColored(barContent, P.statusBar, support);
}

/**
 * Generate a horizontal separator line.
 * Used to visually separate the banner from the interactive area.
 */
export function generateSeparator(support: ColorSupport): string {
  const P = ARC_REACTOR_PALETTE;
  const width = Math.min(detectTerminalWidth(), 60);
  const line = "─".repeat(width);

  if (support === "none") {
    return line;
  }

  return renderColored(line, P.outerRing, support);
}
