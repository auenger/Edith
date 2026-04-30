/**
 * EDITH Route Tool — edith_route implementation
 *
 * Requirement routing analysis: determines whether a user requirement
 * needs additional context loading and which loading strategy to use.
 *
 * Integrates with the requirement-router Skill.
 *
 * Routing decisions:
 *   - direct:      No additional context needed (single service CRUD, new service)
 *   - quick-ref:   Load Layer 1 quick-ref (interface changes, refactoring, incidents)
 *   - deep-dive:   Load Layer 1 + Layer 2 distillates (schema changes, model refactoring)
 *
 * Flow:
 *   1. Validate parameters (requirement is required, context is optional)
 *   2. Load Layer 0 routing-table.md
 *   3. Extract service names from requirement text
 *   4. Classify change type from requirement text
 *   5. Apply routing decision table
 *   6. Resolve file paths for recommended loads
 *   7. Calculate confidence and handle ambiguity
 *   8. Assemble RouteResult
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";

// ── Type Definitions ──────────────────────────────────────────────

/** Input parameters for edith_route */
export interface RouteParams {
  requirement: string;
  context?: string[];
}

/** Routing decision types */
export type RouteDecision = "direct" | "quick-ref" | "multi-service" | "deep-dive";

/** Change type classification */
export type ChangeType =
  | "crud"
  | "api_change"
  | "logic_change"
  | "schema_change"
  | "cross_service"
  | "incident"
  | "refactor"
  | "new_service"
  | "unknown";

/** Route result returned on success */
export interface RouteResult {
  decision: RouteDecision;
  services: string[];
  filesToLoad: string[];
  reason: string;
  confidence: number;
  ambiguity?: string;
  complexity?: ComplexityAnalysis;
  urgent?: boolean;
  isNewProject?: boolean;
  decisionChain?: string[];
}

/** Multi-dimensional complexity analysis */
export interface ComplexityAnalysis {
  entityCount: number;
  coordinationNeed: "none" | "low" | "medium" | "high";
  breakingChange: boolean;
  score: number;
}

/** Route error codes */
export type RouteErrorCode =
  | "ROUTING_TABLE_NOT_FOUND"
  | "UNCLEAR_REQUIREMENT"
  | "AMBIGUOUS_SERVICE";

/** Structured route error */
export interface RouteError {
  code: RouteErrorCode;
  message: string;
  suggestion: string;
}

/** Union return type */
export type RouteOutcome =
  | { ok: true; result: RouteResult }
  | { ok: false; error: RouteError };

/** Internal: Parsed routing table entry */
interface RoutingTableEntry {
  service: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
  aliases: string[];
}

// ── Constants ─────────────────────────────────────────────────────

/**
 * Change type keyword mapping.
 * Maps Chinese/English keywords to change type classifications.
 * Order matters: more specific types should come first (schema_change > api_change > crud).
 */
const CHANGE_TYPE_KEYWORDS: Array<{ type: ChangeType; keywords: string[] }> = [
  {
    type: "schema_change",
    keywords: [
      "schema", "字段定义", "数据模型", "datamodel", "data model",
      "改字段类型", "字段结构", "表结构", "变更 schema", "模型重构",
      "从.*改为.*对象", "字段.*改.*对象", "完整字段定义",
    ],
  },
  {
    type: "cross_service",
    keywords: [
      "同步", "调用.*服务", "集成", "联动", "跨服务", "数据流转",
      "同步更新", "自动.*扣减", "通知.*服务", "联调",
      "sync", "integrate", "cross-service", "orchestrate",
    ],
  },
  {
    type: "crud",
    keywords: [
      "加字段", "加列", "新增.*字段", "添加.*字段",
      "给.*表加", "给.*加字段", "改状态", "增删改查",
      "加.*phone", "加.*email", "加.*属性",
      "add field", "add column",
    ],
  },
  {
    type: "api_change",
    keywords: [
      "改接口", "修改接口", "变更.*接口", "加参数", "改返回值",
      "接口.*修改", "改 api", "api 变更",
      "change api", "modify endpoint", "接口.*参数",
      "修改.*接口", "的.*接口",
    ],
  },
  {
    type: "refactor",
    keywords: [
      "重构", "迁移", "升级", "替换", "改造",
      "refactor", "migrate", "upgrade", "rewrite",
    ],
  },
  {
    type: "incident",
    keywords: [
      "故障", "报警", "线上问题", "回滚", "紧急", "报错", "500",
      "incident", "outage", "rollback", "urgent", "bug",
    ],
  },
];

/**
 * Service name extraction patterns.
 * Tries to match known service names from routing table against requirement text.
 * Also tries common patterns like "xxx-service", "xxx 服务", etc.
 */
const SERVICE_PATTERNS = [
  /([\w-]+-service)/gi,
  /([\w-]+-svc)/gi,
  /([\w-]+-api)/gi,
  /([\w]+服务)/gu,
];

// ── Routing Table Loader ──────────────────────────────────────────

/**
 * Parse the routing-table.md Markdown table into structured entries.
 * Reuses the same parsing logic as query.ts.
 */
function parseRoutingTable(content: string): RoutingTableEntry[] {
  const entries: RoutingTableEntry[] = [];
  const lines = content.split("\n");
  let inServicesTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      inServicesTable = false;
      if (trimmed.includes("Services")) {
        inServicesTable = true;
      }
      continue;
    }

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
          aliases: generateAliases(serviceName, cells[1] || ""),
        });
      }
    }
  }

  return entries;
}

/**
 * Generate common aliases for a service name.
 * Includes role-based keywords for Chinese service matching.
 */
function generateAliases(serviceName: string, role: string): string[] {
  const aliases: string[] = [serviceName];

  if (serviceName.includes("-")) {
    aliases.push(serviceName.replace(/-/g, " "));
    aliases.push(serviceName.replace(/-/g, ""));
  }

  // CamelCase variant
  const camelName = serviceName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  aliases.push(camelName);

  // Role-based aliases (Chinese service names from role)
  if (role && role.length < 20) {
    aliases.push(role);
  }

  // Extract Chinese keywords from role for partial matching.
  // e.g., "用户中心" -> "用户中心", "订单处理" -> "订单处理", "库存管理" -> "库存管理"
  if (role) {
    const chinesePattern = /[一-龥]{2,4}/g;
    let match: RegExpExecArray | null;
    while ((match = chinesePattern.exec(role)) !== null) {
      const keyword = match[0];
      if (keyword.length >= 2 && !aliases.includes(keyword)) {
        aliases.push(keyword);
      }
    }
  }

  return aliases;
}

/**
 * Find routing-table.md in the workspace.
 */
function findRoutingTable(workspaceRoot: string): string | null {
  const candidates = [
    join(workspaceRoot, "skills", "company-edith", "routing-table.md"),
    join(workspaceRoot, "skills", "edith", "routing-table.md"),
    join(workspaceRoot, "routing-table.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Search in skills subdirectories
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
    // Ignore
  }

  return null;
}

/**
 * Load and parse the routing table from the workspace.
 */
function loadRoutingTable(
  workspaceRoot: string,
): { entries: RoutingTableEntry[] } | RouteError {
  const routingTablePath = findRoutingTable(workspaceRoot);

  if (!routingTablePath) {
    return {
      code: "ROUTING_TABLE_NOT_FOUND",
      message: "路由表不存在，请先蒸馏至少一个服务以生成 routing-table.md",
      suggestion: "使用 edith_distill 工具蒸馏至少一个服务，生成路由表后再使用 edith_route。",
    };
  }

  let rawContent: string;
  try {
    rawContent = readFileSync(routingTablePath, "utf-8");
  } catch {
    return {
      code: "ROUTING_TABLE_NOT_FOUND",
      message: "路由表文件无法读取",
      suggestion: "检查 routing-table.md 文件权限。",
    };
  }

  if (!rawContent.trim()) {
    return {
      code: "ROUTING_TABLE_NOT_FOUND",
      message: "路由表为空，请先蒸馏至少一个服务以生成 routing-table.md",
      suggestion: "使用 edith_distill 工具蒸馏至少一个服务。",
    };
  }

  const entries = parseRoutingTable(rawContent);
  return { entries };
}

// ── Service Name Extraction ───────────────────────────────────────

/**
 * Extract service names from a requirement text using routing table entries.
 * Returns matched service entries and a confidence score.
 */
function extractServices(
  requirement: string,
  entries: RoutingTableEntry[],
): { matched: RoutingTableEntry[]; confidence: number } {
  const reqLower = requirement.toLowerCase();
  const matched: RoutingTableEntry[] = [];

  // Match against known service names and aliases
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const aliasLower = alias.toLowerCase();
      const escapedAlias = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Word-boundary matching to avoid partial matches
      const regex = new RegExp(
        `(?:^|[-\\s/.,;:!?"'\`])${escapedAlias}(?:$|[-\\s/.,;:!?"'\`])`,
        "i",
      );
      if (regex.test(reqLower) || reqLower === aliasLower) {
        if (!matched.find((m) => m.service === entry.service)) {
          matched.push(entry);
        }
        break;
      }
    }
  }

  // If no direct matches, try extracting service-like patterns from text
  if (matched.length === 0) {
    const extractedNames = new Set<string>();
    for (const pattern of SERVICE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(requirement)) !== null) {
        extractedNames.add(match[1].toLowerCase());
      }
    }

    for (const name of extractedNames) {
      const entry = entries.find(
        (e) => e.service.toLowerCase() === name || e.aliases.some((a) => a.toLowerCase() === name),
      );
      if (entry && !matched.find((m) => m.service === entry.service)) {
        matched.push(entry);
      }
    }
  }

  // If still no matches, try matching Chinese business terms from role keywords.
  // Extract short Chinese terms (2 characters) from role fields and match
  // them against the requirement, considering common Chinese business suffixes.
  if (matched.length === 0) {
    for (const entry of entries) {
      const role = entry.role;
      if (!role) continue;

      // Extract 2-char Chinese keywords from role
      const chineseTerms: string[] = [];
      const chinesePattern = /[一-龥]{2,4}/g;
      let m: RegExpExecArray | null;
      while ((m = chinesePattern.exec(role)) !== null) {
        const term = m[0];
        // Add the full term and its first 2 chars
        chineseTerms.push(term);
        if (term.length >= 3) {
          chineseTerms.push(term.slice(0, 2));
        }
      }

      // Check if requirement contains any of these Chinese terms
      // followed by common business nouns like 表, 模块, 服务, 系统
      for (const term of chineseTerms) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `${escapedTerm}(?:表|模块|服务|系统|接口|逻辑|功能|数据|字段|接口)?`,
          "i",
        );
        if (pattern.test(requirement)) {
          if (!matched.find((me) => me.service === entry.service)) {
            matched.push(entry);
          }
          break;
        }
      }
    }
  }

  // Calculate confidence based on match precision
  let confidence = 0;
  if (matched.length === 1) {
    confidence = 0.95; // Single exact match
  } else if (matched.length >= 2) {
    // Multiple matches: check if they are truly ambiguous
    const namedCount = matched.filter((m) => {
      const svcLower = m.service.toLowerCase();
      return reqLower.includes(svcLower);
    }).length;

    if (namedCount === matched.length) {
      confidence = 0.9; // All explicitly named
    } else {
      confidence = 0.6; // Some are inferred, potential ambiguity
    }
  }

  return { matched, confidence };
}

// ── Change Type Classification ────────────────────────────────────

/**
 * Classify the change type from requirement text.
 * Returns the most specific type matching the requirement.
 * Priority: schema_change > cross_service > crud > api_change > refactor > incident.
 */
function classifyChange(requirement: string): ChangeType {
  const reqLower = requirement.toLowerCase();

  // Score each change type by keyword match count
  const scores: Array<{ type: ChangeType; score: number }> = [];

  for (const { type, keywords } of CHANGE_TYPE_KEYWORDS) {
    let score = 0;
    for (const keyword of keywords) {
      try {
        const regex = new RegExp(keyword, "i");
        if (regex.test(reqLower)) {
          score += 1;
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }
    scores.push({ type, score });
  }

  // Sort by score descending; use type priority as tiebreaker
  // (CHANGE_TYPE_KEYWORDS order is the priority order)
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0; // Same score: first in list wins (already in priority order)
  });

  if (scores.length > 0 && scores[0].score > 0) {
    return scores[0].type;
  }

  return "unknown";
}

// ── Routing Decision Engine ───────────────────────────────────────

/**
 * Apply the routing decision table based on matched services and change type.
 *
 * Decision table:
 *   0 known services -> direct
 *   1 service + crud -> direct
 *   1 service + api_change/logic_change/refactor/incident -> quick-ref
 *   1 service + schema_change -> deep-dive
 *   2+ services + non-cross -> multi-service
 *   2+ services + cross_service/schema_change -> deep-dive
 */
function routeDecision(
  services: RoutingTableEntry[],
  changeType: ChangeType,
  isUrgent: boolean,
): { decision: RouteDecision; reason: string; chain: string[] } {
  const chain: string[] = [];
  const serviceCount = services.length;
  const serviceNames = services.map((s) => s.service);

  if (serviceCount === 0) {
    chain.push("信号: 无匹配服务");
    return { decision: "direct", reason: "无需特定服务上下文，未匹配到已知服务", chain };
  }

  if (serviceCount === 1) {
    const svc = services[0].service;
    chain.push(`信号: 单服务匹配=${svc}`);
    chain.push(`信号: 变更类型=${changeType}`);

    if (isUrgent) {
      chain.push("信号: 紧急事件检测");
      return { decision: "quick-ref", reason: `${svc} 紧急事件，优先加载速查卡快速定位`, chain };
    }

    switch (changeType) {
      case "crud":
        return { decision: "direct", reason: `单服务 ${svc} CRUD 操作，无需额外上下文`, chain };
      case "api_change":
        return { decision: "quick-ref", reason: `需要修改 ${svc} 接口，了解现有约束和接口契约`, chain };
      case "logic_change":
        return { decision: "quick-ref", reason: `需要修改 ${svc} 业务逻辑，了解关键约束和易错点`, chain };
      case "incident":
        return { decision: "quick-ref", reason: `${svc} 紧急故障，加载速查卡快速定位问题`, chain };
      case "refactor":
        return { decision: "quick-ref", reason: `${svc} 需要重构，先了解接口约束和依赖关系`, chain };
      case "schema_change":
        return { decision: "deep-dive", reason: `${svc} 需要修改数据模型/Schema，需要完整字段定义`, chain };
      default:
        return { decision: "quick-ref", reason: `${svc} 可能需要接口或逻辑上下文，建议加载速查卡`, chain };
    }
  }

  // serviceCount >= 2
  chain.push(`信号: 多服务匹配=[${serviceNames.join(", ")}]`);
  chain.push(`信号: 变更类型=${changeType}`);

  if (changeType === "schema_change") {
    return { decision: "deep-dive", reason: `多服务 (${serviceNames.join(", ")}) Schema 变更，需要多个服务的完整数据模型`, chain };
  }

  if (changeType === "cross_service") {
    return { decision: "deep-dive", reason: `跨服务变更 (${serviceNames.join(", ")})，需要各服务的完整上下文`, chain };
  }

  // Non-cross-service multi-service: use multi-service strategy
  return { decision: "multi-service", reason: `涉及 ${serviceCount} 个服务 (${serviceNames.join(", ")})，加载各服务速查卡`, chain };
}

// ── File Path Resolution ──────────────────────────────────────────

/**
 * Resolve file paths for recommended loads based on the routing decision.
 * Checks for file existence and marks missing files.
 */
function resolveFilePaths(
  workspaceRoot: string,
  services: RoutingTableEntry[],
  decision: RouteDecision,
  changeType: ChangeType,
  loadedContext: string[],
  isUrgent?: boolean,
): { filesToLoad: string[]; missingFiles: string[] } {
  const filesToLoad: string[] = [];
  const missingFiles: string[] = [];

  if (decision === "direct") {
    return { filesToLoad: [], missingFiles: [] };
  }

  for (const entry of services) {
    const quickRefCandidates = [
      join(workspaceRoot, "skills", entry.service, "quick-ref.md"),
      join(workspaceRoot, entry.service, "quick-ref.md"),
    ];

    let quickRefPath: string | undefined;
    for (const candidate of quickRefCandidates) {
      if (existsSync(candidate)) {
        quickRefPath = candidate;
        break;
      }
    }

    // quick-ref, multi-service, deep-dive all need quick-ref
    if (decision === "quick-ref" || decision === "multi-service" || decision === "deep-dive") {
      const relativePath = join("skills", entry.service, "quick-ref.md");
      if (quickRefPath) {
        if (!loadedContext.some((c) => c.includes(entry.service) && c.includes("quick-ref"))) {
          filesToLoad.push(relativePath);
        }
      } else {
        missingFiles.push(relativePath);
      }
    }

    // deep-dive or urgent incidents also need distillate fragments
    if (decision === "deep-dive" || isUrgent) {
      const distillatesDir = join(workspaceRoot, "distillates", entry.service);

      if (existsSync(distillatesDir) && statSync(distillatesDir).isDirectory()) {
        let files: string[];
        try {
          files = readdirSync(distillatesDir).filter((f) => f.endsWith(".md") && f !== "_index.md").sort();
        } catch { files = []; }

        const selectedFragments = selectDistillateFragments(files, changeType, loadedContext, entry.service);
        for (const frag of selectedFragments) {
          filesToLoad.push(join("distillates", entry.service, frag));
        }
        if (files.length === 0) missingFiles.push(join("distillates", entry.service) + "/");
      } else {
        missingFiles.push(join("distillates", entry.service) + "/");
      }
    }
  }

  return { filesToLoad, missingFiles };
}

/**
 * Select relevant distillate fragments based on change type and semantic tags.
 * Uses filename patterns to match fragment relevance.
 */
function selectDistillateFragments(
  allFiles: string[],
  changeType: ChangeType,
  loadedContext: string[],
  serviceName: string,
): string[] {
  // Map change types to fragment name patterns
  const relevancePatterns: Record<ChangeType, string[]> = {
    schema_change: ["data-model", "data_model", "schema", "model", "entity", "数据库", "数据"],
    api_change: ["api", "contract", "接口", "endpoint", "rest"],
    logic_change: ["logic", "business", "流程", "flow", "规则", "rule"],
    cross_service: ["api", "contract", "接口", "integration", "集成"],
    crud: ["data-model", "data_model", "schema", "model"],
    refactor: ["overview", "概览", "architecture", "架构", "api", "data-model"],
    incident: ["api", "contract", "接口", "log", "日志", "error", "错误"],
    new_service: ["overview", "概览", "architecture", "架构", "api", "data-model", "model"],
    unknown: [],
  };

  const patterns = relevancePatterns[changeType] || [];

  // Score each file by relevance
  const scored = allFiles.map((file) => {
    const nameLower = basename(file, ".md").toLowerCase();
    let score = 0;

    for (const pattern of patterns) {
      if (nameLower.includes(pattern)) {
        score += 10;
      }
    }

    // Prefix-based priority (numbered fragments)
    const prefixMatch = nameLower.match(/^(\d+)/);
    if (prefixMatch) {
      const num = parseInt(prefixMatch[1], 10);
      if (num <= 1) score += 5; // overview/summary fragments
    }

    return { file, score };
  });

  // Sort by score descending, then alphabetically
  scored.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  // Select relevant fragments by score, no fixed count limit
  const selected: string[] = [];
  for (const { file, score } of scored) {
    // Skip zero-score fragments if we already have matches
    if (score === 0 && selected.length > 0) continue;

    // Check if already in loaded context
    const relativePath = join("distillates", serviceName, file);
    if (loadedContext.some((c) => c.includes(relativePath))) continue;

    selected.push(file);
  }

  // If no matches at all, include first file as fallback
  if (selected.length === 0 && allFiles.length > 0) {
    const file = allFiles[0];
    const relativePath = join("distillates", serviceName, file);
    if (!loadedContext.some((c) => c.includes(relativePath))) {
      selected.push(file);
    }
  }

  return selected;
}

// ── Confidence Calculation ────────────────────────────────────────

/**
 * Calculate overall confidence score for the routing decision.
 * Based on:
 *   - Service name match precision (from extractServices)
 *   - Change type classification certainty
 *   - Number of matched services (ambiguity increases with partial matches)
 */
function calculateConfidence(
  serviceConfidence: number,
  changeType: ChangeType,
  serviceCount: number,
): number {
  // Change type certainty multiplier
  const changeTypeMultiplier: Record<ChangeType, number> = {
    crud: 1.0,
    api_change: 0.95,
    schema_change: 0.95,
    cross_service: 0.9,
    incident: 0.85,
    logic_change: 0.8,
    refactor: 0.8,
    new_service: 1.0,
    unknown: 0.5,
  };

  const changeCertainty = changeTypeMultiplier[changeType] ?? 0.5;

  // Combine scores: weighted average favoring service match
  const combined = serviceConfidence * 0.7 + changeCertainty * 0.3;

  // If no services matched, confidence is based purely on change type
  if (serviceCount === 0) {
    return changeType === "unknown" ? 0.3 : 0.6;
  }

  return Math.min(Math.round(combined * 100) / 100, 1.0);
}

// ── Complexity Analysis ────────────────────────────────────────────

/**
 * Multi-dimensional complexity analysis of the requirement.
 */
export function analyzeComplexity(requirement: string, serviceCount: number): ComplexityAnalysis {
  const lower = requirement.toLowerCase();

  // Entity count: extract noun phrases that look like domain entities
  const entityPatterns = [
    /[A-Z][a-z]+(?:[A-Z][a-z]+)*/g, // CamelCase
    /[\w]+(?:表|模型|实体|字段|接口|服务)/g, // Chinese suffixed
  ];
  const entities = new Set<string>();
  for (const pat of entityPatterns) {
    let m;
    while ((m = pat.exec(requirement)) !== null) entities.add(m[0]);
  }

  // Coordination need
  let coordination: ComplexityAnalysis["coordinationNeed"] = "none";
  if (serviceCount >= 3) coordination = "high";
  else if (serviceCount >= 2) coordination = "medium";
  else if (lower.includes("同步") || lower.includes("协调") || lower.includes("联调")) coordination = "low";

  // Breaking change detection
  const breakingKeywords = [
    "删除字段", "改字段类型", "删除接口", "废弃", "breaking",
    "不兼容", "迁移数据", "rename", "drop column", "删除表",
  ];
  const breakingChange = breakingKeywords.some((kw) => lower.includes(kw));

  // Overall score 0-100
  const entityScore = Math.min(entities.size * 5, 30);
  const coordScore = coordination === "high" ? 30 : coordination === "medium" ? 20 : coordination === "low" ? 10 : 0;
  const breakScore = breakingChange ? 40 : 0;
  const score = Math.min(entityScore + coordScore + breakScore, 100);

  return { entityCount: entities.size, coordinationNeed: coordination, breakingChange, score };
}

// ── Urgent Incident Detection ─────────────────────────────────────

const URGENT_P0_KEYWORDS = ["线上故障", "生产事故", "500报错", "502", "503", "服务不可用", "outage", "down"];
const URGENT_P1_KEYWORDS = ["紧急", "回滚", "紧急修复", "urgent", "rollback", "hotfix", "报错", "报警", "异常"];

/**
 * Detect if requirement describes an urgent incident.
 */
export function detectUrgentIncident(requirement: string): boolean {
  const lower = requirement.toLowerCase();
  return URGENT_P0_KEYWORDS.some((kw) => lower.includes(kw)) ||
         URGENT_P1_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2;
}

// ── New Project Detection ─────────────────────────────────────────

const NEW_PROJECT_KEYWORDS = [
  "新建项目", "初始化", "创建新", "新项目", "从零开始", "全新服务",
  "new project", "initialize", "scaffold", "from scratch",
];

/**
 * Detect if the requirement is about creating a new project.
 */
export function isNewProject(requirement: string): boolean {
  const lower = requirement.toLowerCase();
  return NEW_PROJECT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Main Route Function ───────────────────────────────────────────

/**
 * Execute a EDITH route analysis.
 *
 * This is the main entry point called by the extension tool handler.
 *
 * @param params - Route parameters (requirement, context)
 * @param workspaceRoot - Workspace root directory from edith.yaml
 * @returns Route outcome — either a successful RouteResult or a RouteError
 */
export function executeRoute(
  params: RouteParams,
  workspaceRoot: string,
): RouteOutcome {
  const { requirement, context = [] } = params;
  const absWorkspaceRoot = resolve(workspaceRoot);

  // ── Step 1: Validate parameters ─────────────────────────────────
  if (!requirement || !requirement.trim()) {
    return {
      ok: false,
      error: {
        code: "UNCLEAR_REQUIREMENT",
        message: "需求描述不能为空",
        suggestion: "请提供具体的需求描述，包含目标服务名称和期望的改动。",
      },
    };
  }

  // ── Step 2: Load routing table ──────────────────────────────────
  const tableResult = loadRoutingTable(absWorkspaceRoot);
  if ("code" in tableResult) {
    // It's an error
    return { ok: false, error: tableResult };
  }

  const { entries } = tableResult;

  // ── Step 3: Extract services ────────────────────────────────────
  const { matched, confidence: serviceConfidence } = extractServices(requirement, entries);

  // ── Step 4: Classify change type ────────────────────────────────
  const changeType = classifyChange(requirement);

  // ── Step 4b: Detect urgent incident and new project ────────────
  const isUrgent = detectUrgentIncident(requirement);
  const isNew = isNewProject(requirement);

  // ── Step 4c: Analyze complexity ────────────────────────────────
  const complexity = analyzeComplexity(requirement, matched.length);

  // ── Step 5: Check for unclear requirement ───────────────────────
  if (matched.length === 0 && changeType === "unknown" && !isNew) {
    const serviceList = entries.map((e) => e.service).join(", ");
    return {
      ok: false,
      error: {
        code: "UNCLEAR_REQUIREMENT",
        message: `无法从需求描述中识别目标服务和改动类型。已有服务: ${serviceList}`,
        suggestion: "请在需求描述中明确目标服务名称和期望的改动类型。",
      },
    };
  }

  // ── Step 5b: New project short-circuit ──────────────────────────
  if (isNew && matched.length === 0) {
    return {
      ok: true,
      result: {
        decision: "direct",
        services: [],
        filesToLoad: [],
        reason: "新项目初始化，无需加载已有服务上下文",
        confidence: 0.95,
        isNewProject: true,
        complexity,
        decisionChain: ["信号: 新项目关键词检测", "决策: direct（新项目无需已有上下文）"],
      },
    };
  }

  // ── Step 6: Routing decision ────────────────────────────────────
  const { decision, reason, chain } = routeDecision(matched, changeType, isUrgent);

  // ── Step 7: Resolve file paths ──────────────────────────────────
  const { filesToLoad, missingFiles } = resolveFilePaths(
    absWorkspaceRoot,
    matched,
    decision,
    changeType,
    context,
    isUrgent,
  );

  // ── Step 8: Calculate confidence & handle ambiguity ─────────────
  let confidence = calculateConfidence(serviceConfidence, changeType, matched.length);

  // Urgent incidents: lower confidence threshold (more conservative)
  if (isUrgent) {
    confidence = Math.min(confidence * 0.9, 0.85);
    chain.push("信号: 紧急事件 — 置信度降低，保守路由");
  }

  let ambiguity: string | undefined;

  if (confidence < 0.7 && matched.length >= 2) {
    const serviceNames = matched.map((m) => m.service).join(", ");
    ambiguity = `需求可能涉及 ${serviceNames}，请明确目标服务`;
  } else if (confidence < 0.7 && matched.length === 0) {
    ambiguity = "未匹配到明确的已知服务，可能需要手动指定服务名";
  }

  // ── Step 9: Build result ────────────────────────────────────────
  const result: RouteResult = {
    decision,
    services: matched.map((m) => m.service),
    filesToLoad,
    reason,
    confidence,
    complexity,
    ...(ambiguity ? { ambiguity } : {}),
    ...(isUrgent ? { urgent: true } : {}),
    ...(isNew ? { isNewProject: true } : {}),
    decisionChain: chain,
  };

  // Append missing files info to reason
  if (missingFiles.length > 0) {
    result.reason += `。部分文件尚未生成: ${missingFiles.join(", ")}`;
  }

  return { ok: true, result };
}

// ── Output Formatting ─────────────────────────────────────────────

/**
 * Build a human-readable summary from a RouteResult.
 * This is what the Agent shows to the user.
 */
export function formatRouteSummary(result: RouteResult): string {
  const lines: string[] = [
    "EDITH 需求路由分析", "",
    `  决策: ${result.decision}`,
    `  匹配服务: ${result.services.length > 0 ? result.services.join(", ") : "无"}`,
    `  置信度: ${(result.confidence * 100).toFixed(0)}%`,
    "",
    `  原因: ${result.reason}`,
  ];

  if (result.urgent) lines.push("  ⚠️ 紧急事件: 是");
  if (result.isNewProject) lines.push("  新项目: 是");

  if (result.complexity && result.complexity.score > 0) {
    lines.push("", `  复杂度: ${result.complexity.score}/100 (实体: ${result.complexity.entityCount}, 协调: ${result.complexity.coordinationNeed}, 破坏性: ${result.complexity.breakingChange ? "是" : "否"})`);
  }

  if (result.filesToLoad.length > 0) {
    lines.push("", "  建议加载:");
    for (const file of result.filesToLoad) lines.push(`    - ${file}`);
  }

  if (result.decisionChain && result.decisionChain.length > 0) {
    lines.push("", "  决策依据:");
    for (const step of result.decisionChain) lines.push(`    ${step}`);
  }

  if (result.ambiguity) lines.push("", `  注意: ${result.ambiguity}`);

  return lines.join("\n");
}

/**
 * Build a human-readable error message from a RouteError.
 */
export function formatRouteError(error: RouteError): string {
  return [
    "EDITH 需求路由分析失败",
    "",
    `  错误: ${error.message}`,
    `  代码: ${error.code}`,
    `  建议: ${error.suggestion}`,
  ].join("\n");
}
