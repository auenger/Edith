/**
 * EDITH Scan Tool — edith_scan implementation (v3)
 *
 * Deep code archaeology scanner with smart depth control.
 * Automatically selects scan depth based on project size and architecture:
 * - Small projects (<100 files): Exhaustive full read
 * - Medium projects (100-500): Deep key-directory scan
 * - Large projects (>500): Module-boundary-aware deep scan
 * - Monorepo/microservice: Per-module deep scan with merge
 *
 * Backward compatible with v1/v2 — all existing exports preserved.
 */

import {
  existsSync, readdirSync, mkdirSync, writeFileSync,
  accessSync, constants, readFileSync, statSync,
} from "node:fs";
import { resolve, join, extname, relative, basename } from "node:path";

import type { RepoConfig } from "../config.js";
import { addRepo, findConfigFile } from "../config.js";

// ── Type Definitions ──────────────────────────────────────────────

export type ScanMode = "full" | "quick";

/** Smart depth levels — auto-selected based on project size */
export type ScanDepth = "quick" | "deep" | "exhaustive";

/** Project size classification */
export type ProjectSize = "small" | "medium" | "large" | "xlarge";

/** Detected module boundary in multi-module projects */
export interface ModuleBoundary {
  name: string;
  path: string;
  fileCount: number;
  type: "package" | "service" | "app" | "layer";
}

export interface ScanParams {
  target: string;
  mode?: ScanMode;
  /** Manual depth override — skips auto-detection when set */
  depth?: ScanDepth;
}

/** 12 project types per SKILL.md */
export type ProjectType =
  | "web" | "mobile" | "backend" | "cli" | "library"
  | "desktop" | "game" | "data" | "extension" | "infra"
  | "embedded" | "custom";

/** 5 architecture patterns per SKILL.md */
export type ArchitecturePattern =
  | "monolith" | "monorepo" | "microservice" | "multi-part" | "event-driven";

/** Extracted API endpoint */
export interface ApiEndpoint {
  method: string;
  path: string;
  group: string;
  source: string;
  auth?: string;
  requestType?: string;
  responseType?: string;
  description?: string;
}

/** Extracted data entity field */
export interface EntityField {
  name: string;
  type: string;
  constraints: string;
  description: string;
}

/** Extracted data entity */
export interface DataEntity {
  name: string;
  source: string;
  orm: string;
  fields: EntityField[];
  relations: string[];
}

/** Discovered business flow */
export interface BusinessFlow {
  name: string;
  source: string;
  methods: string[];
  externalCalls: string[];
  summary: string;
}

/** Scan state for incremental scanning */
export interface ScanState {
  service: string;
  lastScan: string;
  fileHashes: Record<string, string>;
  completedPhases: string[];
}

/** v2 Scan result — extends v1 with deep analysis data */
export interface ScanResult {
  service: string;
  path: string;
  techStack: string[];
  projectType: ProjectType;
  architecture: ArchitecturePattern;
  /** Smart depth level used for this scan */
  depth: ScanDepth;
  /** Detected project size */
  projectSize: ProjectSize;
  /** Module boundaries detected (empty for single-module projects) */
  moduleBoundaries: ModuleBoundary[];
  endpoints: number;
  models: number;
  flows: number;
  apiContracts: ApiEndpoint[];
  dataEntities: DataEntity[];
  businessFlows: BusinessFlow[];
  outputDir: string;
  files: string[];
  scannedAt: string;
}

export type ScanErrorCode =
  | "TARGET_NOT_FOUND"
  | "PATH_NOT_FOUND"
  | "EMPTY_PROJECT"
  | "UNSUPPORTED_TECH_STACK"
  | "SCAN_TIMEOUT"
  | "PERMISSION_DENIED"
  | "MISSING_PARAMETER";

export interface ScanError {
  code: ScanErrorCode;
  message: string;
  suggestion: string;
}

export type ScanOutcome =
  | { ok: true; result: ScanResult }
  | { ok: false; error: ScanError };

// ── Constants ─────────────────────────────────────────────────────

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

const SKIP_DIRECTORIES = new Set([
  "node_modules", ".git", "vendor", "__pycache__",
  ".gradle", ".mvn", "dist", "build", "target", ".next",
  ".cache", ".tox", "venv", ".venv", "env",
]);

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

const SUPPORTED_STACKS = [
  "Node.js", "Go", "Python", "Java/Maven", "Java/Gradle",
  "Java/Gradle/Kotlin", "Rust", "Ruby", "PHP",
  "Spring Boot", "Express.js", "NestJS", "FastAPI",
  "Django", "Flask", "Gin", "Next.js", "React", "Vue.js",
];

const DEFAULT_SCAN_TIMEOUT = 300;

const ENDPOINT_DIRS = new Set([
  "routes", "controllers", "handlers", "api", "endpoints", "resources",
]);

const MODEL_DIRS = new Set([
  "models", "schemas", "entities", "domain", "types",
]);

const SERVICE_DIRS = new Set([
  "services", "handlers", "usecases", "commands", "business",
]);

// ── Smart Depth Constants ──────────────────────────────────────────

/** File count thresholds for project size classification */
const SIZE_THRESHOLDS = {
  small: 100,
  medium: 500,
  large: 2000,
} as const;

/** Monorepo package directories */
const MONOREPO_DIRS = new Set(["packages", "apps", "libs", "modules"]);

/** Microservice directories */
const SERVICE_ROOT_DIRS = new Set(["services", "cmd", "internal"]);

/** Directory purpose annotations for source-tree.md */
const DIR_ANNOTATIONS: Record<string, string> = {
  src: "源码根目录",
  lib: "库代码",
  app: "应用入口",
  cmd: "命令入口（Go）",
  internal: "内部包（Go）",
  pkg: "公共包（Go）",
  api: "API 定义",
  routes: "路由定义",
  controllers: "控制器层",
  handlers: "请求处理",
  middleware: "中间件",
  services: "业务服务层",
  models: "数据模型",
  entities: "实体定义",
  schemas: "Schema 定义",
  domain: "领域模型",
  config: "配置",
  utils: "工具函数",
  helpers: "辅助函数",
  test: "测试",
  tests: "测试",
  spec: "测试规格",
  __tests__: "测试",
  migrations: "数据库迁移",
  docs: "文档",
  public: "静态资源",
  static: "静态资源",
  assets: "资源文件",
  templates: "模板",
  views: "视图",
  components: "UI 组件",
  pages: "页面",
};

// ── Helpers ───────────────────────────────────────────────────────

function readFileText(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Collect all code files recursively, returning relative paths */
function collectCodeFiles(dirPath: string, basePath: string): string[] {
  const results: string[] = [];

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
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
        results.push(relative(basePath, full));
      }
    }
  }

  walk(dirPath);
  return results;
}

/** Simple hash of file content for incremental scanning */
function simpleHash(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) - h + content.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

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

export function resolveTarget(
  target: string,
  repos: RepoConfig[],
): { ok: true; name: string; path: string } | { ok: false; error: ScanError } {
  if (!target || target.trim() === "") {
    return { ok: false, error: missingParameterError("target") };
  }

  if (target.startsWith("/") || target.startsWith("~")) {
    const expandedPath = target.startsWith("~")
      ? join(process.env.HOME ?? "/", target.slice(1))
      : target;
    if (!existsSync(expandedPath)) {
      return { ok: false, error: pathNotFoundError(expandedPath) };
    }
    const name = expandedPath.split("/").filter(Boolean).pop() ?? "unknown";
    return { ok: true, name, path: resolve(expandedPath) };
  }

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

function checkReadPermission(dirPath: string): ScanError | null {
  try {
    accessSync(dirPath, constants.R_OK);
    return null;
  } catch {
    return permissionDeniedError(dirPath);
  }
}

function countCodeFiles(dirPath: string): number {
  let count = 0;
  function walk(dir: string): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) { walk(fullPath); }
      else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) { count++; }
    }
  }
  walk(dirPath);
  return count;
}

export function preflightCheck(dirPath: string): ScanError | null {
  const permError = checkReadPermission(dirPath);
  if (permError) return permError;
  if (countCodeFiles(dirPath) === 0) return emptyProjectError(dirPath);
  return null;
}

// ── Smart Depth Detection ───────────────────────────────────────────

/**
 * Classify project size based on source file count.
 */
export function detectProjectSize(dirPath: string): ProjectSize {
  const count = countCodeFiles(dirPath);
  if (count < SIZE_THRESHOLDS.small) return "small";
  if (count < SIZE_THRESHOLDS.medium) return "medium";
  if (count < SIZE_THRESHOLDS.large) return "large";
  return "xlarge";
}

/**
 * Detect module boundaries in multi-module projects (monorepo, microservice).
 */
export function detectModuleBoundaries(dirPath: string): ModuleBoundary[] {
  const boundaries: ModuleBoundary[] = [];
  const entries = readdirEntries(dirPath);

  // Monorepo: packages/, apps/, libs/, modules/
  for (const dirName of MONOREPO_DIRS) {
    if (!entries.has(dirName)) continue;
    const subPath = join(dirPath, dirName);
    const subs = readdirEntries(subPath);
    for (const sub of subs) {
      const fullSub = join(subPath, sub);
      if (!isDirectory(fullSub)) continue;
      boundaries.push({
        name: sub,
        path: fullSub,
        fileCount: countCodeFiles(fullSub),
        type: dirName === "apps" ? "app" : dirName === "services" ? "service" : "package",
      });
    }
  }

  // Go: cmd/ subdirectories as separate commands/services
  if (entries.has("cmd")) {
    const cmdPath = join(dirPath, "cmd");
    const cmds = readdirEntries(cmdPath);
    for (const cmd of cmds) {
      const fullCmd = join(cmdPath, cmd);
      if (!isDirectory(fullCmd)) continue;
      boundaries.push({
        name: cmd,
        path: fullCmd,
        fileCount: countCodeFiles(fullCmd),
        type: "service",
      });
    }
  }

  // Multi-part: client/ + server/ or frontend/ + backend/
  const clientDirs = ["client", "frontend", "web"];
  const serverDirs = ["server", "backend", "api"];
  for (const cd of clientDirs) {
    if (!entries.has(cd)) continue;
    boundaries.push({
      name: cd,
      path: join(dirPath, cd),
      fileCount: countCodeFiles(join(dirPath, cd)),
      type: "layer",
    });
  }
  for (const sd of serverDirs) {
    if (!entries.has(sd)) continue;
    boundaries.push({
      name: sd,
      path: join(dirPath, sd),
      fileCount: countCodeFiles(join(dirPath, sd)),
      type: "layer",
    });
  }

  return boundaries.filter((b) => b.fileCount > 0);
}

/**
 * Resolve the optimal scan depth based on project size and architecture.
 * Manual depth override takes precedence when provided.
 */
export function resolveScanDepth(
  size: ProjectSize,
  architecture: ArchitecturePattern,
  override?: ScanDepth,
): ScanDepth {
  if (override) return override;

  // Architecture-aware mapping
  if (architecture === "monorepo" || architecture === "microservice") {
    return "deep";
  }

  // Size-based mapping
  switch (size) {
    case "small": return "exhaustive";
    case "medium": return "deep";
    case "large":
    case "xlarge": return "deep";
  }
}

function readdirEntries(dirPath: string): Set<string> {
  const entries = new Set<string>();
  try {
    readdirSync(dirPath, { withFileTypes: true }).forEach((e) => {
      if (!e.name.startsWith(".")) entries.add(e.name);
    });
  } catch { /* skip */ }
  return entries;
}

function isDirectory(path: string): boolean {
  try { return statSync(path).isDirectory(); }
  catch { return false; }
}

// ── Project Classification ────────────────────────────────────────

/**
 * Classify project into one of 12 types based on indicator files and structure.
 */
export function classifyProject(dirPath: string, techStack: string[]): ProjectType {
  const entries = new Set<string>();
  try { readdirSync(dirPath).forEach((e) => entries.add(e)); } catch { /* skip */ }

  const hasPackageJson = entries.has("package.json");
  const hasGoMod = entries.has("go.mod");
  const hasCargoToml = entries.has("Cargo.toml");

  const content = readFileText(join(dirPath, "package.json"));

  // Check for web frontend
  if (hasPackageJson && content) {
    try {
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["react-dom"] || deps["next"] || deps["nuxt"] || deps["vite"]) return "web";
      if (deps["react-native"] || deps["expo"]) return "mobile";
      if (deps["electron"]) return "desktop";
    } catch { /* skip */ }
  }

  // Check for mobile indicators
  if (entries.has("android") || entries.has("ios") || entries.has("flutter")) return "mobile";
  if (entries.has("AndroidManifest.xml") || entries.has("Info.plist")) return "mobile";

  // Check for data/ML
  if (entries.has("notebooks") || entries.has("jupyter") || entries.has(".ipynb")) return "data";
  if (techStack.some((s) => s === "Python") && entries.has("notebooks")) return "data";

  // Check for CLI
  if (hasPackageJson && content) {
    try {
      const pkg = JSON.parse(content);
      if (pkg.bin && Object.keys(pkg.bin).length > 0) return "cli";
    } catch { /* skip */ }
  }
  if (hasGoMod) {
    const goContent = readFileText(join(dirPath, "go.mod")) ?? "";
    if (goContent.includes("cobra") || goContent.includes("urfave")) return "cli";
  }

  // Check for extension
  if (entries.has("manifest.json") || entries.has("manifest.chrome.json")) return "extension";

  // Check for infra
  if (entries.has("Terrafile") || entries.has("main.tf") || entries.has("terraform")) return "infra";
  if (entries.has("Dockerfile") && !entries.has("package.json") && !entries.has("pom.xml") && !entries.has("go.mod")) return "infra";

  // Check for embedded
  if (entries.has("platformio.ini") || entries.has(".ino")) return "embedded";

  // Check for game
  if (entries.has("unity") || entries.has("unreal") || entries.has("godot")) return "game";

  // Check for library (no main entry)
  if (hasPackageJson && content) {
    try {
      const pkg = JSON.parse(content);
      if (pkg.main && !pkg.bin && !deps_hasReactEcosystem(pkg)) return "library";
    } catch { /* skip */ }
  }

  // Backend heuristics: has routes/controllers/resources or Spring/FastAPI/Django/Gin
  if (hasEndpointDir(dirPath)) return "backend";
  if (techStack.some((s) => ["Spring Boot", "FastAPI", "Django", "Flask", "Gin", "Express.js", "NestJS"].includes(s))) return "backend";

  return "custom";
}

function deps_hasReactEcosystem(pkg: Record<string, unknown>): boolean {
  const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) };
  return !!(deps["react"] || deps["vue"] || deps["svelte"]);
}

function hasEndpointDir(dirPath: string): boolean {
  function check(dir: string, depth: number): boolean {
    if (depth > 2) return false;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return false; }
    for (const e of entries) {
      if (ENDPOINT_DIRS.has(e.name.toLowerCase()) && e.isDirectory()) return true;
    }
    for (const e of entries) {
      if (e.isDirectory() && !SKIP_DIRECTORIES.has(e.name) && !e.name.startsWith(".")) {
        if (check(join(dir, e.name), depth + 1)) return true;
      }
    }
    return false;
  }
  return check(dirPath, 0);
}

/**
 * Detect architecture pattern from project structure.
 */
export function detectArchitecture(dirPath: string, techStack: string[]): ArchitecturePattern {
  const entries = new Set<string>();
  try { readdirSync(dirPath).forEach((e) => entries.add(e)); } catch { /* skip */ }

  // Monorepo: workspaces / lerna / nx / turborepo
  const pkgContent = readFileText(join(dirPath, "package.json"));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.workspaces || entries.has("lerna.json") || entries.has("nx.json") || entries.has("turbo.json")) return "monorepo";
    } catch { /* skip */ }
  }

  // Go multi-module
  if (entries.has("go.work")) return "monorepo";

  // Multi-part: client+server, frontend+backend at root
  const hasClient = entries.has("client") || entries.has("frontend") || entries.has("web");
  const hasServer = entries.has("server") || entries.has("backend") || entries.has("api");
  if (hasClient && hasServer) return "multi-part";

  // Microservice: docker-compose with multiple services
  const dcContent = readFileText(join(dirPath, "docker-compose.yml")) ?? readFileText(join(dirPath, "docker-compose.yaml")) ?? "";
  if (dcContent) {
    const serviceCount = (dcContent.match(/^\s{2}\w+:/gm) || []).length;
    if (serviceCount >= 3) return "microservice";
  }

  // Event-driven: message queue indicators
  if (hasEventDrivenIndicators(dirPath)) return "event-driven";

  return "monolith";
}

function hasEventDrivenIndicators(dirPath: string): boolean {
  const pkgContent = readFileText(join(dirPath, "package.json"));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
      if (deps["amqplib"] || deps["kafkajs"] || deps["kafka-node"] || deps["bull"] || deps["bullmq"] || deps["nats"]) return true;
    } catch { /* skip */ }
  }
  const reqContent = readFileText(join(dirPath, "requirements.txt")) ?? "";
  if (reqContent) {
    const lower = reqContent.toLowerCase();
    if (lower.includes("celery") || lower.includes("kafka") || lower.includes("rabbitmq") || lower.includes("pika")) return true;
  }
  return false;
}

// ── Tech Stack Detection ──────────────────────────────────────────

export function detectTechStack(dirPath: string): string[] {
  const stacks: string[] = [];
  const detectedFrameworks = new Set<string>();

  let entries: string[];
  try { entries = readdirSync(dirPath); } catch { return stacks; }

  for (const entry of entries) {
    const indicator = TECH_STACK_INDICATORS[entry];
    if (indicator) stacks.push(...indicator);
  }

  // Parse package.json
  const pkgJsonPath = join(dirPath, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const content = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      const deps = { ...content.dependencies, ...content.devDependencies };
      for (const [dep, label] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (deps[dep]) detectedFrameworks.add(label);
      }
      if (deps.pg || deps["pg-promise"]) stacks.push("PostgreSQL");
      if (deps.mysql || deps.mysql2) stacks.push("MySQL");
      if (deps.mongodb || deps.mongoose) stacks.push("MongoDB");
      if (deps.redis || deps.ioredis) stacks.push("Redis");
      if (deps.prisma) stacks.push("Prisma");
      if (deps.typeorm) stacks.push("TypeORM");
    } catch { /* skip */ }
  }

  // Parse pom.xml
  const pomPath = join(dirPath, "pom.xml");
  if (existsSync(pomPath)) {
    const content = readFileText(pomPath) ?? "";
    for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (content.includes(pattern)) detectedFrameworks.add(label);
    }
  }

  // Parse requirements.txt
  const reqPath = join(dirPath, "requirements.txt");
  if (existsSync(reqPath)) {
    const content = (readFileText(reqPath) ?? "").toLowerCase();
    for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (content.includes(pattern.toLowerCase())) detectedFrameworks.add(label);
    }
  }

  // Parse go.mod
  const goModPath = join(dirPath, "go.mod");
  if (existsSync(goModPath)) {
    const content = (readFileText(goModPath) ?? "").toLowerCase();
    for (const [pattern, label] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (content.includes(pattern.toLowerCase())) detectedFrameworks.add(label);
    }
  }

  for (const fw of detectedFrameworks) {
    if (!stacks.includes(fw)) stacks.push(fw);
  }

  return stacks;
}

function isSupportedTechStack(stacks: string[]): boolean {
  if (stacks.length === 0) return false;
  return stacks.every((s) =>
    SUPPORTED_STACKS.some((supported) => s === supported || s.startsWith(supported.split("/")[0]))
  );
}

// ── API Contract Extraction ───────────────────────────────────────

/**
 * Extract API endpoints from source files using regex-based parsing.
 * Supports: Spring Boot, Express, FastAPI, Gin.
 */
export function extractApiContracts(dirPath: string, techStack: string[]): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const codeFiles = collectCodeFiles(dirPath, dirPath);

  for (const relPath of codeFiles) {
    const fullPath = join(dirPath, relPath);
    const content = readFileText(fullPath);
    if (!content) continue;

    const group = inferGroupFromPath(relPath);

    // Spring Boot annotations
    if (content.includes("@RequestMapping") || content.includes("@GetMapping") || content.includes("@PostMapping")) {
      endpoints.push(...parseSpringBoot(content, group, relPath));
    }

    // Express routes
    if (content.includes("router.") || content.includes("Router()") || content.includes("app.get") || content.includes("app.post")) {
      endpoints.push(...parseExpress(content, group, relPath));
    }

    // FastAPI decorators
    if (content.includes("@router.") || content.includes("@app.get") || content.includes("@app.post")) {
      endpoints.push(...parseFastAPI(content, group, relPath));
    }

    // Gin routes
    if (content.includes(".GET(") || content.includes(".POST(") || content.includes(".PUT(") || content.includes(".DELETE(")) {
      endpoints.push(...parseGin(content, group, relPath));
    }
  }

  return endpoints;
}

function inferGroupFromPath(relPath: string): string {
  const parts = relPath.split(/[/\\]/);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (ENDPOINT_DIRS.has(p)) {
      const next = parts[i + 1];
      if (next) return next.replace(/\.\w+$/, "").replace(/[-_](controller|route|handler|resource)$/i, "");
    }
  }
  return basename(relPath).replace(/\.\w+$/, "").replace(/[-_](controller|route|handler|resource)$/i, "");
}

function parseSpringBoot(content: string, group: string, source: string): ApiEndpoint[] {
  const eps: ApiEndpoint[] = [];
  const classMapping = extractFirstMatch(content, /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
  const basePath = classMapping ?? "";

  const methodPatterns = [
    { regex: /@GetMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, method: "GET" },
    { regex: /@PostMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, method: "POST" },
    { regex: /@PutMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, method: "PUT" },
    { regex: /@DeleteMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, method: "DELETE" },
    { regex: /@PatchMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, method: "PATCH" },
    { regex: /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["'][^)]*method\s*=\s*RequestMethod\.(\w+)/g, method: "REQUEST" },
  ];

  for (const { regex, method: httpMethod } of methodPatterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const path = match[1];
      const auth = content.includes("@PreAuthorize") || content.includes("@Secured") ? "required" : undefined;
      eps.push({
        method: httpMethod === "REQUEST" ? (match[2] ?? "GET") : httpMethod,
        path: basePath + path,
        group,
        auth,
        source,
      });
    }
  }

  return eps;
}

function parseExpress(content: string, group: string, source: string): ApiEndpoint[] {
  const eps: ApiEndpoint[] = [];
  const routeRegex = /(?:router|app)\s*\.\s*(get|post|put|delete|patch|all)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    eps.push({
      method: match[1].toUpperCase(),
      path: match[2],
      group,
      source,
    });
  }
  return eps;
}

function parseFastAPI(content: string, group: string, source: string): ApiEndpoint[] {
  const eps: ApiEndpoint[] = [];
  const routeRegex = /@(?:router|app)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const auth = content.includes("Depends(") ? "depends" : undefined;
    eps.push({
      method: match[1].toUpperCase(),
      path: match[2],
      group,
      auth,
      source,
    });
  }
  return eps;
}

function parseGin(content: string, group: string, source: string): ApiEndpoint[] {
  const eps: ApiEndpoint[] = [];
  const routeRegex = /\.(GET|POST|PUT|DELETE|PATCH)\s*\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    eps.push({
      method: match[1],
      path: match[2],
      group,
      source,
    });
  }
  return eps;
}

function extractFirstMatch(content: string, regex: RegExp): string | null {
  const match = regex.exec(content);
  return match ? match[1] : null;
}

// ── Data Model Analysis ───────────────────────────────────────────

/**
 * Extract data entities from source files.
 * Supports: JPA/Hibernate, TypeORM, Prisma, SQLAlchemy.
 */
export function analyzeDataModels(dirPath: string, techStack: string[]): DataEntity[] {
  const entities: DataEntity[] = [];
  const codeFiles = collectCodeFiles(dirPath, dirPath);

  for (const relPath of codeFiles) {
    const fullPath = join(dirPath, relPath);
    const content = readFileText(fullPath);
    if (!content) continue;

    // Prisma schema
    if (relPath.endsWith(".prisma")) {
      entities.push(...parsePrismaSchema(content, relPath));
    }

    // JPA/Hibernate entity
    if (content.includes("@Entity") && (relPath.endsWith(".java") || relPath.endsWith(".kt"))) {
      const entity = parseJpaEntity(content, relPath);
      if (entity) entities.push(entity);
    }

    // TypeORM entity
    if (content.includes("@Entity") && (relPath.endsWith(".ts") || relPath.endsWith(".js"))) {
      const entity = parseTypeORMEntity(content, relPath);
      if (entity) entities.push(entity);
    }

    // SQLAlchemy model
    if ((content.includes("class ") && content.includes("Column(")) && relPath.endsWith(".py")) {
      if (content.includes("Base =") || content.includes("__tablename__")) {
        const entity = parseSQLAlchemyModel(content, relPath);
        if (entity) entities.push(entity);
      }
    }
  }

  return entities;
}

function parsePrismaSchema(content: string, source: string): DataEntity[] {
  const entities: DataEntity[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields: EntityField[] = [];

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        const fieldType = parts[1];
        const constraints = parts.slice(2).join(" ");
        fields.push({ name: fieldName, type: fieldType, constraints, description: "" });
      }
    }

    const relations = [...body.matchAll(/(\w+)\s+(\w+)\s*\[.*?@relation.*?\]/g)].map(
      (m) => `${m[1]} ${m[2]}`
    );

    entities.push({ name, source, orm: "Prisma", fields, relations });
  }
  return entities;
}

function parseJpaEntity(content: string, source: string): DataEntity | null {
  const classMatch = /(?:public\s+)?class\s+(\w+)/.exec(content);
  if (!classMatch) return null;
  const name = classMatch[1];

  const fields: EntityField[] = [];
  const fieldRegex = /@(?:Column|Id|ManyToOne|OneToMany|ManyToMany|OneToOne)(?:\s*\([^)]*\))?\s*(?:\n\s*)*(?:private|protected|public)\s+(\w+(?:<[^>]+>)?)\s+(\w+)/g;
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(content)) !== null) {
    const type = fieldMatch[1];
    const fieldName = fieldMatch[2];
    const annotationLine = content.substring(Math.max(0, fieldMatch.index - 100), fieldMatch.index);
    const constraints: string[] = [];
    if (annotationLine.includes("@Id")) constraints.push("PK");
    if (annotationLine.includes("@GeneratedValue")) constraints.push("auto");
    if (annotationLine.includes("@NotNull") || annotationLine.includes("nullable = false")) constraints.push("NOT NULL");
    if (annotationLine.includes("@ManyToOne")) constraints.push("FK → ManyToOne");
    if (annotationLine.includes("@OneToMany")) constraints.push("← OneToMany");
    if (annotationLine.includes("@ManyToMany")) constraints.push("↔ ManyToMany");
    fields.push({ name: fieldName, type, constraints: constraints.join(", "), description: "" });
  }

  const relations = fields
    .filter((f) => f.constraints.includes("FK") || f.constraints.includes("↔") || f.constraints.includes("←"))
    .map((f) => `${f.name}: ${f.constraints}`);

  return { name, source, orm: "JPA/Hibernate", fields, relations };
}

function parseTypeORMEntity(content: string, source: string): DataEntity | null {
  const classMatch = /(?:export\s+)?class\s+(\w+)/.exec(content);
  if (!classMatch) return null;
  const name = classMatch[1];

  const fields: EntityField[] = [];
  // @Column() name: type
  const fieldRegex = /@(?:(?:PrimaryGenerated|Primary)?Column|ManyToOne|OneToMany|ManyToMany|OneToOne)(?:\([^)]*\))?\s*(?:\n\s*)*(?:public\s+)?(?:readonly\s+)?(\w+)(?:\??):\s*(\w+(?:<[^>]+>)?)/g;
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(content)) !== null) {
    const fieldName = fieldMatch[1];
    const type = fieldMatch[2];
    const annotationLine = content.substring(Math.max(0, fieldMatch.index - 80), fieldMatch.index);
    const constraints: string[] = [];
    if (annotationLine.includes("PrimaryGeneratedColumn") || annotationLine.includes("PrimaryColumn")) constraints.push("PK");
    if (annotationLine.includes("{ nullable: false }") || annotationLine.includes("ManyToOne")) constraints.push("NOT NULL");
    if (annotationLine.includes("ManyToOne")) constraints.push("FK → ManyToOne");
    if (annotationLine.includes("OneToMany")) constraints.push("← OneToMany");
    if (annotationLine.includes("ManyToMany")) constraints.push("↔ ManyToMany");
    fields.push({ name: fieldName, type, constraints: constraints.join(", "), description: "" });
  }

  const relations = fields
    .filter((f) => f.constraints.includes("FK") || f.constraints.includes("↔") || f.constraints.includes("←"))
    .map((f) => `${f.name}: ${f.constraints}`);

  return { name, source, orm: "TypeORM", fields, relations };
}

function parseSQLAlchemyModel(content: string, source: string): DataEntity | null {
  const classMatch = /class\s+(\w+)\s*\(/.exec(content);
  if (!classMatch) return null;
  const name = classMatch[1];

  const tabMatch = /__tablename__\s*=\s*["'](\w+)["']/.exec(content);
  if (!tabMatch) return null;

  const fields: EntityField[] = [];
  const colRegex = /(\w+)\s*=\s*Column\(([^)]+)\)/g;
  let colMatch;
  while ((colMatch = colRegex.exec(content)) !== null) {
    const fieldName = colMatch[1];
    const colDef = colMatch[2];
    const typeMatch = colDef.match(/^(\w+)/);
    const type = typeMatch ? typeMatch[1] : "unknown";
    const constraints: string[] = [];
    if (colDef.includes("primary_key=True") || colDef.includes("PrimaryKey")) constraints.push("PK");
    if (colDef.includes("nullable=False")) constraints.push("NOT NULL");
    if (colDef.includes("unique=True")) constraints.push("UNIQUE");
    if (colDef.includes("ForeignKey(")) constraints.push("FK");
    fields.push({ name: fieldName, type, constraints: constraints.join(", "), description: "" });
  }

  const relations = [...content.matchAll(/(\w+)\s*=\s*(?:relationship|backref)\s*\(/g)].map(
    (m) => m[1]
  );

  return { name, source, orm: "SQLAlchemy", fields, relations };
}

// ── Business Logic Discovery ──────────────────────────────────────

/**
 * Discover business logic from service layer files.
 */
export function discoverBusinessLogic(dirPath: string): BusinessFlow[] {
  const flows: BusinessFlow[] = [];
  const codeFiles = collectCodeFiles(dirPath, dirPath);

  for (const relPath of codeFiles) {
    if (!isInServiceDir(relPath)) continue;

    const fullPath = join(dirPath, relPath);
    const content = readFileText(fullPath);
    if (!content) continue;

    const methods = extractServiceMethods(content);
    if (methods.length === 0) continue;

    const externalCalls = extractExternalCalls(content);

    const flowName = basename(relPath).replace(/\.\w+$/, "");
    const summary = inferFlowSummary(methods, externalCalls);

    flows.push({
      name: flowName,
      source: relPath,
      methods,
      externalCalls,
      summary,
    });
  }

  return flows;
}

function isInServiceDir(relPath: string): boolean {
  const parts = relPath.split(/[/\\]/).map((p) => p.toLowerCase());
  return parts.some((p) => SERVICE_DIRS.has(p));
}

function extractServiceMethods(content: string): string[] {
  const methods: string[] = [];

  // Java/Kotlin methods
  const javaRegex = /(?:public|private|protected)\s+\w+(?:<[^>]+>)?\s+(\w+)\s*\(/g;
  let match;
  while ((match = javaRegex.exec(content)) !== null) {
    if (!["if", "for", "while", "switch", "catch", "return", "new"].includes(match[1])) {
      methods.push(match[1]);
    }
  }

  // TypeScript/JavaScript methods
  const tsRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g;
  while ((match = tsRegex.exec(content)) !== null) {
    if (!["if", "for", "while", "switch", "catch", "constructor", "function"].includes(match[1])) {
      if (!methods.includes(match[1])) methods.push(match[1]);
    }
  }

  // Python methods
  const pyRegex = /def\s+(\w+)\s*\(/g;
  while ((match = pyRegex.exec(content)) !== null) {
    if (match[1] !== "__init__" && !methods.includes(match[1])) {
      methods.push(match[1]);
    }
  }

  // Go methods
  const goRegex = /func\s*\(\w+\s+\*?\w+\)\s+(\w+)\s*\(/g;
  while ((match = goRegex.exec(content)) !== null) {
    if (!methods.includes(match[1])) methods.push(match[1]);
  }

  return methods.slice(0, 20);
}

function extractExternalCalls(content: string): string[] {
  const calls: string[] = [];

  // HTTP client calls
  const httpPatterns = [
    /(?:fetch|axios\.\w+|http\.\w+|requests\.\w+|restTemplate\.\w+)\s*\(/gi,
  ];
  for (const pattern of httpPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const ctx = content.substring(Math.max(0, match.index - 30), Math.min(content.length, match.index + 50));
      if (!calls.some((c) => ctx.includes(c))) {
        calls.push(ctx.trim().split("\n")[0].trim());
      }
    }
  }

  // Database calls
  if (content.includes("repository.") || content.includes(".save(") || content.includes(".find(") || content.includes(".query(")) {
    calls.push("database access");
  }

  // Message queue
  if (content.includes("publish(") || content.includes("send(") || content.includes("emit(") || content.includes(".produce(")) {
    calls.push("message queue");
  }

  // Cache
  if (content.includes("cache.") || content.includes("redis.") || content.includes("memcached.")) {
    calls.push("cache access");
  }

  return calls.slice(0, 10);
}

function inferFlowSummary(methods: string[], externalCalls: string[]): string {
  const actions: string[] = [];
  for (const m of methods) {
    const lower = m.toLowerCase();
    if (lower.startsWith("create") || lower.startsWith("add") || lower.startsWith("insert")) actions.push("创建");
    else if (lower.startsWith("update") || lower.startsWith("modify") || lower.startsWith("edit")) actions.push("更新");
    else if (lower.startsWith("delete") || lower.startsWith("remove")) actions.push("删除");
    else if (lower.startsWith("get") || lower.startsWith("find") || lower.startsWith("query") || lower.startsWith("search")) actions.push("查询");
    else if (lower.startsWith("validate") || lower.startsWith("check")) actions.push("校验");
    else if (lower.startsWith("process") || lower.startsWith("handle")) actions.push("处理");
    else if (lower.startsWith("send") || lower.startsWith("notify")) actions.push("通知");
  }

  const unique = [...new Set(actions)];
  if (unique.length === 0) return "业务逻辑处理";
  return `涉及: ${unique.join("、")}`;
}

// ── Source Tree Builder ───────────────────────────────────────────

function buildSourceTree(dirPath: string, maxDepth: number): string {
  const lines: string[] = [];

  function walk(dir: string, prefix: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

    const sorted = entries
      .filter((e) => !SKIP_DIRECTORIES.has(e.name) && !e.name.startsWith("."))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    const maxShow = 20;
    const shown = sorted.slice(0, maxShow);

    for (let i = 0; i < shown.length; i++) {
      const entry = shown[i];
      const isLast = i === shown.length - 1 && sorted.length <= maxShow;
      const connector = isLast ? "└── " : "├── ";
      const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
      const annotation = entry.isDirectory() ? (DIR_ANNOTATIONS[entry.name] ? `  ← ${DIR_ANNOTATIONS[entry.name]}` : "") : "";
      lines.push(`${prefix}${connector}${name}${annotation}`);

      if (entry.isDirectory()) {
        walk(join(dir, entry.name), prefix + (isLast ? "    " : "│   "), depth + 1);
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

function buildOverview(dirPath: string): string {
  const parts: string[] = [];

  const pkgPath = join(dirPath, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) parts.push(`Name: ${pkg.name}`);
      if (pkg.description) parts.push(`Description: ${pkg.description}`);
      if (pkg.version) parts.push(`Version: ${pkg.version}`);
    } catch { /* skip */ }
  }

  const readmePath = join(dirPath, "README.md");
  if (existsSync(readmePath) && parts.length === 0) {
    const content = readFileText(readmePath);
    if (content) {
      const firstLine = content.split("\n").find((l) => l.trim().length > 0) ?? "";
      if (firstLine) parts.push(firstLine.replace(/^#+\s*/, ""));
    }
  }

  return parts.join("\n");
}

// ── Scan State (Incremental) ──────────────────────────────────────

function loadScanState(outputDir: string): ScanState | null {
  const statePath = join(outputDir, ".scan-state.json");
  const content = readFileText(statePath);
  if (!content) return null;
  try { return JSON.parse(content); } catch { return null; }
}

function saveScanState(outputDir: string, state: ScanState): void {
  writeFileSync(join(outputDir, ".scan-state.json"), JSON.stringify(state, null, 2), "utf-8");
}

function computeFileHashes(dirPath: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  const files = collectCodeFiles(dirPath, dirPath);
  let count = 0;
  for (const rel of files) {
    if (count++ > 200) break;
    const content = readFileText(join(dirPath, rel));
    if (content) hashes[rel] = simpleHash(content);
  }
  return hashes;
}

// ── Result Persistence (v2: 10+ documents) ────────────────────────

interface DeepScanData {
  projectType: ProjectType;
  architecture: ArchitecturePattern;
  techStack: string[];
  overview: string;
  sourceTree: string;
  apiContracts: ApiEndpoint[];
  dataEntities: DataEntity[];
  businessFlows: BusinessFlow[];
  endpoints: number;
  models: number;
  flows: number;
}

export function persistScanResult(
  workspaceRoot: string,
  serviceName: string,
  techStack: string[],
  scanData: DeepScanData,
  projectPath: string,
): { outputDir: string; files: string[] } {
  const outputDir = resolve(workspaceRoot, serviceName, "docs");
  mkdirSync(outputDir, { recursive: true });

  const date = new Date().toISOString().split("T")[0];
  const files: string[] = [];

  const write = (name: string, content: string) => {
    writeFileSync(join(outputDir, name), content, "utf-8");
    files.push(name);
  };

  // 1. index.md
  write("index.md", renderIndex(serviceName, scanData, date));

  // 2. project-overview.md
  write("project-overview.md", renderProjectOverview(serviceName, scanData, projectPath, date));

  // 3. tech-stack.md
  write("tech-stack.md", renderTechStack(serviceName, scanData, date));

  // 4. source-tree.md
  write("source-tree.md", renderSourceTree(serviceName, scanData, date));

  // 5. api-contracts.md (conditional)
  if (scanData.apiContracts.length > 0) {
    write("api-contracts.md", renderApiContracts(serviceName, scanData, date));
  }

  // 6. data-models.md (conditional)
  if (scanData.dataEntities.length > 0) {
    write("data-models.md", renderDataModels(serviceName, scanData, date));
  }

  // 7. business-logic.md (conditional)
  if (scanData.businessFlows.length > 0) {
    write("business-logic.md", renderBusinessLogic(serviceName, scanData, date));
  }

  // 8. development-guide.md
  write("development-guide.md", renderDevelopmentGuide(serviceName, scanData, date));

  // 9. overview.md (backward compat alias)
  write("overview.md", renderLegacyOverview(serviceName, scanData, projectPath, date));

  // 10. api-endpoints.md (backward compat alias)
  write("api-endpoints.md", renderLegacyApiEndpoints(serviceName, scanData, date));

  // 11. data-models legacy (already covered above if entities exist)

  // 12. .scan-state.json
  const state: ScanState = {
    service: serviceName,
    lastScan: new Date().toISOString(),
    fileHashes: computeFileHashes(projectPath),
    completedPhases: ["classification", "tech-stack", "api", "models", "business-logic", "source-tree", "output"],
  };
  saveScanState(outputDir, state);
  files.push(".scan-state.json");

  return { outputDir, files };
}

// ── Document Renderers ────────────────────────────────────────────

function renderIndex(service: string, data: DeepScanData, date: string): string {
  const lines = [
    `# ${service} — 文档索引`,
    "",
    `**类型：** ${data.projectType}`,
    `**架构：** ${data.architecture}`,
    `**更新日期：** ${date}`,
    "",
    "## 项目概览",
    "",
    data.overview || "暂无概览信息。",
    "",
    "## 快速参考",
    "",
    "| 项 | 值 |",
    "|---|---|",
    `| 技术栈 | ${data.techStack.join(", ") || "未识别"} |`,
    `| 项目类型 | ${data.projectType} |`,
    `| 架构模式 | ${data.architecture} |`,
    `| API 端点 | ${data.apiContracts.length} |`,
    `| 数据实体 | ${data.dataEntities.length} |`,
    `| 业务流程 | ${data.businessFlows.length} |`,
    "",
    "## 生成的文档",
    "",
    "### 核心文档",
    "",
    `- [项目概览](./project-overview.md) — 执行摘要和高层架构`,
    `- [源码树分析](./source-tree.md) — 带注释的目录结构`,
    `- [技术栈](./tech-stack.md) — 完整技术栈和依赖`,
    "",
    "### 条件文档（根据项目类型生成）",
    "",
    data.apiContracts.length > 0 ? "- [API 契约](./api-contracts.md) — API 端点和 Schema" : "",
    data.dataEntities.length > 0 ? "- [数据模型](./data-models.md) — 数据库 Schema 和实体关系" : "",
    data.businessFlows.length > 0 ? "- [业务逻辑](./business-logic.md) — 核心业务流程和规则" : "",
    "- [开发指南](./development-guide.md) — 本地搭建和开发流程",
    "",
    "## 给 AI Agent 的使用指南",
    "",
    "| 场景 | 参考文档 |",
    "|------|---------|",
    "| 新增 API/后端功能 | api-contracts.md, data-models.md |",
    "| 理解架构 | project-overview.md, source-tree.md |",
    "| 全栈功能 | 所有文档 |",
    "",
    "---",
    "",
    "_由 edith-document-project 生成_",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

function renderProjectOverview(service: string, data: DeepScanData, path: string, date: string): string {
  return [
    `# ${service} — 项目概览`,
    "",
    `**生成日期：** ${date}`,
    `**项目类型：** ${data.projectType}`,
    `**架构模式：** ${data.architecture}`,
    "",
    "## 概要",
    "",
    data.overview || "暂无概览信息。",
    "",
    "## 统计",
    "",
    "| 指标 | 数量 |",
    "|------|------|",
    `| API 端点 | ${data.apiContracts.length} |`,
    `| 数据实体 | ${data.dataEntities.length} |`,
    `| 业务流程 | ${data.businessFlows.length} |`,
    `| 端点文件 | ${data.endpoints} |`,
    `| 模型文件 | ${data.models} |`,
    `| 服务文件 | ${data.flows} |`,
    "",
    `**源码路径**: \`${path}\``,
    "",
    "---",
    "",
    "_由 edith-document-project 生成_",
  ].join("\n");
}

function renderTechStack(service: string, data: DeepScanData, date: string): string {
  const stackList = data.techStack.length > 0
    ? data.techStack.map((s) => `- ${s}`).join("\n")
    : "- 未识别";
  return [
    `# ${service} — 技术栈`,
    "",
    `**生成日期：** ${date}`,
    "",
    "## 识别的技术栈",
    "",
    stackList,
    "",
    "## 架构模式",
    "",
    `- **${data.architecture}**`,
    "",
    "---",
    "",
    "_由 edith-document-project 生成_",
  ].join("\n");
}

function renderSourceTree(service: string, data: DeepScanData, date: string): string {
  const fence = "```";
  return [
    `# ${service} — 源码树分析`,
    "",
    `**生成日期：** ${date}`,
    "",
    "## 目录结构（带用途注解）",
    "",
    fence,
    data.sourceTree,
    fence,
    "",
    "---",
    "",
    "_由 edith-document-project 生成_",
  ].join("\n");
}

function renderApiContracts(service: string, data: DeepScanData, date: string): string {
  const lines = [
    `# ${service} — API 契约`,
    "",
    `**生成日期：** ${date}`,
    `**项目类型：** ${data.projectType}`,
    "",
    `## API 概览`,
    "",
    `- **总端点数：** ${data.apiContracts.length}`,
    "",
  ];

  // Group by group
  const groups = new Map<string, ApiEndpoint[]>();
  for (const ep of data.apiContracts) {
    const g = groups.get(ep.group) ?? [];
    g.push(ep);
    groups.set(ep.group, g);
  }

  for (const [group, endpoints] of groups) {
    lines.push(`### ${group}`, "");
    for (const ep of endpoints) {
      lines.push(`#### ${ep.method} ${ep.path}`, "");
      if (ep.auth) lines.push(`**认证：** ${ep.auth}`, "");
      if (ep.description) lines.push(`**用途：** ${ep.description}`, "");
      lines.push("");
    }
    lines.push("---", "");
  }

  lines.push("_由 edith-document-project 生成_");
  return lines.join("\n");
}

function renderDataModels(service: string, data: DeepScanData, date: string): string {
  const lines = [
    `# ${service} — 数据模型`,
    "",
    `**生成日期：** ${date}`,
    "",
    `## Schema 概览`,
    "",
    `- **实体数：** ${data.dataEntities.length}`,
    "",
  ];

  for (const entity of data.dataEntities) {
    lines.push(`### ${entity.name}`, "");
    lines.push(`**ORM：** ${entity.orm}  |  **来源：** ${entity.source}`, "");
    if (entity.fields.length > 0) {
      lines.push("| 字段 | 类型 | 约束 |", "|------|------|------|");
      for (const f of entity.fields) {
        lines.push(`| ${f.name} | ${f.type} | ${f.constraints || "-"} |`);
      }
      lines.push("");
    }
    if (entity.relations.length > 0) {
      lines.push("**关联关系：**");
      for (const r of entity.relations) {
        lines.push(`- ${r}`);
      }
      lines.push("");
    }
    lines.push("---", "");
  }

  lines.push("_由 edith-document-project 生成_");
  return lines.join("\n");
}

function renderBusinessLogic(service: string, data: DeepScanData, date: string): string {
  const lines = [
    `# ${service} — 业务逻辑`,
    "",
    `**生成日期：** ${date}`,
    "",
    "## 核心业务流程",
    "",
  ];

  for (const flow of data.businessFlows) {
    lines.push(`### ${flow.name}`, "");
    lines.push(`**来源：** ${flow.source}`, "");
    lines.push(`**摘要：** ${flow.summary}`, "");
    lines.push("**方法：**");
    for (const m of flow.methods) {
      lines.push(`- \`${m}()\``);
    }
    if (flow.externalCalls.length > 0) {
      lines.push("", "**外部依赖：**");
      for (const c of flow.externalCalls) {
        lines.push(`- ${c}`);
      }
    }
    lines.push("", "---", "");
  }

  lines.push("_由 edith-document-project 生成_");
  return lines.join("\n");
}

function renderDevelopmentGuide(service: string, data: DeepScanData, date: string): string {
  return [
    `# ${service} — 开发指南`,
    "",
    `**生成日期：** ${date}`,
    "",
    "## 环境要求",
    "",
    data.techStack.length > 0
      ? data.techStack.map((s) => `- ${s}`).join("\n")
      : "- 待确认",
    "",
    "## 常用命令",
    "",
    "| 操作 | 命令 |",
    "|------|------|",
    "| 安装依赖 | `npm install` / `pip install -r requirements.txt` / `go mod download` |",
    "| 启动开发 | `npm run dev` / `python manage.py runserver` / `go run .` |",
    "| 运行测试 | `npm test` / `pytest` / `go test ./...` |",
    "| 构建 | `npm run build` / `go build` |",
    "",
    "## 项目结构",
    "",
    "详见 [source-tree.md](./source-tree.md)",
    "",
    "---",
    "",
    "_由 edith-document-project 生成_",
  ].join("\n");
}

function renderLegacyOverview(service: string, data: DeepScanData, path: string, date: string): string {
  return [
    `# ${service} - Project Overview`,
    "",
    `> Auto-generated by EDITH scan at ${date}`,
    "",
    "## Summary",
    "",
    data.overview || "Project overview not available.",
    "",
    `## Project Classification`,
    "",
    `- **Type:** ${data.projectType}`,
    `- **Architecture:** ${data.architecture}`,
    "",
    "## Tech Stack",
    "",
    data.techStack.length > 0
      ? data.techStack.map((s) => `- ${s}`).join("\n")
      : "- Could not detect tech stack",
    "",
    "## Statistics",
    "",
    "| Metric | Count |",
    "|--------|-------|",
    `| API endpoints | ${data.apiContracts.length} |`,
    `| Data entities | ${data.dataEntities.length} |`,
    `| Business flows | ${data.businessFlows.length} |`,
    `| Endpoint files | ${data.endpoints} |`,
    `| Model files | ${data.models} |`,
    `| Service files | ${data.flows} |`,
    "",
    `**Source path**: \`${path}\``,
    "",
  ].join("\n");
}

function renderLegacyApiEndpoints(service: string, data: DeepScanData, date: string): string {
  const fence = "```";
  if (data.apiContracts.length > 0) {
    const lines = [
      `# ${service} - API Endpoints`,
      "",
      `> Auto-generated by EDITH scan at ${date}`,
      "",
      `## Detected Endpoints (${data.apiContracts.length})`,
      "",
      "| Method | Path | Group | Auth |",
      "|--------|------|-------|------|",
    ];
    for (const ep of data.apiContracts) {
      lines.push(`| ${ep.method} | ${ep.path} | ${ep.group} | ${ep.auth || "-"} |`);
    }
    return lines.join("\n") + "\n";
  }
  return [
    `# ${service} - API Endpoints`,
    "",
    `> Auto-generated by EDITH scan at ${date}`,
    "",
    "## Source Tree",
    "",
    fence,
    data.sourceTree,
    fence,
    "",
  ].join("\n");
}

// ── Main Scan Function ────────────────────────────────────────────

export async function executeScan(
  params: ScanParams,
  repos: RepoConfig[],
  workspaceRoot: string,
  timeout: number = DEFAULT_SCAN_TIMEOUT,
): Promise<ScanOutcome> {
  // Step 1: Validate
  if (!params.target || params.target.trim() === "") {
    return { ok: false, error: missingParameterError("target") };
  }
  const mode: ScanMode = params.mode === "quick" ? "quick" : "full";

  // Step 2: Resolve
  const resolved = resolveTarget(params.target, repos);
  if (!resolved.ok) return resolved;
  const { name, path: projectPath } = resolved;

  // Step 3: Pre-flight
  const preflightError = preflightCheck(projectPath);
  if (preflightError) return { ok: false, error: preflightError };

  // Step 4: Tech stack
  const techStack = detectTechStack(projectPath);
  const supported = isSupportedTechStack(techStack);

  // Step 5: Classification
  const projectType = classifyProject(projectPath, techStack);
  const architecture = detectArchitecture(projectPath, techStack);

  // Step 6: Smart depth detection
  const projectSize = detectProjectSize(projectPath);
  const moduleBoundaries = detectModuleBoundaries(projectPath);
  const depth = resolveScanDepth(projectSize, architecture, params.depth);

  // Step 7: Deep analysis (with timeout)
  let scanData: DeepScanData;
  try {
    scanData = await Promise.race([
      new Promise<DeepScanData>((resolve) => {
        const data = performDeepScan(projectPath, mode, depth, techStack, projectType, architecture, moduleBoundaries);
        resolve(data);
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`SCAN_TIMEOUT:${timeout}`)), timeout * 1000);
      }),
    ]);
  } catch (err) {
    const errMsg = (err as Error).message ?? String(err);
    if (errMsg.startsWith("SCAN_TIMEOUT:")) {
      return { ok: false, error: scanTimeoutError(timeout) };
    }
    return {
      ok: false,
      error: { code: "SCAN_TIMEOUT", message: `扫描失败: ${errMsg}`, suggestion: "检查项目目录是否可访问，或尝试使用 mode=quick。" },
    };
  }

  // Step 8: Persist
  const absWorkspaceRoot = resolve(workspaceRoot);
  const { outputDir, files } = persistScanResult(absWorkspaceRoot, name, techStack, scanData, projectPath);

  // Step 9: Auto-register
  const cfgPath = findConfigFile();
  if (cfgPath) {
    addRepo(cfgPath, { name, path: projectPath, stack: techStack.length > 0 ? techStack.join(", ") : undefined });
  }

  // Step 10: Build result
  const result: ScanResult = {
    service: name,
    path: projectPath,
    techStack,
    projectType,
    architecture,
    depth,
    projectSize,
    moduleBoundaries,
    endpoints: scanData.endpoints,
    models: scanData.models,
    flows: scanData.flows,
    apiContracts: scanData.apiContracts,
    dataEntities: scanData.dataEntities,
    businessFlows: scanData.businessFlows,
    outputDir,
    files,
    scannedAt: new Date().toISOString(),
  };

  if (!supported && techStack.length > 0) {
    const error = unsupportedTechStackError(techStack);
    const warningFile = "scan-warning.md";
    writeFileSync(join(outputDir, warningFile), `# Scan Warning\n\n${error.message}\n\n${error.suggestion}\n`, "utf-8");
    result.files.push(warningFile);
  }

  return { ok: true, result };
}

function performDeepScan(
  dirPath: string,
  mode: ScanMode,
  depth: ScanDepth,
  techStack: string[],
  projectType: ProjectType,
  architecture: ArchitecturePattern,
  moduleBoundaries: ModuleBoundary[],
): DeepScanData {
  // Count files in key directories
  let endpoints = 0, models = 0, flows = 0;
  function countDirs(dir: string, countDepth: number): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name) || (entry.name.startsWith(".") && entry.name !== ".github")) continue;
      const full = join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      const lower = entry.name.toLowerCase();
      if (ENDPOINT_DIRS.has(lower)) {
        try { endpoints += readdirSync(full).filter((f) => CODE_EXTENSIONS.has(extname(f))).length; } catch { /* skip */ }
      }
      if (MODEL_DIRS.has(lower)) {
        try { models += readdirSync(full).filter((f) => CODE_EXTENSIONS.has(extname(f))).length; } catch { /* skip */ }
      }
      if (SERVICE_DIRS.has(lower)) {
        try { flows += readdirSync(full).filter((f) => CODE_EXTENSIONS.has(extname(f))).length; } catch { /* skip */ }
      }
      if (countDepth < 4) countDirs(full, countDepth + 1);
    }
  }
  countDirs(dirPath, 0);

  // Source tree depth based on scan depth level
  const treeDepth = depth === "quick" ? 2 : depth === "deep" ? 3 : 5;
  const sourceTree = buildSourceTree(dirPath, treeDepth);
  const overview = buildOverview(dirPath);

  // Analysis granularity based on depth
  const shouldAnalyze = mode === "full" && depth !== "quick";
  const apiContracts = shouldAnalyze ? extractApiContracts(dirPath, techStack) : [];
  const dataEntities = shouldAnalyze ? analyzeDataModels(dirPath, techStack) : [];
  const businessFlows = shouldAnalyze ? discoverBusinessLogic(dirPath) : [];

  return {
    projectType,
    architecture,
    techStack,
    overview,
    sourceTree,
    apiContracts,
    dataEntities,
    businessFlows,
    endpoints,
    models,
    flows,
  };
}

// ── Format Functions ──────────────────────────────────────────────

export function formatScanSummary(result: ScanResult): string {
  const lines = [
    "EDITH 知识扫描完成",
    "",
    `  服务: ${result.service}`,
    `  路径: ${result.path}`,
    `  技术栈: ${result.techStack.length > 0 ? result.techStack.join(", ") : "未识别"}`,
    `  项目类型: ${result.projectType}`,
    `  架构模式: ${result.architecture}`,
    `  项目规模: ${result.projectSize}`,
    `  扫描深度: ${result.depth}（自动选择）`,
    "",
    `  API 端点: ${result.apiContracts.length} (${result.endpoints} 端点文件)`,
    `  数据实体: ${result.dataEntities.length} (${result.models} 模型文件)`,
    `  业务流程: ${result.businessFlows.length} (${result.flows} 服务文件)`,
  ];

  if (result.moduleBoundaries.length > 0) {
    lines.push("", `  模块边界: ${result.moduleBoundaries.map((m) => `${m.name}(${m.fileCount})`).join(", ")}`);
  }

  lines.push(
    "",
    `  输出目录: ${result.outputDir}`,
    `  生成文件: ${result.files.join(", ")}`,
    `  扫描时间: ${result.scannedAt}`,
  );
  return lines.join("\n");
}

export function formatScanError(error: ScanError): string {
  return [
    "EDITH 知识扫描失败",
    "",
    `  错误: ${error.message}`,
    `  代码: ${error.code}`,
    `  建议: ${error.suggestion}`,
  ].join("\n");
}
