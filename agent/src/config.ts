/**
 * JARVIS Configuration Module
 *
 * Parses and validates jarvis.yaml configuration files.
 * Provides typed access to all JARVIS settings.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { load as loadYaml } from "js-yaml";

// ── Type Definitions ──────────────────────────────────────────────

export interface LlmConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface WorkspaceConfig {
  root: string;
  language: "zh" | "en";
}

export interface RepoConfig {
  name: string;
  path: string;
  description?: string;
  languages?: string[];
}

export interface AgentConfig {
  tokenBudget?: number;
  maxContextFiles?: number;
  autoScan?: boolean;
}

export interface JarvisConfig {
  llm: LlmConfig;
  workspace: WorkspaceConfig;
  repos: RepoConfig[];
  agent?: AgentConfig;
}

// ── Error Classes ─────────────────────────────────────────────────

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(configPath: string) {
    super(
      `未找到 jarvis.yaml 配置文件，请先创建配置。\n` +
        `  期望路径: ${configPath}\n` +
        `  可参考 agent/jarvis.yaml.example 创建最小配置。`
    );
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigParseError extends ConfigError {
  public readonly line?: number;
  public readonly yamlMessage: string;

  constructor(configPath: string, originalError: unknown) {
    const yamlError = originalError as { mark?: { line?: number }; message?: string };
    const line = yamlError?.mark?.line;
    const msg = yamlError?.message ?? String(originalError);

    let message = `jarvis.yaml 格式错误: ${configPath}\n  ${msg}`;
    if (line !== undefined) {
      message += `\n  出错行号: ${line + 1}`;
    }

    super(message);
    this.name = "ConfigParseError";
    this.line = line !== undefined ? line + 1 : undefined;
    this.yamlMessage = msg;
  }
}

// ── Loader ────────────────────────────────────────────────────────

/**
 * Validate that the config file exists at the given path.
 * Throws ConfigNotFoundError if missing.
 */
export function validateConfigExists(configPath: string): void {
  const resolved = resolve(configPath);
  if (!existsSync(resolved)) {
    throw new ConfigNotFoundError(resolved);
  }
}

/**
 * Load and parse a jarvis.yaml file.
 *
 * @param configPath - Path to the jarvis.yaml file
 * @returns Parsed JarvisConfig object
 * @throws ConfigNotFoundError if file does not exist
 * @throws ConfigParseError if YAML is invalid
 */
export function loadConfig(configPath: string): JarvisConfig {
  const resolved = resolve(configPath);

  validateConfigExists(resolved);

  let rawContent: string;
  try {
    rawContent = readFileSync(resolved, "utf-8");
  } catch (err) {
    throw new ConfigError(`无法读取配置文件: ${resolved}\n  ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = loadYaml(rawContent);
  } catch (err) {
    throw new ConfigParseError(resolved, err);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new ConfigError(`jarvis.yaml 内容无效: 期望对象，得到 ${typeof parsed}`);
  }

  const config = parsed as Record<string, unknown>;

  // Validate required top-level fields
  if (!config.llm || typeof config.llm !== "object") {
    throw new ConfigError("jarvis.yaml 缺少 llm 配置段");
  }
  if (!config.workspace || typeof config.workspace !== "object") {
    throw new ConfigError("jarvis.yaml 缺少 workspace 配置段");
  }

  const llm = config.llm as Record<string, unknown>;
  const workspace = config.workspace as Record<string, unknown>;

  if (!llm.provider || typeof llm.provider !== "string") {
    throw new ConfigError("jarvis.yaml: llm.provider 必须为字符串");
  }
  if (!llm.model || typeof llm.model !== "string") {
    throw new ConfigError("jarvis.yaml: llm.model 必须为字符串");
  }
  if (!workspace.root || typeof workspace.root !== "string") {
    throw new ConfigError("jarvis.yaml: workspace.root 必须为字符串");
  }

  return {
    llm: {
      provider: llm.provider as string,
      model: llm.model as string,
      apiKey: llm.apiKey as string | undefined,
      baseUrl: llm.baseUrl as string | undefined,
    },
    workspace: {
      root: workspace.root as string,
      language: (workspace.language as "zh" | "en") ?? "zh",
    },
    repos: Array.isArray(config.repos) ? (config.repos as RepoConfig[]) : [],
    agent: config.agent as AgentConfig | undefined,
  };
}
