/**
 * EDITH Edit Detector — Human edit detection and preservation for Obsidian Vault
 *
 * Detects human modifications to vault artifacts using content hashing.
 * On refresh, preserves human-edited files and only updates machine-generated ones.
 *
 * Mechanism:
 *   1. Calculate SHA-256 content hash for each vault file
 *   2. Compare with stored hashes from previous distillation
 *   3. Hash mismatch + human_edited: true -> preserve human version
 *   4. Hash mismatch + human_edited: false -> normal overwrite (external tool modified)
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
} from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { createHash } from "node:crypto";

import { parseFrontmatter, type FrontmatterData } from "./frontmatter.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface FileHash {
  /** Relative path from vault root */
  path: string;
  /** SHA-256 content hash */
  hash: string;
  /** ISO timestamp of when this hash was recorded */
  recorded_at: string;
}

export interface HashManifest {
  /** Manifest version */
  version: number;
  /** ISO timestamp of manifest creation */
  created_at: string;
  /** File hashes keyed by relative path */
  files: Record<string, FileHash>;
}

export interface EditDetectionResult {
  /** Files that have been modified since last distillation */
  modified: string[];
  /** Files that have been human-edited (will be preserved) */
  human_edited: string[];
  /** Files unchanged since last distillation */
  unchanged: string[];
  /** Files that are new (not in previous manifest) */
  new_files: string[];
  /** Files removed since last distillation */
  removed: string[];
}

export interface RefreshResult {
  /** Files successfully updated */
  updated: string[];
  /** Files preserved due to human edits */
  preserved: string[];
  /** Errors during refresh */
  errors: string[];
}

// ── Constants ──────────────────────────────────────────────────────

const MANIFEST_VERSION = 1;
const MANIFEST_DIR = ".edith";
const MANIFEST_FILE = "vault-hash-manifest.json";

// ── Hash Calculation ───────────────────────────────────────────────

/**
 * Calculate SHA-256 hash of file content.
 */
export function calculateContentHash(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Calculate content hash for a file at the given path.
 * Returns null if the file doesn't exist or can't be read.
 */
export function calculateFileHash(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    return calculateContentHash(content);
  } catch {
    return null;
  }
}

// ── Manifest Management ────────────────────────────────────────────

/**
 * Get the manifest file path within the vault.
 */
export function getManifestPath(vaultRoot: string): string {
  return join(vaultRoot, MANIFEST_DIR, MANIFEST_FILE);
}

/**
 * Load the hash manifest from the vault.
 * Returns an empty manifest if none exists.
 */
export function loadManifest(vaultRoot: string): HashManifest {
  const manifestPath = getManifestPath(vaultRoot);

  if (!existsSync(manifestPath)) {
    return {
      version: MANIFEST_VERSION,
      created_at: new Date().toISOString(),
      files: {},
    };
  }

  try {
    const content = readFileSync(manifestPath, "utf-8");
    return JSON.parse(content) as HashManifest;
  } catch {
    return {
      version: MANIFEST_VERSION,
      created_at: new Date().toISOString(),
      files: {},
    };
  }
}

/**
 * Save the hash manifest to the vault.
 */
export function saveManifest(vaultRoot: string, manifest: HashManifest): void {
  const manifestDir = join(vaultRoot, MANIFEST_DIR);
  mkdirSync(manifestDir, { recursive: true });

  const manifestPath = getManifestPath(vaultRoot);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

/**
 * Build a new manifest from the current vault state.
 * Scans all Markdown files and calculates their hashes.
 */
export function buildManifest(vaultRoot: string): HashManifest {
  const manifest: HashManifest = {
    version: MANIFEST_VERSION,
    created_at: new Date().toISOString(),
    files: {},
  };

  scanDirectory(vaultRoot, vaultRoot, manifest);
  return manifest;
}

function scanDirectory(
  dir: string,
  vaultRoot: string,
  manifest: HashManifest,
): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip .obsidian and .edith directories
    if (entry.name === ".obsidian" || entry.name === ".edith") continue;

    if (entry.isDirectory()) {
      scanDirectory(fullPath, vaultRoot, manifest);
      continue;
    }

    if (!entry.name.endsWith(".md")) continue;

    const relativePath = fullPath.slice(vaultRoot.length + 1);
    const hash = calculateFileHash(fullPath);

    if (hash) {
      manifest.files[relativePath] = {
        path: relativePath,
        hash,
        recorded_at: new Date().toISOString(),
      };
    }
  }
}

// ── Edit Detection ─────────────────────────────────────────────────

/**
 * Detect changes between the previous manifest and current vault state.
 *
 * Compares hashes and checks frontmatter for human_edited flags.
 */
export function detectEdits(
  vaultRoot: string,
  previousManifest: HashManifest,
): EditDetectionResult {
  const result: EditDetectionResult = {
    modified: [],
    human_edited: [],
    unchanged: [],
    new_files: [],
    removed: [],
  };

  const currentManifest = buildManifest(vaultRoot);
  const currentPaths = new Set(Object.keys(currentManifest.files));
  const previousPaths = new Set(Object.keys(previousManifest.files));

  // Find new files
  for (const path of currentPaths) {
    if (!previousPaths.has(path)) {
      result.new_files.push(path);
    }
  }

  // Find removed files
  for (const path of previousPaths) {
    if (!currentPaths.has(path)) {
      result.removed.push(path);
    }
  }

  // Compare existing files
  for (const path of currentPaths) {
    if (!previousPaths.has(path)) continue; // Already in new_files

    const currentHash = currentManifest.files[path].hash;
    const previousHash = previousManifest.files[path].hash;

    if (currentHash === previousHash) {
      result.unchanged.push(path);
      continue;
    }

    // Hash changed - check if human-edited
    const fullPath = join(vaultRoot, path);
    const isHumanEdited = checkHumanEdited(fullPath);

    if (isHumanEdited) {
      result.human_edited.push(path);
    } else {
      result.modified.push(path);
    }
  }

  return result;
}

/**
 * Check if a file has been human-edited by reading its frontmatter.
 */
export function checkHumanEdited(filePath: string): boolean {
  if (!existsSync(filePath)) return false;

  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseFrontmatter(content);
    return parsed.data.human_edited === true;
  } catch {
    return false;
  }
}

// ── Refresh with Preservation ──────────────────────────────────────

/**
 * Refresh vault files while preserving human-edited ones.
 *
 * For each file to update:
 *   - If human_edited: skip, log as preserved
 *   - Otherwise: update with new content
 */
export function refreshWithPreservation(
  vaultRoot: string,
  updates: Map<string, string>,
  previousManifest: HashManifest,
): RefreshResult {
  const result: RefreshResult = {
    updated: [],
    preserved: [],
    errors: [],
  };

  for (const [relativePath, newContent] of updates) {
    const fullPath = join(vaultRoot, relativePath);

    // Check if this file was human-edited in previous manifest
    const previousEntry = previousManifest.files[relativePath];
    const isHumanEdited = checkHumanEdited(fullPath);

    if (isHumanEdited && previousEntry) {
      // Verify the file was actually modified by comparing hashes
      const currentHash = calculateFileHash(fullPath);
      if (currentHash !== previousEntry.hash) {
        result.preserved.push(relativePath);
        continue;
      }
    }

    // Safe to update
    try {
      // Ensure directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, newContent, "utf-8");
      result.updated.push(relativePath);
    } catch (err) {
      result.errors.push(`Failed to update ${relativePath}: ${(err as Error).message}`);
    }
  }

  return result;
}

// ── Formatting ─────────────────────────────────────────────────────

export function formatEditDetectionResult(result: EditDetectionResult): string {
  const lines: string[] = [
    "人工编辑检测结果",
    "",
    `  变更文件: ${result.modified.length}`,
    `  人工编辑: ${result.human_edited.length}`,
    `  未变更: ${result.unchanged.length}`,
    `  新文件: ${result.new_files.length}`,
    `  已删除: ${result.removed.length}`,
  ];

  if (result.human_edited.length > 0) {
    lines.push("", "  保留人工编辑:");
    for (const file of result.human_edited) {
      lines.push(`    - Preserved human edit: ${file}`);
    }
  }

  return lines.join("\n");
}

export function formatRefreshResult(result: RefreshResult): string {
  const lines: string[] = [
    "Vault 刷新完成",
    "",
    `  更新: ${result.updated.length}`,
    `  保留: ${result.preserved.length}`,
    `  错误: ${result.errors.length}`,
  ];

  if (result.preserved.length > 0) {
    lines.push("", "  保留人工编辑:");
    for (const file of result.preserved) {
      lines.push(`    - Preserved human edit: ${file}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("", "  错误:");
    for (const error of result.errors) {
      lines.push(`    - ${error}`);
    }
  }

  return lines.join("\n");
}
