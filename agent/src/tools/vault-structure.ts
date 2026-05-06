/**
 * EDITH Vault Structure Generator — Obsidian Vault directory mapping
 *
 * Maps EDITH three-layer knowledge artifacts to Obsidian Vault directory
 * structure for zero-adaptation bidirectional integration.
 *
 * Vault layout:
 *   00-routing/     <- Layer 0 (routing-table.md)
 *   01-services/    <- Layer 1 (per-service quick-ref.md)
 *   02-distillates/ <- Layer 2 (per-service distillate fragments)
 *   03-decisions/   <- Human decision records
 *   graphify-out/   <- Graphify index output
 *   .obsidian/      <- Obsidian configuration
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { resolve, join, basename, relative } from "node:path";

import type { ObsidianConfig } from "../config.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface VaultMappingResult {
  vault_path: string;
  directories_created: string[];
  files_written: string[];
  files_preserved: string[];
  errors: string[];
}

export interface ObsidianAppConfig {
  /** Default view mode */
  defaultViewMode?: string;
  /** Show inline title */
  showInlineTitle?: boolean;
  /** Readable line length */
  readableLineLength?: boolean;
}

// ── .obsidian Configuration Generation ─────────────────────────────

/**
 * Generate Obsidian .obsidian/app.json configuration.
 */
export function generateObsidianAppConfig(): Record<string, unknown> {
  return {
    legacyEditor: false,
    defaultViewMode: "source",
    showInlineTitle: true,
    readableLineLength: true,
    showUnsupportedFiles: true,
    attachmentFolderPath: "./",
    newFileLocation: "current",
    useMarkdownLinks: false, // Use Wikilinks
  };
}

/**
 * Generate Obsidian .obsidian/appearance.json configuration.
 */
export function generateObsidianAppearanceConfig(): Record<string, unknown> {
  return {
    baseTheme: "dark",
    cssTheme: "",
    enabledCssSnippets: [] as string[],
  };
}

/**
 * Write .obsidian directory configuration files.
 */
export function writeObsidianConfig(vaultRoot: string): void {
  const obsidianDir = join(vaultRoot, ".obsidian");
  mkdirSync(obsidianDir, { recursive: true });

  const appConfig = generateObsidianAppConfig();
  writeFileSync(
    join(obsidianDir, "app.json"),
    JSON.stringify(appConfig, null, 2),
    "utf-8",
  );

  const appearanceConfig = generateObsidianAppearanceConfig();
  writeFileSync(
    join(obsidianDir, "appearance.json"),
    JSON.stringify(appearanceConfig, null, 2),
    "utf-8",
  );
}

// ── Vault Directory Structure ──────────────────────────────────────

const VAULT_DIRECTORIES = [
  "00-routing",
  "01-services",
  "02-distillates",
  "03-decisions",
  "graphify-out",
] as const;

/**
 * Create the vault directory structure.
 * Returns list of directories created.
 */
export function createVaultDirectories(vaultRoot: string): string[] {
  const created: string[] = [];

  for (const dir of VAULT_DIRECTORIES) {
    const dirPath = join(vaultRoot, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      created.push(dir);
    }
  }

  // Create .obsidian config directory
  const obsidianDir = join(vaultRoot, ".obsidian");
  if (!existsSync(obsidianDir)) {
    mkdirSync(obsidianDir, { recursive: true });
    created.push(".obsidian");
  }

  return created;
}

// ── Layer Mapping Functions ────────────────────────────────────────

/**
 * Map Layer 0 (routing-table.md) to vault.
 * Copies routing-table.md -> 00-routing/routing-table.md
 */
export function mapLayer0(
  workspaceRoot: string,
  vaultRoot: string,
): { file: string; written: boolean } {
  const sourcePath = join(workspaceRoot, "routing-table.md");
  const targetPath = join(vaultRoot, "00-routing", "routing-table.md");

  if (!existsSync(sourcePath)) {
    return { file: "routing-table.md", written: false };
  }

  const content = readFileSync(sourcePath, "utf-8");
  writeFileSync(targetPath, content, "utf-8");
  return { file: "00-routing/routing-table.md", written: true };
}

/**
 * Build a service-prefixed vault filename so Graph View nodes are unique.
 * e.g. ("user-service", "quick-ref") -> "user-service.quick-ref"
 */
export function prefixedFilename(serviceName: string, baseName: string): string {
  const withoutExt = baseName.replace(/\.md$/, "");
  return `${serviceName}.${withoutExt}.md`;
}

/**
 * Map Layer 1 (quick-ref.md) to vault.
 * Copies each {service}/quick-ref.md -> 01-services/{service}/{service}.quick-ref.md
 */
export function mapLayer1(
  workspaceRoot: string,
  vaultRoot: string,
): { files: string[]; services: string[] } {
  const files: string[] = [];
  const services: string[] = [];

  // Find all service directories that have quick-ref.md
  const entries = readdirSync(workspaceRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Skip known non-service directories
    if (["docs", "node_modules", ".git", ".edith", "distillates"].includes(entry.name)) continue;

    const quickRefPath = join(workspaceRoot, entry.name, "quick-ref.md");
    if (!existsSync(quickRefPath)) continue;

    const targetDir = join(vaultRoot, "01-services", entry.name);
    mkdirSync(targetDir, { recursive: true });

    const targetName = prefixedFilename(entry.name, "quick-ref");
    const content = readFileSync(quickRefPath, "utf-8");
    writeFileSync(join(targetDir, targetName), content, "utf-8");

    files.push(`01-services/${entry.name}/${targetName}`);
    services.push(entry.name);
  }

  return { files, services };
}

/**
 * Map Layer 2 (distillates) to vault.
 * Copies each {service}/distillates/*.md -> 02-distillates/{service}/{service}.{name}.md
 */
export function mapLayer2(
  workspaceRoot: string,
  vaultRoot: string,
): { files: string[]; services: string[] } {
  const files: string[] = [];
  const services: string[] = [];

  const entries = readdirSync(workspaceRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (["docs", "node_modules", ".git", ".edith"].includes(entry.name)) continue;

    const distillatesDir = join(workspaceRoot, entry.name, "distillates");
    if (!existsSync(distillatesDir) || !statSync(distillatesDir).isDirectory()) continue;

    const targetDir = join(vaultRoot, "02-distillates", entry.name);
    mkdirSync(targetDir, { recursive: true });

    let mdFiles: string[];
    try {
      mdFiles = readdirSync(distillatesDir).filter((f: string) => f.endsWith(".md"));
    } catch {
      continue;
    }

    for (const mdFile of mdFiles) {
      const targetName = prefixedFilename(entry.name, mdFile);
      const content = readFileSync(join(distillatesDir, mdFile), "utf-8");
      writeFileSync(join(targetDir, targetName), content, "utf-8");
      files.push(`02-distillates/${entry.name}/${targetName}`);
    }

    services.push(entry.name);
  }

  return { files, services };
}

/**
 * Map graphify output to vault.
 * Copies graphify-out/ directory contents.
 */
export function mapGraphifyOut(
  workspaceRoot: string,
  vaultRoot: string,
): string[] {
  const files: string[] = [];
  const graphifyDir = join(workspaceRoot, "graphify-out");

  if (!existsSync(graphifyDir) || !statSync(graphifyDir).isDirectory()) {
    return files;
  }

  const targetDir = join(vaultRoot, "graphify-out");
  mkdirSync(targetDir, { recursive: true });

  let entries: string[];
  try {
    entries = readdirSync(graphifyDir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const srcPath = join(graphifyDir, entry);
    if (!statSync(srcPath).isFile()) continue;

    const content = readFileSync(srcPath, "utf-8");
    writeFileSync(join(targetDir, entry), content, "utf-8");
    files.push(`graphify-out/${entry}`);
  }

  return files;
}

// ── Main Vault Structure Generator ─────────────────────────────────

/**
 * Generate the complete Obsidian Vault structure from EDITH knowledge artifacts.
 *
 * Steps:
 * 1. Create vault directory structure
 * 2. Write .obsidian configuration
 * 3. Map Layer 0 (routing-table)
 * 4. Map Layer 1 (quick-ref per service)
 * 5. Map Layer 2 (distillates per service)
 * 6. Map graphify-out if present
 * 7. Create 03-decisions/ placeholder with README
 */
export function generateVaultStructure(
  workspaceRoot: string,
  obsidianConfig: ObsidianConfig,
): VaultMappingResult {
  const result: VaultMappingResult = {
    vault_path: "",
    directories_created: [],
    files_written: [],
    files_preserved: [],
    errors: [],
  };

  const absWorkspace = resolve(workspaceRoot);
  const vaultRoot = resolve(absWorkspace, obsidianConfig.vault_path);
  result.vault_path = vaultRoot;

  // Step 1: Create directories
  try {
    result.directories_created = createVaultDirectories(vaultRoot);
  } catch (err) {
    result.errors.push(`Failed to create vault directories: ${(err as Error).message}`);
    return result;
  }

  // Step 2: Write .obsidian config
  if (obsidianConfig.graph_view) {
    try {
      writeObsidianConfig(vaultRoot);
    } catch (err) {
      result.errors.push(`Failed to write .obsidian config: ${(err as Error).message}`);
    }
  }

  // Step 3: Map Layer 0
  try {
    const layer0Result = mapLayer0(absWorkspace, vaultRoot);
    if (layer0Result.written) {
      result.files_written.push(layer0Result.file);
    }
  } catch (err) {
    result.errors.push(`Layer 0 mapping failed: ${(err as Error).message}`);
  }

  // Step 4: Map Layer 1
  try {
    const layer1Result = mapLayer1(absWorkspace, vaultRoot);
    result.files_written.push(...layer1Result.files);
  } catch (err) {
    result.errors.push(`Layer 1 mapping failed: ${(err as Error).message}`);
  }

  // Step 5: Map Layer 2
  try {
    const layer2Result = mapLayer2(absWorkspace, vaultRoot);
    result.files_written.push(...layer2Result.files);
  } catch (err) {
    result.errors.push(`Layer 2 mapping failed: ${(err as Error).message}`);
  }

  // Step 6: Map graphify-out
  try {
    const graphifyFiles = mapGraphifyOut(absWorkspace, vaultRoot);
    result.files_written.push(...graphifyFiles);
  } catch (err) {
    result.errors.push(`graphify-out mapping failed: ${(err as Error).message}`);
  }

  // Step 7: Create decisions directory placeholder
  const decisionsReadme = join(vaultRoot, "03-decisions", "README.md");
  if (!existsSync(decisionsReadme)) {
    const readmeContent = [
      "# Decisions",
      "",
      "This directory contains human-written architecture decision records.",
      "",
      "Use Wikilinks to link decisions to related knowledge artifacts:",
      "- `[[user-service/user-service.quick-ref]]`",
      "- `[[user-service/user-service.01-api-contracts]]`",
      "",
      "Organize by month: `YYYY-MM/decision-name.md`",
    ].join("\n");
    writeFileSync(decisionsReadme, readmeContent, "utf-8");
  }

  return result;
}

// ── Formatting ─────────────────────────────────────────────────────

export function formatVaultResult(result: VaultMappingResult): string {
  const lines: string[] = [
    "Obsidian Vault 生成完成",
    "",
    `  Vault 路径: ${result.vault_path}`,
    `  新建目录: ${result.directories_created.length}`,
    `  写入文件: ${result.files_written.length}`,
  ];

  if (result.files_written.length > 0) {
    lines.push("");
    lines.push("  文件映射:");
    for (const file of result.files_written.slice(0, 20)) {
      lines.push(`    - ${file}`);
    }
    if (result.files_written.length > 20) {
      lines.push(`    ... and ${result.files_written.length - 20} more`);
    }
  }

  if (result.files_preserved.length > 0) {
    lines.push("");
    lines.push(`  保留人工编辑: ${result.files_preserved.length}`);
    for (const file of result.files_preserved) {
      lines.push(`    - ${file}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("  错误:");
    for (const error of result.errors) {
      lines.push(`    - ${error}`);
    }
  }

  return lines.join("\n");
}
