/**
 * JARVIS Agent Entry Point
 *
 * When invoked directly (e.g., via `npm start` or `tsx src/index.ts`),
 * delegates to the shared agent startup module.
 *
 * The CLI entry point (bin/jarvis.ts) also uses the same startup module,
 * but adds --version, --init, and config-detection logic first.
 *
 * Flow: startAgent() → load config → display banner → create session → enter loop
 */

import { startAgent } from "./agent-startup.js";
import { ConfigError } from "./config.js";

startAgent().catch((err: unknown) => {
  if (err instanceof ConfigError) {
    console.error(`\n[ERROR] ${err.message}\n`);
    process.exit(1);
  }
  console.error(`\n[FATAL] Unhandled error:\n  ${err}\n`);
  process.exit(1);
});
