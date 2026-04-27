/**
 * JARVIS Agent Entry Point
 *
 * Loads configuration, initializes the pi SDK agent session,
 * and starts the interactive agent loop.
 *
 * Flow: load config → create agent session → display welcome → enter loop
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";

import { loadConfig, ConfigError } from "./config.js";
import jarvisExtension from "./extension.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Constants ─────────────────────────────────────────────────────

const BANNER = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      ██╗██████╗  █████╗ ███████╗███████╗███████╗        ║
║      ██║██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝        ║
║      ██║██████╔╝███████║███████╗███████╗███████╗        ║
║      ██║██╔═══╝ ██╔══██║╚════██║╚════██║╚════██║        ║
║      ██║██║     ██║  ██║███████║███████║███████║        ║
║      ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝        ║
║                                                          ║
║          AI Knowledge Infrastructure Agent               ║
║          Phase 1 MVP — Agent Skeleton                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;

const DEFAULT_CONFIG_PATH = resolve(__dirname, "..", "jarvis.yaml");

// ── Main ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(BANNER);
  console.log("[JARVIS] Starting agent initialization...\n");

  // Step 1: Load configuration
  const configPath = process.env.JARVIS_CONFIG ?? DEFAULT_CONFIG_PATH;

  let config;
  try {
    config = loadConfig(configPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`\n[ERROR] ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`[JARVIS] Configuration loaded from: ${configPath}`);
  console.log(`[JARVIS]   LLM Provider: ${config.llm.provider}`);
  console.log(`[JARVIS]   Model:        ${config.llm.model}`);
  console.log(`[JARVIS]   Workspace:    ${config.workspace.root}`);
  console.log(`[JARVIS]   Language:     ${config.workspace.language}`);
  console.log(`[JARVIS]   Repositories: ${config.repos.length}`);
  console.log();

  // Step 2: Initialize pi SDK
  try {
    const cwd = resolve(__dirname, "..");
    const authStorage = AuthStorage.create();
    const modelRegistry = ModelRegistry.create(authStorage);
    const sessionManager = SessionManager.inMemory();

    console.log("[JARVIS] Initializing pi SDK agent session...");

    // Create a resource loader that includes our JARVIS extension factory.
    // The pi SDK discovers and loads extensions via the resource loader,
    // not directly through createAgentSession options.
    const resourceLoader = new DefaultResourceLoader({
      cwd,
      agentDir: cwd,
      extensionFactories: [jarvisExtension],
    });
    await resourceLoader.reload();

    const { session } = await createAgentSession({
      sessionManager,
      authStorage,
      modelRegistry,
      resourceLoader,
    });

    console.log("[JARVIS] Agent session created successfully.\n");
    console.log("─".repeat(56));
    console.log("  JARVIS Agent is ready. Type your message below.");
    console.log("  Press Ctrl+C to exit.");
    console.log("─".repeat(56));
    console.log();

    // Step 3: Send initial prompt to verify agent is alive.
    // The pi SDK session handles the interactive REPL.
    await session.prompt(
      "You are JARVIS, an AI Knowledge Infrastructure assistant. " +
        "Acknowledge you are ready. Keep it brief."
    );
  } catch (err) {
    console.error(`\n[ERROR] Failed to initialize pi SDK agent:\n  ${(err as Error).message}\n`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  if (err instanceof ConfigError) {
    console.error(`\n[ERROR] ${err.message}\n`);
    process.exit(1);
  }
  console.error(`\n[FATAL] Unhandled error:\n  ${err}\n`);
  process.exit(1);
});
