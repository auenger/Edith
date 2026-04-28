/**
 * EDITH SubAgent Manager
 *
 * Manages child agent processes for task delegation.
 * Three execution modes: single, parallel, chain.
 *
 * Based on pi SDK subprocess pattern:
 *   spawn("pi", ["run", "--agent", "<name>", "--json"])
 */

import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── Type Definitions ──────────────────────────────────────────────

export interface SubAgentConfig {
  name: string;
  task: string;
  model?: string;
  timeout?: number;
}

export interface SubAgentResult {
  success: boolean;
  output: string;
  error?: string;
  tokens?: { input: number; output: number };
  duration: number;
  agent: string;
}

export type ExecutionMode = "single" | "parallel" | "chain";

interface RunningAgent {
  process: ChildProcess;
  resolve: (result: SubAgentResult) => void;
  timeout?: NodeJS.Timeout;
}

// ── Constants ─────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_CONCURRENT = 3;

// ── Agent Definition Loader ───────────────────────────────────────

interface AgentDefinition {
  name: string;
  description: string;
  tools?: string[];
  model?: string;
  systemPrompt: string;
  filePath: string;
}

function loadAgentDefinition(agentPath: string): AgentDefinition {
  const content = readFileSync(agentPath, "utf-8");

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error(`Agent definition missing frontmatter: ${agentPath}`);
  }

  const [, frontmatter, body] = frontmatterMatch;

  // Simple YAML key-value parsing (no dependency needed)
  const meta: Record<string, string> = {};
  for (const line of frontmatter.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      meta[kv[1]] = kv[2].trim();
    }
  }

  return {
    name: meta.name ?? "unknown",
    description: meta.description ?? "",
    tools: meta.tools?.split(",").map((s) => s.trim()),
    model: meta.model,
    systemPrompt: body.trim(),
    filePath: agentPath,
  };
}

function getAgentsDir(): string {
  // Resolve agents/ relative to this source file's directory
  // After compilation: dist/tools/subagent.js -> dist/agents/
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return resolve(thisDir, "..", "agents");
}

function listAvailableAgents(): Map<string, AgentDefinition> {
  const agentsDir = getAgentsDir();
  const agents = new Map<string, AgentDefinition>();

  try {
    const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const def = loadAgentDefinition(join(agentsDir, file));
      agents.set(def.name, def);
    }
  } catch {
    // agents/ directory may not exist yet
  }

  return agents;
}

// ── Task Type Detection ───────────────────────────────────────────

const TASK_PATTERNS: Array<{ pattern: RegExp; agent: string }> = [
  { pattern: /蒸馏|distill/i, agent: "distill-agent" },
  { pattern: /探索|explore|浏览|browse/i, agent: "explore-agent" },
  { pattern: /扫描|scan/i, agent: "explore-agent" },
];

function detectAgentForTask(task: string): string {
  for (const { pattern, agent } of TASK_PATTERNS) {
    if (pattern.test(task)) {
      return agent;
    }
  }
  return "explore-agent"; // default fallback
}

// ── SubAgent Process Execution ────────────────────────────────────

function runSubProcess(
  agentDef: AgentDefinition,
  task: string,
  timeoutMs: number,
): Promise<SubAgentResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    let stdout = "";
    let stderr = "";

    // Build CLI args for pi subprocess
    // Write task as a temporary instruction via stdin pipe
    const args = [
      "run",
      "--agent", agentDef.filePath,
      "--json",
    ];

    if (agentDef.model) {
      args.push("--model", agentDef.model);
    }

    const child = spawn("pi", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        EDITH_AGENT_TASK: task,
      },
    });

    const running: RunningAgent = { process: child, resolve };

    // Timeout guard
    running.timeout = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({
        success: false,
        output: "",
        error: `SubAgent timed out after ${timeoutMs / 1000}s`,
        duration: Date.now() - start,
        agent: agentDef.name,
      });
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(running.timeout);
      const duration = Date.now() - start;

      if (code === 0) {
        // Try to parse JSON output for structured data
        let parsed: any;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          parsed = null;
        }

        resolve({
          success: true,
          output: parsed?.output ?? parsed?.text ?? stdout.trim(),
          tokens: parsed?.tokens
            ? { input: parsed.tokens.input ?? 0, output: parsed.tokens.output ?? 0 }
            : undefined,
          duration,
          agent: agentDef.name,
        });
      } else {
        resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim() || `Process exited with code ${code}`,
          duration,
          agent: agentDef.name,
        });
      }
    });

    child.on("error", (err) => {
      clearTimeout(running.timeout);
      resolve({
        success: false,
        output: "",
        error: `Failed to spawn subagent: ${err.message}`,
        duration: Date.now() - start,
        agent: agentDef.name,
      });
    });

    // Send task via stdin
    child.stdin.write(task);
    child.stdin.end();
  });
}

// ── SubAgentManager Class ─────────────────────────────────────────

export class SubAgentManager {
  private agents: Map<string, AgentDefinition>;
  private activeCount = 0;

  constructor() {
    this.agents = listAvailableAgents();
  }

  /**
   * Execute a single sub-agent task.
   */
  async execute(config: SubAgentConfig): Promise<SubAgentResult> {
    const agentName = config.name === "auto" ? detectAgentForTask(config.task) : config.name;
    const agentDef = this.agents.get(agentName);

    if (!agentDef) {
      return {
        success: false,
        output: "",
        error: `Agent "${agentName}" not found. Available: ${[...this.agents.keys()].join(", ") || "none"}`,
        duration: 0,
        agent: agentName,
      };
    }

    const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    const model = config.model ?? agentDef.model;
    const effectiveDef = model ? { ...agentDef, model } : agentDef;

    return runSubProcess(effectiveDef, config.task, timeout);
  }

  /**
   * Execute multiple sub-agents in parallel.
   * Respects MAX_CONCURRENT limit.
   * @param onProgress - Optional callback invoked after each agent completes.
   */
  async parallel(
    tasks: SubAgentConfig[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];
    const queue = [...tasks];
    let completed = 0;
    const total = tasks.length;

    // Process in batches of MAX_CONCURRENT
    while (queue.length > 0) {
      const batch = queue.splice(0, MAX_CONCURRENT);
      const batchResults = await Promise.allSettled(
        batch.map(async (task) => {
          const result = await this.execute(task);
          completed++;
          onProgress?.(completed, total);
          return result;
        }),
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled") {
          results.push(r.value);
        } else {
          results.push({
            success: false,
            output: "",
            error: r.reason?.message ?? "Unknown parallel execution error",
            duration: 0,
            agent: "parallel-worker",
          });
        }
      }
    }

    return results;
  }

  /**
   * Execute multiple sub-agents in chain (serial).
   * Each agent receives the previous agent's output as context.
   */
  async chain(tasks: SubAgentConfig[]): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];
    let previousOutput = "";

    for (const task of tasks) {
      const enrichedTask = previousOutput
        ? `${task.task}\n\n--- Previous step output ---\n${previousOutput}`
        : task.task;

      const result = await this.execute({ ...task, task: enrichedTask });
      results.push(result);

      if (result.success) {
        previousOutput = result.output;
      } else {
        // Chain breaks on first failure
        break;
      }
    }

    return results;
  }

  /**
   * List available agent definitions.
   */
  listAgents(): string[] {
    return [...this.agents.keys()];
  }

  /**
   * Parse /delegate command arguments into SubAgentConfig.
   * Supports: /delegate <task> and /delegate --parallel <task1> <task2>
   */
  parseCommand(args: string): { mode: ExecutionMode; configs: SubAgentConfig[] } {
    const trimmed = args.trim();

    // Parallel mode: /delegate --parallel "task1" "task2"
    if (trimmed.startsWith("--parallel")) {
      const taskStr = trimmed.slice("--parallel".length).trim();
      const tasks = this.parseQuotedTasks(taskStr);
      return {
        mode: "parallel",
        configs: tasks.map((task) => ({ name: "auto", task })),
      };
    }

    // Chain mode: /delegate --chain "task1" "task2"
    if (trimmed.startsWith("--chain")) {
      const taskStr = trimmed.slice("--chain".length).trim();
      const tasks = this.parseQuotedTasks(taskStr);
      return {
        mode: "chain",
        configs: tasks.map((task) => ({ name: "auto", task })),
      };
    }

    // Single mode: /delegate <task description>
    return {
      mode: "single",
      configs: [{ name: "auto", task: trimmed }],
    };
  }

  private parseQuotedTasks(input: string): string[] {
    const tasks: string[] = [];
    const regex = /"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      tasks.push(match[1]);
    }
    // If no quoted strings found, treat entire input as single task
    if (tasks.length === 0 && input.trim()) {
      tasks.push(input.trim());
    }
    return tasks;
  }
}

// ── Formatting Helpers ────────────────────────────────────────────

export function formatSubAgentResult(result: SubAgentResult): string {
  const lines: string[] = [];
  const status = result.success ? "✓" : "✗";
  const durationSec = (result.duration / 1000).toFixed(1);

  lines.push(`[${status}] SubAgent: ${result.agent} (${durationSec}s)`);

  if (result.tokens) {
    lines.push(`  Tokens: ${result.tokens.input} in / ${result.tokens.output} out`);
  }

  if (result.success) {
    // Truncate long outputs for display
    const output = result.output.length > 2000
      ? result.output.slice(0, 2000) + "\n... (truncated)"
      : result.output;
    lines.push(output);
  } else {
    lines.push(`  Error: ${result.error}`);
  }

  return lines.join("\n");
}

export function formatParallelResults(results: SubAgentResult[]): string {
  const lines: string[] = [];
  const succeeded = results.filter((r) => r.success).length;

  lines.push(`Parallel execution complete: ${succeeded}/${results.length} succeeded`);
  lines.push("");

  for (const result of results) {
    lines.push(formatSubAgentResult(result));
    lines.push("");
  }

  return lines.join("\n");
}
