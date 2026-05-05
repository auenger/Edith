/**
 * EDITH Governance Tool — edith_governance implementation
 *
 * Main entry point for knowledge governance operations.
 * Provides actions: status, review, resolve, refresh
 *
 * Usage:
 *   edith_governance({ action: "status" })                    — Global governance status + health
 *   edith_governance({ action: "review", file: "...", confirm: true }) — Review and confirm scaffold
 *   edith_governance({ action: "resolve", file: "...", resolution: "..." }) — Resolve conflict
 *   edith_governance({ action: "refresh" })                   — Refresh governance data files
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

import type { EdithConfig, GovernanceConfig } from "../config.js";

import {
  scanVaultLifecycles,
  computeDistribution,
  transitionFile,
  formatDistribution,
  type ArtifactLifecycleInfo,
} from "./lifecycle.js";

import {
  computeKnowledgeHealth,
  computeServiceHealth,
  formatHealthScore,
  formatServiceHealth,
  type KnowledgeHealth,
  type ServiceHealth,
} from "./health-scorer.js";

import {
  scanVaultConflicts,
  resolveConflict,
  formatConflictEntry,
  type ConflictEntry,
} from "./conflict-detector.js";

import {
  writeGovernanceFiles,
  readHealthJson,
  readLifecycleJson,
  readConflictsJson,
  formatGovernanceWriteResult,
} from "./governance-writer.js";

import {
  scanVaultFreshness,
  formatFreshnessResult,
  type FreshnessScanResult,
} from "./freshness-detector.js";

// ── Type Definitions ──────────────────────────────────────────────

export type GovernanceAction = "status" | "review" | "resolve" | "refresh";

export interface GovernanceParams {
  /** Action to perform */
  action: GovernanceAction;
  /** File path (for review/resolve actions) — relative to vault root */
  file?: string;
  /** Confirm review (for review action) */
  confirm?: boolean;
  /** Conflict resolution action (for resolve action) */
  resolution?: "accept" | "preserve" | "merge";
  /** New content for conflict resolution */
  new_content?: string;
}

export interface GovernanceStatusResult {
  health: KnowledgeHealth;
  services: ServiceHealth[];
  stale_artifacts: ArtifactLifecycleInfo[];
  conflicts: ConflictEntry[];
  freshness: FreshnessScanResult | null;
}

export interface GovernanceResult {
  action: GovernanceAction;
  status?: GovernanceStatusResult;
  transition?: {
    file: string;
    from: string;
    to: string;
  };
  conflict_resolved?: boolean;
  governance_files_written?: number;
  success: boolean;
  errors: string[];
}

export type GovernanceOutcome =
  | { ok: true; result: GovernanceResult }
  | { ok: false; error: { code: string; message: string; suggestion?: string } };

// ── Main Execution ────────────────────────────────────────────────

/**
 * Execute a governance operation.
 */
export function executeGovernance(
  params: GovernanceParams,
  config: EdithConfig,
): GovernanceOutcome {
  const governanceConfig = config.governance;

  if (!governanceConfig || !governanceConfig.enabled) {
    return {
      ok: false,
      error: {
        code: "GOVERNANCE_DISABLED",
        message: "知识治理引擎未启用",
        suggestion: "在 edith.yaml 中设置 governance.enabled: true",
      },
    };
  }

  // Determine vault root
  const obsidianConfig = config.obsidian;
  const vaultRoot = obsidianConfig
    ? resolve(config.workspace.root, obsidianConfig.vault_path)
    : resolve(config.workspace.root, "obsidian-vault");

  if (!existsSync(vaultRoot)) {
    return {
      ok: false,
      error: {
        code: "VAULT_NOT_FOUND",
        message: `Vault 目录不存在: ${vaultRoot}`,
        suggestion: "先运行 edith_obsidian({ action: 'generate' }) 生成 Vault",
      },
    };
  }

  const workspaceRoot = resolve(config.workspace.root);

  switch (params.action) {
    case "status":
      return executeStatus(vaultRoot, workspaceRoot, governanceConfig);
    case "review":
      return executeReview(vaultRoot, params, workspaceRoot);
    case "resolve":
      return executeResolve(vaultRoot, params);
    case "refresh":
      return executeRefresh(vaultRoot, workspaceRoot);
    default:
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: `未知操作: ${params.action}`,
          suggestion: "支持的操作: status, review, resolve, refresh",
        },
      };
  }
}

// ── Status Action ─────────────────────────────────────────────────

function executeStatus(
  vaultRoot: string,
  workspaceRoot: string,
  governanceConfig: GovernanceConfig,
): GovernanceOutcome {
  const errors: string[] = [];

  // Compute health score
  let health: KnowledgeHealth;
  try {
    health = computeKnowledgeHealth(vaultRoot);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "HEALTH_COMPUTE_FAILED",
        message: `健康度计算失败: ${(err as Error).message}`,
      },
    };
  }

  // Compute per-service health
  let services: ServiceHealth[] = [];
  try {
    services = computeServiceHealth(vaultRoot);
  } catch (err) {
    errors.push(`服务健康度: ${(err as Error).message}`);
  }

  // Find stale artifacts
  const artifacts = scanVaultLifecycles(vaultRoot);
  const staleArtifacts = artifacts.filter((a) => a.status === "stale");

  // Find conflicts
  let conflicts: ConflictEntry[] = [];
  try {
    conflicts = scanVaultConflicts(vaultRoot);
  } catch (err) {
    errors.push(`冲突扫描: ${(err as Error).message}`);
  }

  // Freshness scan (optional, if quality_scoring enabled)
  let freshness: FreshnessScanResult | null = null;
  if (governanceConfig.quality_scoring) {
    try {
      const thresholdHours = parseThresholdHours(governanceConfig.stale_threshold);
      freshness = scanVaultFreshness(vaultRoot, workspaceRoot, thresholdHours);
    } catch (err) {
      errors.push(`新鲜度扫描: ${(err as Error).message}`);
    }
  }

  return {
    ok: true,
    result: {
      action: "status",
      status: {
        health,
        services,
        stale_artifacts: staleArtifacts,
        conflicts,
        freshness,
      },
      success: errors.length === 0,
      errors,
    },
  };
}

// ── Review Action ─────────────────────────────────────────────────

function executeReview(
  vaultRoot: string,
  params: GovernanceParams,
  workspaceRoot: string,
): GovernanceOutcome {
  if (!params.file) {
    return {
      ok: false,
      error: {
        code: "MISSING_FILE",
        message: "review 操作需要指定 file 参数",
        suggestion: "使用 edith_governance({ action: 'review', file: 'path/to/artifact.md', confirm: true })",
      },
    };
  }

  if (!params.confirm) {
    return {
      ok: false,
      error: {
        code: "CONFIRM_REQUIRED",
        message: "review 操作需要 confirm: true 确认审阅",
        suggestion: "添加 confirm: true 以确认审阅",
      },
    };
  }

  const fullPath = join(vaultRoot, params.file);
  const result = transitionFile(fullPath, "reviewed", {
    reviewed_by: "human",
  });

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: "TRANSITION_FAILED",
        message: result.error.message,
        suggestion: `合法目标状态: ${getValidTargetsHint(result.error.from)}`,
      },
    };
  }

  // Update governance files
  try {
    writeGovernanceFiles(workspaceRoot, vaultRoot);
  } catch {
    // Non-fatal
  }

  return {
    ok: true,
    result: {
      action: "review",
      transition: {
        file: params.file,
        from: result.result.from,
        to: result.result.to,
      },
      success: true,
      errors: [],
    },
  };
}

// ── Resolve Action ────────────────────────────────────────────────

function executeResolve(
  vaultRoot: string,
  params: GovernanceParams,
): GovernanceOutcome {
  if (!params.file) {
    return {
      ok: false,
      error: {
        code: "MISSING_FILE",
        message: "resolve 操作需要指定 file 参数",
      },
    };
  }

  if (!params.resolution) {
    return {
      ok: false,
      error: {
        code: "MISSING_RESOLUTION",
        message: "resolve 操作需要指定 resolution 参数",
        suggestion: "可选: accept (接受新内容) | preserve (保留人工) | merge (合并)",
      },
    };
  }

  const resolutionMap: Record<string, "accept_new" | "preserve_human" | "merge"> = {
    accept: "accept_new",
    preserve: "preserve_human",
    merge: "merge",
  };

  const conflictResolution = resolutionMap[params.resolution];
  if (!conflictResolution) {
    return {
      ok: false,
      error: {
        code: "INVALID_RESOLUTION",
        message: `无效的 resolution: ${params.resolution}`,
        suggestion: "可选: accept | preserve | merge",
      },
    };
  }

  const result = resolveConflict(vaultRoot, {
    artifact_path: params.file,
    action: conflictResolution,
    new_content: params.new_content,
  });

  return {
    ok: true,
    result: {
      action: "resolve",
      conflict_resolved: result.resolved,
      success: result.resolved,
      errors: result.error ? [result.error] : [],
    },
  };
}

// ── Refresh Action ────────────────────────────────────────────────

function executeRefresh(
  vaultRoot: string,
  workspaceRoot: string,
): GovernanceOutcome {
  const result = writeGovernanceFiles(workspaceRoot, vaultRoot);

  return {
    ok: true,
    result: {
      action: "refresh",
      governance_files_written: result.files_written,
      success: result.errors.length === 0,
      errors: result.errors,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function parseThresholdHours(threshold: string): number {
  const match = /^(\d+)(h|d|w)$/.exec(threshold);
  if (!match) return 168;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "h": return value;
    case "d": return value * 24;
    case "w": return value * 24 * 7;
    default: return 168;
  }
}

function getValidTargetsHint(status: string): string {
  const transitions: Record<string, string[]> = {
    scaffold: ["reviewed"],
    reviewed: ["mature", "stale"],
    mature: ["stale"],
    stale: ["scaffold"],
  };
  return transitions[status]?.join(", ") ?? "none";
}

// ── Output Formatting ─────────────────────────────────────────────

export function formatGovernanceResult(result: GovernanceResult): string {
  const lines: string[] = [];

  switch (result.action) {
    case "status":
      if (result.status) {
        lines.push(formatHealthScore(result.status.health));
        lines.push("");
        lines.push(formatServiceHealth(result.status.services));

        if (result.status.stale_artifacts.length > 0) {
          lines.push("", "过时片段:");
          for (const art of result.status.stale_artifacts) {
            lines.push(`  - [${art.stale_reason ?? "unknown"}] ${art.edith_id}`);
          }
        }

        if (result.status.conflicts.length > 0) {
          lines.push("", "活跃冲突:");
          for (const conflict of result.status.conflicts) {
            lines.push(`  - ${formatConflictEntry(conflict)}`);
          }
        }

        if (result.status.freshness) {
          lines.push("", formatFreshnessResult(result.status.freshness));
        }
      }
      break;

    case "review":
      if (result.transition) {
        lines.push(
          `审阅确认: ${result.transition.file}`,
          `  状态: ${result.transition.from} → ${result.transition.to}`,
        );
      }
      break;

    case "resolve":
      lines.push(
        `冲突裁决: ${result.conflict_resolved ? "成功" : "失败"}`,
      );
      break;

    case "refresh":
      lines.push(`治理数据刷新: ${result.governance_files_written}/3 文件已更新`);
      break;
  }

  if (result.errors.length > 0) {
    lines.push("", "注意:");
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join("\n");
}

export function formatGovernanceError(error: { code: string; message: string; suggestion?: string }): string {
  const lines = [
    "知识治理操作失败",
    "",
    `  错误: ${error.message}`,
    `  代码: ${error.code}`,
  ];
  if (error.suggestion) {
    lines.push(`  建议: ${error.suggestion}`);
  }
  return lines.join("\n");
}
