#!/usr/bin/env node
/**
 * JARVIS Post-Install Script
 *
 * Runs automatically after `npm install @jarvis/agent`.
 * Checks for an existing jarvis.yaml and provides guidance
 * for first-time setup.
 *
 * Behavior:
 *   - If jarvis.yaml exists → Inform user that config was detected
 *   - If jarvis.yaml not found → Guide user to run `jarvis --init`
 *   - Never creates files automatically
 *   - Never fails the npm install (catches all errors silently)
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_FILENAME = "jarvis.yaml";

function main(): void {
  try {
    // Check for jarvis.yaml in current working directory
    const configPath = resolve(process.cwd(), CONFIG_FILENAME);
    const configExists = existsSync(configPath);

    console.log();
    console.log("  ══════════════════════════════════════════");
    console.log("  JARVIS Agent - Post-Install Check");
    console.log("  ══════════════════════════════════════════");
    console.log();

    if (configExists) {
      console.log("  Detected existing configuration: jarvis.yaml");
      console.log();
      console.log("  You can start using JARVIS right away:");
      console.log("    jarvis");
      console.log();
    } else {
      console.log("  No jarvis.yaml configuration found.");
      console.log();
      console.log("  To set up JARVIS for the first time, run:");
      console.log("    jarvis --init");
      console.log();
      console.log("  This will launch an interactive wizard to configure:");
      console.log("    - LLM provider and model");
      console.log("    - Workspace root path");
      console.log("    - Source repositories");
      console.log();
    }

    console.log("  Additional commands:");
    console.log("    jarvis --version    Check installed version");
    console.log("    jarvis --help       Show usage information");
    console.log();
    console.log("  ══════════════════════════════════════════");
    console.log();
  } catch (err) {
    // Post-install scripts should never fail the npm install.
    // Log error but exit successfully.
    console.error(
      `  [JARVIS] Post-install check encountered an error: ${(err as Error).message}`
    );
    console.error("  [JARVIS] You can safely ignore this message.");
    console.log();
  }
}

main();
