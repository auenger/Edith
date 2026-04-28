/**
 * EDITH Agent Startup Module
 *
 * Extracted from index.ts to allow the CLI entry point (bin/edith.ts)
 * to reuse the agent initialization logic without code duplication.
 *
 * Flow: load config -> display banner -> create pi SDK session -> send system prompt
 */

import { resolve, dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";

import { loadConfig, ConfigError, type EdithConfig } from "./config.js";
import edithExtension from "./extension.js";
import { createTheme } from "./theme/index.js";
import { countWorkspaceStats } from "./theme/workspace-stats.js";
import { buildSystemPrompt } from "./system-prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start the EDITH agent.
 *
 * Loads configuration, initializes the pi SDK agent session,
 * displays branding, and enters the interactive agent loop.
 *
 * @param configPath - Optional explicit path to edith.yaml.
 *                      If omitted, searches upward from cwd.
 */
export async function startAgent(configPath?: string): Promise<void> {
  // Step 0: Initialize TUI theme with Arc Reactor branding
  const theme = createTheme();

  // Display the Arc Reactor banner
  console.log();
  console.log(theme.banner);
  console.log();
  console.log("[EDITH] Starting agent initialization...\n");

  // Step 1: Load configuration
  const resolvedConfigPath = configPath ?? process.env.EDITH_CONFIG ?? undefined;

  let config: EdithConfig;
  try {
    config = loadConfig(resolvedConfigPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`\n[ERROR] ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`[EDITH] Configuration loaded successfully.`);
  console.log(`[EDITH]   LLM Provider:    ${config.llm.provider}`);
  console.log(`[EDITH]   Model:           ${config.llm.model}`);
  console.log(`[EDITH]   Workspace:       ${config.workspace.root}`);
  console.log(`[EDITH]   Language:        ${config.workspace.language}`);
  console.log(`[EDITH]   Repositories:    ${config.repos.length}`);
  console.log(`[EDITH]   Context Budget:  routing_table=${config.agent.context_budget.routing_table}, quick_ref=${config.agent.context_budget.quick_ref}, distillate_per_query=${config.agent.context_budget.distillate_per_query}, max_fragments_per_route=${config.agent.context_budget.max_fragments_per_route}`);
  console.log(`[EDITH]   Auto Refresh:    ${config.agent.auto_refresh}`);
  console.log(`[EDITH]   Theme:           ${theme.colorSupport} color support`);
  console.log();

  // Step 2: Initialize pi SDK
  try {
    const cwd = resolve(__dirname, "..");
    const authStorage = AuthStorage.create();
    const modelRegistry = ModelRegistry.create(authStorage);
    const sessionManager = SessionManager.inMemory();

    console.log("[EDITH] Initializing pi SDK agent session...");

    const resourceLoader = new DefaultResourceLoader({
      cwd,
      agentDir: cwd,
      extensionFactories: [edithExtension],
    });
    await resourceLoader.reload();

    // Resolve model from edith.yaml config
    const model = modelRegistry.find(config.llm.provider, config.llm.model);
    if (!model) {
      throw new Error(
        `Model not found: ${config.llm.provider}/${config.llm.model}. ` +
        `Run the agent interactively and use /model to see available models.`
      );
    }

    const { session } = await createAgentSession({
      sessionManager,
      authStorage,
      modelRegistry,
      resourceLoader,
      model,
    });

    console.log("[EDITH] Agent session created successfully.\n");

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

    // Step 4: Enter interactive REPL loop
    session.subscribe((event) => {
      if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      if (event.type === "agent_end") {
        console.log("\n");
      }
    });

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = () => {
      rl.question(`${theme.prompt}`, async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
          prompt();
          return;
        }
        if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
          console.log("\n  EDITH shutting down. Goodbye.\n");
          rl.close();
          process.exit(0);
        }
        try {
          await session.prompt(trimmed);
        } catch (err) {
          console.error(`\n[ERROR] ${(err as Error).message}\n`);
        }
        prompt();
      });
    };

    prompt();
  } catch (err) {
    console.error(`\n[ERROR] Failed to initialize pi SDK agent:\n  ${(err as Error).message}\n`);
    process.exit(1);
  }
}
