/**
 * JARVIS Agent Startup Module
 *
 * Extracted from index.ts to allow the CLI entry point (bin/jarvis.ts)
 * to reuse the agent initialization logic without code duplication.
 *
 * Flow: load config -> display banner -> create pi SDK session -> send system prompt
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

import { loadConfig, ConfigError, type JarvisConfig } from "./config.js";
import jarvisExtension from "./extension.js";
import { createTheme } from "./theme/index.js";
import { countWorkspaceStats } from "./theme/workspace-stats.js";
import { buildSystemPrompt } from "./system-prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start the JARVIS agent.
 *
 * Loads configuration, initializes the pi SDK agent session,
 * displays branding, and enters the interactive agent loop.
 *
 * @param configPath - Optional explicit path to jarvis.yaml.
 *                      If omitted, searches upward from cwd.
 */
export async function startAgent(configPath?: string): Promise<void> {
  // Step 0: Initialize TUI theme with Arc Reactor branding
  const theme = createTheme();

  // Display the Arc Reactor banner
  console.log();
  console.log(theme.banner);
  console.log();
  console.log("[JARVIS] Starting agent initialization...\n");

  // Step 1: Load configuration
  const resolvedConfigPath = configPath ?? process.env.JARVIS_CONFIG ?? undefined;

  let config: JarvisConfig;
  try {
    config = loadConfig(resolvedConfigPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`\n[ERROR] ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`[JARVIS] Configuration loaded successfully.`);
  console.log(`[JARVIS]   LLM Provider:    ${config.llm.provider}`);
  console.log(`[JARVIS]   Model:           ${config.llm.model}`);
  console.log(`[JARVIS]   Workspace:       ${config.workspace.root}`);
  console.log(`[JARVIS]   Language:        ${config.workspace.language}`);
  console.log(`[JARVIS]   Repositories:    ${config.repos.length}`);
  console.log(`[JARVIS]   Token Budget:    routing_table=${config.agent.token_budget.routing_table}, quick_ref=${config.agent.token_budget.quick_ref}, distillate_fragment=${config.agent.token_budget.distillate_fragment}`);
  console.log(`[JARVIS]   Auto Refresh:    ${config.agent.auto_refresh}`);
  console.log(`[JARVIS]   Theme:           ${theme.colorSupport} color support`);
  console.log();

  // Step 2: Initialize pi SDK
  try {
    const cwd = resolve(__dirname, "..");
    const authStorage = AuthStorage.create();
    const modelRegistry = ModelRegistry.create(authStorage);
    const sessionManager = SessionManager.inMemory();

    console.log("[JARVIS] Initializing pi SDK agent session...");

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

    // Display status bar with workspace statistics
    const stats = countWorkspaceStats(config.workspace.root);
    console.log(theme.separator);
    console.log(theme.statusBar(stats.workspacePath, stats.serviceCount, stats.artifactCount));
    console.log(theme.separator);
    console.log();
    console.log(`  ${theme.prompt}Agent is ready. Type your message below.`);
    console.log("  Press Ctrl+C to exit.");
    console.log();

    // Step 3: Build and send System Prompt
    const systemPrompt = buildSystemPrompt(config.workspace.language);
    await session.prompt(systemPrompt);
  } catch (err) {
    console.error(`\n[ERROR] Failed to initialize pi SDK agent:\n  ${(err as Error).message}\n`);
    process.exit(1);
  }
}
