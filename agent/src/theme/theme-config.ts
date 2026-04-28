/**
 * EDITH Theme Configuration
 *
 * Reads optional theme settings from edith.yaml.
 * If no theme section is present, defaults to the Arc Reactor Iron Man style.
 */

// ── Theme Config Types ───────────────────────────────────────────

export type ThemeStyle = "arc-reactor" | "minimal" | "classic";
export type ColorScheme = "iron-man" | "warm" | "monochrome";

export interface ThemeConfig {
  /** Logo style (default: arc-reactor) */
  style: ThemeStyle;

  /** Color scheme (default: iron-man) */
  colorScheme: ColorScheme;

  /** Show the reactor animation on startup (default: true) */
  showReactor: boolean;
}

// ── Defaults ─────────────────────────────────────────────────────

export const DEFAULT_THEME: ThemeConfig = {
  style: "arc-reactor",
  colorScheme: "iron-man",
  showReactor: true,
};

/**
 * Parse theme configuration from a raw edith.yaml object.
 * Returns defaults for any missing fields.
 *
 * @param rawConfig - The parsed edith.yaml root object (may contain a `theme` key)
 */
export function parseThemeConfig(rawConfig: unknown): ThemeConfig {
  if (!rawConfig || typeof rawConfig !== "object") {
    return { ...DEFAULT_THEME };
  }

  const config = rawConfig as Record<string, unknown>;
  const theme = config.theme;

  if (!theme || typeof theme !== "object") {
    return { ...DEFAULT_THEME };
  }

  const t = theme as Record<string, unknown>;

  const style = typeof t.style === "string" && ["arc-reactor", "minimal", "classic"].includes(t.style)
    ? (t.style as ThemeStyle)
    : DEFAULT_THEME.style;

  const colorScheme = typeof t.color_scheme === "string" && ["iron-man", "warm", "monochrome"].includes(t.color_scheme)
    ? (t.color_scheme as ColorScheme)
    : DEFAULT_THEME.colorScheme;

  const showReactor = typeof t.show_reactor === "boolean"
    ? t.show_reactor
    : DEFAULT_THEME.showReactor;

  return { style, colorScheme, showReactor };
}
