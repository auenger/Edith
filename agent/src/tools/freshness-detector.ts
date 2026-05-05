/**
 * EDITH Freshness Detector — Source hash comparison for knowledge staleness detection
 *
 * Detects when knowledge artifacts are stale by comparing source file hashes
 * with the hashes recorded at distillation time. Works alongside edit-detector.ts
 * for the governance engine's freshness tracking.
 *
 * Mechanism:
 *   1. Read source_hash from artifact frontmatter (governance.source_hash)
 *   2. Compute current hash of source files (governance.source_files)
 *   3. If hashes differ → artifact is stale (source files changed since distillation)
 *   4. Also checks time-based staleness via stale_threshold config
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

import { parseFrontmatter } from "./frontmatter.js";
import { extractLifecycleState, type LifecycleStatus } from "./lifecycle.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface FreshnessCheckResult {
  /** Artifact relative path */
  artifact_path: string;
  /** EDITH identifier */
  edith_id: string;
  /** Whether the artifact is fresh (source hash matches) */
  is_fresh: boolean;
  /** Reason for staleness, if applicable */
  staleness_reason: "source_hash_mismatch" | "time_threshold" | "source_files_missing" | null;
  /** Stored source hash */
  stored_hash: string | null;
  /** Current computed source hash */
  current_hash: string | null;
  /** Days since last distillation */
  days_since_distillation: number | null;
  /** Current lifecycle status */
  lifecycle_status: LifecycleStatus;
}

export interface FreshnessScanResult {
  /** Total artifacts scanned */
  total: number;
  /** Fresh artifacts */
  fresh: number;
  /** Stale artifacts */
  stale: number;
  /** Individual results */
  artifacts: FreshnessCheckResult[];
}

// ── Hash Computation ──────────────────────────────────────────────

/**
 * Compute a combined hash for a list of source files.
 * Uses SHA-256 for each file, then combines them.
 */
export function computeSourceHash(
  sourceFiles: string[],
  workspaceRoot: string,
): string | null {
  if (sourceFiles.length === 0) return null;

  const hashes: string[] = [];
  for (const relPath of sourceFiles) {
    const fullPath = resolve(workspaceRoot, relPath);
    if (!existsSync(fullPath)) {
      hashes.push("MISSING:" + relPath);
      continue;
    }

    try {
      const content = readFileSync(fullPath, "utf-8");
      const hash = createHash("sha256").update(content, "utf-8").digest("hex");
      hashes.push(hash);
    } catch {
      hashes.push("ERROR:" + relPath);
    }
  }

  // Combine all hashes into a single hash
  const combined = hashes.join("|");
  return createHash("sha256").update(combined, "utf-8").digest("hex");
}

/**
 * Compute hash for a single file.
 */
export function computeFileHash(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    return createHash("sha256").update(content, "utf-8").digest("hex");
  } catch {
    return null;
  }
}

// ── Staleness Threshold Parsing ───────────────────────────────────

/**
 * Parse a time threshold string (e.g., "168h", "7d") into hours.
 */
export function parseThreshold(threshold: string): number {
  const match = /^(\d+)(h|d|w)$/.exec(threshold);
  if (!match) return 168; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "h": return value;
    case "d": return value * 24;
    case "w": return value * 24 * 7;
    default: return 168;
  }
}

/**
 * Check if an artifact is stale based on time threshold.
 */
export function isTimeStale(
  lastDistilled: string | null,
  thresholdHours: number,
): boolean {
  if (!lastDistilled) return true; // No distillation timestamp → stale

  try {
    const distilledAt = new Date(lastDistilled).getTime();
    const now = Date.now();
    const hoursSinceDistillation = (now - distilledAt) / (1000 * 60 * 60);
    return hoursSinceDistillation > thresholdHours;
  } catch {
    return true;
  }
}

// ── Single Artifact Freshness Check ───────────────────────────────

/**
 * Check freshness of a single artifact file.
 */
export function checkArtifactFreshness(
  artifactPath: string,
  vaultRoot: string,
  workspaceRoot: string,
  staleThresholdHours: number = 168,
): FreshnessCheckResult | null {
  const fullPath = join(vaultRoot, artifactPath);
  if (!existsSync(fullPath)) return null;

  try {
    const content = readFileSync(fullPath, "utf-8");
    const parsed = parseFrontmatter(content);

    if (!parsed.data.edith_id) return null;

    const lifecycle = extractLifecycleState(content);

    // Extract governance fields from content
    const storedHash = extractGovernanceField(content, "source_hash");
    const sourceFilesJson = extractSourceFiles(content);
    const lastDistilled = parsed.data.last_distilled ?? null;

    // Compute current source hash
    const currentHash = sourceFilesJson.length > 0
      ? computeSourceHash(sourceFilesJson, workspaceRoot)
      : null;

    // Determine freshness
    let isFresh = true;
    let stalenessReason: FreshnessCheckResult["staleness_reason"] = null;

    // Check source hash mismatch
    if (storedHash && currentHash && storedHash !== currentHash) {
      isFresh = false;
      stalenessReason = "source_hash_mismatch";
    }

    // Check if source files exist
    if (sourceFilesJson.length > 0) {
      const allExist = sourceFilesJson.every((f) => existsSync(resolve(workspaceRoot, f)));
      if (!allExist) {
        isFresh = false;
        stalenessReason = "source_files_missing";
      }
    }

    // Check time threshold
    const daysSince = lastDistilled
      ? (Date.now() - new Date(lastDistilled).getTime()) / (1000 * 60 * 60 * 24)
      : null;

    if (isFresh && lastDistilled && isTimeStale(lastDistilled, staleThresholdHours)) {
      isFresh = false;
      stalenessReason = "time_threshold";
    }

    return {
      artifact_path: artifactPath,
      edith_id: parsed.data.edith_id,
      is_fresh: isFresh,
      staleness_reason: stalenessReason,
      stored_hash: storedHash,
      current_hash: currentHash,
      days_since_distillation: daysSince !== null ? Math.round(daysSince * 10) / 10 : null,
      lifecycle_status: lifecycle.status,
    };
  } catch {
    return null;
  }
}

// ── Vault-wide Freshness Scan ─────────────────────────────────────

/**
 * Scan the vault for stale artifacts.
 */
export function scanVaultFreshness(
  vaultRoot: string,
  workspaceRoot: string,
  staleThresholdHours: number = 168,
): FreshnessScanResult {
  const artifacts: FreshnessCheckResult[] = [];

  if (!existsSync(vaultRoot)) {
    return { total: 0, fresh: 0, stale: 0, artifacts };
  }

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".obsidian" || entry.name === ".edith") continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith(".md")) continue;

      const relativePath = fullPath.slice(vaultRoot.length + 1);
      const result = checkArtifactFreshness(
        relativePath,
        vaultRoot,
        workspaceRoot,
        staleThresholdHours,
      );
      if (result) {
        artifacts.push(result);
      }
    }
  }

  walk(vaultRoot);

  return {
    total: artifacts.length,
    fresh: artifacts.filter((a) => a.is_fresh).length,
    stale: artifacts.filter((a) => !a.is_fresh).length,
    artifacts,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Extract a governance field value from content.
 */
function extractGovernanceField(content: string, field: string): string | null {
  const lines = content.split("\n");
  let inGovernance = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (trimmed === "governance:") {
      inGovernance = true;
      continue;
    }

    if (inGovernance && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");

      if (key === field) {
        return value === "null" ? null : value;
      }

      // If we hit another top-level key, we've left the governance block
      if (key === "quality" || key === "lifecycle") {
        inGovernance = false;
      }
    }
  }

  return null;
}

/**
 * Extract source_files list from content.
 */
function extractSourceFiles(content: string): string[] {
  const files: string[] = [];
  const lines = content.split("\n");
  let inSourceFiles = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (trimmed === "source_files:") {
      inSourceFiles = true;
      continue;
    }

    if (inSourceFiles) {
      if (trimmed.startsWith("- ")) {
        const value = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
        files.push(value);
      } else if (trimmed === "[]") {
        break;
      } else if (!trimmed.startsWith("#") && trimmed.includes(":")) {
        break;
      }
    }
  }

  return files;
}

// ── Formatting ────────────────────────────────────────────────────

export function formatFreshnessResult(result: FreshnessScanResult): string {
  const lines: string[] = [
    "知识新鲜度检测",
    "",
    `  总计: ${result.total} 个片段`,
    `  新鲜: ${result.fresh}`,
    `  过时: ${result.stale}`,
  ];

  if (result.artifacts.filter((a) => !a.is_fresh).length > 0) {
    lines.push("", "过时片段:");
    for (const artifact of result.artifacts.filter((a) => !a.is_fresh)) {
      const reason = artifact.staleness_reason ?? "unknown";
      const days = artifact.days_since_distillation !== null
        ? ` (${artifact.days_since_distillation} 天前蒸馏)`
        : "";
      lines.push(`  - [${reason}] ${artifact.edith_id}${days}`);
    }
  }

  return lines.join("\n");
}
