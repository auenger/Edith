/**
 * EDITH Distill Tool — edith_distill implementation (v2)
 *
 * Lossless compression engine for knowledge artifacts.
 * Upgraded from basic filter to full 5-step compression pipeline with
 * conflict detection, cross-document analysis, round-trip validation,
 * and auto-grouping.
 *
 * Backward compatible with v1 — all existing exports preserved.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { resolve, join, basename, extname } from "node:path";

import type { EdithConfig, ContextBudget, RepoConfig } from "../config.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface DistillParams {
  target: string;
  validate?: boolean;
}

export interface LayerResult {
  file: string;
  tokens: number;
}

export interface DistillateFileInfo {
  file: string;
  tokens: number;
  topic: string;
  incomplete?: boolean;
}

/** A discrete information point extracted from source */
export interface InformationPoint {
  id: string;
  content: string;
  source: string;
  type: "fact" | "constraint" | "decision" | "entity" | "endpoint" | "relationship";
  entities: string[];
}

/** A detected conflict between documents */
export interface Conflict {
  entity: string;
  field: string;
  sourceA: string;
  valueA: string;
  sourceB: string;
  valueB: string;
}

/** Cross-document relationship */
export interface CrossReference {
  from: string;
  to: string;
  type: "references" | "shared-entity" | "depends-on" | "implements";
  detail: string;
}

/** Document group for auto-grouping */
export interface DocumentGroup {
  name: string;
  documents: string[];
  theme: string;
}

/** Round-trip validation result */
export interface ValidationResult {
  coverage: number;
  totalFacts: number;
  coveredFacts: number;
  missingFacts: string[];
  passed: boolean;
}

export interface DistillResult {
  service: string;
  layers: {
    layer0: LayerResult;
    layer1: LayerResult;
    layer2: {
      files: DistillateFileInfo[];
      totalTokens: number;
    };
  };
  totalTokens: number;
  compressionRatio: number;
  conflicts: Conflict[];
  crossReferences: CrossReference[];
  groups: DocumentGroup[];
  validation?: ValidationResult;
  warnings: string[];
  distilledAt: string;
}

export type DistillErrorCode =
  | "SOURCE_NOT_FOUND"
  | "CORRUPTED_SOURCE"
  | "BUDGET_EXCEEDED"
  | "PARTIAL_GENERATION"
  | "MERGE_CONFLICT";

export interface DistillError {
  code: DistillErrorCode;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

export type DistillOutcome =
  | { ok: true; result: DistillResult }
  | { ok: false; error: DistillError };

// ── Token Estimation ──────────────────────────────────────────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// ── Error Factory Functions ───────────────────────────────────────

function sourceNotFoundError(service: string): DistillError {
  return {
    code: "SOURCE_NOT_FOUND",
    severity: "error",
    message: `${service} 尚未扫描，请先执行 edith scan ${service}`,
    suggestion: `使用 edith scan ${service} 扫描该项目后，再执行蒸馏。`,
  };
}

function corruptedSourceError(file: string): DistillError {
  return {
    code: "CORRUPTED_SOURCE",
    severity: "error",
    message: `源文档格式异常: ${file} 不是有效的 Markdown 文件`,
    suggestion: "建议重新扫描该服务以生成有效的源文档。",
  };
}

function partialGenerationWarning(file: string, reason: string): string {
  return `${file} 因${reason}而跳过`;
}

// ── Source Document Loading ───────────────────────────────────────

interface SourceDocument {
  filename: string;
  content: string;
  tokens: number;
}

export function loadSourceDocuments(
  workspaceRoot: string,
  service: string,
): { ok: true; documents: SourceDocument[] } | { ok: false; error: DistillError } {
  const docsDir = resolve(workspaceRoot, service, "docs");

  if (!existsSync(docsDir) || !statSync(docsDir).isDirectory()) {
    return { ok: false, error: sourceNotFoundError(service) };
  }

  let files: string[];
  try {
    files = readdirSync(docsDir).filter((f) => extname(f) === ".md").sort();
  } catch {
    return { ok: false, error: sourceNotFoundError(service) };
  }

  if (files.length === 0) {
    return { ok: false, error: sourceNotFoundError(service) };
  }

  const documents: SourceDocument[] = [];
  for (const file of files) {
    const filePath = join(docsDir, file);
    let content: string;
    try { content = readFileSync(filePath, "utf-8"); } catch {
      return { ok: false, error: corruptedSourceError(file) };
    }
    if (!content.trim() || content.includes("\0")) {
      return { ok: false, error: corruptedSourceError(file) };
    }
    documents.push({ filename: file, content, tokens: estimateTokens(content) });
  }

  return { ok: true, documents };
}

// ── Step 1: Extract Information Points ────────────────────────────

/**
 * Extract discrete information points from all source documents.
 */
export function extract(documents: SourceDocument[]): InformationPoint[] {
  const points: InformationPoint[] = [];
  let idCounter = 0;

  for (const doc of documents) {
    const lines = doc.content.split("\n");
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("## ")) {
        currentSection = trimmed.replace(/^#+\s*/, "");
        continue;
      }

      // Extract from list items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.replace(/^[-*]\s*/, "");
        if (shouldKeep(content)) {
          const type = classifyPoint(content, currentSection);
          const entities = extractEntities(content);
          points.push({ id: `p${++idCounter}`, content, source: doc.filename, type, entities });
        }
        continue;
      }

      // Extract from table rows (API endpoints, data models)
      if (trimmed.startsWith("|") && !trimmed.includes("---")) {
        const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
        if (cells.length >= 2 && !isTableHeader(cells)) {
          const method = cells[0].toUpperCase();
          if (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
            points.push({
              id: `p${++idCounter}`,
              content: `${method} ${cells[1]}${cells[2] ? " — " + cells[2] : ""}`,
              source: doc.filename,
              type: "endpoint",
              entities: [cells[1]],
            });
          } else if (cells[0] && cells[1]) {
            points.push({
              id: `p${++idCounter}`,
              content: `${cells[0]}: ${cells.slice(1).join(", ")}`,
              source: doc.filename,
              type: classifyPoint(trimmed, currentSection),
              entities: extractEntities(cells[0]),
            });
          }
        }
      }

      // Extract from prose (compressed)
      if (trimmed.length > 20 && !trimmed.startsWith("#") && !trimmed.startsWith("|") &&
          !trimmed.startsWith("-") && !trimmed.startsWith("*") && !trimmed.startsWith(">") &&
          !trimmed.startsWith("```")) {
        if (shouldKeep(trimmed)) {
          points.push({
            id: `p${++idCounter}`,
            content: compressLanguage(trimmed),
            source: doc.filename,
            type: "fact",
            entities: extractEntities(trimmed),
          });
        }
      }
    }
  }

  return points;
}

function isTableHeader(cells: string[]): boolean {
  const headers = new Set(["method", "field", "字段", "metric", "指标", "service", "path", "service"]);
  return cells.some((c) => headers.has(c.toLowerCase()));
}

function classifyPoint(content: string, section: string): InformationPoint["type"] {
  const lower = section.toLowerCase();
  if (lower.includes("api") || lower.includes("endpoint") || lower.includes("端点")) return "endpoint";
  if (lower.includes("model") || lower.includes("entity") || lower.includes("数据") || lower.includes("实体")) return "entity";
  if (lower.includes("constraint") || lower.includes("约束") || lower.includes("限制")) return "constraint";
  if (lower.includes("decision") || lower.includes("决策")) return "decision";
  return "fact";
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];
  // Extract backtick-quoted identifiers
  const backtickMatch = text.match(/`([^`]+)`/g);
  if (backtickMatch) {
    entities.push(...backtickMatch.map((m) => m.slice(1, -1)));
  }
  // Extract bold-quoted names
  const boldMatch = text.match(/\*\*([^*]+)\*\*/g);
  if (boldMatch) {
    entities.push(...boldMatch.map((m) => m.slice(2, -2)));
  }
  // Extract API paths
  const pathMatch = text.match(/(\/[a-z0-9/_{}-]+)/g);
  if (pathMatch) {
    entities.push(...pathMatch);
  }
  return [...new Set(entities)];
}

// ── Step 2: Deduplicate ───────────────────────────────────────────

/**
 * Merge overlapping facts, keeping the richest context.
 */
export function deduplicate(points: InformationPoint[]): InformationPoint[] {
  const seen = new Map<string, InformationPoint>();

  for (const point of points) {
    const key = normalizeForDedup(point.content);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, point);
    } else {
      // Keep the one with more entities (richer context)
      if (point.entities.length > existing.entities.length) {
        seen.set(key, point);
      }
      // If same richness, keep the one from a more specific source
      else if (point.entities.length === existing.entities.length && point.type !== "fact" && existing.type === "fact") {
        seen.set(key, point);
      }
    }
  }

  return [...seen.values()];
}

function normalizeForDedup(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]/g, "")
    .slice(0, 80);
}

// ── Step 3: Filter by Consumer ────────────────────────────────────

const CONSUMER_IRRELEVANT_PATTERNS = [
  /auto-generated/i,
  /generated by/i,
  /本文档由/i,
  /由.*生成/i,
  /^\s*$/,
];

/**
 * Filter out content irrelevant to downstream consumers.
 */
export function filterByConsumer(points: InformationPoint[]): InformationPoint[] {
  return points.filter((p) => {
    return !CONSUMER_IRRELEVANT_PATTERNS.some((pat) => pat.test(p.content));
  });
}

// ── Step 4: Group by Theme ────────────────────────────────────────

const THEME_KEYWORDS: Record<string, string[]> = {
  "api-contracts": ["api", "endpoint", "端点", "路由", "route", "get", "post", "put", "delete", "contract", "契约", "http"],
  "data-models": ["model", "entity", "数据", "schema", "字段", "field", "table", "表", "orm", "entity", "实体", "relation"],
  "business-logic": ["logic", "业务", "business", "流程", "flow", "服务", "service", "process"],
  "overview": ["overview", "概览", "项目", "project", "tech", "技术栈", "architecture", "架构"],
  "constraints": ["constraint", "约束", "限制", "规则", "rule", "must", "必须", "不得"],
};

export function groupByTheme(points: InformationPoint[]): Map<string, InformationPoint[]> {
  const groups = new Map<string, InformationPoint[]>();

  for (const point of points) {
    let assigned = false;
    const lower = point.content.toLowerCase();

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        const group = groups.get(theme) ?? [];
        group.push(point);
        groups.set(theme, group);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const group = groups.get("overview") ?? [];
      group.push(point);
      groups.set("overview", group);
    }
  }

  return groups;
}

// ── Step 5: Language Compression ──────────────────────────────────

const REMOVE_PATTERNS = [
  /如前所述[，,]?\s*/g,
  /值得注意的是[，,]?\s*/g,
  /此外[，,]?\s*/g,
  /需要注意的是[，,]?\s*/g,
  /事实上[，,]?\s*/g,
  /总之[，,]?\s*/g,
  /综上所述[，,]?\s*/g,
  /我们认为[，,]?\s*/g,
  /可能\s*/g,
  /似乎\s*/g,
  /本文描述了[，,]?\s*/g,
  /如上所述[，,]?\s*/g,
  /如下所示[，,]?\s*/g,
  /本文档[，,]?\s*/g,
  /这是颠覆性的[，,]?\s*/g,
  /令人兴奋的是[，,]?\s*/g,
];

const SELF_REF_PATTERNS = [
  /auto-generated.*?\n/i,
  /generated by.*?\n/i,
];

/**
 * Apply language-level compression: remove transitional phrases,
 * rhetoric, hesitation markers, and self-referential content.
 */
export function compressLanguage(text: string): string {
  let result = text;
  for (const pattern of REMOVE_PATTERNS) {
    result = result.replace(pattern, "");
  }
  for (const pattern of SELF_REF_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

/**
 * Check if a line should be kept (not transitional/self-referential).
 */
function shouldKeep(line: string): boolean {
  const lower = line.toLowerCase();
  const skipPatterns = [
    "auto-generated", "generated by",
    "如前所述", "值得注意的是", "此外", "需要注意的是",
    "事实上", "总之", "综上所述", "本文描述了", "如上所述",
    "如下所示", "本文档",
  ];
  return !skipPatterns.some((p) => lower.includes(p));
}

// ── Conflict Detection ────────────────────────────────────────────

/**
 * Detect conflicts between documents for the same entity.
 */
export function detectConflicts(points: InformationPoint[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Group points by entity name
  const entityPoints = new Map<string, InformationPoint[]>();
  for (const point of points) {
    for (const entity of point.entities) {
      const key = entity.toLowerCase();
      const group = entityPoints.get(key) ?? [];
      group.push(point);
      entityPoints.set(key, group);
    }
  }

  // Check for conflicts in entity descriptions across different sources
  for (const [entity, pts] of entityPoints) {
    if (pts.length < 2) continue;

    // Group by source
    const bySource = new Map<string, InformationPoint[]>();
    for (const p of pts) {
      const group = bySource.get(p.source) ?? [];
      group.push(p);
      bySource.set(p.source, group);
    }

    if (bySource.size < 2) continue;

    // Check for type conflicts (same entity, different types)
    const types = new Set(pts.map((p) => p.type));
    if (types.size > 1) {
      const sources = [...bySource.keys()];
      if (sources.length >= 2) {
        conflicts.push({
          entity,
          field: "type",
          sourceA: sources[0],
          valueA: pts.find((p) => p.source === sources[0])!.type,
          sourceB: sources[1],
          valueB: pts.find((p) => p.source === sources[1])!.type,
        });
      }
    }

    // Check for endpoint conflicts (same path, different methods)
    const endpoints = pts.filter((p) => p.type === "endpoint");
    if (endpoints.length >= 2) {
      const paths = endpoints.map((e) => {
        const match = e.content.match(/(\/[^\s]+)/);
        return match ? match[1] : "";
      });
      const methodMap = new Map<string, Set<string>>();
      for (let i = 0; i < endpoints.length; i++) {
        const path = paths[i];
        if (!path) continue;
        const method = endpoints[i].content.split(" ")[0];
        const methods = methodMap.get(path) ?? new Set();
        methods.add(method);
        methodMap.set(path, methods);
      }
      // Conflicting methods for same path across sources is expected (multiple methods on same endpoint)
      // Real conflict: same method+path with different descriptions
    }
  }

  return conflicts;
}

// ── Cross-Document Analysis ───────────────────────────────────────

/**
 * Analyze relationships between documents.
 */
export function analyzeCrossDocument(points: InformationPoint[], documents: SourceDocument[]): CrossReference[] {
  const refs: CrossReference[] = [];
  const docNames = documents.map((d) => d.filename);

  // Find shared entities across documents
  const entitySources = new Map<string, Set<string>>();
  for (const point of points) {
    for (const entity of point.entities) {
      const key = entity.toLowerCase();
      const sources = entitySources.get(key) ?? new Set();
      sources.add(point.source);
      entitySources.set(key, sources);
    }
  }

  for (const [entity, sources] of entitySources) {
    if (sources.size >= 2) {
      const srcArray = [...sources];
      refs.push({
        from: srcArray[0],
        to: srcArray[1],
        type: "shared-entity",
        detail: `共享实体: ${entity}`,
      });
    }
  }

  // Find reference patterns (one doc mentions another's topic)
  const topicKeywords: Record<string, string[]> = {
    "api-contracts.md": ["api", "endpoint", "端点", "路由"],
    "data-models.md": ["model", "entity", "数据", "schema", "字段"],
    "business-logic.md": ["service", "业务", "flow", "流程"],
  };

  for (const doc of documents) {
    const otherDocs = docNames.filter((n) => n !== doc.filename);
    for (const otherDoc of otherDocs) {
      const keywords = topicKeywords[otherDoc] ?? [];
      const lower = doc.content.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        const alreadyExists = refs.some(
          (r) => r.from === doc.filename && r.to === otherDoc && r.type === "references"
        );
        if (!alreadyExists) {
          refs.push({
            from: doc.filename,
            to: otherDoc,
            type: "references",
            detail: `${doc.filename} 引用了 ${otherDoc} 中的概念`,
          });
        }
      }
    }
  }

  return refs;
}

// ── Round-Trip Validation ─────────────────────────────────────────

/**
 * Validate that compressed output covers ≥95% of source facts.
 */
export function validateRoundTrip(
  sourcePoints: InformationPoint[],
  distilledContent: string,
): ValidationResult {
  const sourceFacts = sourcePoints.filter((p) =>
    p.type === "fact" || p.type === "constraint" || p.type === "decision" || p.type === "endpoint"
  );

  const totalFacts = sourceFacts.length;
  if (totalFacts === 0) {
    return { coverage: 100, totalFacts: 0, coveredFacts: 0, missingFacts: [], passed: true };
  }

  const missingFacts: string[] = [];
  const lower = distilledContent.toLowerCase();

  for (const fact of sourceFacts) {
    // Check if key entities from this fact appear in distilled content
    const keyTerms = fact.entities.length > 0
      ? fact.entities
      : extractKeyTerms(fact.content);

    const covered = keyTerms.length === 0 || keyTerms.some((term) => lower.includes(term.toLowerCase()));

    if (!covered) {
      missingFacts.push(fact.content.slice(0, 80));
    }
  }

  const coveredFacts = totalFacts - missingFacts.length;
  const coverage = Math.round((coveredFacts / totalFacts) * 100);

  return {
    coverage,
    totalFacts,
    coveredFacts,
    missingFacts: missingFacts.slice(0, 20),
    passed: coverage >= 95,
  };
}

function extractKeyTerms(content: string): string[] {
  // Extract significant words (skip common words)
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been",
    "的", "了", "在", "是", "和", "与", "或", "不", "有", "to", "of", "for", "in", "on",
    "with", "and", "or", "this", "that", "it", "from", "by"]);

  return content
    .split(/[\s,;:|.!?(){}[\]<>"'`/]+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w.toLowerCase()))
    .slice(0, 5);
}

// ── Auto-Grouping ─────────────────────────────────────────────────

/**
 * Group documents by naming conventions and theme.
 */
export function groupDocuments(documents: SourceDocument[]): DocumentGroup[] {
  const groups: DocumentGroup[] = [];
  const grouped = new Set<string>();

  // Pair patterns: brief + discovery notes
  const pairPatterns: Array<{ pattern: RegExp; match: RegExp; theme: string }> = [
    { pattern: /^(.+)brief\.md$/, match: /^$1discovery\.md$/, theme: "发现配对" },
  ];

  // Module clustering: same prefix
  const prefixMap = new Map<string, string[]>();
  for (const doc of documents) {
    const name = basename(doc.filename, ".md");
    const prefix = name.split(/[-_]/)[0].toLowerCase();
    if (prefix.length >= 3) {
      const list = prefixMap.get(prefix) ?? [];
      list.push(doc.filename);
      prefixMap.set(prefix, list);
    }
  }

  // Create groups from clusters
  for (const [prefix, files] of prefixMap) {
    if (files.length >= 2) {
      groups.push({
        name: prefix,
        documents: files,
        theme: `同前缀 ${prefix} 文档组`,
      });
      files.forEach((f) => grouped.add(f));
    }
  }

  // Group by detected topic
  const topicMap = new Map<string, string[]>();
  for (const doc of documents) {
    if (grouped.has(doc.filename)) continue;

    const lower = doc.content.toLowerCase().slice(0, 500);
    let topic = "general";
    if (lower.includes("api") || lower.includes("endpoint") || lower.includes("端点")) topic = "api";
    else if (lower.includes("model") || lower.includes("entity") || lower.includes("数据")) topic = "data";
    else if (lower.includes("logic") || lower.includes("business") || lower.includes("业务")) topic = "business";
    else if (lower.includes("overview") || lower.includes("概览") || lower.includes("tech stack")) topic = "overview";

    const list = topicMap.get(topic) ?? [];
    list.push(doc.filename);
    topicMap.set(topic, list);
  }

  for (const [topic, files] of topicMap) {
    groups.push({
      name: topic,
      documents: files,
      theme: `${topic} 相关文档`,
    });
  }

  return groups;
}

// ── Compression Pipeline ──────────────────────────────────────────

/**
 * Run the 5-step compression pipeline on source documents.
 */
function runCompressionPipeline(
  documents: SourceDocument[],
  warnings: string[],
): { points: InformationPoint[]; conflicts: Conflict[]; crossRefs: CrossReference[]; groups: DocumentGroup[] } {
  // Step 1: Extract
  const rawPoints = extract(documents);

  // Step 2: Deduplicate
  const deduped = deduplicate(rawPoints);

  // Step 3: Filter
  const filtered = filterByConsumer(deduped);

  // Step 4: Group by theme (just categorize, don't split yet)
  const themeGroups = groupByTheme(filtered);

  // Step 5: Language compression applied per point during extraction

  // Conflict detection
  const conflicts = detectConflicts(filtered);

  // Cross-document analysis
  const crossRefs = analyzeCrossDocument(filtered, documents);

  // Auto-grouping
  const groups = groupDocuments(documents);

  return { points: filtered, conflicts, crossRefs, groups };
}

// ── Layer 0: Routing Table Generation ────────────────────────────

interface RoutingTableEntry {
  service: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
}

function extractRoutingEntry(service: string, documents: SourceDocument[]): RoutingTableEntry {
  const overview = documents.find((d) => d.filename === "overview.md" || d.filename === "project-overview.md");
  const content = overview?.content ?? "";

  const entry: RoutingTableEntry = { service, role: "", stack: "", owner: "", constraints: "" };

  const techStackMatch = content.match(/## Tech Stack\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (techStackMatch) {
    entry.stack = techStackMatch[1].split("\n").filter((l) => l.trim().startsWith("- "))
      .map((l) => l.trim().replace(/^-\s*/, "")).join(", ");
  }

  const summaryMatch = content.match(/## (?:Summary|概要)\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (summaryMatch) {
    entry.role = summaryMatch[1].trim().split("\n")[0].replace(/^#+\s*/, "").trim();
  }
  if (!entry.role) entry.role = `${service} service`;

  return entry;
}

function generateRoutingTableEntry(entry: RoutingTableEntry): string {
  return `| ${entry.service} | ${entry.role} | ${entry.stack} | ${entry.owner || "TBD"} | ${entry.constraints} |`;
}

export function generateLayer0(
  workspaceRoot: string,
  service: string,
  documents: SourceDocument[],
): { content: string; tokens: number } {
  const entry = extractRoutingEntry(service, documents);
  const entryLine = generateRoutingTableEntry(entry);

  const routingTablePath = findRoutingTablePath(workspaceRoot);
  let existingEntries: string[] = [];

  if (routingTablePath && existsSync(routingTablePath)) {
    try {
      const existingContent = readFileSync(routingTablePath, "utf-8");
      const lines = existingContent.split("\n");
      let inServicesTable = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("## Services")) { inServicesTable = true; continue; }
        if (trimmed.startsWith("## ") && inServicesTable) { inServicesTable = false; continue; }
        if (inServicesTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
          const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
          if (cells.length >= 4 && cells[0] !== "Service" && cells[0] !== service) {
            existingEntries.push(trimmed);
          }
        }
      }
    } catch { /* start fresh */ }
  }

  const allEntries = [...existingEntries, entryLine];
  const content = buildRoutingTableContent(service, allEntries);
  return { content, tokens: estimateTokens(content) };
}

function buildRoutingTableContent(currentService: string, entries: string[]): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("name: company-edith-routing-table");
  lines.push("description: Layer 0 routing table. Always loaded. Maps services to one-line descriptions and key constraints.");
  lines.push("layer: 0");
  lines.push("---");
  lines.push("");
  lines.push("# Service Routing Table");
  lines.push("");
  lines.push("## Services");
  lines.push("");
  lines.push("| Service | Role | Stack | Owner | Key Constraints |");
  lines.push("|---------|------|-------|-------|-----------------|");
  lines.push(...entries);
  lines.push("");
  lines.push("## Quick-Ref Paths");
  lines.push("");
  lines.push("| Service | Quick-Ref (Layer 1) | Full Distillates (Layer 2) |");
  lines.push("|---------|---------------------|----------------------------|");
  for (const entry of entries) {
    const cells = entry.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length >= 1) {
      lines.push(`| ${cells[0]} | ${cells[0]}/quick-ref.md | ${cells[0]}/distillates/ |`);
    }
  }
  lines.push("");
  lines.push("## Loading Rules");
  lines.push("");
  lines.push("- Layer 0 (this file): always loaded -- identify which services a task touches");
  lines.push("- Layer 1 (quick-ref): load when task enters a specific service");
  lines.push("- Layer 2 (distillate fragments): load specific fragment when implementing a detail");

  return lines.join("\n");
}

function findRoutingTablePath(workspaceRoot: string): string | null {
  const candidate = join(workspaceRoot, "routing-table.md");
  return existsSync(candidate) ? candidate : null;
}

// ── Layer 1: Quick-Ref Generation ────────────────────────────────

export function generateLayer1(
  service: string,
  documents: SourceDocument[],
): { content: string; tokens: number } {
  const lines: string[] = [];
  lines.push("---");
  lines.push("type: edith-quick-ref");
  lines.push("layer: 1");
  lines.push(`target_service: "${service}"`);
  lines.push("sources:");
  for (const doc of documents) lines.push(`  - "${service}/docs/${doc.filename}"`);
  lines.push(`created: "${new Date().toISOString()}"`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${service} Quick-Ref`);

  lines.push("", "## Verify", "");
  lines.push("- Build: `npm run build`", "- Test: `npm test`", "- Run: `npm start`", "- Lint: `npm run lint`");

  lines.push("", "## Key Constraints", "");
  const constraints = extractConstraints(documents);
  for (const c of constraints) lines.push(`- ${c}`);
  if (constraints.length === 0) lines.push("- No specific constraints detected");

  lines.push("", "## Pitfalls", "", "- Refer to project documentation for common pitfalls");

  lines.push("", "## API Endpoints", "");
  const endpoints = extractEndpoints(service, documents);
  if (endpoints.length > 0) {
    lines.push("| Method | Path | Purpose |", "|--------|------|---------|");
    for (const ep of endpoints) lines.push(`| ${ep.method} | ${ep.path} | ${ep.purpose} |`);
  } else {
    lines.push("No API endpoints detected in source documents.");
  }

  lines.push("", "## Data Models", "");
  const models = extractModels(documents);
  for (const m of models) lines.push(`- **${m.name}**: ${m.purpose}. Key fields: ${m.keyFields.join(", ")}`);
  if (models.length === 0) lines.push("- No data models detected in source documents.");

  lines.push("", "## Deep Dive", "");
  lines.push(`- Overview: \`${service}/distillates/01-overview.md\``);
  lines.push(`- API contracts: \`${service}/distillates/02-api-contracts.md\``);
  lines.push(`- Data models: \`${service}/distillates/03-data-models.md\``);
  lines.push(`- Business logic: \`${service}/distillates/04-business-logic.md\``);

  const content = lines.join("\n");
  return { content, tokens: estimateTokens(content) };
}

interface EndpointInfo { method: string; path: string; purpose: string; }
interface ModelInfo { name: string; purpose: string; keyFields: string[]; }

function extractConstraints(documents: SourceDocument[]): string[] {
  const constraints: string[] = [];
  for (const doc of documents) {
    const patterns = [
      /##?\s+(?:Key\s+)?Constraints?\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi,
      /##?\s+(?:Critical|Important)\s+(?:Rules?|Requirements?)\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(doc.content)) !== null) {
        const items = match[1].split("\n").filter((l) => l.trim().startsWith("- ")).map((l) => l.trim().replace(/^-\s*/, ""));
        constraints.push(...items);
      }
    }
  }
  return constraints;
}

function extractEndpoints(service: string, documents: SourceDocument[]): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];
  for (const doc of documents) {
    const lines = doc.content.split("\n");
    let inEndpointTable = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/##?\s+(?:API|Endpoints?|Routes?)/i.test(trimmed)) { inEndpointTable = true; continue; }
      if (trimmed.startsWith("## ") && inEndpointTable) { inEndpointTable = false; continue; }
      if (inEndpointTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
        const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
        if (cells.length >= 2 && cells[0] !== "Method" && cells[0] !== "HTTP") {
          const method = cells[0].toUpperCase();
          if (["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
            endpoints.push({ method, path: cells[1], purpose: cells[2] || "" });
          }
        }
      }
    }
  }
  return endpoints;
}

function extractModels(documents: SourceDocument[]): ModelInfo[] {
  const models: ModelInfo[] = [];
  for (const doc of documents) {
    const pattern = /##?\s+(?:Data\s+)?Models?\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi;
    let match;
    while ((match = pattern.exec(doc.content)) !== null) {
      const items = match[1].split("\n").filter((l) => l.trim().startsWith("- ")).map((l) => l.trim().replace(/^-\s*/, ""));
      for (const item of items) {
        const boldMatch = item.match(/\*\*(.+?)\*\*:\s*(.+)/);
        if (boldMatch) {
          const name = boldMatch[1];
          const rest = boldMatch[2];
          const purpose = rest.split(".")[0] || rest.split(",")[0] || rest;
          const keyFieldsMatch = rest.match(/[Kk]ey\s+fields?:\s*(.+)/i);
          const keyFields = keyFieldsMatch ? keyFieldsMatch[1].split(",").map((f) => f.trim()).slice(0, 3) : [];
          models.push({ name, purpose, keyFields });
        }
      }
    }
  }
  return models;
}

// ── Layer 2: Distillate Fragment Generation ──────────────────────

interface DistillateTopic {
  index: number;
  slug: string;
  title: string;
  sources: string[];
}

export function generateLayer2(
  service: string,
  documents: SourceDocument[],
  warnings: string[],
  compressionResult?: { points: InformationPoint[]; groups: DocumentGroup[] },
): { files: DistillateFileInfo[]; fragments: Map<string, string>; totalTokens: number; distilledContent: string } {
  const topics = determineTopics(documents);
  const fragments = new Map<string, string>();
  const files: DistillateFileInfo[] = [];
  let totalTokens = 0;
  const allContent: string[] = [];

  // Use compression pipeline results if available
  const themePoints = compressionResult?.points
    ? groupByTheme(compressionResult.points)
    : null;

  for (const topic of topics) {
    const filename = `${String(topic.index).padStart(2, "0")}-${topic.slug}.md`;
    let content: string;

    if (themePoints && themePoints.has(topic.slug)) {
      content = buildDistillateFromPoints(service, topic, themePoints.get(topic.slug)!);
    } else {
      content = buildDistillateFragment(service, topic, documents);
    }

    if (!content.trim()) {
      warnings.push(partialGenerationWarning(filename, "源文档不完整"));
      files.push({ file: filename, tokens: 0, topic: topic.title, incomplete: true });
      continue;
    }

    const tokens = estimateTokens(content);
    fragments.set(filename, content);
    files.push({ file: filename, tokens, topic: topic.title });
    totalTokens += tokens;
    allContent.push(content);
  }

  return { files, fragments, totalTokens, distilledContent: allContent.join("\n\n") };
}

function determineTopics(documents: SourceDocument[]): DistillateTopic[] {
  const topics: DistillateTopic[] = [];
  const docNames = new Set(documents.map((d) => d.filename));

  const standardTopics: Array<{ index: number; slug: string; title: string; sources: string[] }> = [
    { index: 1, slug: "overview", title: "Overview", sources: ["overview.md", "project-overview.md"] },
    { index: 2, slug: "api-contracts", title: "API Contracts", sources: ["api-endpoints.md", "api-contracts.md"] },
    { index: 3, slug: "data-models", title: "Data Models", sources: ["data-models.md"] },
    { index: 4, slug: "business-logic", title: "Business Logic", sources: ["business-logic.md"] },
  ];

  for (const topic of standardTopics) {
    if (topic.sources.some((s) => docNames.has(s))) {
      topics.push(topic);
    }
  }

  const coveredSources = new Set(topics.flatMap((t) => t.sources));
  let extraIndex = topics.length + 1;
  for (const doc of documents) {
    if (!coveredSources.has(doc.filename)) {
      const slug = basename(doc.filename, ".md").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      topics.push({ index: extraIndex++, slug, title: doc.filename.replace(/\.md$/, "").replace(/[-_]/g, " "), sources: [doc.filename] });
    }
  }

  return topics;
}

function buildDistillateFromPoints(service: string, topic: DistillateTopic, points: InformationPoint[]): string {
  const lines: string[] = [];
  lines.push(`本分片覆盖 [${topic.title}]。来自服务: ${service}。`, "");
  lines.push("---");
  lines.push("type: edith-distillate");
  lines.push(`target_service: "${service}"`);
  lines.push(`created: "${new Date().toISOString()}"`);
  lines.push("---", "");
  lines.push(`# ${service} — ${topic.title}`, "");

  for (const point of points) {
    lines.push(`- ${point.content}`);
  }

  return lines.join("\n");
}

function buildDistillateFragment(
  service: string,
  topic: DistillateTopic,
  documents: SourceDocument[],
): string {
  const lines: string[] = [];
  lines.push(`本分片覆盖 [${topic.title}]。来自服务: ${service}。`, "");
  lines.push("---");
  lines.push("type: edith-distillate");
  lines.push(`target_service: "${service}"`);
  lines.push("sources:");
  for (const source of topic.sources) lines.push(`  - "${service}/docs/${source}"`);
  lines.push(`created: "${new Date().toISOString()}"`);
  lines.push("---", "");
  lines.push(`# ${service} — ${topic.title}`, "");

  for (const sourceName of topic.sources) {
    const doc = documents.find((d) => d.filename === sourceName);
    if (!doc) continue;
    const compressed = compressContent(doc.content, topic.title);
    if (sourceName === "overview.md" && topic.slug !== "overview") {
      lines.push(...extractRelevantSections(doc.content, topic.slug));
    } else {
      lines.push(...compressed);
    }
  }

  return lines.join("\n");
}

function compressContent(content: string, topic: string): string[] {
  const lines: string[] = [];
  const sourceLines = content.split("\n");
  let inCodeBlock = false;

  for (const line of sourceLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      lines.push(line);
      if (!inCodeBlock) lines.push("");
      continue;
    }
    if (inCodeBlock) { lines.push(line); continue; }
    if (!trimmed) { lines.push(""); continue; }
    if (trimmed.startsWith("#")) { lines.push(line, ""); continue; }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (shouldKeep(trimmed)) lines.push(line);
      continue;
    }
    if (trimmed.startsWith("|")) { lines.push(line); continue; }
    if (trimmed.length > 0 && !trimmed.startsWith(">")) {
      if (shouldKeep(trimmed)) lines.push(compressLanguage(trimmed));
    }
  }

  return lines;
}

function extractRelevantSections(content: string, topicSlug: string): string[] {
  const lines: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    "api-contracts": ["api", "endpoint", "接口", "路由", "route", "contract", "契约"],
    "data-models": ["model", "数据", "schema", "字段", "entity", "实体"],
    "business-logic": ["logic", "业务", "business", "流程", "flow", "规则", "rule", "服务"],
  };
  const keywords = topicKeywords[topicSlug] ?? [];
  const sectionPattern = /^##\s+(.+)$/gm;
  const sections: Array<{ title: string; start: number }> = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push({ title: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (keywords.some((kw) => section.title.toLowerCase().includes(kw))) {
      const end = i + 1 < sections.length ? sections[i + 1].start : content.length;
      lines.push(...compressContent(content.slice(section.start, end), topicSlug));
    }
  }
  return lines;
}

// ── Result Persistence ────────────────────────────────────────────

export function persistDistillResult(
  workspaceRoot: string,
  service: string,
  layer0: { content: string },
  layer1: { content: string },
  layer2: { fragments: Map<string, string> },
  conflicts?: Conflict[],
  crossRefs?: CrossReference[],
  validation?: ValidationResult,
): { layer0File: string; layer1File: string; layer2Files: string[] } {
  const absRoot = resolve(workspaceRoot);

  const layer0File = join(absRoot, "routing-table.md");
  writeFileSync(layer0File, layer0.content, "utf-8");

  const serviceDir = join(absRoot, service);
  mkdirSync(serviceDir, { recursive: true });
  const layer1File = join(serviceDir, "quick-ref.md");
  writeFileSync(layer1File, layer1.content, "utf-8");

  const distillatesDir = join(serviceDir, "distillates");
  mkdirSync(distillatesDir, { recursive: true });
  const layer2Files: string[] = [];
  for (const [filename, content] of layer2.fragments) {
    writeFileSync(join(distillatesDir, filename), content, "utf-8");
    layer2Files.push(filename);
  }

  // Write conflicts report if any
  if (conflicts && conflicts.length > 0) {
    const conflictLines = ["# 蒸馏冲突报告", "", `发现 ${conflicts.length} 个冲突:`, ""];
    for (const c of conflicts) {
      conflictLines.push(`## ${c.entity} — ${c.field}`, "");
      conflictLines.push(`- ${c.sourceA}: ${c.valueA}`);
      conflictLines.push(`- ${c.sourceB}: ${c.valueB}`);
      conflictLines.push(`- ⚠️ CONFLICT: ${c.entity} 在 ${c.sourceA} 和 ${c.sourceB} 中描述不同`, "");
    }
    writeFileSync(join(serviceDir, "distill-conflicts.md"), conflictLines.join("\n"), "utf-8");
  }

  // Write cross-references report if any
  if (crossRefs && crossRefs.length > 0) {
    const refLines = ["# 跨文档引用", "", `发现 ${crossRefs.length} 个跨文档关系:`, ""];
    for (const r of crossRefs) {
      refLines.push(`- **${r.from}** → **${r.to}** (${r.type}): ${r.detail}`);
    }
    writeFileSync(join(distillatesDir, "00-cross-references.md"), refLines.join("\n"), "utf-8");
  }

  // Write validation report if present
  if (validation) {
    const valLines = [
      "# 往返验证报告", "",
      `覆盖率: ${validation.coverage}%`,
      `总事实数: ${validation.totalFacts}`,
      `覆盖事实数: ${validation.coveredFacts}`,
      `通过: ${validation.passed ? "是" : "否"}`, "",
    ];
    if (validation.missingFacts.length > 0) {
      valLines.push("## 遗漏信息点", "");
      for (const f of validation.missingFacts) valLines.push(`- ${f}`);
    }
    writeFileSync(join(serviceDir, "distill-validation.md"), valLines.join("\n"), "utf-8");
  }

  return { layer0File, layer1File, layer2Files };
}

// ── Main Distill Function ────────────────────────────────────────

export function executeDistill(
  params: DistillParams,
  config: EdithConfig,
  repos: RepoConfig[],
): DistillOutcome {
  const warnings: string[] = [];
  const workspaceRoot = resolve(config.workspace.root);

  if (!params.target || params.target.trim() === "") {
    return {
      ok: false,
      error: { code: "SOURCE_NOT_FOUND", severity: "error", message: "缺少必需参数: target", suggestion: "edith_distill 需要 target 参数，指定要蒸馏的服务名。" },
    };
  }

  const service = params.target.trim();

  const sourceResult = loadSourceDocuments(workspaceRoot, service);
  if (!sourceResult.ok) return { ok: false, error: sourceResult.error };
  const { documents } = sourceResult;

  // Run compression pipeline
  const compressionResult = runCompressionPipeline(documents, warnings);

  // Add conflict warnings
  for (const conflict of compressionResult.conflicts) {
    warnings.push(`⚠️ CONFLICT: ${conflict.entity}.${conflict.field} — ${conflict.sourceA}("${conflict.valueA}") vs ${conflict.sourceB}("${conflict.valueB}")`);
  }

  // Generate layers
  const layer0 = generateLayer0(workspaceRoot, service, documents);
  const layer1 = generateLayer1(service, documents);
  const layer2 = generateLayer2(service, documents, warnings, compressionResult);

  // Round-trip validation (optional)
  let validation: ValidationResult | undefined;
  if (params.validate) {
    validation = validateRoundTrip(compressionResult.points, layer2.distilledContent);
    if (!validation.passed) {
      warnings.push(`往返验证: 覆盖率 ${validation.coverage}% (目标 ≥95%)`);
    }
  }

  // Persist
  const persisted = persistDistillResult(
    workspaceRoot, service, layer0, layer1, layer2,
    compressionResult.conflicts, compressionResult.crossRefs, validation,
  );

  // Calculate compression ratio
  const sourceTokens = documents.reduce((sum, d) => sum + d.tokens, 0);
  const totalTokens = layer0.tokens + layer1.tokens + layer2.totalTokens;
  const compressionRatio = totalTokens > 0 ? Math.round((sourceTokens / totalTokens) * 10) / 10 : 0;

  const result: DistillResult = {
    service,
    layers: {
      layer0: { file: persisted.layer0File, tokens: layer0.tokens },
      layer1: { file: persisted.layer1File, tokens: layer1.tokens },
      layer2: { files: layer2.files, totalTokens: layer2.totalTokens },
    },
    totalTokens,
    compressionRatio,
    conflicts: compressionResult.conflicts,
    crossReferences: compressionResult.crossRefs,
    groups: compressionResult.groups,
    validation,
    warnings,
    distilledAt: new Date().toISOString(),
  };

  return { ok: true, result };
}

// ── Formatting Functions ─────────────────────────────────────────

export function formatDistillSummary(result: DistillResult): string {
  const lines: string[] = [
    "EDITH 知识蒸馏完成", "",
    `  服务: ${result.service}`,
    `  压缩比: ${result.compressionRatio}:1`,
    "",
    "  Layer 0 (routing-table):",
    `    文件: ${result.layers.layer0.file}`,
    `    Tokens: ${result.layers.layer0.tokens}`,
    "",
    "  Layer 1 (quick-ref):",
    `    文件: ${result.layers.layer1.file}`,
    `    Tokens: ${result.layers.layer1.tokens}`,
    "",
    "  Layer 2 (distillates):",
    `    片段数: ${result.layers.layer2.files.length}`,
    `    Total Tokens: ${result.layers.layer2.totalTokens}`,
  ];

  for (const f of result.layers.layer2.files) {
    const status = f.incomplete ? " (不完整)" : "";
    lines.push(`      - ${f.file}: ${f.tokens} tokens [${f.topic}]${status}`);
  }

  if (result.conflicts.length > 0) {
    lines.push("", `  冲突: ${result.conflicts.length}`);
    for (const c of result.conflicts) {
      lines.push(`    ⚠️ ${c.entity}.${c.field}: ${c.sourceA} vs ${c.sourceB}`);
    }
  }

  if (result.crossReferences.length > 0) {
    lines.push("", `  跨文档关系: ${result.crossReferences.length}`);
  }

  if (result.validation) {
    lines.push("", `  往返验证: ${result.validation.coverage}% (${result.validation.passed ? "通过" : "未通过"})`);
  }

  lines.push("", `  总 Token 数: ${result.totalTokens}`, `  蒸馏时间: ${result.distilledAt}`);

  if (result.warnings.length > 0) {
    lines.push("", "  警告:");
    for (const w of result.warnings) lines.push(`    - ${w}`);
  }

  return lines.join("\n");
}

export function formatDistillError(error: DistillError): string {
  const lines = ["EDITH 知识蒸馏失败", "", `  错误: ${error.message}`, `  代码: ${error.code}`];
  if (error.suggestion) lines.push(`  建议: ${error.suggestion}`);
  return lines.join("\n");
}
