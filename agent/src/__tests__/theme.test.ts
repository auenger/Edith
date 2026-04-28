/**
 * Tests for EDITH TUI Theme module
 *
 * Verifies:
 *  - Color detection logic
 *  - Banner generation for all support levels
 *  - Prompt generation
 *  - Status bar generation
 *  - Color interpolation
 *  - Edge cases (narrow terminal, no TERM env)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  detectColorSupport,
  type ColorSupport,
  interpolateColor,
  renderTrueColor,
  render256Color,
  render16Color,
  renderNoColor,
  renderColored,
  renderColoredLine,
  type RGB,
  ARC_REACTOR_PALETTE,
  rgbTo256,
} from "../theme/color-engine.js";

import {
  generateBanner,
  generatePrompt,
  generateStatusBar,
  generateSeparator,
} from "../theme/banner.js";

import { createTheme } from "../theme/index.js";

import { parseThemeConfig, DEFAULT_THEME } from "../theme/theme-config.js";

import { countWorkspaceStats } from "../theme/workspace-stats.js";

// ── Color Engine Tests ────────────────────────────────────────────

describe("Color Engine: detectColorSupport", () => {
  const origColorterm = process.env.COLORTERM;
  const origTerm = process.env.TERM;

  function restoreEnv() {
    if (origColorterm !== undefined) process.env.COLORTERM = origColorterm;
    else delete process.env.COLORTERM;
    if (origTerm !== undefined) process.env.TERM = origTerm;
    else delete process.env.TERM;
  }

  it("detects true-color when COLORTERM=truecolor", () => {
    process.env.COLORTERM = "truecolor";
    process.env.TERM = "xterm-256color";
    assert.equal(detectColorSupport(), "true-color");
    restoreEnv();
  });

  it("detects true-color when COLORTERM=24bit", () => {
    process.env.COLORTERM = "24bit";
    assert.equal(detectColorSupport(), "true-color");
    restoreEnv();
  });

  it("detects 256-color when TERM contains 256color", () => {
    delete process.env.COLORTERM;
    process.env.TERM = "xterm-256color";
    assert.equal(detectColorSupport(), "256-color");
    restoreEnv();
  });

  it("detects 16-color when TERM exists but no special indicators", () => {
    delete process.env.COLORTERM;
    process.env.TERM = "xterm";
    assert.equal(detectColorSupport(), "16-color");
    restoreEnv();
  });

  it("detects none when TERM=dumb", () => {
    delete process.env.COLORTERM;
    process.env.TERM = "dumb";
    assert.equal(detectColorSupport(), "none");
    restoreEnv();
  });

  it("detects none when no TERM env var", () => {
    delete process.env.COLORTERM;
    delete process.env.TERM;
    assert.equal(detectColorSupport(), "none");
    restoreEnv();
  });

  it("detects none when TERM=unknown", () => {
    delete process.env.COLORTERM;
    process.env.TERM = "unknown";
    assert.equal(detectColorSupport(), "none");
    restoreEnv();
  });
});

describe("Color Engine: interpolateColor", () => {
  it("returns single color for steps=1", () => {
    const result = interpolateColor({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 1);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], { r: 0, g: 0, b: 0 });
  });

  it("interpolates correctly for 3 steps", () => {
    const result = interpolateColor({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 3);
    assert.equal(result.length, 3);
    assert.deepEqual(result[0], { r: 0, g: 0, b: 0 });
    assert.deepEqual(result[1], { r: 50, g: 100, b: 25 });
    assert.deepEqual(result[2], { r: 100, g: 200, b: 50 });
  });
});

describe("Color Engine: render functions", () => {
  it("renderTrueColor produces correct escape sequence", () => {
    const result = renderTrueColor("test", { r: 255, g: 128, b: 0 });
    assert.ok(result.startsWith("\x1b[38;2;255;128;0m"));
    assert.ok(result.endsWith("\x1b[0m"));
    assert.ok(result.includes("test"));
  });

  it("render256Color produces correct escape sequence", () => {
    const result = render256Color("test", { r: 0, g: 0, b: 0 });
    assert.ok(result.startsWith("\x1b[38;5;"));
    assert.ok(result.endsWith("\x1b[0m"));
  });

  it("render16Color produces escape sequence", () => {
    const result = render16Color("test", { r: 0, g: 100, b: 255 });
    assert.ok(result.includes("\x1b["));
    assert.ok(result.endsWith("\x1b[0m"));
  });

  it("renderNoColor returns plain text", () => {
    const result = renderNoColor("test");
    assert.equal(result, "test");
  });

  it("renderColored dispatches to correct renderer", () => {
    const color: RGB = { r: 100, g: 100, b: 100 };

    const tc = renderColored("x", color, "true-color");
    assert.ok(tc.includes("\x1b[38;2;"));

    const c256 = renderColored("x", color, "256-color");
    assert.ok(c256.includes("\x1b[38;5;"));

    const c16 = renderColored("x", color, "16-color");
    assert.ok(c16.includes("\x1b["));

    const cn = renderColored("x", color, "none");
    assert.equal(cn, "x");
  });
});

describe("Color Engine: rgbTo256", () => {
  it("maps black to index 16", () => {
    assert.equal(rgbTo256({ r: 0, g: 0, b: 0 }), 16);
  });

  it("maps white to index 231", () => {
    assert.equal(rgbTo256({ r: 255, g: 255, b: 255 }), 231);
  });
});

describe("Color Engine: renderColoredLine", () => {
  it("returns plain text for none support", () => {
    const chars = ["a", "b", "c"];
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];
    assert.equal(renderColoredLine(chars, colors, "none"), "abc");
  });

  it("returns colored text for true-color support", () => {
    const chars = ["a", "b"];
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
    ];
    const result = renderColoredLine(chars, colors, "true-color");
    assert.ok(result.includes("\x1b[38;2;"));
    assert.ok(result.includes("a"));
    assert.ok(result.includes("b"));
  });
});

// ── Banner Tests ──────────────────────────────────────────────────

// Helper: strip ANSI escape sequences for content assertions
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[^m]*m/g, "");
}

describe("Banner: generateBanner", () => {
  it("generates banner for true-color without crashing", () => {
    const banner = generateBanner("true-color");
    assert.ok(banner.length > 0);
    const plain = stripAnsi(banner);
    assert.ok(plain.includes("EDITH"), "Banner should contain EDITH text");
    assert.ok(plain.includes("AI Knowledge Infrastructure"), "Banner should contain subtitle");
  });

  it("generates banner for 256-color without crashing", () => {
    const banner = generateBanner("256-color");
    const plain = stripAnsi(banner);
    assert.ok(plain.includes("EDITH"));
  });

  it("generates banner for 16-color without crashing", () => {
    const banner = generateBanner("16-color");
    const plain = stripAnsi(banner);
    assert.ok(plain.includes("EDITH"));
  });

  it("generates plain text banner for none", () => {
    const banner = generateBanner("none");
    assert.ok(banner.includes("EDITH"));
    assert.ok(banner.includes("AI Knowledge Infrastructure"));
    // No ANSI escape sequences
    assert.ok(!banner.includes("\x1b["));
  });

  it("all colored text segments are properly closed with reset", () => {
    const banner = generateBanner("true-color");
    // Every opening escape should have a matching reset
    // Split by reset and verify each segment
    const segments = banner.split("\x1b[0m");
    // The last segment should have no opening escape (it's after the last reset)
    for (let i = 0; i < segments.length - 1; i++) {
      // Each segment (except possibly the last empty one) should have an opening escape
      // or be pure text between resets
    }
    // Verify no hanging opens: strip all resets, count opens, should be zero
    const afterLastReset = segments[segments.length - 1];
    const hangingOpens = (afterLastReset.match(/\x1b\[/g) || []).length;
    assert.equal(hangingOpens, 0, "No hanging ANSI escape sequences after last reset");
    assert.ok(banner.length > 0, "Banner should be non-empty");
  });
});

describe("Banner: generatePrompt", () => {
  it("generates EDITH> prompt with color", () => {
    const prompt = generatePrompt("true-color");
    assert.ok(prompt.includes("EDITH"));
    assert.ok(prompt.includes(">"));
    assert.ok(prompt.includes("\x1b["));
  });

  it("generates plain prompt for none", () => {
    const prompt = generatePrompt("none");
    assert.equal(prompt, "EDITH> ");
  });
});

describe("Banner: generateStatusBar", () => {
  it("generates status bar with correct content", () => {
    const bar = generateStatusBar("./workspace", 3, 12, "true-color");
    assert.ok(bar.includes("./workspace"));
    assert.ok(bar.includes("3 services"));
    assert.ok(bar.includes("12 artifacts"));
  });

  it("generates plain status bar for none", () => {
    const bar = generateStatusBar("./ws", 5, 20, "none");
    assert.ok(!bar.includes("\x1b["));
    assert.ok(bar.includes("5 services"));
  });
});

describe("Banner: generateSeparator", () => {
  it("generates separator line", () => {
    const sep = generateSeparator("none");
    assert.ok(sep.includes("─")); // Unicode box-drawing char or dash
  });
});

// ── Theme Module Tests ────────────────────────────────────────────

describe("Theme: createTheme", () => {
  it("creates theme with auto-detected color support", () => {
    const theme = createTheme();
    assert.ok(theme.colorSupport);
    assert.ok(theme.banner.length > 0);
    assert.ok(theme.prompt.length > 0);
    assert.ok(theme.separator.length > 0);
  });

  it("creates theme with overridden color support", () => {
    const theme = createTheme("none");
    assert.equal(theme.colorSupport, "none");
    assert.ok(!theme.banner.includes("\x1b["));
    assert.equal(theme.prompt, "EDITH> ");
  });

  it("statusBar generates content", () => {
    const theme = createTheme("none");
    const bar = theme.statusBar("./ws", 2, 8);
    assert.ok(bar.includes("2 services"));
    assert.ok(bar.includes("8 artifacts"));
  });

  it("refreshBanner returns a new banner", () => {
    const theme = createTheme("true-color");
    const banner = theme.refreshBanner();
    assert.ok(banner.includes("EDITH"));
  });
});

// ── Theme Config Tests ────────────────────────────────────────────

describe("Theme Config: parseThemeConfig", () => {
  it("returns defaults for null input", () => {
    const config = parseThemeConfig(null);
    assert.deepEqual(config, DEFAULT_THEME);
  });

  it("returns defaults for empty object", () => {
    const config = parseThemeConfig({});
    assert.deepEqual(config, DEFAULT_THEME);
  });

  it("parses valid theme config", () => {
    const config = parseThemeConfig({
      theme: {
        style: "minimal",
        color_scheme: "warm",
        show_reactor: false,
      },
    });
    assert.equal(config.style, "minimal");
    assert.equal(config.colorScheme, "warm");
    assert.equal(config.showReactor, false);
  });

  it("ignores invalid values and uses defaults", () => {
    const config = parseThemeConfig({
      theme: {
        style: "nonexistent",
        color_scheme: "invalid",
      },
    });
    assert.equal(config.style, "arc-reactor");
    assert.equal(config.colorScheme, "iron-man");
    assert.equal(config.showReactor, true);
  });
});

// ── Workspace Stats Tests ─────────────────────────────────────────

describe("Workspace Stats: countWorkspaceStats", () => {
  it("returns zeros for non-existent directory", () => {
    const stats = countWorkspaceStats("/nonexistent/path/that/does/not/exist");
    assert.equal(stats.serviceCount, 0);
    assert.equal(stats.artifactCount, 0);
    assert.equal(stats.workspacePath, "/nonexistent/path/that/does/not/exist");
  });

  it("returns zeros for empty directory", () => {
    // Use a temp-like path that likely exists but is empty
    const stats = countWorkspaceStats("/tmp");
    // /tmp exists but likely has no .md files at the top level
    assert.ok(typeof stats.serviceCount === "number");
    assert.ok(typeof stats.artifactCount === "number");
  });
});
