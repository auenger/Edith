/**
 * EDITH Distill Tool — edith_distill implementation
 *
 * Distills source documents into three-layer knowledge artifacts:
 *   Layer 0: routing-table.md (<500 tokens, global routing table)
 *   Layer 1: quick-ref.md (~5% of source, per-service quick ref)
 *   Layer 2: distillates/*.md (semantically split distillate fragments)
 *
 * Integrates with the distillator Skill.
 *
 * Features:
 * - Source document loading and validation
 * - Token budget control with truncation strategies
 * - Layer 0 routing table generation and global merge
 * - Layer 1 quick-ref generation with truncation
 * - Layer 2 distillate fragment generation with semantic splitting
 * - Structured error and warning handling
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

/** Input parameters for edith_distill */
export interface DistillParams {
  target: string;
}

/** Per-layer generation result */
export interface LayerResult {
  file: string;
  tokens: number;
}

/** Layer 2 file info */
export interface DistillateFileInfo {
  file: string;
  tokens: number;
  topic: string;
  incomplete?: boolean;
}

/** Complete distill result */
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
  warnings: string[];
  distilledAt: string;
}

/** Error codes matching the spec's error code table */
export type DistillErrorCode =
  | "SOURCE_NOT_FOUND"
  | "CORRUPTED_SOURCE"
  | "BUDGET_EXCEEDED"
  | "PARTIAL_GENERATION"
  | "MERGE_CONFLICT";

/** Structured distill error (blocking) */
export interface DistillError {
  code: DistillErrorCode;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

/** Union return type */
export type DistillOutcome =
  | { ok: true; result: DistillResult }
  | { ok: false; error: DistillError };

// ── Token Estimation ──────────────────────────────────────────────

/**
 * Rough token estimation: ~1 token per 4 chars (English) or ~1 token per 2 chars (CJK).
 * Conservative estimate using 3 chars per token.
 */
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

function mergeConflictWarning(message: string): string {
  return `routing-table 全局合并冲突: ${message}`;
}

// ── Source Document Loading ───────────────────────────────────────

interface SourceDocument {
  filename: string;
  content: string;
  tokens: number;
}

/**
 * Load source documents from workspace/{service}/docs/ directory.
 * Validates that each file is valid Markdown.
 */
export function loadSourceDocuments(
  workspaceRoot: string,
  service: string,
): { ok: true; documents: SourceDocument[] } | { ok: false; error: DistillError } {
  const docsDir = resolve(workspaceRoot, service, "docs");

  if (!existsSync(docsDir)) {
    return { ok: false, error: sourceNotFoundError(service) };
  }

  if (!statSync(docsDir).isDirectory()) {
    return { ok: false, error: sourceNotFoundError(service) };
  }

  let files: string[];
  try {
    files = readdirSync(docsDir)
      .filter((f) => extname(f) === ".md")
      .sort();
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

    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      return { ok: false, error: corruptedSourceError(file) };
    }

    // Basic Markdown validation: non-empty, no binary content indicators
    if (!content.trim()) {
      return { ok: false, error: corruptedSourceError(file) };
    }

    // Check for binary content (null bytes)
    if (content.includes("\0")) {
      return { ok: false, error: corruptedSourceError(file) };
    }

    documents.push({
      filename: file,
      content,
      tokens: estimateTokens(content),
    });
  }

  return { ok: true, documents };
}

// ── Token Budget Resolution ───────────────────────────────────────
// Storage phase: no budget limits — distill complete content.
// Budget is only used at consumption time (query/route).

// ── Layer 0: Routing Table Generation ────────────────────────────

interface RoutingTableEntry {
  service: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
}

/**
 * Extract routing table entry from source documents.
 * Parses overview.md for service metadata.
 */
function extractRoutingEntry(
  service: string,
  documents: SourceDocument[],
): RoutingTableEntry {
  const overview = documents.find((d) => d.filename === "overview.md");
  const content = overview?.content ?? "";

  const entry: RoutingTableEntry = {
    service,
    role: "",
    stack: "",
    owner: "",
    constraints: "",
  };

  // Extract tech stack from overview
  const techStackMatch = content.match(/## Tech Stack\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (techStackMatch) {
    const items = techStackMatch[1]
      .split("\n")
      .filter((l) => l.trim().startsWith("- "))
      .map((l) => l.trim().replace(/^-\s*/, ""));
    entry.stack = items.join(", ");
  }

  // Extract statistics for role estimation
  const summaryMatch = content.match(/## Summary\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (summaryMatch) {
    entry.role = summaryMatch[1].trim().split("\n")[0].replace(/^#+\s*/, "").trim();
  }

  // Default role from service name
  if (!entry.role) {
    entry.role = `${service} service`;
  }

  return entry;
}

/**
 * Generate Layer 0 routing table content for a single service.
 */
function generateRoutingTableEntry(entry: RoutingTableEntry): string {
  return `| ${entry.service} | ${entry.role} | ${entry.stack} | ${entry.owner || "TBD"} | ${entry.constraints} |`;
}

/**
 * Generate the full Layer 0 routing-table.md content.
 * Merges with existing routing table if present.
 */
export function generateLayer0(
  workspaceRoot: string,
  service: string,
  documents: SourceDocument[],
): { content: string; tokens: number } {
  const entry = extractRoutingEntry(service, documents);
  const entryLine = generateRoutingTableEntry(entry);

  // Check for existing routing table
  const routingTablePath = findRoutingTablePath(workspaceRoot);
  let existingContent = "";
  let existingEntries: string[] = [];

  if (routingTablePath && existsSync(routingTablePath)) {
    try {
      existingContent = readFileSync(routingTablePath, "utf-8");
      // Extract existing service entries (lines starting with | in the Services table)
      const lines = existingContent.split("\n");
      let inServicesTable = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("## Services")) {
          inServicesTable = true;
          continue;
        }
        if (trimmed.startsWith("## ") && inServicesTable) {
          inServicesTable = false;
          continue;
        }
        if (inServicesTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
          const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
          if (cells.length >= 4 && cells[0] !== "Service") {
            // Skip existing entry for the same service (we will replace it)
            if (cells[0] !== service) {
              existingEntries.push(trimmed);
            }
          }
        }
      }
    } catch {
      // Ignore read errors, start fresh
    }
  }

  // Build the full routing table — no truncation, all entries preserved
  const allEntries = [...existingEntries, entryLine];
  const content = buildRoutingTableContent(service, allEntries);

  return {
    content,
    tokens: estimateTokens(content),
  };
}

/**
 * Build complete routing-table.md content.
 */
function buildRoutingTableContent(
  currentService: string,
  entries: string[],
): string {
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

  // All entries preserved — no truncation at storage time
  lines.push(...entries);

  // Quick-Ref Paths section
  lines.push("");
  lines.push("## Quick-Ref Paths");
  lines.push("");
  lines.push("| Service | Quick-Ref (Layer 1) | Full Distillates (Layer 2) |");
  lines.push("|---------|---------------------|----------------------------|");

  for (const entry of entries) {
    const cells = entry.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length >= 1) {
      const svc = cells[0];
      lines.push(`| ${svc} | ${svc}/quick-ref.md | ${svc}/distillates/ |`);
    }
  }

  // Loading rules
  lines.push("");
  lines.push("## Loading Rules");
  lines.push("");
  lines.push("- Layer 0 (this file): always loaded -- identify which services a task touches");
  lines.push("- Layer 1 (quick-ref): load when task enters a specific service");
  lines.push("- Layer 2 (distillate fragments): load specific fragment when implementing a detail");

  return lines.join("\n");
}

/**
 * Find the routing-table.md file path in the workspace.
 */
function findRoutingTablePath(workspaceRoot: string): string | null {
  const candidates = [
    join(workspaceRoot, "routing-table.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// ── Layer 1: Quick-Ref Generation ────────────────────────────────

/**
 * Generate Layer 1 quick-ref.md content.
 * Extracts: verify commands, key constraints, pitfalls, API endpoints, data models.
 */
export function generateLayer1(
  service: string,
  documents: SourceDocument[],
): { content: string; tokens: number } {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push("type: edith-quick-ref");
  lines.push("layer: 1");
  lines.push(`target_service: "${service}"`);
  lines.push("sources:");
  for (const doc of documents) {
    lines.push(`  - "${service}/docs/${doc.filename}"`);
  }
  lines.push(`created: "${new Date().toISOString()}"`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${service} Quick-Ref`);

  // Verify section
  lines.push("");
  lines.push("## Verify");
  lines.push("");
  lines.push("- Build: `npm run build`");
  lines.push("- Test: `npm test`");
  lines.push("- Run: `npm start`");
  lines.push("- Lint: `npm run lint`");

  // Key Constraints — all constraints preserved, no top-5 limit
  lines.push("");
  lines.push("## Key Constraints");
  lines.push("");

  const constraints = extractConstraints(documents);
  for (const c of constraints) {
    lines.push(`- ${c}`);
  }
  if (constraints.length === 0) {
    lines.push("- No specific constraints detected");
  }

  // Pitfalls
  lines.push("");
  lines.push("## Pitfalls");
  lines.push("");
  lines.push("- Refer to project documentation for common pitfalls");

  // API Endpoints
  lines.push("");
  lines.push("## API Endpoints");
  lines.push("");

  const endpoints = extractEndpoints(service, documents);
  if (endpoints.length > 0) {
    lines.push("| Method | Path | Purpose |");
    lines.push("|--------|------|---------|");
    for (const ep of endpoints) {
      lines.push(`| ${ep.method} | ${ep.path} | ${ep.purpose} |`);
    }
  } else {
    lines.push("No API endpoints detected in source documents.");
  }

  // Data Models
  lines.push("");
  lines.push("## Data Models");
  lines.push("");

  const models = extractModels(documents);
  for (const m of models) {
    lines.push(`- **${m.name}**: ${m.purpose}. Key fields: ${m.keyFields.join(", ")}`);
  }
  if (models.length === 0) {
    lines.push("- No data models detected in source documents.");
  }

  // Deep Dive links
  lines.push("");
  lines.push("## Deep Dive");
  lines.push("");
  lines.push(`- Overview: \`${service}/distillates/01-overview.md\``);
  lines.push(`- API contracts: \`${service}/distillates/02-api-contracts.md\``);
  lines.push(`- Data models: \`${service}/distillates/03-data-models.md\``);
  lines.push(`- Business logic: \`${service}/distillates/04-business-logic.md\``);

  // No truncation — complete content preserved at storage time
  const content = lines.join("\n");
  const tokens = estimateTokens(content);

  return { content, tokens };
}

interface EndpointInfo {
  method: string;
  path: string;
  purpose: string;
}

interface ModelInfo {
  name: string;
  purpose: string;
  keyFields: string[];
}

/**
 * Extract constraints from source documents.
 */
function extractConstraints(documents: SourceDocument[]): string[] {
  const constraints: string[] = [];

  for (const doc of documents) {
    // Look for constraint-related sections
    const constraintPatterns = [
      /##?\s+(?:Key\s+)?Constraints?\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi,
      /##?\s+(?:Critical|Important)\s+(?:Rules?|Requirements?)\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi,
    ];

    for (const pattern of constraintPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(doc.content)) !== null) {
        const items = match[1]
          .split("\n")
          .filter((l) => l.trim().startsWith("- "))
          .map((l) => l.trim().replace(/^-\s*/, ""));
        constraints.push(...items);
      }
    }
  }

  return constraints;
}

/**
 * Extract API endpoints from source documents.
 */
function extractEndpoints(service: string, documents: SourceDocument[]): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  for (const doc of documents) {
    // Look for API endpoint tables
    const lines = doc.content.split("\n");
    let inEndpointTable = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect endpoint section
      if (/##?\s+(?:API|Endpoints?|Routes?)/i.test(trimmed)) {
        inEndpointTable = true;
        continue;
      }
      if (trimmed.startsWith("## ") && inEndpointTable) {
        inEndpointTable = false;
        continue;
      }

      // Parse table rows
      if (inEndpointTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
        const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
        if (cells.length >= 2 && cells[0] !== "Method" && cells[0] !== "HTTP") {
          const method = cells[0].toUpperCase();
          if (["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
            endpoints.push({
              method,
              path: cells[1],
              purpose: cells[2] || "",
            });
          }
        }
      }
    }
  }

  return endpoints;
}

/**
 * Extract data models from source documents.
 */
function extractModels(documents: SourceDocument[]): ModelInfo[] {
  const models: ModelInfo[] = [];

  for (const doc of documents) {
    // Look for model-related sections
    const modelPatterns = [
      /##?\s+(?:Data\s+)?Models?\s*\n([\s\S]*?)(?=\n##?\s|\n$|$)/gi,
    ];

    for (const pattern of modelPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(doc.content)) !== null) {
        const items = match[1]
          .split("\n")
          .filter((l) => l.trim().startsWith("- "))
          .map((l) => l.trim().replace(/^-\s*/, ""));

        for (const item of items) {
          // Parse model name from bold pattern or first word
          const boldMatch = item.match(/\*\*(.+?)\*\*:\s*(.+)/);
          if (boldMatch) {
            const name = boldMatch[1];
            const rest = boldMatch[2];
            const purpose = rest.split(".")[0] || rest.split(",")[0] || rest;
            const keyFieldsMatch = rest.match(/[Kk]ey\s+fields?:\s*(.+)/i);
            const keyFields = keyFieldsMatch
              ? keyFieldsMatch[1].split(",").map((f) => f.trim()).slice(0, 3)
              : [];
            models.push({ name, purpose, keyFields });
          } else {
            // Simple format: just use first word as name
            const name = item.split(/[:\s.]/)[0];
            if (name.length > 0 && name.length < 30) {
              models.push({
                name,
                purpose: item.slice(name.length).replace(/^[:\s.]+/, "").split(".")[0] || item,
                keyFields: [],
              });
            }
          }
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

/**
 * Generate Layer 2 distillate fragments.
 * Semantically splits source documents into topic-based fragments.
 */
export function generateLayer2(
  service: string,
  documents: SourceDocument[],
  warnings: string[],
): { files: DistillateFileInfo[]; fragments: Map<string, string>; totalTokens: number } {
  const topics = determineTopics(documents);
  const fragments = new Map<string, string>();
  const files: DistillateFileInfo[] = [];
  let totalTokens = 0;

  for (const topic of topics) {
    const filename = `${String(topic.index).padStart(2, "0")}-${topic.slug}.md`;
    const content = buildDistillateFragment(service, topic, documents);

    if (!content.trim()) {
      warnings.push(partialGenerationWarning(filename, "源文档不完整"));
      files.push({
        file: filename,
        tokens: 0,
        topic: topic.title,
        incomplete: true,
      });
      continue;
    }

    // No truncation — complete content preserved at storage time
    const tokens = estimateTokens(content);

    fragments.set(filename, content);
    files.push({
      file: filename,
      tokens,
      topic: topic.title,
    });

    totalTokens += tokens;
  }

  return { files, fragments, totalTokens };
}

/**
 * Determine topics for distillate splitting based on available source documents.
 */
function determineTopics(documents: SourceDocument[]): DistillateTopic[] {
  const topics: DistillateTopic[] = [];
  const docNames = new Set(documents.map((d) => d.filename));

  // Standard topic mapping
  const standardTopics: Array<{ index: number; slug: string; title: string; sources: string[] }> = [
    { index: 1, slug: "overview", title: "Overview", sources: ["overview.md"] },
    { index: 2, slug: "api-contracts", title: "API Contracts", sources: ["api-endpoints.md"] },
    { index: 3, slug: "data-models", title: "Data Models", sources: ["data-models.md"] },
    { index: 4, slug: "business-logic", title: "Business Logic", sources: ["overview.md"] },
  ];

  for (const topic of standardTopics) {
    const hasSources = topic.sources.some((s) => docNames.has(s));
    if (hasSources) {
      topics.push(topic);
    }
  }

  // Add additional documents as extra topics
  const coveredSources = new Set(topics.flatMap((t) => t.sources));
  let extraIndex = topics.length + 1;

  for (const doc of documents) {
    if (!coveredSources.has(doc.filename)) {
      const slug = basename(doc.filename, ".md")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      topics.push({
        index: extraIndex++,
        slug,
        title: doc.filename.replace(/\.md$/, "").replace(/[-_]/g, " "),
        sources: [doc.filename],
      });
    }
  }

  return topics;
}

/**
 * Build a single distillate fragment file content.
 */
function buildDistillateFragment(
  service: string,
  topic: DistillateTopic,
  documents: SourceDocument[],
): string {
  const lines: string[] = [];

  // Context header
  lines.push(`本分片覆盖 [${topic.title}]。来自服务: ${service}。`);
  lines.push("");

  // Frontmatter
  lines.push("---");
  lines.push("type: edith-distillate");
  lines.push(`target_service: "${service}"`);
  lines.push("sources:");
  for (const source of topic.sources) {
    lines.push(`  - "${service}/docs/${source}"`);
  }
  lines.push(`created: "${new Date().toISOString()}"`);
  lines.push("---");
  lines.push("");

  // Title
  lines.push(`# ${service} — ${topic.title}`);
  lines.push("");

  // Extract content from matching source documents
  for (const sourceName of topic.sources) {
    const doc = documents.find((d) => d.filename === sourceName);
    if (!doc) continue;

    // Apply compression rules: extract dense information points
    const compressed = compressContent(doc.content, topic.title);

    if (sourceName === "overview.md" && topic.slug !== "overview") {
      // For non-overview topics using overview as source, extract only relevant sections
      const relevantSections = extractRelevantSections(doc.content, topic.slug);
      lines.push(...relevantSections);
    } else {
      lines.push(...compressed);
    }
  }

  return lines.join("\n");
}

/**
 * Apply compression rules to source content.
 * Extracts dense information points following distillator Skill rules.
 */
function compressContent(content: string, topic: string): string[] {
  const lines: string[] = [];
  const sourceLines = content.split("\n");

  let currentSection = "";
  let inCodeBlock = false;

  for (const line of sourceLines) {
    const trimmed = line.trim();

    // Track code blocks
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        lines.push(line);
      } else {
        lines.push(line);
        lines.push("");
      }
      continue;
    }

    if (inCodeBlock) {
      lines.push(line);
      continue;
    }

    // Skip empty lines between sections
    if (!trimmed) {
      if (currentSection) {
        lines.push("");
      }
      continue;
    }

    // Keep headers
    if (trimmed.startsWith("#")) {
      currentSection = trimmed;
      lines.push(line);
      lines.push("");
      continue;
    }

    // Keep list items (already dense format)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      // Filter out transitional phrases
      if (isTransitional(trimmed)) continue;
      lines.push(line);
      continue;
    }

    // Keep table rows
    if (trimmed.startsWith("|")) {
      lines.push(line);
      continue;
    }

    // Compress prose paragraphs into single lines
    if (trimmed.length > 0 && !trimmed.startsWith(">")) {
      // Skip self-referential phrases
      if (isSelfReferential(trimmed)) continue;
      // Skip transitional phrases
      if (isTransitional(trimmed)) continue;
      lines.push(trimmed);
    }
  }

  return lines;
}

/**
 * Extract sections relevant to a specific topic.
 */
function extractRelevantSections(content: string, topicSlug: string): string[] {
  const lines: string[] = [];
  const sectionPattern = /^##\s+(.+)$/gm;
  const sections: Array<{ title: string; start: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push({ title: match[1].trim(), start: match.index });
  }

  // Map topic slug to relevant section keywords
  const topicKeywords: Record<string, string[]> = {
    "api-contracts": ["api", "endpoint", "接口", "路由", "route", "contract", "契约"],
    "data-models": ["model", "数据", "schema", "字段", "entity", "实体"],
    "business-logic": ["logic", "业务", "business", "流程", "flow", "规则", "rule", "服务"],
  };

  const keywords = topicKeywords[topicSlug] || [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.title.toLowerCase();
    const isRelevant = keywords.some((kw) => sectionTitle.includes(kw));

    if (isRelevant) {
      const end = i + 1 < sections.length ? sections[i + 1].start : content.length;
      const sectionContent = content.slice(section.start, end);
      lines.push(...compressContent(sectionContent, topicSlug));
    }
  }

  return lines;
}

/**
 * Check if a line is a transitional phrase that should be removed.
 */
function isTransitional(line: string): boolean {
  const lower = line.toLowerCase();
  const transitions = [
    "如前所述", "值得注意的是", "此外", "需要注意的是",
    "事实上", "总之", "综上所述",
  ];
  return transitions.some((t) => lower.includes(t));
}

/**
 * Check if a line is self-referential content that should be removed.
 */
function isSelfReferential(line: string): boolean {
  const lower = line.toLowerCase();
  const selfRefs = [
    "本文描述了", "如上所述", "如下所示", "本文档",
    "auto-generated", "generated by",
  ];
  return selfRefs.some((t) => lower.includes(t));
}

// ── Result Persistence ────────────────────────────────────────────

/**
 * Persist distill results to the workspace.
 * Writes Layer 0 (global), Layer 1 (per-service), Layer 2 (per-service fragments).
 */
export function persistDistillResult(
  workspaceRoot: string,
  service: string,
  layer0: { content: string },
  layer1: { content: string },
  layer2: { fragments: Map<string, string> },
): { layer0File: string; layer1File: string; layer2Files: string[] } {
  const absRoot = resolve(workspaceRoot);

  // Layer 0: Write global routing-table.md
  const layer0File = join(absRoot, "routing-table.md");
  writeFileSync(layer0File, layer0.content, "utf-8");

  // Layer 1: Write per-service quick-ref.md
  const serviceDir = join(absRoot, service);
  mkdirSync(serviceDir, { recursive: true });
  const layer1File = join(serviceDir, "quick-ref.md");
  writeFileSync(layer1File, layer1.content, "utf-8");

  // Layer 2: Write distillate fragments
  const distillatesDir = join(serviceDir, "distillates");
  mkdirSync(distillatesDir, { recursive: true });
  const layer2Files: string[] = [];

  for (const [filename, content] of layer2.fragments) {
    const filePath = join(distillatesDir, filename);
    writeFileSync(filePath, content, "utf-8");
    layer2Files.push(filename);
  }

  return { layer0File, layer1File, layer2Files };
}

// ── Main Distill Function ────────────────────────────────────────

/**
 * Execute a EDITH distill operation.
 *
 * This is the main entry point called by the extension tool handler.
 *
 * @param params - Distill parameters (target service name)
 * @param config - EDITH configuration for workspace paths and token budgets
 * @param repos - Repository configuration from edith.yaml
 * @returns Distill outcome — either a successful DistillResult or a DistillError
 */
export function executeDistill(
  params: DistillParams,
  config: EdithConfig,
  repos: RepoConfig[],
): DistillOutcome {
  const warnings: string[] = [];
  const workspaceRoot = resolve(config.workspace.root);

  // ── Step 1: Validate parameters ────────────────────────────────
  if (!params.target || params.target.trim() === "") {
    return {
      ok: false,
      error: {
        code: "SOURCE_NOT_FOUND",
        severity: "error",
        message: "缺少必需参数: target",
        suggestion: "edith_distill 需要 target 参数，指定要蒸馏的服务名。",
      },
    };
  }

  const service = params.target.trim();

  // ── Step 2: Load source documents ───────────────────────────────
  const sourceResult = loadSourceDocuments(workspaceRoot, service);
  if (!sourceResult.ok) {
    return { ok: false, error: sourceResult.error };
  }

  const { documents } = sourceResult;

  // ── Step 3: Generate Layer 0 — routing-table.md (no truncation) ──
  const layer0 = generateLayer0(workspaceRoot, service, documents);

  // ── Step 4: Generate Layer 1 — quick-ref.md (no truncation) ────
  const layer1 = generateLayer1(service, documents);

  // ── Step 5: Generate Layer 2 — distillate fragments (no truncation)
  const layer2 = generateLayer2(service, documents, warnings);

  // ── Step 6: Persist results ─────────────────────────────────────
  const persisted = persistDistillResult(
    workspaceRoot,
    service,
    layer0,
    layer1,
    layer2,
  );

  // ── Step 7: Assemble result ─────────────────────────────────────
  const totalTokens = layer0.tokens + layer1.tokens + layer2.totalTokens;

  const result: DistillResult = {
    service,
    layers: {
      layer0: {
        file: persisted.layer0File,
        tokens: layer0.tokens,
      },
      layer1: {
        file: persisted.layer1File,
        tokens: layer1.tokens,
      },
      layer2: {
        files: layer2.files,
        totalTokens: layer2.totalTokens,
      },
    },
    totalTokens,
    warnings,
    distilledAt: new Date().toISOString(),
  };

  return { ok: true, result };
}

// ── Formatting Functions ─────────────────────────────────────────

/**
 * Build a human-readable summary from a DistillResult.
 * This is what the Agent shows to the user.
 */
export function formatDistillSummary(result: DistillResult): string {
  const lines: string[] = [
    "EDITH 知识蒸馏完成",
    "",
    "  服务: " + result.service,
    "",
    "  Layer 0 (routing-table):",
    "    文件: " + result.layers.layer0.file,
    "    Tokens: " + result.layers.layer0.tokens,
    "",
    "  Layer 1 (quick-ref):",
    "    文件: " + result.layers.layer1.file,
    "    Tokens: " + result.layers.layer1.tokens,
    "",
    "  Layer 2 (distillates):",
    "    片段数: " + result.layers.layer2.files.length,
    "    Total Tokens: " + result.layers.layer2.totalTokens,
  ];

  for (const f of result.layers.layer2.files) {
    const status = f.incomplete ? " (不完整)" : "";
    lines.push(`      - ${f.file}: ${f.tokens} tokens [${f.topic}]${status}`);
  }

  lines.push("");
  lines.push("  总 Token 数: " + result.totalTokens);
  lines.push("  蒸馏时间: " + result.distilledAt);

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("  警告:");
    for (const w of result.warnings) {
      lines.push("    - " + w);
    }
  }

  return lines.join("\n");
}

/**
 * Build a human-readable error message from a DistillError.
 */
export function formatDistillError(error: DistillError): string {
  const lines: string[] = [
    "EDITH 知识蒸馏失败",
    "",
    "  错误: " + error.message,
    "  代码: " + error.code,
  ];

  if (error.suggestion) {
    lines.push("  建议: " + error.suggestion);
  }

  return lines.join("\n");
}
