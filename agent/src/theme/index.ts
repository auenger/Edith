/**
 * EDITH TUI Theme Module
 *
 * Provides a unified interface for EDITH terminal branding:
 *   - Arc Reactor ASCII art banner with ANSI gradient
 *   - EDITH> branded prompt
 *   - Status bar with workspace statistics
 *   - Terminal color detection and graceful degradation
 *
 * Usage:
 *   import { createTheme } from "./theme/index.js";
 *   const theme = createTheme();
 *   console.log(theme.banner);
 *   console.log(theme.prompt);
 *   console.log(theme.statusBar("./workspace", 3, 12));
 */

import { detectColorSupport, type ColorSupport } from "./color-engine.js";
import {
  generateBanner,
  generatePrompt,
  generateStatusBar,
  generateSeparator,
} from "./banner.js";

// ── Theme Interface ──────────────────────────────────────────────

export interface EdithTheme {
  /** Detected color support level */
  colorSupport: ColorSupport;

  /** Pre-rendered Arc Reactor banner string */
  banner: string;

  /** Pre-rendered EDITH> prompt string */
  prompt: string;

  /** Pre-rendered separator line */
  separator: string;

  /**
   * Generate a status bar with current workspace stats.
   * @param workspacePath - Path to the workspace root
   * @param serviceCount - Number of services
   * @param artifactCount - Number of artifacts
   */
  statusBar(workspacePath: string, serviceCount: number, artifactCount: number): string;

  /**
   * Re-generate the banner (useful after terminal resize).
   */
  refreshBanner(): string;

  /**
   * Re-generate the prompt.
   */
  refreshPrompt(): string;
}

// ── Theme Factory ────────────────────────────────────────────────

/**
 * Create a EDITH TUI theme instance.
 *
 * Detects terminal color capabilities once at creation time,
 * then pre-renders the banner and prompt for fast display.
 *
 * @param overrideSupport - Override auto-detected color support (for testing)
 */
export function createTheme(overrideSupport?: ColorSupport): EdithTheme {
  const colorSupport = overrideSupport ?? detectColorSupport();

  return {
    colorSupport,

    get banner(): string {
      return generateBanner(colorSupport);
    },

    get prompt(): string {
      return generatePrompt(colorSupport);
    },

    get separator(): string {
      return generateSeparator(colorSupport);
    },

    statusBar(workspacePath: string, serviceCount: number, artifactCount: number): string {
      return generateStatusBar(workspacePath, serviceCount, artifactCount, colorSupport);
    },

    refreshBanner(): string {
      return generateBanner(colorSupport);
    },

    refreshPrompt(): string {
      return generatePrompt(colorSupport);
    },
  };
}

// Re-export color engine utilities for direct access
export { detectColorSupport, type ColorSupport, type RGB } from "./color-engine.js";
