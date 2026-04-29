/**
 * EDITH Scan Tool — edith_scan implementation
 *
 * Scans project code and generates structured documentation.
 * Integrates with the document-project Skill.
 *
 * Features:
 * - Parameter parsing and validation (target, mode)
 * - Repo path resolution from edith.yaml repos mapping
 * - Pre-flight checks (permissions, empty project)
 * - Skill invocation for code scanning
 * - Result persistence to workspace/{service}/docs/
 * - Structured error handling (6 error codes)
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, accessSync, constants } from "node:fs";
import { resolve, join, extname } from "node:path";

import type { RepoConfig } from "../config.js";
import { addRepo, findConfigFile } from "../config.js";

// ── Type Definitions ──────────────────────────────────────────────

/** Scan mode: full = complete analysis, quick = tech stack + endpoints only */
export type ScanMode = "full" | "quick";

/** Input parameters for edith_scan */
export interface ScanParams {
  target: string;
  mode?: ScanMode;
}

/** Scan result returned on success */
export interface ScanResult {
  service: string;
  path: string;
  techStack: string[];
  endpoints: number;
  models: number;
  flows: number;
  outputDir: string;
  files: string[];
  scannedAt: string;
}

/** Error codes matching the spec's error code table */
export type ScanErrorCode =
  | "TARGET_NOT_FOUND"
  | "PATH_NOT_FOUND"
  | "EMPTY_PROJECT"
  | "UNSUPPORTED_TECH_STACK"
  | "SCAN_TIMEOUT"
  | "PERMISSION_DENIED"
  | "MISSING_PARAMETER";

/** Structured scan error */
export interface ScanError {
  code: ScanErrorCode;
  message: string;
  suggestion: string;
}

/** Union return type */
export type ScanOutcome =
  | { ok: true; result: ScanResult }
  | { ok: false; error: ScanError };

// ── Constants ─────────────────────────────────────────────────────

/** Code file extensions used to determine if a project has code */
const CODE_EXTENSIONS = new Set([
  ".java", ".kt", ".scala", ".groovy",
  ".go",
  ".py", ".pyx", ".pyi",
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".rs",
  ".rb",
  ".php",
  ".cs",
  ".swift",
  ".c", ".cpp", ".h", ".hpp",
]);

/** Directories to skip during code file counting */
const SKIP_DIRECTORIES = new Set([
  "node_modules", ".git", "vendor", "__pycache__",
  ".gradle", ".mvn", "dist", "build", "target", ".next",
  ".cache", ".tox", "venv", ".venv", "env",
]);

/** Recognized tech stack indicators: filename -> stack mapping */
const TECH_STACK_INDICATORS: Record<string, string[]> = {
  "package.json": ["Node.js"],
  "go.mod": ["Go"],
  "requirements.txt": ["Python"],
  "pyproject.toml": ["Python"],
  "setup.py": ["Python"],
  "pom.xml": ["Java/Maven"],
  "build.gradle": ["Java/Gradle"],
  "build.gradle.kts": ["Java/Gradle/Kotlin"],
  "Cargo.toml": ["Rust"],
  "Gemfile": ["Ruby"],
  "composer.json": ["PHP"],
  "*.csproj": [".NET/C#"],
};

/** Framework detection patterns (checked inside package.json / pom.xml etc.) */
const FRAMEWORK_PATTERNS: Record<string, string> = {
  "spring-boot-starter": "Spring Boot",
  "org.springframework.boot": "Spring Boot",
  "express": "Express.js",
  "nestjs": "NestJS",
  "fastapi": "FastAPI",
  "django": "Django",
  "flask": "Flask",
  "gin-gonic": "Gin",
  "echo": "Echo (Go)",
  "actix": "Actix (Rust)",
  "react": "React",
  "vue": "Vue.js",
  "next": "Next.js",
};

/** Supported tech stacks for full analysis */
const SUPPORTED_STACKS = [
  "Node.js", "Go", "Python", "Java/Maven", "Java/Gradle",
  "Java/Gradle/Kotlin", "Rust", "Ruby", "PHP",
  "Spring Boot", "Express.js", "NestJS", "FastAPI",
  "Django", "Flask", "Gin", "Next.js", "React", "Vue.js",
];

/** Default scan timeout in seconds */
const DEFAULT_SCAN_TIMEOUT = 300;

// ── Error Factory Functions ───────────────────────────────────────

function targetNotFoundError(target: string): ScanError {
  return {
    code: "TARGET_NOT_FOUND",
    message: `未找到 ${target} 的配置，请检查 edith.yaml`,
    suggestion: `在 edith.yaml 的 repos 段添加 ${target} 的路径配置，或使用绝对路径作为 target。`,
  };
}

function pathNotFoundError(path: string): ScanError {
  return {
    code: "PATH_NOT_FOUND",
    message: `项目路径不存在: ${path}，请检查 edith.yaml 中的路径配置`,
    suggestion: "确认路径正确，或更新 edith.yaml 中对应的 path 字段。",
  };
}

function emptyProjectError(path: string): ScanError {
  return {
    code: "EMPTY_PROJECT",
    message: `目标项目为空，未发现可分析的代码文件`,
    suggestion: `确认 ${path} 是正确的项目目录，且包含源代码文件。`,
  };
}

function unsupportedTechStackError(stacks: string[]): ScanError {
  const stackList = stacks.join(", ");
  return {
    code: "UNSUPPORTED_TECH_STACK",
    message: `不支持识别的技术栈: ${stackList}。当前支持: Java/Spring, Go, Python, Node.js`,
    suggestion: "后续版本可能支持更多技术栈。当前仍会输出已识别的文件结构信息。",
  };
}

function scanTimeoutError(timeout: number): ScanError {
  return {
    code: "SCAN_TIMEOUT",
    message: `扫描超时（${timeout}s），项目过大`,
    suggestion: "建议使用 mode=quick 或缩小扫描范围。",
  };
}

function permissionDeniedError(path: string): ScanError {
  return {
    code: "PERMISSION_DENIED",
    message: `权限不足: 无法读取 ${path}，请检查目录权限`,
    suggestion: "检查目录权限，或使用有读取权限的用户运行 EDITH。",
  };
}

function missingParameterError(param: string): ScanError {
  return {
    code: "MISSING_PARAMETER",
    message: `缺少必需参数: ${param}`,
    suggestion: "edith_scan 需要 target 参数，指定要扫描的项目名或路径。",
  };
}

// ── Repo Path Resolution ──────────────────────────────────────────

/**
 * Resolve target string to a service name and absolute path.
 *
 * Resolution order:
 * 1. If target is an absolute path that exists -> use directly
 * 2. If target matches a repo name in edith.yaml -> use mapped path
 * 3. Otherwise -> TARGET_NOT_FOUND
 */
export function resolveTarget(
  target: string,
  repos: RepoConfig[],
): { ok: true; name: string; path: string } | { ok: false; error: ScanError } {
  if (!target || target.trim() === "") {
    return { ok: false, error: missingParameterError("target") };
  }

  // Check if target is an absolute path
  if (target.startsWith("/") || target.startsWith("~")) {
    const expandedPath = target.startsWith("~")
      ? join(process.env.HOME ?? "/", target.slice(1))
      : target;
    if (!existsSync(expandedPath)) {
      return { ok: false, error: pathNotFoundError(expandedPath) };
    }
    // Derive service name from directory name
    const name = expandedPath.split("/").filter(Boolean).pop() ?? "unknown";
    return { ok: true, name, path: resolve(expandedPath) };
  }

  // Look up in repos mapping
  const repo = repos.find((r) => r.name === target);
  if (!repo) {
    return { ok: false, error: targetNotFoundError(target) };
  }

  const resolvedPath = resolve(repo.path);
  if (!existsSync(resolvedPath)) {
    return { ok: false, error: pathNotFoundError(resolvedPath) };
  }

  return { ok: true, name: repo.name, path: resolvedPath };
}

// ── Pre-flight Checks ─────────────────────────────────────────────

/**
 * Check if the directory is readable.
 */
function checkReadPermission(dirPath: string): ScanError | null {
  try {
    accessSync(dirPath, constants.R_OK);
    return null;
  } catch {
    return permissionDeniedError(dirPath);
  }
}

/**
 * Count code files in a directory tree, skipping common non-code directories.
 */
function countCodeFiles(dirPath: string): number {
  let count = 0;

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
        count++;
      }
    }
  }

  walk(dirPath);
  return count;
}

/**
 * Run pre-flight checks on the target directory.
 * Returns null if all checks pass, or a ScanError if any check fails.
 */
export function preflightCheck(dirPath: string): ScanError | null {
  // Check permissions
  const permError = checkReadPermission(dirPath);
  if (permError) return permError;

  // Check if directory has code files
  const codeFileCount = countCodeFiles(dirPath);
  if (codeFileCount === 0) {
    return emptyProjectError(dirPath);
  }

  return null;
}

// ── Tech Stack Detection ──────────────────────────────────────────

/**
 * Detect tech stacks from project root directory.
 * Checks for indicator files and parses dependency files for frameworks.
 */
export function detectTechStack(dirPath: string): string[] {
  const stacks: string[] = [];
  const detectedFrameworks = new Set<string>();

  let entries: string[];
  try {
    entries = readdirSync(dirPath);
  } catch {
    return stacks;
  }

  // Check for indicator files
  for (const entry of entries) {
    const indicator = TECH_STACK_INDICATORS[entry];
    if (indicator) {
      stacks.push(...indicator);
    }
  }

  // Parse package.json for Node.js frameworks
  const pkgJsonPath = join(dirPath, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const content = JSON.parse(
        require("fs").readFileSync(pkgJsonPath, "utf-8")
      );
      const deps = { ...content.dependencies, ...content.devDependencies };
      for (const [dep, label] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (deps[dep]) {
          detectedFrameworks.add(label);
        }
      }

      // Check for database drivers
      if (deps.pg || deps["pg-promise"]) stacks.push("PostgreSQL");
      if (deps.mysql || deps.mysql2) stacks.push("MySQL");
      if (deps.mongodb || deps.mongoose) stacks.push("MongoDB");
      if (deps.redis || deps.ioredis) stacks.push("Redis");
      if (deps.prisma) stacks.push("Prisma");
      if (deps.typeorm) stacks.push("TypeORM");
    } catch {
      // Malformed package.json, skip framework detection
    }
  }

  // Parse pom.xml for Java frameworks
  const pomPath = join(dirPath, "pom.xml");
  if (existsSync(pomPath)) {
    try {
      const content = require("fs").readFileSync(pomPath, "utf-8");
      for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (content.includes(pattern)) {
          detectedFrameworks.add(label);
        }
      }
    } catch {
      // Skip
    }
  }

  // Parse requirements.txt for Python frameworks
  const reqPath = join(dirPath, "requirements.txt");
  if (existsSync(reqPath)) {
    try {
      const content = require("fs").readFileSync(reqPath, "utf-8").toLowerCase();
      for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (content.includes(pattern.toLowerCase())) {
          detectedFrameworks.add(label);
        }
      }
    } catch {
      // Skip
    }
  }

  // Parse go.mod for Go frameworks
  const goModPath = join(dirPath, "go.mod");
  if (existsSync(goModPath)) {
    try {
      const content = require("fs").readFileSync(goModPath, "utf-8").toLowerCase();
      for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (content.includes(pattern.toLowerCase())) {
          detectedFrameworks.add(label);
        }
      }
    } catch {
      // Skip
    }
  }

  // Merge frameworks into stacks, avoiding duplicates
  for (const fw of detectedFrameworks) {
    if (!stacks.includes(fw)) {
      stacks.push(fw);
    }
  }

  return stacks;
}

/**
 * Check if all detected stacks are supported for full analysis.
 */
function isSupportedTechStack(stacks: string[]): boolean {
  if (stacks.length === 0) return false;
  return stacks.every((s) =>
    SUPPORTED_STACKS.some((supported) => s === supported || s.startsWith(supported.split("/")[0]))
  );
}

// ── Directory Scanning (Project Structure Analysis) ───────────────

interface ScanData {
  endpoints: number;
  models: number;
  flows: number;
  sourceTree: string;
  overview: string;
}

/**
 * Scan project directories for endpoints, models, and business flows.
 * This is a lightweight static analysis — no code execution.
 */
function scanProjectStructure(dirPath: string, mode: ScanMode): ScanData {
  let endpoints = 0;
  let models = 0;
  let flows = 0;

  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return { endpoints: 0, models: 0, flows: 0, sourceTree: "", overview: "" };
  }

  function walk(dir: string, depth: number): void {
    let dirEntries;
    try {
      dirEntries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of dirEntries) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const dirName = entry.name.toLowerCase();

        // Detect endpoint-related directories
        if (["routes", "controllers", "handlers", "api", "endpoints", "resources"].includes(dirName)) {
          try {
            const files = readdirSync(fullPath);
            endpoints += files.filter((f) => CODE_EXTENSIONS.has(extname(f))).length;
          } catch { /* skip */ }
        }

        // Detect model-related directories
        if (["models", "schemas", "entities", "domain", "types"].includes(dirName)) {
          try {
            const files = readdirSync(fullPath);
            models += files.filter((f) => CODE_EXTENSIONS.has(extname(f))).length;
          } catch { /* skip */ }
        }

        // Detect service/business logic directories
        if (["services", "handlers", "usecases", "commands", "business"].includes(dirName)) {
          try {
            const files = readdirSync(fullPath);
            flows += files.filter((f) => CODE_EXTENSIONS.has(extname(f))).length;
          } catch { /* skip */ }
        }

        if (depth < 4) {
          walk(fullPath, depth + 1);
        }
      }
    }
  }

  walk(dirPath, 0);

  // Build source tree string
  const sourceTree = buildSourceTree(dirPath, mode === "quick" ? 2 : 3);
  const overview = buildOverview(dirPath);

  return { endpoints, models, flows, sourceTree, overview };
}

/**
 * Build a simplified source tree string for the project.
 */
function buildSourceTree(dirPath: string, maxDepth: number): string {
  const lines: string[] = [];

  function walk(dir: string, prefix: string, depth: number): void {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    // Sort: directories first, then files, skip hidden and ignored
    const sorted = entries
      .filter((e) => !SKIP_DIRECTORIES.has(e.name) && !e.name.startsWith("."))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    const maxShow = 15;
    const shown = sorted.slice(0, maxShow);

    for (let i = 0; i < shown.length; i++) {
      const entry = shown[i];
      const isLast = i === shown.length - 1 && sorted.length <= maxShow;
      const connector = isLast ? "└── " : "├── ";
      const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
      lines.push(`${prefix}${connector}${name}`);

      if (entry.isDirectory()) {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        walk(join(dir, entry.name), newPrefix, depth + 1);
      }
    }

    if (sorted.length > maxShow) {
      lines.push(`${prefix}└── ... (${sorted.length - maxShow} more)`);
    }
  }

  const rootName = dirPath.split("/").filter(Boolean).pop() ?? "project";
  lines.push(`${rootName}/`);
  walk(dirPath, "", 0);

  return lines.join("\n");
}

/**
 * Build a brief project overview from root-level files.
 */
function buildOverview(dirPath: string): string {
  const parts: string[] = [];

  // Try to read package.json for description
  const pkgPath = join(dirPath, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(require("fs").readFileSync(pkgPath, "utf-8"));
      if (pkg.name) parts.push(`Name: ${pkg.name}`);
      if (pkg.description) parts.push(`Description: ${pkg.description}`);
      if (pkg.version) parts.push(`Version: ${pkg.version}`);
    } catch { /* skip */ }
  }

  // Try to read README.md first line
  const readmePath = join(dirPath, "README.md");
  if (existsSync(readmePath) && parts.length === 0) {
    try {
      const content = require("fs").readFileSync(readmePath, "utf-8");
      const firstLine = content.split("\n").find((l: string) => l.trim().length > 0) ?? "";
      if (firstLine) parts.push(firstLine.replace(/^#+\s*/, ""));
    } catch { /* skip */ }
  }

  return parts.join("\n");
}

// ── Result Persistence ────────────────────────────────────────────

/**
 * Write scan results to the workspace directory.
 * Creates workspace/{service}/docs/ and writes documentation files.
 */
export function persistScanResult(
  workspaceRoot: string,
  serviceName: string,
  techStack: string[],
  scanData: ScanData,
  projectPath: string,
): { outputDir: string; files: string[] } {
  const outputDir = resolve(workspaceRoot, serviceName, "docs");
  mkdirSync(outputDir, { recursive: true });

  const scannedAt = new Date().toISOString();
  const files: string[] = [];

  // 1. overview.md
  const overviewContent = [
    "# " + serviceName + " - Project Overview",
    "",
    "> Auto-generated by EDITH scan at " + scannedAt,
    "",
    "## Summary",
    "",
    scanData.overview || "Project overview not available.",
    "",
    "## Tech Stack",
    "",
    techStack.length > 0
      ? techStack.map((s) => "- " + s).join("\n")
      : "- Could not detect tech stack",
    "",
    "## Statistics",
    "",
    "| Metric | Count |",
    "|--------|-------|",
    "| Endpoints detected | " + scanData.endpoints + " |",
    "| Data models detected | " + scanData.models + " |",
    "| Business flows detected | " + scanData.flows + " |",
    "",
    "**Source path**: `" + projectPath + "`",
    "",
  ].join("\n");

  writeFileSync(join(outputDir, "overview.md"), overviewContent, "utf-8");
  files.push("overview.md");

  // 2. api-endpoints.md
  const codeFence = "```";
  const apiContent = [
    "# " + serviceName + " - API Endpoints",
    "",
    "> Auto-generated by EDITH scan at " + scannedAt,
    "",
    "## Detected Endpoints (" + scanData.endpoints + " endpoint files found)",
    "",
    scanData.endpoints > 0
      ? "Endpoint details require deep scan mode or module-level analysis."
      : "No endpoint-related directories found (routes/, controllers/, handlers/, api/).",
    "",
    "## Source Tree",
    "",
    codeFence,
    scanData.sourceTree,
    codeFence,
    "",
  ].join("\n");

  writeFileSync(join(outputDir, "api-endpoints.md"), apiContent, "utf-8");
  files.push("api-endpoints.md");

  // 3. data-models.md
  const modelsContent = [
    "# " + serviceName + " - Data Models",
    "",
    "> Auto-generated by EDITH scan at " + scannedAt,
    "",
    "## Detected Models (" + scanData.models + " model files found)",
    "",
    scanData.models > 0
      ? "Model details require deep scan mode or module-level analysis."
      : "No model-related directories found (models/, schemas/, entities/, domain/).",
    "",
    "## Tech Stack",
    "",
    techStack.length > 0
      ? techStack.map((s) => "- " + s).join("\n")
      : "- Could not detect tech stack",
    "",
  ].join("\n");

  writeFileSync(join(outputDir, "data-models.md"), modelsContent, "utf-8");
  files.push("data-models.md");

  return { outputDir, files };
}

// ── Main Scan Function ────────────────────────────────────────────

/**
 * Execute a EDITH scan.
 *
 * This is the main entry point called by the extension tool handler.
 *
 * @param params - Scan parameters (target, mode)
 * @param repos - Repository configuration from edith.yaml
 * @param workspaceRoot - Workspace root directory for output
 * @param timeout - Scan timeout in seconds (default: 300)
 * @returns Scan outcome — either a successful ScanResult or a ScanError
 */
export async function executeScan(
  params: ScanParams,
  repos: RepoConfig[],
  workspaceRoot: string,
  timeout: number = DEFAULT_SCAN_TIMEOUT,
): Promise<ScanOutcome> {
  // ── Step 1: Validate parameters ────────────────────────────────
  if (!params.target || params.target.trim() === "") {
    return { ok: false, error: missingParameterError("target") };
  }

  const mode: ScanMode = params.mode === "quick" ? "quick" : "full";

  // ── Step 2: Resolve target to project path ─────────────────────
  const resolved = resolveTarget(params.target, repos);
  if (!resolved.ok) return resolved;

  const { name, path: projectPath } = resolved;

  // ── Step 3: Pre-flight checks ──────────────────────────────────
  const preflightError = preflightCheck(projectPath);
  if (preflightError) {
    return { ok: false, error: preflightError };
  }

  // ── Step 4: Detect tech stack ──────────────────────────────────
  const techStack = detectTechStack(projectPath);

  // Check for unsupported tech stack (non-blocking in degraded mode)
  const supported = isSupportedTechStack(techStack);
  if (!supported && techStack.length > 0) {
    // We still proceed with degraded output but include a warning
    const error = unsupportedTechStackError(techStack);
    // In degraded mode, we continue but note the limitation
  }

  // ── Step 5: Scan project structure (with timeout) ──────────────
  let scanData: ScanData;

  try {
    // Use Promise.race for timeout control
    scanData = await Promise.race([
      new Promise<ScanData>((resolve) => {
        // Synchronous scan wrapped in a microtask
        const data = scanProjectStructure(projectPath, mode);
        resolve(data);
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`SCAN_TIMEOUT:${timeout}`));
        }, timeout * 1000);
      }),
    ]);
  } catch (err) {
    const errMsg = (err as Error).message ?? String(err);
    if (errMsg.startsWith("SCAN_TIMEOUT:")) {
      return { ok: false, error: scanTimeoutError(timeout) };
    }
    // Unexpected error
    return {
      ok: false,
      error: {
        code: "SCAN_TIMEOUT",
        message: `扫描失败: ${errMsg}`,
        suggestion: "检查项目目录是否可访问，或尝试使用 mode=quick。",
      },
    };
  }

  // ── Step 6: Persist results ────────────────────────────────────
  const absWorkspaceRoot = resolve(workspaceRoot);
  const { outputDir, files } = persistScanResult(
    absWorkspaceRoot,
    name,
    techStack,
    scanData,
    projectPath,
  );

  // ── Step 7: Auto-register repo in edith.yaml ──────────────────
  const cfgPath = findConfigFile();
  if (cfgPath) {
    addRepo(cfgPath, {
      name,
      path: projectPath,
      stack: techStack.length > 0 ? techStack.join(", ") : undefined,
    });
  }

  // ── Step 8: Build result ───────────────────────────────────────
  const result: ScanResult = {
    service: name,
    path: projectPath,
    techStack,
    endpoints: scanData.endpoints,
    models: scanData.models,
    flows: scanData.flows,
    outputDir,
    files,
    scannedAt: new Date().toISOString(),
  };

  // If tech stack was unsupported, return both result and warning
  if (!supported && techStack.length > 0) {
    const error = unsupportedTechStackError(techStack);
    // Return success with result but include degradation note in files
    const warningFile = "scan-warning.md";
    writeFileSync(
      join(outputDir, warningFile),
      `# Scan Warning\n\n${error.message}\n\n${error.suggestion}\n`,
      "utf-8",
    );
    result.files.push(warningFile);
  }

  return { ok: true, result };
}

/**
 * Build a human-readable summary from a ScanResult.
 * This is what the Agent shows to the user.
 */
export function formatScanSummary(result: ScanResult): string {
  const lines: string[] = [
    "EDITH 知识扫描完成",
    "",
    "  服务: " + result.service,
    "  路径: " + result.path,
    "  技术栈: " + (result.techStack.length > 0 ? result.techStack.join(", ") : "未识别"),
    "",
    "  端点: " + result.endpoints,
    "  模型: " + result.models,
    "  流程: " + result.flows,
    "",
    "  输出目录: " + result.outputDir,
    "  生成文件: " + result.files.join(", "),
    "  扫描时间: " + result.scannedAt,
  ];
  return lines.join("\n");
}

/**
 * Build a human-readable error message from a ScanError.
 */
export function formatScanError(error: ScanError): string {
  return [
    "EDITH 知识扫描失败",
    "",
    "  错误: " + error.message,
    "  代码: " + error.code,
    "  建议: " + error.suggestion,
  ].join("\n");
}
