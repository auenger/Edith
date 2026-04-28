#!/usr/bin/env node
/**
 * EDITH CLI Entry Point
 *
 * Provides three modes of operation:
 *   edith --version   → Print version and exit
 *   edith --init      → Run interactive configuration wizard
 *   edith             → Start the agent (requires edith.yaml)
 *
 * The compiled output (dist/bin/edith.js) is registered as the
 * "edith" command via package.json "bin" field.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { loadConfig, ConfigError, findConfigFile, initConfigWizard } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Version ──────────────────────────────────────────────────────────

/**
 * Read version from package.json.
 * Works both in development (src/) and production (dist/) layouts.
 */
function getVersion(): string {
  // Try relative to dist/bin/ first (production layout)
  const prodPath = resolve(__dirname, "..", "..", "package.json");
  // Try relative to src/bin/ (development layout)
  const devPath = resolve(__dirname, "..", "..", "package.json");

  for (const pkgPath of [prodPath, devPath]) {
    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (pkg.version) {
        return pkg.version;
      }
    } catch {
      // Continue to next path
    }
  }

  return "unknown";
}

// ── Argument Parsing ─────────────────────────────────────────────────

function parseArgs(argv: string[]): { version: boolean; init: boolean } {
  const args = argv.slice(2); // Skip node and script path
  return {
    version: args.includes("--version") || args.includes("-v"),
    init: args.includes("--init"),
  };
}

// ── Help Message ─────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
Usage: edith [options]

Options:
  --version, -v    Print version and exit
  --init           Run interactive configuration wizard
  --help, -h       Show this help message

Description:
  EDITH is an AI Knowledge Infrastructure Agent.

  On first run, ensure edith.yaml exists in your workspace.
  Run "edith --init" to create one interactively.

Examples:
  edith --version        # Check installed version
  edith --init           # Create edith.yaml configuration
  edith                  # Start the agent
`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseArgs(process.argv);

  // Handle --help
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  // Handle --version
  if (flags.version) {
    const version = getVersion();
    console.log(`edith v${version}`);
    process.exit(0);
  }

  // Handle --init
  if (flags.init) {
    try {
      await initConfigWizard();
    } catch (err) {
      console.error(`\n[ERROR] ${(err as Error).message}\n`);
      process.exit(1);
    }
    return;
  }

  // Default mode: Start the agent.
  // Check for edith.yaml first; if not found, show guidance.
  const configPath = findConfigFile();
  if (!configPath) {
    console.log();
    console.log("  [EDITH] edith.yaml not found in current directory or parent directories.");
    console.log();
    console.log("  To get started, run:");
    console.log("    edith --init");
    console.log();
    console.log("  This will create a edith.yaml configuration file interactively.");
    console.log();
    process.exit(1);
  }

  // Config found — delegate to the main agent entry point.
  // Import and run the agent startup sequence from index.ts.
  try {
    // Re-use the main entry point logic.
    // We import dynamically to avoid top-level side effects
    // when only --version or --init was requested.
    const { startAgent } = await import("../agent-startup.js");
    await startAgent();
  } catch (err) {
    // If dynamic import fails (e.g., agent-startup not extracted yet),
    // fall back to the index.ts main function.
    if ((err as any).code === "ERR_MODULE_NOT_FOUND") {
      console.log();
      console.log("  [EDITH] Starting agent...");
      console.log(`  [EDITH] Configuration: ${configPath}`);
      console.log();

      try {
        loadConfig(configPath);
      } catch (err) {
        if (err instanceof ConfigError) {
          console.error(`\n  [ERROR] ${err.message}\n`);
          process.exit(1);
        }
        throw err;
      }

      // Load and run the main index module
      await import("../index.js");
    } else {
      throw err;
    }
  }
}

main().catch((err: unknown) => {
  if (err instanceof ConfigError) {
    console.error(`\n  [ERROR] ${err.message}\n`);
    process.exit(1);
  }
  console.error(`\n  [FATAL] Unhandled error:\n  ${err}\n`);
  process.exit(1);
});
