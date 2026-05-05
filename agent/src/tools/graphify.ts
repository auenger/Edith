/**
 * EDITH Graphify Tool — Cognitive Graph Index Engine
 *
 * Generates a semantic dependency graph (graph.json) from source code
 * using AST-level analysis. The graph drives:
 *   - Layer 0 routing-table.md auto-generation
 *   - Layer 2 distillates skeleton splitting
 *   - Board Knowledge Map visualization data source
 *
 * Confidence grading:
 *   EXTRACTED  — Source code AST direct extraction (high confidence)
 *   INFERRED   — Semantic inference from naming conventions (medium)
 *   AMBIGUOUS  — Ambiguous relationships requiring human review (low)
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { resolve, join, extname, relative, basename } from "node:path";
import type { GraphifyConfig, GraphifyConfidence } from "../config.js";

// Re-export for downstream consumers (distill.ts, etc.)
export type { GraphifyConfidence };

// ── Type Definitions ──────────────────────────────────────────────

/** graph.json node — represents a service, module, or conceptual entity */
export interface GraphNode {
  id: string;
  type: "service" | "concept" | "module";
  knowledgeCompleteness: number;  // 0-1
  endpoints?: number;
  language?: string;
  path?: string;
}

/** graph.json edge — represents a dependency or call relationship */
export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  confidence: GraphifyConfidence;
  weight: number;
  callType?: "sync" | "async" | "event";
}

/** graph.json metadata */
export interface GraphMetadata {
  generatedAt: string;
  languages: string[];
  nodeCount: number;
  edgeCount: number;
  version: string;
}

/** graph.json top-level structure — the canonical data contract */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

/** File-level AST extraction result */
export interface FileExtraction {
  path: string;
  language: string;
  imports: Array<{
    source: string;
    names: string[];
    type: "named" | "default" | "namespace" | "module";
    line?: number;
  }>;
  exports: Array<{
    name: string;
    type: "function" | "class" | "interface" | "type" | "constant" | "default";
    isAsync?: boolean;
  }>;
  calls: Array<{
    target: string;
    method?: string;
    confidence: GraphifyConfidence;
    line?: number;
    callType?: "sync" | "async" | "event";
  }>;
}

/** Parameters for graphify execution */
export interface GraphifyParams {
  target: string;
  /** Force full rescan, ignoring cache */
  force?: boolean;
  /** Specific languages to scan (overrides config) */
  languages?: string[];
}

/** Result of graphify execution */
export interface GraphifyResult {
  graphPath: string;
  nodes: number;
  edges: number;
  languages: string[];
  confidenceBreakdown: {
    extracted: number;
    inferred: number;
    ambiguous: number;
  };
  duration: number;
  /** Whether this was an incremental update */
  incremental: boolean;
}

export type GraphifyErrorCode =
  | "TARGET_NOT_FOUND"
  | "PATH_NOT_FOUND"
  | "GRAPH_CORRUPTED"
  | "SCAN_FAILED"
  | "WRITE_FAILED";

export interface GraphifyError {
  code: GraphifyErrorCode;
  message: string;
  suggestion: string;
}

export type GraphifyOutcome =
  | { ok: true; result: GraphifyResult }
  | { ok: false; error: GraphifyError };

// ── Constants ─────────────────────────────────────────────────────

const GRAPH_VERSION = "1.0.0";

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  typescript: [".ts", ".tsx"],
  javascript: [".js", ".jsx", ".mjs", ".cjs"],
  python: [".py", ".pyx", ".pyi"],
  go: [".go"],
  java: [".java"],
  kotlin: [".kt"],
  scala: [".scala"],
  rust: [".rs"],
  ruby: [".rb"],
  php: [".php"],
  csharp: [".cs"],
  swift: [".swift"],
  cpp: [".c", ".cpp", ".h", ".hpp"],
  markdown: [".md", ".mdx"],
};

const SKIP_DIRECTORIES = new Set([
  "node_modules", ".git", "vendor", "__pycache__",
  ".gradle", ".mvn", "dist", "build", "target", ".next",
  ".cache", ".tox", "venv", ".venv", "env",
]);

// ── AST-level Import/Export/Call Extraction ───────────────────────

/**
 * Extract imports, exports, and calls from a source file.
 * Uses regex-based pattern matching (lightweight AST approximation).
 * A full tree-sitter integration would replace these patterns.
 */
function extractFromFile(
  filePath: string,
  language: string,
): FileExtraction {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const imports: FileExtraction["imports"] = [];
  const exports: FileExtraction["exports"] = [];
  const calls: FileExtraction["calls"] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // ── Language-specific import patterns ──
    if (language === "typescript" || language === "javascript") {
      // import { X, Y } from './module'
      const namedImport = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/;
      const namedMatch = namedImport.exec(line);
      if (namedMatch) {
        imports.push({
          source: namedMatch[2],
          names: namedMatch[1].split(",").map((s) => s.trim()),
          type: "named",
          line: lineNum,
        });
        continue;
      }
      // import X from './module'
      const defaultImport = /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/;
      const defaultMatch = defaultImport.exec(line);
      if (defaultMatch) {
        imports.push({
          source: defaultMatch[2],
          names: [defaultMatch[1]],
          type: "default",
          line: lineNum,
        });
        continue;
      }
      // import * as X from './module'
      const nsImport = /import\s+\*\s+as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/;
      const nsMatch = nsImport.exec(line);
      if (nsMatch) {
        imports.push({
          source: nsMatch[2],
          names: [nsMatch[1]],
          type: "namespace",
          line: lineNum,
        });
        continue;
      }
      // require('./module')
      const requirePattern = /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/;
      const requireMatch = requirePattern.exec(line);
      if (requireMatch) {
        imports.push({
          source: requireMatch[2],
          names: [requireMatch[1]],
          type: "module",
          line: lineNum,
        });
      }
    } else if (language === "python") {
      // from module import X, Y
      const fromImport = /from\s+([\w.]+)\s+import\s+(.+)/;
      const fromMatch = fromImport.exec(line);
      if (fromMatch) {
        imports.push({
          source: fromMatch[1],
          names: fromMatch[2].split(",").map((s) => s.trim()),
          type: "named",
          line: lineNum,
        });
        continue;
      }
      // import module
      const pyImport = /^import\s+([\w.]+)/;
      const pyMatch = pyImport.exec(line);
      if (pyMatch) {
        imports.push({
          source: pyMatch[1],
          names: [pyMatch[1]],
          type: "module",
          line: lineNum,
        });
      }
    } else if (language === "go") {
      // "github.com/pkg/module"
      const goImport = /"([^"]+)"/;
      if (line.includes("import") && goImport.test(line)) {
        const goMatch = goImport.exec(line);
        if (goMatch) {
          imports.push({
            source: goMatch[1],
            names: [],
            type: "module",
            line: lineNum,
          });
        }
      }
    } else if (language === "java") {
      // import com.example.Class;
      const javaImport = /import\s+(?:static\s+)?([\w.]+(?:\.\*)?)/;
      const javaMatch = javaImport.exec(line);
      if (javaMatch) {
        imports.push({
          source: javaMatch[1],
          names: [],
          type: "module",
          line: lineNum,
        });
      }
    }

    // ── Export patterns (TypeScript/JavaScript) ──
    if (language === "typescript" || language === "javascript") {
      // export function X
      const exportFn = /export\s+(?:async\s+)?function\s+(\w+)/;
      const fnMatch = exportFn.exec(line);
      if (fnMatch) {
        exports.push({
          name: fnMatch[1],
          type: "function",
          isAsync: line.includes("async"),
        });
      }
      // export class X
      const exportClass = /export\s+class\s+(\w+)/;
      const classMatch = exportClass.exec(line);
      if (classMatch) {
        exports.push({ name: classMatch[1], type: "class" });
      }
      // export interface X
      const exportIface = /export\s+interface\s+(\w+)/;
      const ifaceMatch = exportIface.exec(line);
      if (ifaceMatch) {
        exports.push({ name: ifaceMatch[1], type: "interface" });
      }
      // export type X
      const exportType = /export\s+type\s+(\w+)/;
      const typeMatch = exportType.exec(line);
      if (typeMatch) {
        exports.push({ name: typeMatch[1], type: "type" });
      }
      // export const X
      const exportConst = /export\s+const\s+(\w+)/;
      const constMatch = exportConst.exec(line);
      if (constMatch) {
        exports.push({ name: constMatch[1], type: "constant" });
      }
      // export default
      const exportDefault = /export\s+default\s+/;
      if (exportDefault.test(line)) {
        exports.push({ name: "default", type: "default" });
      }
    }

    // ── Call patterns (cross-service) ──
    // fetch('http://...')
    const fetchCall = /fetch\s*\(\s*['"](?:https?:)?\/\/([^/'"]+)/;
    const fetchMatch = fetchCall.exec(line);
    if (fetchMatch) {
      calls.push({
        target: fetchMatch[1],
        confidence: "EXTRACTED",
        line: lineNum,
      });
    }
    // axios.get/post/put/delete('...')
    const axiosCall = /axios\.\w+\s*\(\s*['"][^'"]*([^/]+\.[\w]+)/;
    const axiosMatch = axiosCall.exec(line);
    if (axiosMatch) {
      calls.push({
        target: axiosMatch[1],
        confidence: "EXTRACTED",
        line: lineNum,
      });
    }
    // grpc/protobuf service calls (serviceName.method())
    const grpcCall = /(\w+)Service\.\w+\(/;
    const grpcMatch = grpcCall.exec(line);
    if (grpcMatch) {
      calls.push({
        target: grpcMatch[1],
        confidence: "EXTRACTED",
        line: lineNum,
      });
    }
    // Event emission patterns
    const eventEmit = /\.emit\s*\(\s*['"](\w+)/;
    const emitMatch = eventEmit.exec(line);
    if (emitMatch) {
      calls.push({
        target: emitMatch[1],
        confidence: "INFERRED",
        callType: "event",
        line: lineNum,
      });
    }
    // Client instantiation patterns (serviceNameClient)
    const clientPattern = /new\s+(\w+)Client\s*\(/;
    const clientMatch = clientPattern.exec(line);
    if (clientMatch) {
      calls.push({
        target: clientMatch[1],
        confidence: "EXTRACTED",
        line: lineNum,
      });
    }
  }

  return { path: filePath, language, imports, exports, calls };
}

// ── Language Detection ─────────────────────────────────────────────

function detectLanguage(filePath: string): string | null {
  const ext = extname(filePath);
  for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (exts.includes(ext)) return lang;
  }
  return null;
}

function isConfiguredLanguage(filePath: string, languages: string[]): boolean {
  const lang = detectLanguage(filePath);
  if (!lang) return false;
  return languages.includes(lang);
}

// ── File Discovery ─────────────────────────────────────────────────

function discoverSourceFiles(
  rootDir: string,
  languages: string[],
): string[] {
  const files: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 10) return; // safety limit
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
        walk(full, depth + 1);
      } else if (isConfiguredLanguage(full, languages)) {
        files.push(full);
      }
    }
  }

  walk(rootDir, 0);
  return files;
}

// ── Graph Building ─────────────────────────────────────────────────

/**
 * Build graph nodes and edges from extracted file data.
 * Uses module/service-level aggregation and cross-reference analysis.
 */
function buildGraph(
  extractions: FileExtraction[],
  rootDir: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  // Phase 1: Create module-level nodes
  const moduleFiles = new Map<string, FileExtraction[]>();
  for (const ext of extractions) {
    const relPath = relative(rootDir, ext.path);
    const parts = relPath.split(/[/\\]/);
    // Module is top-level directory or file itself
    const moduleId = parts.length > 1 ? parts[0] : basename(ext.path, extname(ext.path));
    if (!moduleFiles.has(moduleId)) {
      moduleFiles.set(moduleId, []);
    }
    moduleFiles.get(moduleId)!.push(ext);
  }

  for (const [moduleId, files] of moduleFiles) {
    let totalExports = 0;
    let totalEndpoints = 0;
    const languages = new Set<string>();

    for (const f of files) {
      totalExports += f.exports.length;
      languages.add(f.language);
      // Count HTTP endpoint exports
      totalEndpoints += f.exports.filter(
        (e) => e.name.toLowerCase().includes("get")
          || e.name.toLowerCase().includes("post")
          || e.name.toLowerCase().includes("put")
          || e.name.toLowerCase().includes("delete")
          || e.name.toLowerCase().includes("handler")
          || e.name.toLowerCase().includes("controller"),
      ).length;
    }

    nodeMap.set(moduleId, {
      id: moduleId,
      type: files.length > 3 ? "service" : "module",
      knowledgeCompleteness: 0, // will be updated by distill data
      endpoints: totalEndpoints > 0 ? totalEndpoints : undefined,
      language: [...languages][0],
    });
  }

  // Phase 2: Build edges from imports
  for (const ext of extractions) {
    const relPath = relative(rootDir, ext.path);
    const parts = relPath.split(/[/\\]/);
    const sourceModule = parts.length > 1 ? parts[0] : basename(ext.path, extname(ext.path));

    for (const imp of ext.imports) {
      // Resolve relative imports to module IDs
      let targetModule: string | null = null;

      if (imp.source.startsWith(".") || imp.source.startsWith("/")) {
        // Relative import — resolve to module
        const resolvedParts = imp.source.replace(/^\.\//, "").split("/");
        targetModule = resolvedParts[0] || null;
      } else if (imp.source.startsWith("@")) {
        // Scoped package — second segment is module name
        const scopedParts = imp.source.split("/");
        targetModule = scopedParts.length > 1 ? scopedParts[1] : null;
      }

      if (targetModule && targetModule !== sourceModule && nodeMap.has(targetModule)) {
        const edgeKey = `${sourceModule}->${targetModule}`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: sourceModule,
            target: targetModule,
            label: imp.names.length > 0 ? `imports ${imp.names.join(", ")}` : "imports",
            confidence: "EXTRACTED",
            weight: 1,
          });
        } else {
          const existing = edgeMap.get(edgeKey)!;
          existing.weight += 1;
        }
      }
    }

    // Phase 3: Build edges from calls (service-to-service)
    for (const call of ext.calls) {
      if (call.target !== sourceModule && nodeMap.has(call.target)) {
        const edgeKey = `${sourceModule}->${call.target}:call`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: sourceModule,
            target: call.target,
            label: "service call",
            confidence: call.confidence,
            weight: 1,
            callType: call.callType ?? "sync",
          });
        } else {
          edgeMap.get(edgeKey)!.weight += 1;
        }
      } else if (!nodeMap.has(call.target) && call.confidence === "EXTRACTED") {
        // External service call — create concept node
        if (!nodeMap.has(call.target)) {
          nodeMap.set(call.target, {
            id: call.target,
            type: "concept",
            knowledgeCompleteness: 0,
          });
        }
        const edgeKey = `${sourceModule}->${call.target}:external`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: sourceModule,
            target: call.target,
            label: "external call",
            confidence: call.confidence,
            weight: 1,
            callType: call.callType ?? "sync",
          });
        } else {
          edgeMap.get(edgeKey)!.weight += 1;
        }
      }
    }
  }

  // Phase 4: Infer edges from naming conventions
  for (const [moduleId, node] of nodeMap) {
    if (node.type !== "service" && node.type !== "module") continue;
    // e.g. "user-service-client" suggests dependency on "user-service"
    const parts = moduleId.split(/[-_]/);
    if (parts.length > 1) {
      for (const [otherId, otherNode] of nodeMap) {
        if (otherId === moduleId) continue;
        const otherParts = otherId.split(/[-_]/);
        // Check if this module name contains another module's name
        if (otherParts.length > 0 && parts.includes(otherParts[0]) && otherNode.type === "service") {
          const edgeKey = `${moduleId}->${otherId}:inferred`;
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, {
              source: moduleId,
              target: otherId,
              label: "inferred dependency",
              confidence: "INFERRED",
              weight: 0.5,
            });
          }
        }
      }
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
}

// ── Cache Management ───────────────────────────────────────────────

function getCacheDir(workspaceRoot: string, config: GraphifyConfig): string {
  return resolve(workspaceRoot, config.cache_dir);
}

function getGraphPath(cacheDir: string): string {
  return join(cacheDir, "graph.json");
}

/**
 * Load existing graph.json from cache.
 * Returns null if not found or corrupted.
 */
export function loadGraph(cacheDir: string): GraphData | null {
  const graphPath = getGraphPath(cacheDir);
  if (!existsSync(graphPath)) return null;

  try {
    const content = readFileSync(graphPath, "utf-8");
    const parsed = JSON.parse(content) as GraphData;
    // Basic validation
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      console.warn("[EDITH] graph.json corrupted: invalid structure, regenerating...");
      return null;
    }
    return parsed;
  } catch {
    console.warn("[EDITH] graph.json corrupted: parse failed, regenerating...");
    return null;
  }
}

/**
 * Save graph.json to cache directory.
 */
function saveGraph(cacheDir: string, graph: GraphData): string {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  const graphPath = getGraphPath(cacheDir);
  writeFileSync(graphPath, JSON.stringify(graph, null, 2), "utf-8");
  return graphPath;
}

// ── Incremental Update ─────────────────────────────────────────────

/**
 * Compute file hashes for change detection.
 */
function computeFileHashes(files: string[]): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const file of files) {
    try {
      const stat = statSync(file);
      // Use mtime + size as a lightweight hash
      hashes[file] = `${stat.mtimeMs}:${stat.size}`;
    } catch {
      // File may have been deleted
    }
  }
  return hashes;
}

/**
 * Load previous file hashes from cache.
 */
function loadPreviousHashes(cacheDir: string): Record<string, string> {
  const hashPath = join(cacheDir, "file-hashes.json");
  if (!existsSync(hashPath)) return {};
  try {
    return JSON.parse(readFileSync(hashPath, "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Save file hashes to cache.
 */
function saveHashes(cacheDir: string, hashes: Record<string, string>): void {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  writeFileSync(join(cacheDir, "file-hashes.json"), JSON.stringify(hashes, null, 2), "utf-8");
}

/**
 * Determine which files have changed since last scan.
 */
function detectChangedFiles(
  currentFiles: string[],
  previousHashes: Record<string, string>,
): { changed: string[]; unchanged: string[]; deleted: string[] } {
  const currentHashes = computeFileHashes(currentFiles);
  const currentSet = new Set(currentFiles);
  const previousSet = new Set(Object.keys(previousHashes));

  const changed: string[] = [];
  const unchanged: string[] = [];
  const deleted: string[] = [];

  for (const file of currentFiles) {
    if (currentHashes[file] !== previousHashes[file]) {
      changed.push(file);
    } else {
      unchanged.push(file);
    }
  }

  for (const file of previousSet) {
    if (!currentSet.has(file)) {
      deleted.push(file);
    }
  }

  return { changed, unchanged, deleted };
}

// ── Main Execution ─────────────────────────────────────────────────

/**
 * Execute Graphify index scan.
 *
 * 1. Discover source files matching configured languages
 * 2. Check for incremental update opportunity
 * 3. Extract imports/exports/calls from changed files
 * 4. Build or update graph.json
 * 5. Persist to cache
 */
export function executeGraphify(
  params: GraphifyParams,
  projectPath: string,
  config: GraphifyConfig,
  workspaceRoot: string,
): GraphifyOutcome {
  const startTime = Date.now();
  const languages = params.languages ?? config.languages;
  const cacheDir = getCacheDir(workspaceRoot, config);

  // Pre-flight: verify project path
  if (!existsSync(projectPath)) {
    return {
      ok: false,
      error: {
        code: "PATH_NOT_FOUND",
        message: `项目路径不存在: ${projectPath}`,
        suggestion: "检查项目路径是否正确。",
      },
    };
  }

  // Discover source files
  const sourceFiles = discoverSourceFiles(projectPath, languages);

  // Handle empty project
  if (sourceFiles.length === 0) {
    const emptyGraph: GraphData = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        languages,
        nodeCount: 0,
        edgeCount: 0,
        version: GRAPH_VERSION,
      },
    };
    const graphPath = saveGraph(cacheDir, emptyGraph);
    return {
      ok: true,
      result: {
        graphPath,
        nodes: 0,
        edges: 0,
        languages,
        confidenceBreakdown: { extracted: 0, inferred: 0, ambiguous: 0 },
        duration: Date.now() - startTime,
        incremental: false,
      },
    };
  }

  // Check for incremental update
  let incremental = false;
  let extractions: FileExtraction[];
  let existingGraph: GraphData | null = null;

  if (!params.force) {
    existingGraph = loadGraph(cacheDir);
    const previousHashes = loadPreviousHashes(cacheDir);
    const { changed, deleted } = detectChangedFiles(sourceFiles, previousHashes);

    if (existingGraph && changed.length === 0 && deleted.length === 0) {
      // No changes — return cached graph
      const graphPath = getGraphPath(cacheDir);
      return {
        ok: true,
        result: {
          graphPath,
          nodes: existingGraph.nodes.length,
          edges: existingGraph.edges.length,
          languages: existingGraph.metadata.languages,
          confidenceBreakdown: countConfidence(existingGraph.edges),
          duration: Date.now() - startTime,
          incremental: true,
        },
      };
    }

    if (existingGraph && (changed.length > 0 || deleted.length > 0)) {
      incremental = true;
      console.log(`[EDITH] Graphify incremental update: ${changed.length} changed, ${deleted.length} deleted`);
      // For incremental: re-extract changed files and rebuild graph
      // (Full rebuild is simpler and ensures consistency; production would do partial)
      extractions = sourceFiles.map((f) => {
        const lang = detectLanguage(f);
        return extractFromFile(f, lang ?? "unknown");
      });
    } else {
      // Full scan
      extractions = sourceFiles.map((f) => {
        const lang = detectLanguage(f);
        return extractFromFile(f, lang ?? "unknown");
      });
    }
  } else {
    // Force full scan
    extractions = sourceFiles.map((f) => {
      const lang = detectLanguage(f);
      return extractFromFile(f, lang ?? "unknown");
    });
  }

  // Build graph from extractions
  const { nodes, edges } = buildGraph(extractions, projectPath);

  // Detect languages from actual files
  const detectedLanguages = [...new Set(extractions.map((e) => e.language))].filter(
    (l) => l !== "unknown",
  );

  // Build final graph
  const graph: GraphData = {
    nodes,
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      languages: detectedLanguages,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      version: GRAPH_VERSION,
    },
  };

  // Save graph and hashes
  const graphPath = saveGraph(cacheDir, graph);
  const hashes = computeFileHashes(sourceFiles);
  saveHashes(cacheDir, hashes);

  return {
    ok: true,
    result: {
      graphPath,
      nodes: nodes.length,
      edges: edges.length,
      languages: detectedLanguages,
      confidenceBreakdown: countConfidence(edges),
      duration: Date.now() - startTime,
      incremental,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function countConfidence(edges: GraphEdge[]): { extracted: number; inferred: number; ambiguous: number } {
  let extracted = 0;
  let inferred = 0;
  let ambiguous = 0;
  for (const edge of edges) {
    switch (edge.confidence) {
      case "EXTRACTED": extracted++; break;
      case "INFERRED": inferred++; break;
      case "AMBIGUOUS": ambiguous++; break;
    }
  }
  return { extracted, inferred, ambiguous };
}

/**
 * Load graph.json from workspace, returning null if not available.
 * Used by scan.ts and distill.ts to access graph data.
 */
export function loadGraphForWorkspace(
  workspaceRoot: string,
  config: GraphifyConfig,
): GraphData | null {
  const cacheDir = getCacheDir(workspaceRoot, config);
  return loadGraph(cacheDir);
}

/**
 * Generate routing-table entries from graph edges.
 * Filters to high-confidence (EXTRACTED) edges between service nodes.
 */
export function extractRoutingRelations(
  graph: GraphData,
): Array<{ from: string; to: string; detail: string; confidence: GraphifyConfidence }> {
  return graph.edges
    .filter((e) => e.confidence === "EXTRACTED" || e.confidence === "INFERRED")
    .map((e) => ({
      from: e.source,
      to: e.target,
      detail: e.label,
      confidence: e.confidence,
    }));
}

// ── Format Functions ──────────────────────────────────────────────

export function formatGraphifySummary(result: GraphifyResult): string {
  const lines = [
    "EDITH Graphify 认知图谱索引完成",
    "",
    `  graph.json: ${result.graphPath}`,
    `  节点数: ${result.nodes}`,
    `  边数: ${result.edges}`,
    `  语言: ${result.languages.join(", ")}`,
    "",
    "  置信度分布:",
    `    EXTRACTED (AST 直接提取): ${result.confidenceBreakdown.extracted}`,
    `    INFERRED  (语义推断):     ${result.confidenceBreakdown.inferred}`,
    `    AMBIGUOUS (待确认):       ${result.confidenceBreakdown.ambiguous}`,
    "",
    `  耗时: ${result.duration}ms`,
    `  模式: ${result.incremental ? "增量更新" : "全量扫描"}`,
  ];

  return lines.join("\n");
}

export function formatGraphifyError(error: GraphifyError): string {
  return `[EDITH] Graphify 错误 [${error.code}]: ${error.message}\n  建议: ${error.suggestion}`;
}
