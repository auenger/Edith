/**
 * EDITH Governance Writer — Generate governance JSON files for Board consumption
 *
 * Writes structured governance data to .edith/governance/ directory:
 *   - health.json     — global health score and breakdown
 *   - lifecycle.json  — lifecycle distribution per service
 *   - conflicts.json  — active conflict list
 *
 * Board DataReader can scan these JSON files directly — no API server needed.
 */

import {
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";

import {
  computeKnowledgeHealth,
  computeServiceHealth,
  type KnowledgeHealth,
  type ServiceHealth,
} from "./health-scorer.js";

import {
  scanVaultLifecycles,
  computeDistribution,
  type LifecycleDistribution,
  type ArtifactLifecycleInfo,
} from "./lifecycle.js";

import {
  scanVaultConflicts,
  type ConflictEntry,
} from "./conflict-detector.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface GovernanceHealthJson {
  overall: number;
  breakdown: {
    freshness: number;
    confidence: number;
    completeness: number;
    humanReviewed: number;
  };
  lifecycle: LifecycleDistribution;
  total_artifacts: number;
  last_updated: string;
}

export interface GovernanceLifecycleJson {
  services: Array<{
    name: string;
    status: Record<string, number>;
    count: number;
  }>;
  total_artifacts: number;
  updated_at: string;
}

export interface GovernanceConflictsJson {
  conflicts: Array<{
    file: string;
    edith_id: string;
    type: string;
    description: string;
    detected_at: string;
    resolved: boolean;
  }>;
  total_conflicts: number;
  updated_at: string;
}

export interface GovernanceWriteResult {
  /** Path to health.json */
  health_path: string;
  /** Path to lifecycle.json */
  lifecycle_path: string;
  /** Path to conflicts.json */
  conflicts_path: string;
  /** Number of files written */
  files_written: number;
  /** Errors during write */
  errors: string[];
}

// ── Directory Setup ───────────────────────────────────────────────

/**
 * Get the governance directory path within the workspace.
 */
export function getGovernanceDir(workspaceRoot: string): string {
  return join(workspaceRoot, ".edith", "governance");
}

/**
 * Ensure the governance directory exists.
 */
function ensureGovernanceDir(workspaceRoot: string): string {
  const dir = getGovernanceDir(workspaceRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ── JSON Generation ───────────────────────────────────────────────

/**
 * Generate health.json content.
 */
function generateHealthJson(
  vaultRoot: string,
): GovernanceHealthJson {
  const health = computeKnowledgeHealth(vaultRoot);

  return {
    overall: health.overall,
    breakdown: {
      freshness: health.breakdown.freshness,
      confidence: health.breakdown.confidence,
      completeness: health.breakdown.completeness,
      humanReviewed: health.breakdown.humanReviewed,
    },
    lifecycle: health.lifecycle,
    total_artifacts: health.total_artifacts,
    last_updated: health.assessed_at,
  };
}

/**
 * Generate lifecycle.json content.
 */
function generateLifecycleJson(
  vaultRoot: string,
): GovernanceLifecycleJson {
  const artifacts = scanVaultLifecycles(vaultRoot);

  // Group by service
  const serviceMap = new Map<string, ArtifactLifecycleInfo[]>();
  for (const artifact of artifacts) {
    const parts = artifact.edith_id.split("/");
    const service = parts.length > 1 ? parts[0] : "global";
    if (!serviceMap.has(service)) {
      serviceMap.set(service, []);
    }
    serviceMap.get(service)!.push(artifact);
  }

  const services = Array.from(serviceMap.entries()).map(([name, arts]) => {
    const status: Record<string, number> = { scaffold: 0, reviewed: 0, mature: 0, stale: 0 };
    for (const art of arts) {
      status[art.status] = (status[art.status] ?? 0) + 1;
    }
    return { name, status, count: arts.length };
  });

  return {
    services,
    total_artifacts: artifacts.length,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Generate conflicts.json content.
 */
function generateConflictsJson(
  vaultRoot: string,
): GovernanceConflictsJson {
  const conflicts = scanVaultConflicts(vaultRoot);

  return {
    conflicts: conflicts.map((c) => ({
      file: c.artifact_path,
      edith_id: c.edith_id,
      type: c.conflict_type,
      description: c.description,
      detected_at: c.detected_at,
      resolved: c.resolved,
    })),
    total_conflicts: conflicts.length,
    updated_at: new Date().toISOString(),
  };
}

// ── Write Governance Files ────────────────────────────────────────

/**
 * Generate and write all governance JSON files.
 */
export function writeGovernanceFiles(
  workspaceRoot: string,
  vaultRoot: string,
): GovernanceWriteResult {
  const result: GovernanceWriteResult = {
    health_path: "",
    lifecycle_path: "",
    conflicts_path: "",
    files_written: 0,
    errors: [],
  };

  const dir = ensureGovernanceDir(workspaceRoot);

  // Write health.json
  try {
    const healthPath = join(dir, "health.json");
    const healthJson = generateHealthJson(vaultRoot);
    writeFileSync(healthPath, JSON.stringify(healthJson, null, 2), "utf-8");
    result.health_path = healthPath;
    result.files_written++;
  } catch (err) {
    result.errors.push(`health.json: ${(err as Error).message}`);
  }

  // Write lifecycle.json
  try {
    const lifecyclePath = join(dir, "lifecycle.json");
    const lifecycleJson = generateLifecycleJson(vaultRoot);
    writeFileSync(lifecyclePath, JSON.stringify(lifecycleJson, null, 2), "utf-8");
    result.lifecycle_path = lifecyclePath;
    result.files_written++;
  } catch (err) {
    result.errors.push(`lifecycle.json: ${(err as Error).message}`);
  }

  // Write conflicts.json
  try {
    const conflictsPath = join(dir, "conflicts.json");
    const conflictsJson = generateConflictsJson(vaultRoot);
    writeFileSync(conflictsPath, JSON.stringify(conflictsJson, null, 2), "utf-8");
    result.conflicts_path = conflictsPath;
    result.files_written++;
  } catch (err) {
    result.errors.push(`conflicts.json: ${(err as Error).message}`);
  }

  return result;
}

// ── Read Governance Files (for Board consumption) ─────────────────

/**
 * Read the health.json file.
 */
export function readHealthJson(workspaceRoot: string): GovernanceHealthJson | null {
  const path = join(getGovernanceDir(workspaceRoot), "health.json");
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as GovernanceHealthJson;
  } catch {
    return null;
  }
}

/**
 * Read the lifecycle.json file.
 */
export function readLifecycleJson(workspaceRoot: string): GovernanceLifecycleJson | null {
  const path = join(getGovernanceDir(workspaceRoot), "lifecycle.json");
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as GovernanceLifecycleJson;
  } catch {
    return null;
  }
}

/**
 * Read the conflicts.json file.
 */
export function readConflictsJson(workspaceRoot: string): GovernanceConflictsJson | null {
  const path = join(getGovernanceDir(workspaceRoot), "conflicts.json");
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as GovernanceConflictsJson;
  } catch {
    return null;
  }
}

// Import readFileSync for the read functions above
import { readFileSync } from "node:fs";

// ── Formatting ────────────────────────────────────────────────────

export function formatGovernanceWriteResult(result: GovernanceWriteResult): string {
  const lines = [
    "治理数据文件已生成",
    "",
    `  写入文件: ${result.files_written}/3`,
  ];

  if (result.health_path) lines.push(`  health.json: ${result.health_path}`);
  if (result.lifecycle_path) lines.push(`  lifecycle.json: ${result.lifecycle_path}`);
  if (result.conflicts_path) lines.push(`  conflicts.json: ${result.conflicts_path}`);

  if (result.errors.length > 0) {
    lines.push("", "  错误:");
    for (const error of result.errors) {
      lines.push(`    - ${error}`);
    }
  }

  return lines.join("\n");
}
