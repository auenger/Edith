#!/usr/bin/env node
/**
 * EDITH Post-Install Script
 *
 * Runs automatically after `npm install @edith/agent`.
 * Checks for an existing edith.yaml and provides guidance
 * for first-time setup.
 *
 * Behavior:
 *   - If edith.yaml exists → Inform user that config was detected
 *   - If edith.yaml not found → Guide user to run `edith --init`
 *   - Never creates files automatically
 *   - Never fails the npm install (catches all errors silently)
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_FILENAME = "edith.yaml";

function main(): void {
  try {
    // Check for edith.yaml in current working directory
    const configPath = resolve(process.cwd(), CONFIG_FILENAME);
    const configExists = existsSync(configPath);

    console.log();
    console.log("  ══════════════════════════════════════════");
    console.log("  EDITH Agent - Post-Install Check");
    console.log("  ══════════════════════════════════════════");
    console.log();

    if (configExists) {
      console.log("  Detected existing configuration: edith.yaml");
      console.log();
      console.log("  You can start using EDITH right away:");
      console.log("    edith");
      console.log();
    } else {
      console.log("  No edith.yaml configuration found.");
      console.log();
      console.log("  To set up EDITH for the first time, run:");
      console.log("    edith --init");
      console.log();
      console.log("  This will launch an interactive wizard to configure:");
      console.log("    - LLM provider and model");
      console.log("    - Workspace root path");
      console.log("    - Source repositories");
      console.log();
    }

    console.log("  Additional commands:");
    console.log("    edith --version    Check installed version");
    console.log("    edith --help       Show usage information");
    console.log();
    console.log("  ══════════════════════════════════════════");
    console.log();
  } catch (err) {
    // Post-install scripts should never fail the npm install.
    // Log error but exit successfully.
    console.error(
      `  [EDITH] Post-install check encountered an error: ${(err as Error).message}`
    );
    console.error("  [EDITH] You can safely ignore this message.");
    console.log();
  }
}

main();
