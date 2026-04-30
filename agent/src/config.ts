/**
 * EDITH Configuration Module
 *
 * Parses and validates edith.yaml configuration files.
 * Provides typed access to all EDITH settings.
 *
 * Features:
 * - YAML parsing with js-yaml
 * - Environment variable resolution (${VAR_NAME} syntax)
 * - Upward directory search for edith.yaml
 * - Required field validation with clear error messages
 * - Default value filling for optional fields
 * - Interactive edith-init wizard
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { load as loadYaml, YAMLException } from "js-yaml";
import * as readline from "node:readline";

// ── Type Definitions ──────────────────────────────────────────────

export type ApiType = "openai-completions" | "openai-responses" | "anthropic";

const VALID_API_TYPES: readonly string[] = ["openai-completions", "openai-responses", "anthropic"];

export interface LlmProfile {
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
  api_type?: ApiType;
  context_window?: number;
}

export interface LlmConfig {
  // New format: profiles mode
  active?: string;
  profiles?: Record<string, LlmProfile>;

  // Legacy format (backward compat, auto-converted to profiles.default)
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
  context_window?: number;
}

export interface ContextMonitorConfig {
  enabled: boolean;
  thresholds: {
    warning: number;
    critical: number;
    emergency: number;
  };
}

export interface WorkspaceConfig {
  root: string;
  language: "zh" | "en";
}

export interface RepoConfig {
  name: string;
  path: string;
  stack?: string;
}

/** @deprecated Use ContextBudget instead. Kept for backward compat mapping. */
export interface TokenBudget {
  routing_table: number;
  quick_ref: number;
  distillate_fragment: number;
}

export interface ContextBudget {
  routing_table: number;
  quick_ref: number;
  distillate_per_query: number;
  max_fragments_per_route: number;
}

export interface AgentConfig {
  context_budget: ContextBudget;
  auto_refresh: boolean;
  refresh_interval: string;
}

export interface EdithConfig {
  llm: LlmConfig;
  workspace: WorkspaceConfig;
  repos: RepoConfig[];
  agent: AgentConfig;
  context_monitor: ContextMonitorConfig;
}

// ── Default Values ────────────────────────────────────────────────

const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  routing_table: 500,
  quick_ref: 2000,
  distillate_per_query: 6000,
  max_fragments_per_route: 5,
};

const DEFAULT_AGENT: Omit<AgentConfig, never> = {
  context_budget: { ...DEFAULT_CONTEXT_BUDGET },
  auto_refresh: true,
  refresh_interval: "24h",
};

const DEFAULT_CONTEXT_MONITOR: ContextMonitorConfig = {
  enabled: true,
  thresholds: {
    warning: 70,
    critical: 85,
    emergency: 95,
  },
};

const CONFIG_FILENAME = "edith.yaml";

// ── Error Classes ─────────────────────────────────────────────────

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ConfigNotFoundError extends ConfigError {
  public readonly searchedPath: string;

  constructor(configPath: string) {
    super(
      `未找到 edith.yaml，运行 edith-init 生成配置文件。\n` +
        `  搜索路径: ${configPath}`
    );
    this.name = "ConfigNotFoundError";
    this.searchedPath = configPath;
  }
}

export class ConfigParseError extends ConfigError {
  public readonly line?: number;
  public readonly yamlMessage: string;

  constructor(configPath: string, originalError: unknown) {
    let line: number | undefined;
    let msg: string;

    if (originalError instanceof YAMLException) {
      line = originalError.mark?.line;
      msg = originalError.message ?? String(originalError);
    } else {
      const err = originalError as { mark?: { line?: number }; message?: string };
      line = err?.mark?.line;
      msg = err?.message ?? String(originalError);
    }

    let message = `配置文件解析失败: ${configPath}\n  ${msg}`;
    if (line !== undefined) {
      message += `\n  出错行号: ${line + 1}`;
    }

    super(message);
    this.name = "ConfigParseError";
    this.line = line !== undefined ? line + 1 : undefined;
    this.yamlMessage = msg;
  }
}

export class ConfigValidationError extends ConfigError {
  constructor(message: string) {
    super(`配置校验失败: ${message}`);
    this.name = "ConfigValidationError";
  }
}

// ── Environment Variable Resolution ───────────────────────────────

const ENV_VAR_PATTERN = /^\$\{([^}]+)\}$/;

/**
 * Resolve environment variable references in a string value.
 * Supports ${VAR_NAME} syntax. If the environment variable is not set,
 * returns undefined. Only applies to string-typed values.
 */
export function resolveEnvVars(value: string): string | undefined {
  const match = ENV_VAR_PATTERN.exec(value);
  if (match) {
    const varName = match[1];
    return process.env[varName];
  }
  return value;
}

/**
 * Recursively resolve environment variables in a config object.
 * Only string values matching ${...} pattern are resolved.
 */
function resolveEnvVarsDeep(obj: unknown): unknown {
  if (typeof obj === "string") {
    return resolveEnvVars(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(resolveEnvVarsDeep);
  }
  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveEnvVarsDeep(value);
    }
    return result;
  }
  return obj;
}

// ── Config File Search ────────────────────────────────────────────

/**
 * Search for edith.yaml starting from startDir and moving upward.
 * Returns the resolved path to the config file, or null if not found.
 */
export function findConfigFile(startDir?: string): string | null {
  let currentDir = resolve(startDir ?? process.cwd());
  const root = resolve("/");

  while (currentDir !== root) {
    const candidate = join(currentDir, CONFIG_FILENAME);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  // Check root directory too
  const rootCandidate = join(root, CONFIG_FILENAME);
  if (existsSync(rootCandidate)) {
    return rootCandidate;
  }

  return null;
}

// ── Validation ────────────────────────────────────────────────────

/**
 * Validate the parsed configuration object.
 * Throws ConfigValidationError with field path and current value on failure.
 */
export function validateConfig(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new ConfigValidationError(
      `配置内容无效: 期望对象，得到 ${raw === null ? "null" : typeof raw}`
    );
  }

  const config = raw as Record<string, unknown>;

  // Validate llm section
  if (!config.llm || typeof config.llm !== "object") {
    throw new ConfigValidationError("缺少 llm 配置段");
  }

  const llm = config.llm as Record<string, unknown>;
  const hasProfiles = llm.profiles && typeof llm.profiles === "object";

  if (hasProfiles) {
    // New format: validate profiles
    const profiles = llm.profiles as Record<string, unknown>;
    if (Object.keys(profiles).length === 0) {
      throw new ConfigValidationError("llm.profiles 不能为空，至少需要一个 profile");
    }
    for (const [name, profile] of Object.entries(profiles)) {
      if (typeof profile !== "object" || profile === null) {
        throw new ConfigValidationError(`llm.profiles.${name} 必须为对象`);
      }
      const p = profile as Record<string, unknown>;
      if (!p.provider || typeof p.provider !== "string") {
        throw new ConfigValidationError(`llm.profiles.${name}.provider 是必填项`);
      }
      if (!p.model || typeof p.model !== "string") {
        throw new ConfigValidationError(`llm.profiles.${name}.model 是必填项`);
      }
      if (p.api_type !== undefined) {
        if (typeof p.api_type !== "string" || !VALID_API_TYPES.includes(p.api_type)) {
          throw new ConfigValidationError(
            `llm.profiles.${name}.api_type 必须为 ${VALID_API_TYPES.join(" / ")}，当前值: ${JSON.stringify(p.api_type)}`
          );
        }
      }
    }
    if (llm.active !== undefined && typeof llm.active !== "string") {
      throw new ConfigValidationError("llm.active 必须为字符串");
    }
    if (llm.active && !(llm.active in profiles)) {
      throw new ConfigValidationError(
        `llm.active '${llm.active}' 不存在于 profiles 中。可用: ${Object.keys(profiles).join(", ")}`
      );
    }
  } else {
    // Legacy format: validate provider + model
    if (!llm.provider || typeof llm.provider !== "string") {
      throw new ConfigValidationError(
        `llm.provider 是必填项${llm.provider !== undefined ? `，当前值: ${JSON.stringify(llm.provider)}` : ""}`
      );
    }
    if (!llm.model || typeof llm.model !== "string") {
      throw new ConfigValidationError(
        `llm.model 是必填项${llm.model !== undefined ? `，当前值: ${JSON.stringify(llm.model)}` : ""}`
      );
    }
  }

  // Validate workspace section
  if (!config.workspace || typeof config.workspace !== "object") {
    throw new ConfigValidationError("缺少 workspace 配置段");
  }

  const workspace = config.workspace as Record<string, unknown>;
  if (!workspace.root || typeof workspace.root !== "string") {
    throw new ConfigValidationError(
      `workspace.root 是必填项${workspace.root !== undefined ? `，当前值: ${JSON.stringify(workspace.root)}` : ""}`
    );
  }

  if (!workspace.language || typeof workspace.language !== "string") {
    throw new ConfigValidationError(
      `workspace.language 是必填项${workspace.language !== undefined ? `，当前值: ${JSON.stringify(workspace.language)}` : ""}`
    );
  }

  // Validate language enum
  if (workspace.language !== "zh" && workspace.language !== "en") {
    throw new ConfigValidationError(
      `workspace.language 必须为 'zh' 或 'en'，当前值: '${workspace.language}'`
    );
  }

  // Validate repos array elements
  if (config.repos !== undefined) {
    if (!Array.isArray(config.repos)) {
      throw new ConfigValidationError(
        `repos 必须为数组，当前类型: ${typeof config.repos}`
      );
    }

    config.repos.forEach((repo: unknown, index: number) => {
      if (typeof repo !== "object" || repo === null) {
        throw new ConfigValidationError(
          `repos[${index}] 必须为对象，当前类型: ${typeof repo}`
        );
      }
      const r = repo as Record<string, unknown>;
      if (!r.name || typeof r.name !== "string") {
        throw new ConfigValidationError(
          `repos[${index}].name 是必填项`
        );
      }
      if (!r.path || typeof r.path !== "string") {
        throw new ConfigValidationError(
          `repos[${index}].path 是必填项`
        );
      }
    });
  }

  // Validate agent section if present
  if (config.agent && typeof config.agent === "object") {
    const agent = config.agent as Record<string, unknown>;

    // Legacy token_budget validation
    if (agent.token_budget && typeof agent.token_budget === "object") {
      const tb = agent.token_budget as Record<string, unknown>;
      for (const field of ["routing_table", "quick_ref", "distillate_fragment"] as const) {
        const val = tb[field];
        if (val !== undefined && (typeof val !== "number" || val <= 0 || !Number.isInteger(val))) {
          throw new ConfigValidationError(
            `agent.token_budget.${field} 必须为正整数，当前值: ${JSON.stringify(val)}`
          );
        }
      }
    }

    // New context_budget validation
    if (agent.context_budget && typeof agent.context_budget === "object") {
      const cb = agent.context_budget as Record<string, unknown>;
      for (const field of ["routing_table", "quick_ref", "distillate_per_query", "max_fragments_per_route"] as const) {
        const val = cb[field];
        if (val !== undefined && (typeof val !== "number" || val <= 0 || !Number.isInteger(val))) {
          throw new ConfigValidationError(
            `agent.context_budget.${field} 必须为正整数，当前值: ${JSON.stringify(val)}`
          );
        }
      }
    }
  }
}

// ── Default Value Application ─────────────────────────────────────

/**
 * Apply default values for optional fields.
 * Only fills in fields that are not provided — never overwrites existing values.
 */
export function applyDefaults(config: Partial<EdithConfig>): EdithConfig {
  const rawLlm = config.llm ?? {
    provider: "",
    model: "",
  };

  // Convert legacy format to profiles if needed
  let llm: LlmConfig;
  if (rawLlm.profiles && Object.keys(rawLlm.profiles).length > 0) {
    // New format — normalize each profile's api_type default
    const profiles: Record<string, LlmProfile> = {};
    for (const [name, profile] of Object.entries(rawLlm.profiles)) {
      profiles[name] = {
        ...profile,
        api_type: profile.api_type ?? (profile.base_url ? "openai-completions" : undefined),
      };
    }
    const firstProfileName = Object.keys(profiles)[0];
    llm = {
      active: rawLlm.active ?? firstProfileName,
      profiles,
      provider: "",
      model: "",
    };
  } else {
    // Legacy format — wrap as profiles.default
    const legacyProfile: LlmProfile = {
      provider: rawLlm.provider,
      model: rawLlm.model,
      api_key: rawLlm.api_key,
      base_url: rawLlm.base_url,
      context_window: rawLlm.context_window,
    };
    llm = {
      active: "default",
      profiles: { default: legacyProfile },
      provider: rawLlm.provider,
      model: rawLlm.model,
      api_key: rawLlm.api_key,
      base_url: rawLlm.base_url,
      context_window: rawLlm.context_window,
    };
  }

  const workspace = config.workspace ?? {
    root: "./company-edith",
    language: "zh" as const,
  };

  const repos = config.repos ?? [];

  const existingAgent = config.agent as Record<string, unknown> | undefined;
  const legacyBudget = existingAgent?.token_budget as Record<string, unknown> | undefined;
  const newBudget = existingAgent?.context_budget as Record<string, unknown> | undefined;

  const agent: AgentConfig = {
    context_budget: {
      routing_table: (newBudget?.routing_table ?? legacyBudget?.routing_table ?? DEFAULT_CONTEXT_BUDGET.routing_table) as number,
      quick_ref: (newBudget?.quick_ref ?? legacyBudget?.quick_ref ?? DEFAULT_CONTEXT_BUDGET.quick_ref) as number,
      distillate_per_query: (newBudget?.distillate_per_query ?? legacyBudget?.distillate_fragment ?? DEFAULT_CONTEXT_BUDGET.distillate_per_query) as number,
      max_fragments_per_route: (newBudget?.max_fragments_per_route ?? DEFAULT_CONTEXT_BUDGET.max_fragments_per_route) as number,
    },
    auto_refresh: ((existingAgent as Record<string, unknown>)?.auto_refresh as boolean) ?? DEFAULT_AGENT.auto_refresh,
    refresh_interval: ((existingAgent as Record<string, unknown>)?.refresh_interval as string) ?? DEFAULT_AGENT.refresh_interval,
  };

  const existingMonitor = config.context_monitor as Record<string, unknown> | undefined;
  const monitorThresholds = (existingMonitor?.thresholds ?? {}) as Record<string, unknown>;

  const context_monitor: ContextMonitorConfig = {
    enabled: (existingMonitor?.enabled as boolean) ?? DEFAULT_CONTEXT_MONITOR.enabled,
    thresholds: {
      warning: (monitorThresholds.warning as number) ?? DEFAULT_CONTEXT_MONITOR.thresholds.warning,
      critical: (monitorThresholds.critical as number) ?? DEFAULT_CONTEXT_MONITOR.thresholds.critical,
      emergency: (monitorThresholds.emergency as number) ?? DEFAULT_CONTEXT_MONITOR.thresholds.emergency,
    },
  };

  return {
    llm,
    workspace: {
      root: workspace.root,
      language: workspace.language,
    },
    repos: repos.map((r) => ({
      name: r.name,
      path: r.path,
      stack: r.stack,
    })),
    agent,
    context_monitor,
  };
}

// ── Config Loader ─────────────────────────────────────────────────

/**
 * Load and parse a edith.yaml file.
 *
 * If filePath is provided, loads that specific file.
 * If filePath is omitted, searches upward from cwd for edith.yaml.
 *
 * @param filePath - Optional explicit path to the config file
 * @returns Fully resolved and validated EdithConfig object
 * @throws ConfigNotFoundError if file does not exist
 * @throws ConfigParseError if YAML syntax is invalid
 * @throws ConfigValidationError if required fields are missing or invalid
 */
export function loadConfig(filePath?: string): EdithConfig {
  // Determine config file path
  let configPath: string | null;
  if (filePath) {
    configPath = resolve(filePath);
    if (!existsSync(configPath)) {
      throw new ConfigNotFoundError(configPath);
    }
  } else {
    configPath = findConfigFile();
    if (!configPath) {
      throw new ConfigNotFoundError(resolve(process.cwd(), CONFIG_FILENAME));
    }
  }

  // Read file content
  let rawContent: string;
  try {
    rawContent = readFileSync(configPath, "utf-8");
  } catch (err) {
    throw new ConfigError(`无法读取配置文件: ${configPath}\n  ${(err as Error).message}`);
  }

  // Parse YAML
  let parsed: unknown;
  try {
    parsed = loadYaml(rawContent);
  } catch (err) {
    throw new ConfigParseError(configPath, err);
  }

  // Resolve environment variables
  const resolved = resolveEnvVarsDeep(parsed);

  // Validate
  validateConfig(resolved);

  // Apply defaults and return typed config
  return applyDefaults(resolved as Partial<EdithConfig>);
}

// ── Profile Helpers ─────────────────────────────────────────────────

export function getActiveProfile(config: EdithConfig): LlmProfile {
  const profiles = config.llm.profiles;
  if (!profiles) {
    return {
      provider: config.llm.provider,
      model: config.llm.model,
      api_key: config.llm.api_key,
      base_url: config.llm.base_url,
      context_window: config.llm.context_window,
    };
  }
  const activeName = config.llm.active ?? Object.keys(profiles)[0];
  const profile = profiles[activeName];
  if (!profile) {
    throw new ConfigError(`Active profile '${activeName}' not found. Available: ${Object.keys(profiles).join(", ")}`);
  }
  return profile;
}

export function listProfiles(config: EdithConfig): string[] {
  if (!config.llm.profiles) return ["default"];
  return Object.keys(config.llm.profiles);
}

// ── Config Write-back (line-level patch, preserves comments) ─────

/**
 * Update a scalar YAML field using line-level replacement.
 * Finds the line matching `key:` under the given section header and replaces its value.
 * Preserves all other content including comments.
 */
function patchYamlScalar(
  content: string,
  sectionKey: string,
  fieldKey: string,
  newValue: string,
): string {
  const lines = content.split("\n");
  let inSection = false;
  let sectionIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();

    // Detect section header (e.g. "llm:" at top level)
    if (trimmed === `${sectionKey}:` || trimmed.startsWith(`${sectionKey}:`)) {
      inSection = true;
      sectionIndent = lines[i].length - trimmed.length;
      continue;
    }

    if (inSection) {
      const currentIndent = lines[i].length - trimmed.length;

      // Stop if we hit another top-level key at same or lower indent
      if (trimmed.length > 0 && currentIndent <= sectionIndent && !trimmed.startsWith("#")) {
        inSection = false;
        continue;
      }

      // Match the field (e.g. "active:" with indent > section indent)
      const fieldPattern = new RegExp(`^(\\s{${sectionIndent + 1},}})${fieldKey}:\\s*(.*)$`);
      const match = fieldPattern.exec(lines[i]);
      if (match) {
        // Preserve inline comment if present
        const oldValue = match[2];
        const commentIdx = oldValue.indexOf(" #");
        const comment = commentIdx >= 0 ? "  " + oldValue.slice(commentIdx + 1) : "";
        lines[i] = `${match[1]}${fieldKey}: ${newValue}${comment}`;
        break;
      }
    }
  }

  return lines.join("\n");
}

/**
 * Append a YAML array entry under a section.
 * Used for adding repos to the repos: list.
 */
function appendYamlArrayEntry(
  content: string,
  sectionKey: string,
  entryLines: string[],
): string {
  const lines = content.split("\n");
  let sectionLineIdx = -1;
  let lastEntryEndIdx = -1;

  // Find the section header
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed === `${sectionKey}:` || trimmed.startsWith(`${sectionKey}:`)) {
      sectionLineIdx = i;
      break;
    }
  }

  if (sectionLineIdx === -1) {
    // Section doesn't exist, append it at end
    return content + "\n" + sectionKey + ":\n" + entryLines.join("\n") + "\n";
  }

  // Find the last entry in the array (lines starting with "  - ")
  const sectionIndent = lines[sectionLineIdx].length - lines[sectionLineIdx].trimStart().length;
  for (let i = sectionLineIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    const currentIndent = lines[i].length - trimmed.length;

    if (trimmed.length === 0) continue;

    // Stop at next top-level section
    if (currentIndent <= sectionIndent && !trimmed.startsWith("#")) break;

    if (currentIndent === sectionIndent + 2 && trimmed.startsWith("- ")) {
      lastEntryEndIdx = i;
    }
    // Continuation lines of the last entry
    if (lastEntryEndIdx !== -1 && currentIndent > sectionIndent + 2 && trimmed.length > 0) {
      lastEntryEndIdx = i;
    }
  }

  // Insert after the last entry (or after section header if empty)
  const insertIdx = lastEntryEndIdx !== -1 ? lastEntryEndIdx + 1 : sectionLineIdx + 1;
  const indented = entryLines.map((l) => "  " + l);
  lines.splice(insertIdx, 0, ...indented);

  return lines.join("\n");
}

/**
 * Save the active profile name to edith.yaml.
 * Line-level replacement preserves comments and formatting.
 */
export function saveActiveProfile(configPath: string, profileName: string): void {
  try {
    const content = readFileSync(configPath, "utf-8");
    const updated = patchYamlScalar(content, "llm", "active", profileName);
    if (updated !== content) {
      writeFileSync(configPath, updated, "utf-8");
      console.log(`[EDITH] Config updated: llm.active → ${profileName}`);
    }
  } catch (err) {
    console.warn(`[EDITH] Failed to persist active profile: ${(err as Error).message}`);
  }
}

/**
 * Append a repo to edith.yaml repos list.
 * Skips if a repo with the same name or path already exists.
 */
export function addRepo(configPath: string, repo: RepoConfig): void {
  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = loadYaml(content) as Record<string, unknown>;
    const repos = (parsed.repos ?? []) as RepoConfig[];

    const isDuplicate = repos.some(
      (r: RepoConfig) => r.name === repo.name || r.path === repo.path,
    );
    if (isDuplicate) {
      console.log(`[EDITH] Repo '${repo.name}' already in config, skipping.`);
      return;
    }

    const entryLines = [`- name: ${repo.name}`, `  path: ${repo.path}`];
    if (repo.stack) {
      entryLines.push(`  stack: ${repo.stack}`);
    }
    const updated = appendYamlArrayEntry(content, "repos", entryLines);
    writeFileSync(configPath, updated, "utf-8");
    console.log(`[EDITH] Config updated: added repo '${repo.name}'`);
  } catch (err) {
    console.warn(`[EDITH] Failed to add repo: ${(err as Error).message}`);
  }
}

// ── edith-init Interactive Wizard ────────────────────────────────

interface ProviderPreset {
  models: string[];
  base_url?: string;
  context_window?: number;
  api_type?: string;
}

const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  xiaomi: {
    models: ["MiMo-V2.5-Pro", "MiMo-V2.5"],
    base_url: "https://token-plan-cn.xiaomimimo.com/v1",
    context_window: 131072,
  },
  deepseek: {
    models: ["deepseek-v4-pro", "deepseek-chat", "deepseek-coder"],
    context_window: 1000000,
  },
  openai: {
    models: ["gpt-4", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    context_window: 128000,
  },
  anthropic: {
    models: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-3.5-sonnet", "claude-3-haiku"],
    context_window: 200000,
  },
  minimax: {
    models: ["MiniMax-M2.7", "MiniMax-M1"],
    base_url: "https://api.minimaxi.com/anthropic",
    api_type: "anthropic",
    context_window: 1000000,
  },
  zhipu: {
    models: ["GLM-5.1", "GLM-4-Plus", "GLM-4"],
    base_url: "https://open.bigmodel.cn/api/anthropic",
    api_type: "anthropic",
    context_window: 128000,
  },
  moonshot: {
    models: ["moonshot-v1-128k", "moonshot-v1-32k"],
    base_url: "https://api.moonshot.cn/v1",
    context_window: 128000,
  },
  ollama: {
    models: ["qwen3:32b", "llama3", "mistral", "codellama"],
    base_url: "http://localhost:11434/v1",
  },
  other: { models: [] },
};

function createReadlineInterface(): readline.ReadLine {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.ReadLine, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function questionWithDefault(rl: readline.ReadLine, prompt: string, defaultValue: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${prompt} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Interactive configuration wizard that generates a edith.yaml file.
 *
 * Steps:
 * 1. Select LLM provider
 * 2. Input model name
 * 3. Input API key (optional)
 * 4. Input workspace root path
 * 5. Select language
 * 6. Add repos (repeatable)
 * 7. Confirm and generate file
 *
 * Ctrl+C at any step cancels without generating files.
 * If edith.yaml already exists, asks for overwrite confirmation.
 */
export async function initConfigWizard(outputPath?: string): Promise<void> {
  const targetPath = resolve(outputPath ?? join(process.cwd(), CONFIG_FILENAME));

  // Check if file already exists
  if (existsSync(targetPath)) {
    const rl = createReadlineInterface();
    try {
      const overwrite = await question(rl, `\nedith.yaml already exists at ${targetPath}\nOverwrite? (y/N): `);
      if (overwrite.toLowerCase() !== "y") {
        console.log("配置向导已取消。");
        return;
      }
    } finally {
      rl.close();
    }
  }

  const rl = createReadlineInterface();

  // Handle Ctrl+C gracefully
  let cancelled = false;
  rl.on("close", () => {
    if (cancelled) return;
    cancelled = true;
    console.log("\n配置向导已取消。");
    process.exit(0);
  });

  try {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   EDITH Configuration Wizard            ║");
    console.log("║   edith-init                            ║");
    console.log("╚══════════════════════════════════════════╝\n");

    const providerList = Object.keys(PROVIDER_PRESETS).join(" / ");
    const profiles: Record<string, LlmProfile> = {};
    const profileOrder: string[] = [];

    // Step 1: Add LLM Profiles (loop)
    console.log("Step 1: LLM Profiles");
    console.log(`  Providers: ${providerList}\n`);

    let profileIndex = 1;
    while (true) {
      const profileLabel = profileIndex === 1 ? "first" : "next";
      console.log(`  ── Profile #${profileIndex} ──`);

      // Profile name
      const defaultName = profileIndex === 1 ? "default" : "";
      const profileName = await questionWithDefault(rl, "  Profile name", defaultName);
      if (!profileName) {
        if (profileIndex === 1) {
          console.log("  At least one profile is required.");
          continue;
        }
        break;
      }
      if (profileName in profiles) {
        console.log(`  Profile '${profileName}' already exists. Skipping.`);
        continue;
      }

      // Provider
      const provider = await question(rl, `  Provider [${providerList}]: `);
      if (!provider) {
        console.log("  Provider cannot be empty. Skipping this profile.");
        continue;
      }
      const preset = PROVIDER_PRESETS[provider] ?? PROVIDER_PRESETS.other;

      // Model
      if (preset.models.length > 0) {
        console.log(`  Suggested: ${preset.models.join(", ")}`);
      }
      const model = await question(rl, "  Model: ");
      if (!model) {
        console.log("  Model cannot be empty. Skipping this profile.");
        continue;
      }

      // API Key
      const apiKeyInput = await question(rl, "  API Key (Enter to skip): ");

      // Base URL
      const baseUrlInput = preset.base_url
        ? await questionWithDefault(rl, "  Base URL", preset.base_url)
        : await question(rl, "  Base URL (Enter to skip): ");

      // Context Window
      const cwDefault = preset.context_window ? String(preset.context_window) : "128000";
      const cwInput = await questionWithDefault(rl, "  Context window (tokens)", cwDefault);

      profiles[profileName] = {
        provider,
        model,
        ...(apiKeyInput ? { api_key: apiKeyInput } : {}),
        ...(baseUrlInput ? { base_url: baseUrlInput } : {}),
        ...(preset.api_type ? { api_type: preset.api_type as ApiType } : {}),
        context_window: parseInt(cwInput, 10) || 128000,
      };
      profileOrder.push(profileName);

      console.log("");
      const addMore = await question(rl, "  Add another profile? (y/N): ");
      if (addMore.toLowerCase() !== "y") break;
      console.log("");
      profileIndex++;
    }

    // Step 2: Select active profile
    console.log("\nStep 2: Active Profile");
    const profileNames = Object.keys(profiles);
    console.log(`  Available: ${profileNames.join(", ")}`);
    const activeInput = await questionWithDefault(rl, "  Active profile", profileNames[0]);
    const activeProfile = profileNames.includes(activeInput) ? activeInput : profileNames[0];

    // Step 3: Workspace
    console.log("\nStep 3: Workspace");
    const workspaceRoot = await questionWithDefault(rl, "  Workspace root path", "./company-edith");

    // Step 4: Language
    console.log("\nStep 4: Language");
    const language = await questionWithDefault(rl, "  Language (zh/en)", "zh");
    if (language !== "zh" && language !== "en") {
      console.log("Invalid language. Must be 'zh' or 'en'. Configuration cancelled.");
      return;
    }

    // Step 5: Repos
    console.log("\nStep 5: Repositories (press Enter with empty name to finish)");
    const repos: RepoConfig[] = [];
    let repoIndex = 1;
    while (true) {
      const repoName = await question(rl, `  Repo ${repoIndex} name (empty to finish): `);
      if (!repoName) break;
      const repoPath = await question(rl, `  Repo ${repoIndex} path: `);
      if (!repoPath) {
        console.log("  Repo path cannot be empty. Skipping.");
        continue;
      }
      const repoStack = await question(rl, `  Repo ${repoIndex} stack (optional, Enter to skip): `);
      repos.push({
        name: repoName,
        path: repoPath,
        ...(repoStack ? { stack: repoStack } : {}),
      });
      repoIndex++;
    }

    // Step 6: Confirm and generate
    console.log("\n── Configuration Preview ──────────────────");
    const yamlContent = generateConfigYaml({
      llm: {
        active: activeProfile,
        profiles,
        provider: "",
        model: "",
      },
      workspace: {
        root: workspaceRoot,
        language: language as "zh" | "en",
      },
      repos,
    });
    console.log(yamlContent);
    console.log("──────────────────────────────────────────");

    const confirm = await question(rl, "\nGenerate this configuration? (Y/n): ");
    if (confirm.toLowerCase() === "n") {
      console.log("配置向导已取消。");
      return;
    }

    // Write the file
    writeFileSync(targetPath, yamlContent, "utf-8");
    console.log(`\nConfiguration written to: ${targetPath}`);
    console.log("You can now start EDITH with: edith");
  } finally {
    rl.close();
  }
}

/**
 * Generate YAML content string from a partial config.
 * Uses manual YAML generation to avoid extra dependencies.
 */
function generateConfigYaml(config: Partial<EdithConfig>): string {
  const lines: string[] = [];

  // LLM section — multi-profile format
  lines.push("llm:");
  lines.push(`  active: ${config.llm?.active ?? "default"}`);
  lines.push("  profiles:");
  if (config.llm?.profiles) {
    for (const [name, profile] of Object.entries(config.llm.profiles)) {
      lines.push(`    ${name}:`);
      lines.push(`      provider: ${profile.provider}`);
      lines.push(`      model: ${profile.model}`);
      if (profile.api_key) {
        lines.push(`      api_key: ${profile.api_key}`);
      }
      if (profile.base_url) {
        lines.push(`      base_url: ${profile.base_url}`);
      }
      if (profile.api_type) {
        lines.push(`      api_type: ${profile.api_type}`);
      }
      if (profile.context_window) {
        lines.push(`      context_window: ${profile.context_window}`);
      }
    }
  } else {
    lines.push("    default:");
    lines.push("      provider: openai");
    lines.push("      model: gpt-4");
  }

  // Workspace section
  lines.push("");
  lines.push("workspace:");
  lines.push(`  root: ${config.workspace?.root ?? "./company-edith"}`);
  lines.push(`  language: ${config.workspace?.language ?? "zh"}`);

  // Repos section
  lines.push("");
  if (config.repos && config.repos.length > 0) {
    lines.push("repos:");
    for (const repo of config.repos) {
      lines.push(`  - name: ${repo.name}`);
      lines.push(`    path: ${repo.path}`);
      if (repo.stack) {
        lines.push(`    stack: ${repo.stack}`);
      }
    }
  } else {
    lines.push("repos: []");
  }

  // Agent section
  lines.push("");
  lines.push("agent:");
  lines.push("  context_budget:");
  lines.push("    routing_table: 500");
  lines.push("    quick_ref: 2000");
  lines.push("    distillate_per_query: 6000");
  lines.push("    max_fragments_per_route: 5");
  lines.push("  auto_refresh: true");
  lines.push("  refresh_interval: 24h");

  // Context monitor section
  lines.push("");
  lines.push("context_monitor:");
  lines.push("  enabled: true");
  lines.push("  thresholds:");
  lines.push("    warning: 70");
  lines.push("    critical: 85");
  lines.push("    emergency: 95");

  return lines.join("\n") + "\n";
}
