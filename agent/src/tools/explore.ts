/**
 * EDITH Explore Tool — edith_explore implementation
 *
 * Lightweight project overview: structure, tech stack, key files.
 * No file persistence — results returned inline.
 */

import { existsSync, readdirSync, readFileSync, statSync, accessSync, constants } from "node:fs";
import { resolve, join, extname, basename } from "node:path";

import type { RepoConfig } from "../config.js";
import { resolveTarget, detectTechStack } from "./scan.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface ExploreParams {
  target: string;
}

export interface ExploreResult {
  service: string;
  path: string;
  techStack: string[];
  directoryTree: string;
  keyFiles: KeyFile[];
  fileStats: FileStat[];
  meta: ProjectMeta | null;
  totalFiles: number;
  exploredAt: string;
}

export interface KeyFile {
  path: string;
  kind: "entry" | "config" | "test" | "ci" | "docs" | "docker";
}

export interface FileStat {
  extension: string;
  count: number;
}

export interface ProjectMeta {
  name?: string;
  description?: string;
  version?: string;
}

export type ExploreErrorCode =
  | "TARGET_NOT_FOUND"
  | "PATH_NOT_FOUND"
  | "EMPTY_PROJECT"
  | "PERMISSION_DENIED"
  | "MISSING_PARAMETER";

export interface ExploreError {
  code: ExploreErrorCode;
  message: string;
  suggestion: string;
}

export type ExploreOutcome =
  | { ok: true; result: ExploreResult }
  | { ok: false; error: ExploreError };

// ── Constants ─────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules", ".git", "vendor", "__pycache__",
  ".gradle", ".mvn", "dist", "build", "target", ".next",
  ".cache", ".tox", "venv", ".venv", "env", ".turbo",
]);

const CODE_EXTS = new Set([
  ".java", ".kt", ".scala", ".groovy", ".go", ".py", ".pyx", ".pyi",
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".rs", ".rb", ".php",
  ".cs", ".swift", ".c", ".cpp", ".h", ".hpp",
]);

const ENTRY_FILES = new Set([
  "index.ts", "index.js", "index.mjs", "main.ts", "main.js",
  "app.ts", "app.js", "server.ts", "server.js",
  "main.go", "main.py", "app.py", "manage.py", "__main__.py",
  "Application.java", "Main.kt",
]);

const CONFIG_FILES = new Set([
  "package.json", "tsconfig.json", "jsconfig.json",
  ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml",
  ".prettierrc", ".prettierrc.js", ".prettierrc.json",
  "webpack.config.js", "webpack.config.ts", "vite.config.ts", "vite.config.js",
  "rollup.config.js", "rollup.config.ts",
  "jest.config.js", "jest.config.ts", "vitest.config.ts",
  "pyproject.toml", "setup.py", "setup.cfg", "tox.ini",
  "go.mod", "go.sum",
  "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle",
  "Cargo.toml", "Gemfile", "composer.json",
  "edith.yaml",
]);

const CI_FILES = new Set([
  ".github", ".gitlab-ci.yml", ".circleci", "Jenkinsfile",
  "azure-pipelines.yml", ".travis.yml",
]);

const DOCKER_FILES = new Set([
  "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
  "docker-compose.override.yml", ".dockerignore",
]);

const DOCS_FILES = new Set([
  "README.md", "README.zh.md", "README.en.md", "README.txt",
  "CHANGELOG.md", "CHANGES.md", "HISTORY.md",
  "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "LICENSE",
]);

const MAX_TREE_DEPTH = 4;
const MAX_ENTRIES_PER_DIR = 20;

// ── Error Factories ───────────────────────────────────────────────

function missingParam(param: string): ExploreError {
  return {
    code: "MISSING_PARAMETER",
    message: `缺少必需参数: ${param}`,
    suggestion: "edith_explore 需要 target 参数，指定要探索的项目名或路径。",
  };
}

function pathNotFound(p: string): ExploreError {
  return {
    code: "PATH_NOT_FOUND",
    message: `项目路径不存在: ${p}`,
    suggestion: "确认路径正确，或更新 edith.yaml 中对应的 path 字段。",
  };
}

function emptyProject(p: string): ExploreError {
  return {
    code: "EMPTY_PROJECT",
    message: `目标项目为空，未发现代码文件`,
    suggestion: `确认 ${p} 是正确的项目目录，且包含源代码文件。`,
  };
}

function permissionDenied(p: string): ExploreError {
  return {
    code: "PERMISSION_DENIED",
    message: `权限不足: 无法读取 ${p}`,
    suggestion: "检查目录权限，或使用有读取权限的用户运行 EDITH。",
  };
}

// ── Pre-flight Check ──────────────────────────────────────────────

function preflight(dirPath: string): ExploreError | null {
  try {
    accessSync(dirPath, constants.R_OK);
  } catch {
    return permissionDenied(dirPath);
  }

  let codeFileCount = 0;
  function walk(dir: string): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name) || (e.name.startsWith(".") && e.name !== ".github")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (CODE_EXTS.has(extname(e.name))) codeFileCount++;
    }
  }
  walk(dirPath);

  if (codeFileCount === 0) return emptyProject(dirPath);
  return null;
}

// ── Directory Tree Builder ────────────────────────────────────────

function buildTree(dirPath: string): string {
  const lines: string[] = [];
  const rootName = basename(dirPath);
  lines.push(`${rootName}/`);
  walkTree(dirPath, "", 0, lines);
  return lines.join("\n");
}

function walkTree(dir: string, prefix: string, depth: number, lines: string[]): void {
  if (depth > MAX_TREE_DEPTH) return;

  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

  const visible = entries
    .filter(e => !SKIP_DIRS.has(e.name) && !e.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const shown = visible.slice(0, MAX_ENTRIES_PER_DIR);

  for (let i = 0; i < shown.length; i++) {
    const e = shown[i];
    const isLast = i === shown.length - 1 && visible.length <= MAX_ENTRIES_PER_DIR;
    const connector = isLast ? "└── " : "├── ";
    const suffix = e.isDirectory() ? "/" : "";
    lines.push(`${prefix}${connector}${e.name}${suffix}`);

    if (e.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      walkTree(join(dir, e.name), newPrefix, depth + 1, lines);
    }
  }

  if (visible.length > MAX_ENTRIES_PER_DIR) {
    lines.push(`${prefix}└── ... (${visible.length - MAX_ENTRIES_PER_DIR} more)`);
  }
}

// ── Key File Detection ────────────────────────────────────────────

function detectKeyFiles(dirPath: string): KeyFile[] {
  const results: KeyFile[] = [];

  function walk(dir: string, relPath: string): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      if (e.name.startsWith(".") && e.name !== ".github") continue;

      const fullRel = relPath ? `${relPath}/${e.name}` : e.name;

      if (e.isDirectory()) {
        // Test directories
        if (["test", "tests", "__tests__", "spec", "specs", "testing"].includes(e.name.toLowerCase())) {
          results.push({ path: `${fullRel}/`, kind: "test" });
        }
        // CI directories
        if (CI_FILES.has(e.name)) {
          results.push({ path: `${fullRel}/`, kind: "ci" });
        }

        walk(join(dir, e.name), fullRel);
      } else {
        if (ENTRY_FILES.has(e.name)) results.push({ path: fullRel, kind: "entry" });
        else if (CONFIG_FILES.has(e.name)) results.push({ path: fullRel, kind: "config" });
        else if (DOCKER_FILES.has(e.name)) results.push({ path: fullRel, kind: "docker" });
        else if (DOCS_FILES.has(e.name)) results.push({ path: fullRel, kind: "docs" });
      }
    }
  }

  walk(dirPath, "");
  return results;
}

// ── File Statistics ───────────────────────────────────────────────

function countFilesByExtension(dirPath: string): { stats: FileStat[]; total: number } {
  const extMap = new Map<string, number>();
  let total = 0;

  function walk(dir: string): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name) || (e.name.startsWith(".") && e.name !== ".github")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const ext = extname(e.name);
        if (ext) {
          extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
          total++;
        }
      }
    }
  }

  walk(dirPath);

  const stats = Array.from(extMap.entries())
    .map(([extension, count]) => ({ extension, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return { stats, total };
}

// ── Project Meta ──────────────────────────────────────────────────

function extractMeta(dirPath: string): ProjectMeta | null {
  const pkgPath = join(dirPath, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return {
        name: pkg.name || undefined,
        description: pkg.description || undefined,
        version: pkg.version || undefined,
      };
    } catch { /* skip */ }
  }

  const readmePath = join(dirPath, "README.md");
  if (existsSync(readmePath)) {
    try {
      const content = readFileSync(readmePath, "utf-8");
      const firstLine = content.split("\n").find(l => l.trim().length > 0) ?? "";
      return { description: firstLine.replace(/^#+\s*/, "") || undefined };
    } catch { /* skip */ }
  }

  return null;
}

// ── Main Explore Function ─────────────────────────────────────────

export async function executeExplore(
  params: ExploreParams,
  repos: RepoConfig[],
): Promise<ExploreOutcome> {
  if (!params.target || params.target.trim() === "") {
    return { ok: false, error: missingParam("target") };
  }

  const resolved = resolveTarget(params.target, repos);
  if (!resolved.ok) {
    // Map scan errors to explore errors
    const scanErr = resolved.error;
    return {
      ok: false,
      error: {
        code: scanErr.code as ExploreErrorCode,
        message: scanErr.message,
        suggestion: scanErr.suggestion,
      },
    };
  }

  const { name, path: projectPath } = resolved;

  const preflightErr = preflight(projectPath);
  if (preflightErr) return { ok: false, error: preflightErr };

  const techStack = detectTechStack(projectPath);
  const directoryTree = buildTree(projectPath);
  const keyFiles = detectKeyFiles(projectPath);
  const { stats: fileStats, total: totalFiles } = countFilesByExtension(projectPath);
  const meta = extractMeta(projectPath);

  const result: ExploreResult = {
    service: name,
    path: projectPath,
    techStack,
    directoryTree,
    keyFiles,
    fileStats,
    meta,
    totalFiles,
    exploredAt: new Date().toISOString(),
  };

  return { ok: true, result };
}

// ── Formatters ────────────────────────────────────────────────────

const KIND_LABELS: Record<KeyFile["kind"], string> = {
  entry: "入口",
  config: "配置",
  test: "测试",
  ci: "CI/CD",
  docs: "文档",
  docker: "容器",
};

export function formatExploreSummary(result: ExploreResult): string {
  const lines: string[] = [];

  lines.push("EDITH 项目探索");
  lines.push("═".repeat(40));

  if (result.meta) {
    if (result.meta.name) lines.push(`  名称: ${result.meta.name}`);
    if (result.meta.version) lines.push(`  版本: ${result.meta.version}`);
    if (result.meta.description) lines.push(`  描述: ${result.meta.description}`);
  }
  lines.push(`  路径: ${result.path}`);
  lines.push(`  技术栈: ${result.techStack.length > 0 ? result.techStack.join(", ") : "未识别"}`);
  lines.push(`  文件总数: ${result.totalFiles}`);
  lines.push("");

  if (result.keyFiles.length > 0) {
    lines.push("关键文件:");
    const grouped = new Map<string, string[]>();
    for (const kf of result.keyFiles) {
      const label = KIND_LABELS[kf.kind];
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(kf.path);
    }
    for (const [label, paths] of grouped) {
      lines.push(`  ${label}: ${paths.slice(0, 5).join(", ")}${paths.length > 5 ? ` (+${paths.length - 5})` : ""}`);
    }
    lines.push("");
  }

  if (result.fileStats.length > 0) {
    lines.push("文件分布 (top 10):");
    for (const s of result.fileStats.slice(0, 10)) {
      const bar = "█".repeat(Math.min(Math.ceil(s.count / Math.max(result.fileStats[0].count, 1) * 20), 20));
      lines.push(`  ${s.extension.padEnd(6)} ${String(s.count).padStart(5)}  ${bar}`);
    }
    lines.push("");
  }

  lines.push("目录结构:");
  lines.push(result.directoryTree);

  return lines.join("\n");
}

export function formatExploreError(error: ExploreError): string {
  return [
    "EDITH 项目探索失败",
    "",
    `  错误: ${error.message}`,
    `  代码: ${error.code}`,
    `  建议: ${error.suggestion}`,
  ].join("\n");
}
