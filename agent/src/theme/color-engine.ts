/**
 * JARVIS ANSI Color Engine
 *
 * Terminal color capability detection and ANSI escape sequence rendering.
 * Supports four levels of color support with graceful degradation:
 *   true-color → 256-color → 16-color → none
 *
 * Color palette inspired by Iron Man's Arc Reactor:
 *   Core glow:    #00ffff (bright cyan) / #ffffff (white highlight)
 *   Inner ring:   #00d4ff (ice blue)
 *   Middle ring:  #0066aa (medium blue)
 *   Outer ring:   #003355 (deep blue)
 */

// ── Color Support Detection ──────────────────────────────────────

export type ColorSupport = "true-color" | "256-color" | "16-color" | "none";

/**
 * Detect the terminal's color support level.
 *
 * Detection strategy:
 * 1. COLORTERM=truecolor|24bit → true-color (24-bit RGB)
 * 2. TERM contains "256color"   → 256-color (8-bit indexed)
 * 3. TERM exists otherwise      → 16-color (basic ANSI)
 * 4. No TERM env var            → none (plain text)
 */
export function detectColorSupport(): ColorSupport {
  const colorterm = process.env.COLORTERM;
  if (colorterm === "truecolor" || colorterm === "24bit") {
    return "true-color";
  }

  const term = process.env.TERM;
  if (!term) {
    return "none";
  }

  if (term.includes("256color")) {
    return "256-color";
  }

  // TERM is set but no special color indicators — assume basic 16-color
  // Treat known non-color terminals as "none"
  if (term === "dumb" || term === "unknown" || term === "ansi") {
    return "none";
  }

  return "16-color";
}

/**
 * Detect terminal width for responsive LOGO display.
 * Returns a sensible default if detection fails.
 */
export function detectTerminalWidth(): number {
  if (process.stdout.columns && process.stdout.columns > 0) {
    return process.stdout.columns;
  }
  return 80; // Standard terminal default
}

// ── RGB Color Type ───────────────────────────────────────────────

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// ── Arc Reactor Color Palette ────────────────────────────────────

export const ARC_REACTOR_PALETTE = {
  coreGlow:   { r: 0,   g: 255, b: 255 } as RGB, // #00ffff — bright cyan
  coreWhite:  { r: 255, g: 255, b: 255 } as RGB, // #ffffff — white highlight
  innerRing:  { r: 0,   g: 212, b: 255 } as RGB, // #00d4ff — ice blue
  middleRing: { r: 0,   g: 102, b: 170 } as RGB, // #0066aa — medium blue
  outerRing:  { r: 0,   g: 51,  b: 85  } as RGB, // #003355 — deep blue
  subtitle:   { r: 0,   g: 180, b: 220 } as RGB, // #00b4dc — subtitle gradient
  statusBar:  { r: 80,  g: 80,  b: 100 } as RGB, // #505064 — muted status color
} as const;

// ── Color Interpolation ──────────────────────────────────────────

/**
 * Linearly interpolate between two RGB colors.
 * Returns an array of `steps` colors from start to end (inclusive).
 */
export function interpolateColor(start: RGB, end: RGB, steps: number): RGB[] {
  if (steps <= 1) return [{ ...start }];

  const colors: RGB[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    colors.push({
      r: Math.round(start.r + (end.r - start.r) * t),
      g: Math.round(start.g + (end.g - start.g) * t),
      b: Math.round(start.b + (end.b - start.b) * t),
    });
  }
  return colors;
}

// ── ANSI Escape Sequence Rendering ──────────────────────────────

const ESC = "\x1b[";
const RESET = "\x1b[0m";

/**
 * Render text with 24-bit true color (RGB) foreground.
 * Format: ESC[38;2;R;G;Bm <text> ESC[0m
 */
export function renderTrueColor(text: string, color: RGB): string {
  return `${ESC}38;2;${color.r};${color.g};${color.b}m${text}${RESET}`;
}

/**
 * Map an RGB color to the nearest 256-color index.
 * Uses the 216-color cube (16 + 36*r + 6*g + b) for best approximation.
 */
export function rgbTo256(color: RGB): number {
  // 256-color palette:
  //   0-7:   Standard colors
  //   8-15:  High-intensity colors
  //   16-231: 6x6x6 color cube (r,g,b each 0-5)
  //   232-255: Grayscale ramp

  const rIdx = Math.round((color.r / 255) * 5);
  const gIdx = Math.round((color.g / 255) * 5);
  const bIdx = Math.round((color.b / 255) * 5);

  return 16 + 36 * rIdx + 6 * gIdx + bIdx;
}

/**
 * Render text with 256-color (8-bit indexed) foreground.
 * Format: ESC[38;5;Nm <text> ESC[0m
 */
export function render256Color(text: string, color: RGB): string {
  const idx = rgbTo256(color);
  return `${ESC}38;5;${idx}m${text}${RESET}`;
}

/**
 * 16-color ANSI foreground codes for basic blue/cyan.
 * Blue: ESC[34m  Bright Cyan: ESC[96m  Cyan: ESC[36m
 */
const ANSI_16_COLORS: Record<string, string> = {
  blue:   `${ESC}34m`,
  cyan:   `${ESC}36m`,
  brightCyan: `${ESC}96m`,
  white:  `${ESC}97m`,
  dim:    `${ESC}2m`,
};

/**
 * Render text with 16-color ANSI foreground.
 * Maps RGB colors to the nearest available 16-color: blue, cyan, bright cyan, or white.
 */
export function render16Color(text: string, color: RGB): string {
  // Simple heuristic: determine which 16-color is closest
  const brightness = (color.r + color.g + color.b) / 3;
  const isBlueish = color.b > color.r && color.b > color.g;

  let code: string;
  if (brightness > 200) {
    code = ANSI_16_COLORS.white;
  } else if (brightness > 120 && isBlueish) {
    code = ANSI_16_COLORS.brightCyan;
  } else if (isBlueish) {
    code = ANSI_16_COLORS.cyan;
  } else {
    code = ANSI_16_COLORS.blue;
  }

  return `${code}${text}${RESET}`;
}

/**
 * Render text with no color (plain text passthrough).
 */
export function renderNoColor(text: string): string {
  return text;
}

// ── Universal Render Function ────────────────────────────────────

/**
 * Render colored text based on the given color support level.
 * Automatically picks the best rendering strategy.
 */
export function renderColored(text: string, color: RGB, support: ColorSupport): string {
  switch (support) {
    case "true-color":
      return renderTrueColor(text, color);
    case "256-color":
      return render256Color(text, color);
    case "16-color":
      return render16Color(text, color);
    case "none":
      return renderNoColor(text);
  }
}

/**
 * Render each character with its own color from a color map.
 * Adjacent characters with the same color are batched into a single escape sequence.
 */
export function renderColoredLine(
  chars: string[],
  colors: RGB[],
  support: ColorSupport
): string {
  if (support === "none") {
    return chars.join("");
  }

  const parts: string[] = [];
  let currentColor: RGB | null = null;
  let buffer = "";

  for (let i = 0; i < chars.length; i++) {
    const color = colors[i];
    if (
      currentColor &&
      color.r === currentColor.r &&
      color.g === currentColor.g &&
      color.b === currentColor.b
    ) {
      buffer += chars[i];
    } else {
      if (buffer && currentColor) {
        parts.push(renderColored(buffer, currentColor, support));
      }
      buffer = chars[i];
      currentColor = color;
    }
  }

  if (buffer && currentColor) {
    parts.push(renderColored(buffer, currentColor, support));
  }

  return parts.join("");
}
