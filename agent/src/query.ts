/**
 * EDITH Query Engine — Three-Layer Progressive Loading
 *
 * Implements the edith_query tool logic:
 *   Layer 0: routing-table.md (always loaded, <500 token)
 *   Layer 1: quick-ref.md (per service, on-demand, <2000 token)
 *   Layer 2: distillates/*.md (precise fragments, on-demand, <4000 token total)
 *
 * Flow:
 *   1. Load Layer 0 routing-table.md
 *   2. Match question to relevant services
 *   3. Load Layer 1 quick-ref.md for matched services
 *   4. Load Layer 2 distillate fragments as needed (index-accelerated when available)
 *   5. Assemble answer with source citations
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import type { EdithConfig } from "./config.js";

// ── Error Codes ───────────────────────────────────────────────────

export type QueryErrorCode =
  | "KNOWLEDGE_BASE_EMPTY"
  | "SERVICE_NOT_FOUND"
  | "MISSING_LAYER1"
  | "MISSING_LAYER2"
  | "CORRUPTED_FILE";

// ── Type Definitions ──────────────────────────────────────────────

export interface QueryParams {
  question: string;
  services?: string[];
  max_depth?: 0 | 1 | 2;
}

export interface SourceCitation {
  layer: 0 | 1 | 2;
  file: string;
  section?: string;
  relevance: number;
}

export interface QueryWarning {
  code: QueryErrorCode;
  service?: string;
  file?: string;
  message: string;
}

export interface QueryResult {
  answer: string;
  sources: SourceCitation[];
  layersLoaded: (0 | 1 | 2)[];
  tokensConsumed: number;
  servicesQueried: string[];
  warnings: QueryWarning[];
  error?: {
    code: QueryErrorCode;
    message: string;
  };
}

// ── Internal Data Structures ──────────────────────────────────────

interface RoutingTableEntry {
  service: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
  quickRefPath?: string;
  distillatesPath?: string;
  aliases: string[];
}

interface RoutingTable {
  entries: RoutingTableEntry[];
  rawContent: string;
}

interface QuickRefData {
  service: string;
  content: string;
  sections: Map<string, string>;
}

interface DistillateFragment {
  file: string;
  name: string;
  content: string;
  estimatedTokens: number;
}

// ── Token Estimation ──────────────────────────────────────────────

/**
 * Rough token estimation: ~1 token per 4 chars (English) or ~1 token per 2 chars (CJK).
 * Conservative estimate using 3 chars per token.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// ── Layer 0: Routing Table Loader ─────────────────────────────────

/**
 * Parse the routing-table.md Markdown table into structured entries.
 *
 * Expects the table format from templates/en/routing-table.md:
 *   | Service | Role | Stack | Owner | Key Constraints |
 */
function parseRoutingTable(content: string): RoutingTableEntry[] {
  const entries: RoutingTableEntry[] = [];
  const lines = content.split("\n");
  let inServicesTable = false;
  let inQuickRefTable = false;

  const quickRefPaths = new Map<string, string>();

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.startsWith("## Quick-Ref")) {
      inServicesTable = false;
      inQuickRefTable = true;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      inServicesTable = false;
      inQuickRefTable = false;
      if (trimmed.includes("Services")) {
        inServicesTable = true;
      }
      continue;
    }

    // Parse Quick-Ref paths table
    if (inQuickRefTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      if (cells.length >= 2 && cells[0] !== "Service") {
        quickRefPaths.set(cells[0], cells[1]);
      }
    }

    // Parse Services table
    if (inServicesTable && trimmed.startsWith("|") && !trimmed.includes("---")) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      if (cells.length >= 4 && cells[0] !== "Service") {
        const serviceName = cells[0];
        entries.push({
          service: serviceName,
          role: cells[1] || "",
          stack: cells[2] || "",
          owner: cells[3] || "",
          constraints: cells[4] || "",
          quickRefPath: quickRefPaths.get(serviceName),
          aliases: generateAliases(serviceName, cells[1] || ""),
        });
      }
    }
  }

  // Second pass: fill in quickRefPaths now that we have both tables parsed
  // (quick-ref table may come before services table)
  for (const entry of entries) {
    if (!entry.quickRefPath) {
      entry.quickRefPath = quickRefPaths.get(entry.service);
    }
    // Derive distillates path conventionally
    entry.distillatesPath = join("distillates", entry.service);
  }

  return entries;
}

/**
 * Generate common aliases for a service name.
 * e.g., "user-service" → ["user-service", "user service", "用户服务", "UserService"]
 */
function generateAliases(serviceName: string, role: string): string[] {
  const aliases: string[] = [serviceName];

  // Hyphen-separated words without hyphen: "user-service" → "user service"
  if (serviceName.includes("-")) {
    aliases.push(serviceName.replace(/-/g, " "));
    aliases.push(serviceName.replace(/-/g, "")); // "userservice"
  }

  // CamelCase variant: "user-service" → "UserService"
  const camelName = serviceName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  aliases.push(camelName);

  // Add role keywords (if not too long)
  if (role && role.length < 20) {
    aliases.push(role);
  }

  return aliases;
}

/**
 * Load Layer 0 — the routing table.
 * Returns the parsed routing table or throws a QueryResult error.
 */
function loadLayer0(workspaceRoot: string): { table: RoutingTable; result?: QueryResult } {
  const routingTablePath = findRoutingTable(workspaceRoot);

  if (!routingTablePath) {
    return {
      table: { entries: [], rawContent: "" },
      result: {
        answer: "知识库为空，请先扫描并蒸馏至少一个服务",
        sources: [],
        layersLoaded: [],
        tokensConsumed: 0,
        servicesQueried: [],
        warnings: [],
        error: {
          code: "KNOWLEDGE_BASE_EMPTY",
          message: "routing-table.md 不存在或为空",
        },
      },
    };
  }

  let rawContent: string;
  try {
    rawContent = readFileSync(routingTablePath, "utf-8");
  } catch {
    return {
      table: { entries: [], rawContent: "" },
      result: {
        answer: "知识库为空，请先扫描并蒸馏至少一个服务",
        sources: [],
        layersLoaded: [],
        tokensConsumed: 0,
        servicesQueried: [],
        warnings: [],
        error: {
          code: "KNOWLEDGE_BASE_EMPTY",
          message: "无法读取 routing-table.md",
        },
      },
    };
  }

  if (!rawContent.trim()) {
    return {
      table: { entries: [], rawContent: "" },
      result: {
        answer: "知识库为空，请先扫描并蒸馏至少一个服务",
        sources: [],
        layersLoaded: [],
        tokensConsumed: 0,
        servicesQueried: [],
        warnings: [],
        error: {
          code: "KNOWLEDGE_BASE_EMPTY",
          message: "routing-table.md 为空",
        },
      },
    };
  }

  const entries = parseRoutingTable(rawContent);

  return {
    table: { entries, rawContent },
  };
}

/**
 * Find routing-table.md in the workspace.
 * Searches common locations:
 *   - {workspaceRoot}/skills/{company-edith}/routing-table.md
 *   - {workspaceRoot}/routing-table.md
 */
function findRoutingTable(workspaceRoot: string): string | null {
  const candidates = [
    // Standard: inside skills/<company-edith>/
    join(workspaceRoot, "skills", "company-edith", "routing-table.md"),
    join(workspaceRoot, "skills", "edith", "routing-table.md"),
    // Fallback: root level
    join(workspaceRoot, "routing-table.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Try to find any routing-table.md in the workspace
  try {
    const skillsDir = join(workspaceRoot, "skills");
    if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
      const dirs = readdirSync(skillsDir);
      for (const dir of dirs) {
        const candidate = join(skillsDir, dir, "routing-table.md");
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // Ignore errors during search
  }

  return null;
}

// ── Service Name Extraction ───────────────────────────────────────

/**
 * Extract service names from a question using the routing table entries.
 * Uses keyword matching and alias mapping.
 */
function extractServiceNames(
  question: string,
  entries: RoutingTableEntry[],
  explicitServices?: string[]
): { matched: RoutingTableEntry[]; unmatched: string[] } {
  // If explicit services provided, use them directly
  if (explicitServices && explicitServices.length > 0) {
    const matched: RoutingTableEntry[] = [];
    const unmatched: string[] = [];

    for (const svc of explicitServices) {
      const entry = entries.find(
        (e) =>
          e.service.toLowerCase() === svc.toLowerCase() ||
          e.aliases.some((a) => a.toLowerCase() === svc.toLowerCase())
      );
      if (entry) {
        matched.push(entry);
      } else {
        unmatched.push(svc);
      }
    }

    return { matched, unmatched };
  }

  // Auto-detect from question text
  const questionLower = question.toLowerCase();
  const matched: RoutingTableEntry[] = [];

  for (const entry of entries) {
    // Check service name and all aliases using word-boundary matching
    for (const alias of entry.aliases) {
      const aliasLower = alias.toLowerCase();
      // Use word boundary matching to avoid partial matches
      // e.g., "service-25" should not match "service-2"
      const escapedAlias = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[-\\s/.,;:!?"'])${escapedAlias}(?:$|[-\\s/.,;:!?"'])`, "i");
      if (regex.test(questionLower) || questionLower === aliasLower) {
        if (!matched.find((m) => m.service === entry.service)) {
          matched.push(entry);
        }
        break;
      }
    }
  }

  return { matched, unmatched: [] };
}

// ── Layer 1: Quick-Ref Loader ─────────────────────────────────────

/**
 * Load Layer 1 quick-ref.md for a specific service.
 */
function loadLayer1(
  workspaceRoot: string,
  entry: RoutingTableEntry
): { data?: QuickRefData; warning?: QueryWarning } {
  // Determine quick-ref path
  let quickRefPath: string | undefined;

  if (entry.quickRefPath) {
    // Path from routing table may be relative to workspace
    quickRefPath = join(workspaceRoot, entry.quickRefPath);
  }

  // Fallback: conventional paths
  if (!quickRefPath || !existsSync(quickRefPath)) {
    const fallbacks = [
      join(workspaceRoot, "skills", entry.service, "quick-ref.md"),
      join(workspaceRoot, entry.service, "quick-ref.md"),
    ];
    for (const fb of fallbacks) {
      if (existsSync(fb)) {
        quickRefPath = fb;
        break;
      }
    }
  }

  if (!quickRefPath || !existsSync(quickRefPath)) {
    return {
      warning: {
        code: "MISSING_LAYER1",
        service: entry.service,
        message: `${entry.service} 缺少 quick-ref.md，回答可能不完整，建议重新蒸馏`,
      },
    };
  }

  let content: string;
  try {
    content = readFileSync(quickRefPath, "utf-8");
  } catch {
    return {
      warning: {
        code: "CORRUPTED_FILE",
        service: entry.service,
        file: quickRefPath,
        message: `${join(entry.service, "quick-ref.md")} 无法读取，已跳过`,
      },
    };
  }

  // Basic corruption check: file should have some non-whitespace content
  if (!content.trim()) {
    return {
      warning: {
        code: "CORRUPTED_FILE",
        service: entry.service,
        file: quickRefPath,
        message: `${join(entry.service, "quick-ref.md")} 为空，已跳过`,
      },
    };
  }

  // Parse sections from quick-ref
  const sections = new Map<string, string>();
  const sectionPattern = /^##?\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const sectionPositions: Array<{ title: string; start: number }> = [];

  while ((match = sectionPattern.exec(content)) !== null) {
    sectionPositions.push({ title: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < sectionPositions.length; i++) {
    const current = sectionPositions[i];
    const end = i + 1 < sectionPositions.length ? sectionPositions[i + 1].start : content.length;
    const sectionContent = content.slice(current.start, end).trim();
    sections.set(current.title, sectionContent);
  }

  return {
    data: {
      service: entry.service,
      content,
      sections,
    },
  };
}

// ── Index-Accelerated Fragment Selection ──────────────────────────

interface IndexRoutingPattern {
  topic: string;
  fragmentFile: string;
}

/**
 * Find a knowledge index file in the workspace.
 */
function findIndexFile(workspaceRoot: string): string | null {
  const candidates = [
    join(workspaceRoot, "company-edith", "*-knowledge-index.md"),
    join(workspaceRoot, "skills", "company-edith", "*-knowledge-index.md"),
  ];

  for (const glob of candidates) {
    const dir = resolve(glob, "..");
    if (!existsSync(dir)) continue;
    try {
      const files = readdirSync(dir);
      const match = files.find((f) => f.endsWith("-knowledge-index.md"));
      if (match) return join(dir, match);
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Parse query routing patterns from an index file.
 * Extracts lines like "问 API/接口 → 加载 02-api-contracts".
 */
function parseIndexRouting(indexContent: string): Map<string, string> {
  const routing = new Map<string, string>();
  const lines = indexContent.split("\n");

  let inRoutingSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## 查询路由")) {
      inRoutingSection = true;
      continue;
    }
    if (inRoutingSection && trimmed.startsWith("## ")) break;
    if (!inRoutingSection) continue;

    const match = trimmed.match(/^-\s+问(.+?)\s*→\s*加载\s+(\S+)/);
    if (match) {
      routing.set(match[1].trim(), match[2].trim());
    }
  }

  return routing;
}

/**
 * Check if a question matches a routing pattern and return the target fragment file.
 */
function matchRoutingPattern(
  question: string,
  routing: Map<string, string>,
): string | null {
  const qLower = question.toLowerCase();

  for (const [pattern, fragment] of routing) {
    const keywords = pattern.split(/[/\/,，、]/).map((k) => k.trim().toLowerCase());
    if (keywords.some((kw) => kw.length > 0 && qLower.includes(kw))) {
      return fragment;
    }
  }

  return null;
}

// ── Layer 2: Distillate Fragment Loader ───────────────────────────

/**
 * Load Layer 2 distillate fragments for a specific service.
 * Selects fragments based on question relevance.
 */
function loadLayer2(
  workspaceRoot: string,
  entry: RoutingTableEntry,
  question: string,
  tokenBudget: number,
  indexRouting?: Map<string, string> | null
): { fragments: DistillateFragment[]; unloadedTitles: Array<{ file: string; name: string }>; warning?: QueryWarning } {
  const distillatesDir = entry.distillatesPath
    ? join(workspaceRoot, entry.distillatesPath)
    : join(workspaceRoot, "distillates", entry.service);

  if (!existsSync(distillatesDir) || !statSync(distillatesDir).isDirectory()) {
    return {
      fragments: [],
      unloadedTitles: [],
      warning: {
        code: "MISSING_LAYER2",
        service: entry.service,
        message: `缺少 distillates 片段，无法提供精确详情，建议重新蒸馏`,
      },
    };
  }

  // List all .md files in the distillates directory (excluding _index.md)
  let files: string[];
  try {
    files = readdirSync(distillatesDir)
      .filter((f) => f.endsWith(".md") && f !== "_index.md")
      .sort();
  } catch {
    return {
      fragments: [],
      unloadedTitles: [],
      warning: {
        code: "CORRUPTED_FILE",
        service: entry.service,
        message: `${join(entry.service, "distillates")} 目录无法读取，已跳过`,
      },
    };
  }

  if (files.length === 0) {
    return {
      fragments: [],
      unloadedTitles: [],
      warning: {
        code: "MISSING_LAYER2",
        service: entry.service,
        message: `缺少 distillates 片段，无法提供精确详情，建议重新蒸馏`,
      },
    };
  }

  // Score and rank fragments by relevance to the question
  const questionLower = question.toLowerCase();
  const questionWords = questionLower.split(/[\s,，.。?？!！、]+/).filter((w) => w.length > 1);

  const scoredFiles: Array<{ file: string; score: number }> = [];

  for (const file of files) {
    const filePath = join(distillatesDir, file);
    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    // Score based on filename and content keyword matching
    const fileName = basename(file, ".md").toLowerCase();
    let score = 0;

    // Index routing boost: if index suggests this fragment, give it a strong signal
    if (indexRouting) {
      const suggestedFile = matchRoutingPattern(question, indexRouting);
      if (suggestedFile && file.includes(suggestedFile.replace(/^\d+-/, ""))) {
        score += 15;
      }
    }

    // Filename keyword match (higher weight)
    for (const word of questionWords) {
      if (fileName.includes(word)) {
        score += 3;
      }
    }

    // Content keyword match
    const contentLower = content.toLowerCase();
    for (const word of questionWords) {
      const regex = new RegExp(word, "gi");
      const matches = contentLower.match(regex);
      if (matches) {
        score += Math.min(matches.length, 5); // Cap at 5 per word
      }
    }

    // Topic-based matching from common distillate naming patterns
    const topicMap: Record<string, string[]> = {
      api: ["api", "接口", "endpoint", "rest", "graphql", "契约", "contract"],
      data: ["数据", "模型", "model", "schema", "字段", "field", "数据库", "database"],
      logic: ["逻辑", "业务", "business", "流程", "flow", "规则", "rule"],
      overview: ["概览", "overview", "简介", "架构", "architecture"],
      auth: ["认证", "auth", "登录", "login", "权限", "permission", "token"],
      config: ["配置", "config", "环境", "environment", "部署", "deploy"],
    };

    for (const [topic, keywords] of Object.entries(topicMap)) {
      const matchesTopic = keywords.some((kw) => fileName.includes(kw));
      const questionMatchesTopic = keywords.some((kw) => questionLower.includes(kw));
      if (matchesTopic && questionMatchesTopic) {
        score += 5;
      }
    }

    scoredFiles.push({ file, score });
  }

  // Sort by score descending
  scoredFiles.sort((a, b) => b.score - a.score);

  // Load fragments up to token budget — no truncation, just budget-aware selection
  const fragments: DistillateFragment[] = [];
  const unloadedTitles: Array<{ file: string; name: string }> = [];
  let tokensUsed = 0;

  for (const { file, score } of scoredFiles) {
    const filePath = join(distillatesDir, file);
    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    const estimatedTokens = estimateTokens(content);

    if (tokensUsed + estimatedTokens <= tokenBudget) {
      fragments.push({
        file: join(entry.distillatesPath || join("distillates", entry.service), file),
        name: basename(file, ".md"),
        content,
        estimatedTokens,
      });
      tokensUsed += estimatedTokens;
    } else {
      // Budget exceeded — list as unloaded title for reference
      unloadedTitles.push({
        file: join(entry.distillatesPath || join("distillates", entry.service), file),
        name: basename(file, ".md"),
      });
    }
  }

  // If no scored matches, load first fragment as fallback
  if (fragments.length === 0 && scoredFiles.length > 0) {
    const file = scoredFiles[0].file;
    const filePath = join(distillatesDir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const estimatedTokens = estimateTokens(content);
      fragments.push({
        file: join(entry.distillatesPath || join("distillates", entry.service), file),
        name: basename(file, ".md"),
        content,
        estimatedTokens,
      });
    } catch {
      // Ignore
    }
  }

  return { fragments, unloadedTitles };
}

// ── Answer Assembly ───────────────────────────────────────────────

/**
 * Assemble the final answer with source citations.
 */
function assembleAnswer(
  question: string,
  table: RoutingTable,
  matchedEntries: RoutingTableEntry[],
  layer1Data: Map<string, QuickRefData>,
  layer2Fragments: Map<string, DistillateFragment[]>,
  unloadedTitles: Map<string, Array<{ file: string; name: string }>>,
  maxDepth: 0 | 1 | 2,
  warnings: QueryWarning[]
): QueryResult {
  const sources: SourceCitation[] = [];
  const layersLoaded: (0 | 1 | 2)[] = [0]; // Layer 0 always loaded
  let totalTokens = estimateTokens(table.rawContent);
  const answerParts: string[] = [];

  // Source: Layer 0 routing table
  sources.push({
    layer: 0,
    file: "routing-table.md",
    relevance: 1.0,
  });

  // Layer 0 summary
  if (matchedEntries.length === 0) {
    // This should not happen — handled before calling assembleAnswer
    return {
      answer: "未找到相关服务",
      sources,
      layersLoaded,
      tokensConsumed: totalTokens,
      servicesQueried: [],
      warnings,
    };
  }

  // Build answer from Layer 0 info
  answerParts.push(`## 相关服务`);
  for (const entry of matchedEntries) {
    answerParts.push(`### ${entry.service}`);
    answerParts.push(`- **角色**: ${entry.role}`);
    answerParts.push(`- **技术栈**: ${entry.stack}`);
    answerParts.push(`- **Owner**: ${entry.owner}`);
    if (entry.constraints) {
      answerParts.push(`- **关键约束**: ${entry.constraints}`);
    }
  }

  // Layer 1: Quick-Ref data
  if (maxDepth >= 1) {
    let hasLayer1 = false;
    for (const entry of matchedEntries) {
      const quickRef = layer1Data.get(entry.service);
      if (quickRef) {
        hasLayer1 = true;
        answerParts.push("");
        answerParts.push(`---`);
        answerParts.push(`## ${entry.service} 速查`);
        answerParts.push(`[来源: Layer 1 quick-ref.md]`);
        answerParts.push("");
        answerParts.push(quickRef.content);

        sources.push({
          layer: 1,
          file: quickRef.content
            ? join("skills", entry.service, "quick-ref.md")
            : entry.quickRefPath || join("skills", entry.service, "quick-ref.md"),
          relevance: 0.9,
        });

        totalTokens += estimateTokens(quickRef.content);
      }
    }
    if (hasLayer1) {
      layersLoaded.push(1);
    }
  }

  // Layer 2: Distillate fragments
  if (maxDepth >= 2) {
    let hasLayer2 = false;
    for (const entry of matchedEntries) {
      const fragments = layer2Fragments.get(entry.service);
      if (fragments && fragments.length > 0) {
        hasLayer2 = true;
        answerParts.push("");
        answerParts.push(`---`);
        answerParts.push(`## ${entry.service} 详细信息`);

        for (const frag of fragments) {
          answerParts.push("");
          answerParts.push(`### ${frag.name}`);
          answerParts.push(`[来源: Layer 2 ${frag.file}]`);
          answerParts.push("");
          answerParts.push(frag.content);

          sources.push({
            layer: 2,
            file: frag.file,
            section: frag.name,
            relevance: 0.8,
          });

          totalTokens += frag.estimatedTokens;
        }
      }
    }
    if (hasLayer2) {
      layersLoaded.push(2);
    }

    // Show unloaded fragment titles for reference
    if (unloadedTitles.size > 0) {
      answerParts.push("");
      answerParts.push("---");
      answerParts.push("## 更多相关片段（未加载，按需查询）");
      for (const [svc, titles] of unloadedTitles) {
        answerParts.push("");
        answerParts.push(`**${svc}**:`);
        for (const t of titles) {
          answerParts.push(`- ${t.name} (\`${t.file}\`)`);
        }
      }
    }
  }

  // Add warnings to answer
  if (warnings.length > 0) {
    answerParts.push("");
    answerParts.push("---");
    answerParts.push("## 注意事项");
    for (const w of warnings) {
      answerParts.push(`- **${w.code}**: ${w.message}`);
    }
  }

  // Deduplicate layersLoaded
  const uniqueLayers = [...new Set(layersLoaded)].sort() as (0 | 1 | 2)[];

  return {
    answer: answerParts.join("\n"),
    sources,
    layersLoaded: uniqueLayers,
    tokensConsumed: totalTokens,
    servicesQueried: matchedEntries.map((e) => e.service),
    warnings,
  };
}

// ── Main Query Function ───────────────────────────────────────────

/**
 * Execute a EDITH knowledge base query with three-layer progressive loading.
 *
 * @param params - Query parameters (question, services, max_depth)
 * @param config - EDITH configuration for workspace paths and token budgets
 * @returns QueryResult with answer, sources, and metadata
 */
export function executeQuery(params: QueryParams, config: EdithConfig): QueryResult {
  const { question, services, max_depth = 2 } = params;
  const workspaceRoot = resolve(config.workspace.root);
  const warnings: QueryWarning[] = [];

  // ── Validate Parameters ───────────────────────────────────────
  if (!question || !question.trim()) {
    return {
      answer: "参数错误：question 不能为空",
      sources: [],
      layersLoaded: [],
      tokensConsumed: 0,
      servicesQueried: [],
      warnings: [],
      error: {
        code: "KNOWLEDGE_BASE_EMPTY",
        message: "question 参数必填",
      },
    };
  }

  if (max_depth !== 0 && max_depth !== 1 && max_depth !== 2) {
    return {
      answer: "参数错误：max_depth 仅接受 0、1、2",
      sources: [],
      layersLoaded: [],
      tokensConsumed: 0,
      servicesQueried: [],
      warnings: [],
      error: {
        code: "CORRUPTED_FILE",
        message: `max_depth 值无效: ${max_depth}`,
      },
    };
  }

  // ── Layer 0: Load Routing Table ───────────────────────────────
  const { table, result: layer0Error } = loadLayer0(workspaceRoot);
  if (layer0Error) {
    return layer0Error;
  }

  // ── Service Matching ──────────────────────────────────────────
  const { matched, unmatched } = extractServiceNames(question, table.entries, services);

  // Report unmatched explicit services as warnings
  for (const svc of unmatched) {
    warnings.push({
      code: "SERVICE_NOT_FOUND",
      service: svc,
      message: `服务 "${svc}" 未在路由表中找到`,
    });
  }

  if (matched.length === 0) {
    const serviceList = table.entries.map((e) => e.service).join(", ");
    return {
      answer: `未在知识库中找到与问题相关的服务。已有服务: ${serviceList}`,
      sources: [
        {
          layer: 0,
          file: "routing-table.md",
          relevance: 1.0,
        },
      ],
      layersLoaded: [0],
      tokensConsumed: estimateTokens(table.rawContent),
      servicesQueried: [],
      warnings,
      error: {
        code: "SERVICE_NOT_FOUND",
        message: `问题未匹配到任何服务。已有服务: ${serviceList}`,
      },
    };
  }

  // ── Layer 1: Load Quick-Ref ───────────────────────────────────
  const layer1Data = new Map<string, QuickRefData>();

  if (max_depth >= 1) {
    for (const entry of matched) {
      const { data, warning } = loadLayer1(workspaceRoot, entry);
      if (warning) {
        warnings.push(warning);
      }
      if (data) {
        layer1Data.set(entry.service, data);
      }
    }
  }

  // ── Layer 2: Load Distillate Fragments (index-accelerated) ────
  const layer2Fragments = new Map<string, DistillateFragment[]>();
  const unloadedTitles = new Map<string, Array<{ file: string; name: string }>>();

  if (max_depth >= 2) {
    const tokenBudget = config.agent.context_budget.distillate_per_query;

    // Load index routing patterns if available
    let indexRouting: Map<string, string> | null = null;
    const indexPath = findIndexFile(workspaceRoot);
    if (indexPath) {
      try {
        const indexContent = readFileSync(indexPath, "utf-8");
        indexRouting = parseIndexRouting(indexContent);
        if (indexRouting.size > 0) {
          console.log(`[EDITH] Index-accelerated query: using ${indexRouting.size} routing patterns from ${basename(indexPath)}`);
        }
      } catch {
        // Index not usable, fall back to keyword scoring
      }
    }

    for (const entry of matched) {
      const { fragments, unloadedTitles: titles, warning } = loadLayer2(workspaceRoot, entry, question, tokenBudget, indexRouting);
      if (warning) {
        warnings.push(warning);
      }
      if (fragments.length > 0) {
        layer2Fragments.set(entry.service, fragments);
      }
      if (titles.length > 0) {
        unloadedTitles.set(entry.service, titles);
      }
    }
  }

  // ── Assemble Answer ───────────────────────────────────────────
  return assembleAnswer(
    question,
    table,
    matched,
    layer1Data,
    layer2Fragments,
    unloadedTitles,
    max_depth,
    warnings
  );
}

// ── Query Parameter Validation ────────────────────────────────────

/**
 * Validate query parameters and return an error message or null if valid.
 */
export function validateQueryParams(params: Partial<QueryParams>): string | null {
  if (!params.question || typeof params.question !== "string" || !params.question.trim()) {
    return "question 参数必填且不能为空";
  }

  if (params.max_depth !== undefined && ![0, 1, 2].includes(params.max_depth)) {
    return "max_depth 仅接受 0、1、2";
  }

  if (params.services !== undefined) {
    if (!Array.isArray(params.services)) {
      return "services 必须为字符串数组";
    }
    for (const svc of params.services) {
      if (typeof svc !== "string" || !svc.trim()) {
        return "services 数组中的每个元素必须为非空字符串";
      }
    }
  }

  return null;
}
