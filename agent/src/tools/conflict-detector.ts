/**
 * EDITH Conflict Detector — Detect conflicts between new distillation and human edits
 *
 * When re-distilling knowledge artifacts, detects if the new content overlaps
 * with areas that humans have modified. Uses edit-detector.ts for edit detection
 * and adds conflict resolution workflow.
 *
 * Conflict detection flow:
 *   1. edit-detector.ts detects human_edited files (already implemented)
 *   2. This module compares new distilled content with the existing human-edited version
 *   3. Identifies overlapping regions (diff-based)
 *   4. Generates conflict report with resolution options
 *   5. Supports conflict_policy: preserve_human | overwrite | notify
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

import { parseFrontmatter, type FrontmatterData } from "./frontmatter.js";
import { extractLifecycleState, type LifecycleStatus } from "./lifecycle.js";

// ── Type Definitions ──────────────────────────────────────────────

export type ConflictPolicy = "preserve_human" | "overwrite" | "notify";
export type ConflictResolution = "accept_new" | "preserve_human" | "merge";

export interface ConflictRegion {
  /** Line number where the conflict starts */
  start_line: number;
  /** Line number where the conflict ends */
  end_line: number;
  /** Content from human-edited version */
  human_content: string;
  /** Content from new distillation */
  new_content: string;
}

export interface ConflictEntry {
  /** Artifact relative path */
  artifact_path: string;
  /** EDITH identifier */
  edith_id: string;
  /** The type of conflict detected */
  conflict_type: "full_overlap" | "partial_overlap" | "human_edited";
  /** Description of the conflict */
  description: string;
  /** Specific overlapping regions */
  regions: ConflictRegion[];
  /** Timestamp when conflict was detected */
  detected_at: string;
  /** Whether the conflict has been resolved */
  resolved: boolean;
  /** Resolution applied */
  resolution: ConflictResolution | null;
}

export interface ConflictDetectionResult {
  /** Files that have conflicts */
  conflicts: ConflictEntry[];
  /** Files that can be safely updated */
  safe_updates: string[];
  /** Files that are unchanged */
  unchanged: string[];
}

export interface ResolveConflictParams {
  /** Path to the artifact file */
  artifact_path: string;
  /** Resolution action */
  action: ConflictResolution;
  /** New content (for accept_new and merge) */
  new_content?: string;
}

// ── Conflict Detection ────────────────────────────────────────────

/**
 * Detect conflicts between new distillation content and existing human-edited files.
 *
 * @param vaultRoot - Root of the Obsidian Vault
 * @param updates - Map of relative path → new distilled content
 * @param policy - Conflict resolution policy
 */
export function detectConflicts(
  vaultRoot: string,
  updates: Map<string, string>,
  policy: ConflictPolicy = "preserve_human",
): ConflictDetectionResult {
  const result: ConflictDetectionResult = {
    conflicts: [],
    safe_updates: [],
    unchanged: [],
  };

  for (const [relativePath, newContent] of updates) {
    const fullPath = join(vaultRoot, relativePath);

    if (!existsSync(fullPath)) {
      // New file — no conflict possible
      result.safe_updates.push(relativePath);
      continue;
    }

    const existingContent = readFileSync(fullPath, "utf-8");
    const parsed = parseFrontmatter(existingContent);

    // Check if human has edited this file
    if (!parsed.data.human_edited) {
      // No human edits — safe to update
      // But check if content actually changed
      const existingHash = createHash("sha256").update(existingContent, "utf-8").digest("hex");
      const newHash = createHash("sha256").update(newContent, "utf-8").digest("hex");

      if (existingHash === newHash) {
        result.unchanged.push(relativePath);
      } else {
        result.safe_updates.push(relativePath);
      }
      continue;
    }

    // Human has edited — detect overlap
    const conflict = analyzeConflict(relativePath, existingContent, newContent, parsed.data);

    if (conflict) {
      result.conflicts.push(conflict);

      // Apply policy
      if (policy === "overwrite") {
        result.safe_updates.push(relativePath);
      } else if (policy === "notify") {
        // Don't include in safe_updates — just report
      }
      // preserve_human: don't add to safe_updates
    } else {
      // Human edited but new content doesn't overlap with edited areas
      result.safe_updates.push(relativePath);
    }
  }

  return result;
}

/**
 * Analyze a single file for conflicts between human edits and new content.
 */
function analyzeConflict(
  relativePath: string,
  existingContent: string,
  newContent: string,
  frontmatter: FrontmatterData,
): ConflictEntry | null {
  const existingLines = existingContent.split("\n");
  const newLines = newContent.split("\n");

  // Find diff regions between existing and new content
  // Simple line-based diff: find where content diverges
  const regions: ConflictRegion[] = [];

  // Compare body content (skip frontmatter)
  const existingParsed = parseFrontmatter(existingContent);
  const newParsed = parseFrontmatter(newContent);

  const existingBody = existingParsed.body.split("\n");
  const newBody = newParsed.body.split("\n");

  // Simple diff: find lines that differ
  let hasOverlap = false;
  const maxLen = Math.max(existingBody.length, newBody.length);

  let diffStart = -1;
  let diffEnd = -1;
  const humanDiffLines: string[] = [];
  const newDiffLines: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const existingLine = existingBody[i] ?? "";
    const newLine = newBody[i] ?? "";

    if (existingLine !== newLine) {
      if (diffStart === -1) diffStart = i;
      diffEnd = i;
      humanDiffLines.push(existingLine);
      newDiffLines.push(newLine);
      hasOverlap = true;
    }
  }

  // No differences at all
  if (!hasOverlap) return null;

  // Determine conflict type
  let conflictType: ConflictEntry["conflict_type"];

  if (frontmatter.human_edited && diffStart === 0 && diffEnd >= existingBody.length - 1) {
    conflictType = "full_overlap";
  } else if (frontmatter.human_edited && hasOverlap) {
    conflictType = "partial_overlap";
  } else {
    conflictType = "human_edited";
  }

  // Create a conflict region covering the diff
  if (diffStart !== -1) {
    regions.push({
      start_line: diffStart,
      end_line: diffEnd,
      human_content: humanDiffLines.join("\n"),
      new_content: newDiffLines.join("\n"),
    });
  }

  return {
    artifact_path: relativePath,
    edith_id: frontmatter.edith_id,
    conflict_type: conflictType,
    description: buildConflictDescription(conflictType, frontmatter.edith_id, regions.length),
    regions,
    detected_at: new Date().toISOString(),
    resolved: false,
    resolution: null,
  };
}

/**
 * Build a human-readable conflict description.
 */
function buildConflictDescription(
  type: ConflictEntry["conflict_type"],
  edithId: string,
  regionCount: number,
): string {
  switch (type) {
    case "full_overlap":
      return `${edithId}: 新蒸馏内容与人工修改全面重叠 (${regionCount} 区域)`;
    case "partial_overlap":
      return `${edithId}: 新蒸馏内容与人工修改部分重叠 (${regionCount} 区域)`;
    case "human_edited":
      return `${edithId}: 已有人工修改，需确认是否覆盖`;
  }
}

// ── Conflict Resolution ───────────────────────────────────────────

/**
 * Resolve a conflict by applying the chosen action.
 */
export function resolveConflict(
  vaultRoot: string,
  params: ResolveConflictParams,
): { resolved: boolean; error?: string } {
  const fullPath = join(vaultRoot, params.artifact_path);

  if (!existsSync(fullPath)) {
    return { resolved: false, error: `文件不存在: ${params.artifact_path}` };
  }

  const existingContent = readFileSync(fullPath, "utf-8");
  const parsed = parseFrontmatter(existingContent);

  switch (params.action) {
    case "accept_new": {
      // Overwrite with new content, reset to scaffold
      if (!params.new_content) {
        return { resolved: false, error: "accept_new 需要提供 new_content" };
      }
      writeFileSync(fullPath, params.new_content, "utf-8");
      return { resolved: true };
    }

    case "preserve_human": {
      // Keep human version, just mark conflict as resolved
      // Update governance.conflict_detected to false
      const updatedContent = existingContent.replace(
        /conflict_detected: true/,
        "conflict_detected: false",
      );
      writeFileSync(fullPath, updatedContent, "utf-8");
      return { resolved: true };
    }

    case "merge": {
      // Mark as needing manual merge — write new content to a .new sidecar file
      if (!params.new_content) {
        return { resolved: false, error: "merge 需要提供 new_content" };
      }
      const sidecarPath = fullPath + ".new";
      writeFileSync(sidecarPath, params.new_content, "utf-8");
      return { resolved: true };
    }

    default:
      return { resolved: false, error: `未知的冲突解决动作: ${params.action}` };
  }
}

// ── Vault-wide Conflict Scanning ──────────────────────────────────

/**
 * Scan the vault for all active conflicts.
 */
export function scanVaultConflicts(vaultRoot: string): ConflictEntry[] {
  const conflicts: ConflictEntry[] = [];

  if (!existsSync(vaultRoot)) return conflicts;

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

        if (content.includes("conflict_detected: true")) {
          const parsed = parseFrontmatter(content);
          const relativePath = fullPath.slice(vaultRoot.length + 1);

          conflicts.push({
            artifact_path: relativePath,
            edith_id: parsed.data.edith_id || "unknown",
            conflict_type: "human_edited",
            description: `${parsed.data.edith_id || "unknown"}: 存在未解决的冲突`,
            regions: [],
            detected_at: new Date().toISOString(),
            resolved: false,
            resolution: null,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  walk(vaultRoot);
  return conflicts;
}

// ── Formatting ────────────────────────────────────────────────────

export function formatConflictEntry(conflict: ConflictEntry): string {
  const lines = [
    `冲突: ${conflict.edith_id}`,
    `  类型: ${conflict.conflict_type}`,
    `  描述: ${conflict.description}`,
    `  区域数: ${conflict.regions.length}`,
    `  检测时间: ${conflict.detected_at}`,
  ];

  if (conflict.regions.length > 0) {
    lines.push("  冲突区域:");
    for (const region of conflict.regions) {
      lines.push(`    L${region.start_line}-${region.end_line}`);
    }
  }

  return lines.join("\n");
}

export function formatConflictDetectionResult(result: ConflictDetectionResult): string {
  const lines: string[] = [
    "矛盾检测结果",
    "",
    `  冲突: ${result.conflicts.length}`,
    `  安全更新: ${result.safe_updates.length}`,
    `  未变更: ${result.unchanged.length}`,
  ];

  if (result.conflicts.length > 0) {
    lines.push("", "检测到冲突:");
    for (const conflict of result.conflicts) {
      lines.push(`  - ${conflict.description}`);
    }
  }

  return lines.join("\n");
}
