/**
 * EDITH Lifecycle — Knowledge artifact lifecycle state machine
 *
 * Manages the lifecycle of knowledge artifacts through four states:
 *   scaffold → reviewed → mature → stale → scaffold (re-distill)
 *
 * State transitions:
 *   - scaffold → reviewed: human review confirmation
 *   - reviewed → mature: real-world writeback verification
 *   - reviewed/mature → stale: source_hash mismatch detected
 *   - stale → scaffold: re-distillation triggered
 *
 * All transitions are recorded in frontmatter lifecycle fields.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, basename } from "node:path";

import { parseFrontmatter, generateFrontmatter, type FrontmatterData } from "./frontmatter.js";

// ── Type Definitions ──────────────────────────────────────────────

export type LifecycleStatus = "scaffold" | "reviewed" | "mature" | "stale";
export type StaleReason = "code_changed" | "manual" | "dependency_shift";

export interface LifecycleState {
  /** Current lifecycle status */
  status: LifecycleStatus;
  /** When the artifact was first created */
  created_at: string;
  /** When human review was confirmed */
  reviewed_at: string | null;
  /** Who performed the review */
  reviewed_by: string | null;
  /** When the artifact reached mature state */
  matured_at: string | null;
  /** When the artifact was marked stale */
  stale_at: string | null;
  /** Reason for being marked stale */
  stale_reason: StaleReason | null;
}

export interface GovernanceState {
  /** Whether a conflict has been detected */
  conflict_detected: boolean;
  /** Hash of the last known content */
  last_hash: string | null;
  /** Source files this artifact was derived from */
  source_files: string[];
  /** Hash of the source files when last distilled */
  source_hash: string | null;
}

export interface QualityState {
  /** Completeness score (0-1) */
  completeness: number;
  /** Freshness score (0-1) */
  freshness: number;
}

export interface TransitionResult {
  /** Previous status */
  from: LifecycleStatus;
  /** New status */
  to: LifecycleStatus;
  /** Updated lifecycle state */
  lifecycle: LifecycleState;
  /** Timestamp of transition */
  transitioned_at: string;
}

export type TransitionErrorCode =
  | "INVALID_TRANSITION"
  | "FILE_NOT_FOUND"
  | "NO_FRONTMATTER"
  | "GOVERNANCE_DISABLED";

export interface TransitionError {
  code: TransitionErrorCode;
  message: string;
  from: LifecycleStatus;
  to: LifecycleStatus;
}

export type TransitionOutcome =
  | { ok: true; result: TransitionResult }
  | { ok: false; error: TransitionError };

// ── Valid Transitions Map ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  scaffold: ["reviewed"],
  reviewed: ["mature", "stale"],
  mature: ["stale"],
  stale: ["scaffold"],
};

/**
 * Check if a transition is valid.
 */
export function isValidTransition(from: LifecycleStatus, to: LifecycleStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid target states from a given status.
 */
export function getValidTargets(status: LifecycleStatus): LifecycleStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

// ── Lifecycle State Creation ──────────────────────────────────────

/**
 * Create an initial lifecycle state for a new artifact.
 * New artifacts always start as "scaffold".
 */
export function createLifecycleState(): LifecycleState {
  return {
    status: "scaffold",
    created_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    matured_at: null,
    stale_at: null,
    stale_reason: null,
  };
}

/**
 * Create an initial governance state.
 */
export function createGovernanceState(
  sourceFiles: string[] = [],
  sourceHash: string | null = null,
): GovernanceState {
  return {
    conflict_detected: false,
    last_hash: null,
    source_files: sourceFiles,
    source_hash: sourceHash,
  };
}

// ── State Transition Logic ────────────────────────────────────────

/**
 * Apply a lifecycle state transition.
 * Returns the updated LifecycleState.
 */
export function applyTransition(
  current: LifecycleState,
  targetStatus: LifecycleStatus,
  options?: {
    reviewed_by?: string;
    stale_reason?: StaleReason;
  },
): TransitionResult {
  if (!isValidTransition(current.status, targetStatus)) {
    return {
      from: current.status,
      to: targetStatus,
      lifecycle: current,
      transitioned_at: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const updated: LifecycleState = { ...current, status: targetStatus };

  switch (targetStatus) {
    case "reviewed":
      updated.reviewed_at = now;
      updated.reviewed_by = options?.reviewed_by ?? "human";
      break;
    case "mature":
      updated.matured_at = now;
      break;
    case "stale":
      updated.stale_at = now;
      updated.stale_reason = options?.stale_reason ?? "code_changed";
      break;
    case "scaffold":
      // Re-distill: reset lifecycle but keep created_at
      updated.reviewed_at = null;
      updated.reviewed_by = null;
      updated.matured_at = null;
      updated.stale_at = null;
      updated.stale_reason = null;
      break;
  }

  return {
    from: current.status,
    to: targetStatus,
    lifecycle: updated,
    transitioned_at: now,
  };
}

// ── File-level Lifecycle Operations ───────────────────────────────

/**
 * Transition a file's lifecycle status.
 * Reads the file, updates the lifecycle fields in frontmatter, writes back.
 */
export function transitionFile(
  filePath: string,
  targetStatus: LifecycleStatus,
  options?: {
    reviewed_by?: string;
    stale_reason?: StaleReason;
  },
): TransitionOutcome {
  if (!existsSync(filePath)) {
    return {
      ok: false,
      error: {
        code: "FILE_NOT_FOUND",
        message: `文件不存在: ${filePath}`,
        from: "scaffold" as LifecycleStatus,
        to: targetStatus,
      },
    };
  }

  const content = readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);

  if (!parsed.data.edith_id) {
    return {
      ok: false,
      error: {
        code: "NO_FRONTMATTER",
        message: `文件没有 EDITH frontmatter: ${filePath}`,
        from: "scaffold" as LifecycleStatus,
        to: targetStatus,
      },
    };
  }

  // Extract current lifecycle state from extended frontmatter
  const currentLifecycle = extractLifecycleState(content);
  const currentStatus = currentLifecycle.status;

  if (!isValidTransition(currentStatus, targetStatus)) {
    return {
      ok: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `无效的状态转换: ${currentStatus} → ${targetStatus}。合法目标: ${getValidTargets(currentStatus).join(", ")}`,
        from: currentStatus,
        to: targetStatus,
      },
    };
  }

  const result = applyTransition(currentLifecycle, targetStatus, options);

  // Write updated frontmatter
  const newContent = updateLifecycleInContent(content, result.lifecycle);
  writeFileSync(filePath, newContent, "utf-8");

  return { ok: true, result };
}

/**
 * Initialize a file with scaffold lifecycle state.
 * Adds lifecycle/governance/quality fields to the frontmatter.
 */
export function initializeFileLifecycle(
  filePath: string,
  sourceFiles: string[] = [],
  sourceHash: string | null = null,
): { written: boolean; error?: string } {
  if (!existsSync(filePath)) {
    return { written: false, error: `文件不存在: ${filePath}` };
  }

  const content = readFileSync(filePath, "utf-8");

  // Check if lifecycle fields already exist
  if (content.includes("lifecycle:")) {
    return { written: false, error: "文件已有 lifecycle 字段" };
  }

  const lifecycle = createLifecycleState();
  const governance = createGovernanceState(sourceFiles, sourceHash);
  const quality: QualityState = { completeness: 0, freshness: 1.0 };

  const newContent = appendGovernanceFields(content, lifecycle, governance, quality);
  writeFileSync(filePath, newContent, "utf-8");

  return { written: true };
}

// ── Content Parsing and Updating ──────────────────────────────────

/**
 * Extract lifecycle state from file content by reading frontmatter fields.
 */
export function extractLifecycleState(content: string): LifecycleState {
  const lifecycle: LifecycleState = {
    status: "scaffold",
    created_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    matured_at: null,
    stale_at: null,
    stale_reason: null,
  };

  // Find lifecycle block in the frontmatter
  const lines = content.split("\n");
  let inLifecycle = false;
  let inGovernance = false;
  let indentLevel = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (trimmed === "lifecycle:") {
      inLifecycle = true;
      inGovernance = false;
      indentLevel = line.length - trimmed.length;
      continue;
    }

    if (trimmed === "governance:") {
      inLifecycle = false;
      inGovernance = true;
      continue;
    }

    if (trimmed.startsWith("---") || trimmed.startsWith("edith_") || trimmed.startsWith("layer:") || trimmed.startsWith("human_")) {
      if (inLifecycle || inGovernance) {
        inLifecycle = false;
        inGovernance = false;
      }
    }

    if (inLifecycle && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");

      switch (key) {
        case "status":
          if (["scaffold", "reviewed", "mature", "stale"].includes(value)) {
            lifecycle.status = value as LifecycleStatus;
          }
          break;
        case "created_at":
          lifecycle.created_at = value;
          break;
        case "reviewed_at":
          lifecycle.reviewed_at = value === "null" ? null : value;
          break;
        case "reviewed_by":
          lifecycle.reviewed_by = value === "null" ? null : value;
          break;
        case "matured_at":
          lifecycle.matured_at = value === "null" ? null : value;
          break;
        case "stale_at":
          lifecycle.stale_at = value === "null" ? null : value;
          break;
        case "stale_reason":
          lifecycle.stale_reason = value === "null" ? null : value as StaleReason;
          break;
      }
    }
  }

  return lifecycle;
}

/**
 * Update lifecycle fields in the content string.
 * Replaces the existing lifecycle block or appends if not present.
 */
export function updateLifecycleInContent(
  content: string,
  lifecycle: LifecycleState,
): string {
  if (!content.includes("lifecycle:")) {
    // Append lifecycle block before closing ---
    return appendLifecycleBlock(content, lifecycle);
  }

  // Replace existing lifecycle block
  const lines = content.split("\n");
  const result: string[] = [];
  let inLifecycle = false;
  let lifecycleIndent = 0;
  let lifecycleWritten = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    const currentIndent = lines[i].length - trimmed.length;

    if (trimmed === "lifecycle:") {
      inLifecycle = true;
      lifecycleIndent = currentIndent;
      // Write the updated lifecycle block
      result.push(...formatLifecycleBlock(lifecycle, lifecycleIndent));
      lifecycleWritten = true;
      continue;
    }

    if (inLifecycle) {
      // Skip old lifecycle fields
      if (currentIndent > lifecycleIndent && trimmed.length > 0) {
        continue;
      }
      inLifecycle = false;
    }

    result.push(lines[i]);
  }

  return result.join("\n");
}

/**
 * Format lifecycle block as YAML lines.
 */
function formatLifecycleBlock(lifecycle: LifecycleState, indent: number = 2): string[] {
  const prefix = " ".repeat(indent);
  return [
    `${prefix}lifecycle:`,
    `${prefix}  status: ${lifecycle.status}`,
    `${prefix}  created_at: "${lifecycle.created_at}"`,
    `${prefix}  reviewed_at: ${lifecycle.reviewed_at ? `"${lifecycle.reviewed_at}"` : "null"}`,
    `${prefix}  reviewed_by: ${lifecycle.reviewed_by ?? "null"}`,
    `${prefix}  matured_at: ${lifecycle.matured_at ? `"${lifecycle.matured_at}"` : "null"}`,
    `${prefix}  stale_at: ${lifecycle.stale_at ? `"${lifecycle.stale_at}"` : "null"}`,
    `${prefix}  stale_reason: ${lifecycle.stale_reason ?? "null"}`,
  ];
}

/**
 * Append lifecycle block to content (before closing --- or at end).
 */
function appendLifecycleBlock(content: string, lifecycle: LifecycleState): string {
  const block = formatLifecycleBlock(lifecycle);

  // Find closing --- and insert before it
  const lines = content.split("\n");
  const lastDelimiter = lines.lastIndexOf("---");

  if (lastDelimiter > 0) {
    // Insert before the closing ---
    lines.splice(lastDelimiter, 0, ...block);
    return lines.join("\n");
  }

  // No frontmatter delimiter found — append at end
  return content + "\n" + block.join("\n") + "\n";
}

/**
 * Append governance and quality fields to content.
 * Used when initializing governance for the first time.
 */
function appendGovernanceFields(
  content: string,
  lifecycle: LifecycleState,
  governance: GovernanceState,
  quality: QualityState,
): string {
  const lines = content.split("\n");
  const lastDelimiter = lines.lastIndexOf("---");

  const fields = [
    "",
    "# === 治理字段 ===",
    "lifecycle:",
    `  status: ${lifecycle.status}`,
    `  created_at: "${lifecycle.created_at}"`,
    "  reviewed_at: null",
    "  reviewed_by: null",
    "  matured_at: null",
    "  stale_at: null",
    "  stale_reason: null",
    "governance:",
    `  conflict_detected: ${governance.conflict_detected}`,
    `  last_hash: ${governance.last_hash ?? "null"}`,
    governance.source_files.length > 0
      ? `  source_files:\n${governance.source_files.map((f) => `    - "${f}"`).join("\n")}`
      : "  source_files: []",
    `  source_hash: ${governance.source_hash ?? "null"}`,
    "quality:",
    `  completeness: ${quality.completeness}`,
    `  freshness: ${quality.freshness}`,
  ];

  if (lastDelimiter > 0) {
    lines.splice(lastDelimiter, 0, ...fields);
  } else {
    lines.push(...fields);
  }

  return lines.join("\n");
}

// ── Vault-wide Lifecycle Scanning ─────────────────────────────────

export interface LifecycleDistribution {
  scaffold: number;
  reviewed: number;
  mature: number;
  stale: number;
}

export interface ArtifactLifecycleInfo {
  /** Relative path from vault root */
  path: string;
  /** EDITH identifier */
  edith_id: string;
  /** Current lifecycle status */
  status: LifecycleStatus;
  /** Stale reason, if applicable */
  stale_reason: StaleReason | null;
  /** Whether conflict is detected */
  conflict_detected: boolean;
}

/**
 * Scan the vault for all artifacts and their lifecycle states.
 */
export function scanVaultLifecycles(vaultRoot: string): ArtifactLifecycleInfo[] {
  const artifacts: ArtifactLifecycleInfo[] = [];

  if (!existsSync(vaultRoot)) return artifacts;

  // Scan all .md files
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

      try {
        const content = readFileSync(fullPath, "utf-8");
        const parsed = parseFrontmatter(content);

        if (!parsed.data.edith_id) continue;

        const lifecycle = extractLifecycleState(content);
        const relativePath = fullPath.slice(vaultRoot.length + 1);

        artifacts.push({
          path: relativePath,
          edith_id: parsed.data.edith_id,
          status: lifecycle.status,
          stale_reason: lifecycle.stale_reason,
          conflict_detected: content.includes("conflict_detected: true"),
        });
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  walk(vaultRoot);
  return artifacts;
}

/**
 * Compute lifecycle distribution from a list of artifacts.
 */
export function computeDistribution(artifacts: ArtifactLifecycleInfo[]): LifecycleDistribution {
  const dist: LifecycleDistribution = { scaffold: 0, reviewed: 0, mature: 0, stale: 0 };
  for (const artifact of artifacts) {
    dist[artifact.status]++;
  }
  return dist;
}

// ── Formatting ────────────────────────────────────────────────────

export function formatLifecycleStatus(status: LifecycleStatus): string {
  const labels: Record<LifecycleStatus, string> = {
    scaffold: "Scaffold  (脚手架 — 待审阅)",
    reviewed: "Reviewed  (已审阅 — 待验证)",
    mature: "Mature    (成熟 — 已验证)",
    stale: "Stale     (过时 — 需重新蒸馏)",
  };
  return labels[status] ?? status;
}

export function formatTransitionResult(result: TransitionResult): string {
  return `状态转换: ${result.from} → ${result.to} (${result.transitioned_at})`;
}

export function formatDistribution(dist: LifecycleDistribution): string {
  const total = dist.scaffold + dist.reviewed + dist.mature + dist.stale;
  return [
    `生命周期分布 (共 ${total} 个片段):`,
    `  scaffold: ${dist.scaffold}`,
    `  reviewed: ${dist.reviewed}`,
    `  mature:   ${dist.mature}`,
    `  stale:    ${dist.stale}`,
  ].join("\n");
}
