/**
 * EDITH Index Tool — edith_index implementation
 *
 * Generates a standardized Markdown index Skill from one or more distilled
 * knowledge bases (routing-table + quick-ref + distillates).
 *
 * The index Skill is a single Markdown file that external Agents (Claude Code,
 * Cursor, etc.) can load to instantly gain project knowledge.
 *
 * Structure:
 *   1. Parse routing-table.md → service map
 *   2. Parse quick-ref.md per service → verify commands, constraints, pitfalls, APIs
 *   3. Parse distillates/*.md per service → fragment index with summaries
 *   4. Parse cross-references → cross-service relationships
 *   5. Generate query routing patterns from fragment topics
 *   6. Assemble into a single Markdown file with YAML frontmatter
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";

// ── Type Definitions ──────────────────────────────────────────────

export interface IndexParams {
  target?: string;
  output_path?: string;
  services?: string[];
}

export interface ServiceInfo {
  name: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string[];
}

export interface QuickRefInfo {
  verify: string[];
  constraints: string[];
  pitfalls: string[];
  apiEndpoints: string[];
  deepDive: string[];
}

export interface DistillateInfo {
  file: string;
  topic: string;
  summary: string;
}

export interface CrossServiceRelation {
  from: string;
  to: string;
  type: string;
  detail: string;
}

export interface IndexResult {
  output_path: string;
  services_count: number;
  fragments_count: number;
  cross_relations_count: number;
  estimated_tokens: number;
}

export type IndexErrorCode =
  | "NO_KNOWLEDGE_BASE"
  | "ROUTING_TABLE_NOT_FOUND"
  | "OUTPUT_WRITE_FAILED"
  | "NO_SERVICES_FOUND";

export interface IndexError {
  code: IndexErrorCode;
  message: string;
  suggestion: string;
}

export type IndexOutcome =
  | { ok: true; result: IndexResult }
  | { ok: false; error: IndexError };

// ── Token Estimation ──────────────────────────────────────────────

const MAX_INDEX_TOKENS = 5000;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// ── Routing Table Parser ──────────────────────────────────────────

function parseRoutingTable(
  content: string,
): { services: ServiceInfo[]; quickRefPaths: Map<string, string> } {
  const services: ServiceInfo[] = [];
  const quickRefPaths = new Map<string, string>();
  const lines = content.split("\n");
  let section: "services" | "quickref" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      if (trimmed.includes("Services")) section = "services";
      else if (trimmed.includes("Quick-Ref")) section = "quickref";
      else section = null;
      continue;
    }

    if (!trimmed.startsWith("|") || trimmed.includes("---")) continue;

    const rawCells = trimmed.split("|");
    // Remove leading/trailing empty elements from edge splits
    const cells = rawCells.slice(1, -1).map((c) => c.trim());

    if (section === "services" && cells.length >= 4 && cells[0] !== "Service") {
      services.push({
        name: cells[0],
        role: cells[1] || "",
        stack: cells[2] || "",
        owner: cells[3] || "",
        constraints: (cells[4] || "")
          .split(/[；;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      });
    }

    if (section === "quickref" && cells.length >= 2 && cells[0] !== "Service") {
      quickRefPaths.set(cells[0], cells[1]);
    }
  }

  return { services, quickRefPaths };
}

// ── Quick-Ref Parser ──────────────────────────────────────────────

function parseQuickRef(content: string): QuickRefInfo {
  const sections = splitSections(content);

  return {
    verify: extractListItems(sections.get("Verify") || ""),
    constraints: extractTableRows(sections.get("Key Constraints") || ""),
    pitfalls: extractTableRows(sections.get("Pitfalls") || ""),
    apiEndpoints: extractListItems(sections.get("API Endpoints") || ""),
    deepDive: extractListItems(sections.get("Deep Dive") || ""),
  };
}

function splitSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const pattern = /^##?\s+(.+)$/gm;
  const positions: Array<{ title: string; start: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    positions.push({ title: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const end =
      i + 1 < positions.length ? positions[i + 1].start : content.length;
    sections.set(
      positions[i].title,
      content.slice(positions[i].start, end).trim(),
    );
  }

  return sections;
}

function extractListItems(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") || l.startsWith("* "))
    .map((l) => l.replace(/^[-*]\s+/, "").trim())
    .filter((l) => l.length > 0);
}

function extractTableRows(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && !l.includes("---"))
    .map((l) => {
      const cells = l.split("|").slice(1, -1).map((c) => c.trim());
      return cells.filter((c) => c.length > 0).join(": ");
    })
    .filter((l) => l.length > 0);
}

// ── Distillates Parser ────────────────────────────────────────────

const TOPIC_MAP: Record<string, string> = {
  "01-overview": "架构概览",
  "02-api-contracts": "API 接口契约",
  "03-data-models": "数据模型",
  "04-business-logic": "业务逻辑",
  "05-development-guide": "开发部署",
  "00-cross-references": "跨服务引用",
};

function inferTopic(filename: string): string {
  const name = basename(filename, ".md").toLowerCase();
  if (TOPIC_MAP[name]) return TOPIC_MAP[name];

  if (name.includes("api") || name.includes("contract") || name.includes("接口"))
    return "API 接口契约";
  if (name.includes("data") || name.includes("model") || name.includes("schema") || name.includes("数据"))
    return "数据模型";
  if (name.includes("logic") || name.includes("business") || name.includes("规则"))
    return "业务逻辑";
  if (name.includes("overview") || name.includes("概览") || name.includes("架构"))
    return "架构概览";
  if (name.includes("deploy") || name.includes("开发") || name.includes("部署"))
    return "开发部署";
  if (name.includes("cross") || name.includes("引用"))
    return "跨服务引用";

  return name;
}

function extractSummary(content: string): string {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const bodyLines = lines.slice(
    lines.findIndex((l) => l.startsWith("#")) + 1,
  );
  const summaryParts: string[] = [];

  for (const line of bodyLines) {
    if (line.startsWith("#")) break;
    const cleaned = line.replace(/^[-*]\s+/, "").replace(/^>\s*/, "").trim();
    if (cleaned.length > 0 && !cleaned.startsWith("---") && !cleaned.startsWith("```")) {
      summaryParts.push(cleaned);
    }
    if (summaryParts.length >= 3) break;
  }

  return summaryParts.join("; ").slice(0, 200);
}

function parseDistillates(dir: string): DistillateInfo[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];

  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }

  return files.map((file) => {
    const filePath = join(dir, file);
    let content = "";
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      // ignore
    }
    return {
      file,
      topic: inferTopic(file),
      summary: extractSummary(content),
    };
  });
}

// ── Cross-References Parser ───────────────────────────────────────

function parseCrossReferences(
  content: string,
  serviceName: string,
): CrossServiceRelation[] {
  const relations: CrossServiceRelation[] = [];
  const pattern =
    /\*\*(.+?)\*\*\s*→\s*\*\*(.+?)\*\*\s*\((\w[\w-]*)\)(?::\s*(.+))?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    relations.push({
      from: match[1],
      to: match[2],
      type: match[3],
      detail: match[4] || "",
    });
  }

  return relations;
}

// ── Index Generator ───────────────────────────────────────────────

const QUERY_ROUTING: Record<string, string> = {
  架构概览: "问架构/技术栈 → 加载 01-overview",
  "API 接口契约": "问 API/接口 → 加载 02-api-contracts",
  数据模型: "问数据模型/实体/字段 → 加载 03-data-models",
  业务逻辑: "问业务逻辑/规则/流程 → 加载 04-business-logic",
  开发部署: "问开发/部署/配置 → 加载 05-development-guide",
};

function generateIndex(
  kbDir: string,
  services: ServiceInfo[],
  quickRefPaths: Map<string, string>,
  company: string,
): { content: string; estimatedTokens: number } {
  const parts: string[] = [];
  const serviceNames = services.map((s) => s.name);

  // Frontmatter
  parts.push("---");
  parts.push(`name: ${company}-knowledge-index`);
  parts.push(
    `description: 项目知识索引 — ${serviceNames.join(", ")}。加载后 Agent 自动获得项目知识。`,
  );
  parts.push("version: 1.0");
  parts.push("generated_by: edith-knowledge-index");
  parts.push(`generated_at: "${new Date().toISOString()}"`);
  parts.push(`services: [${serviceNames.map((s) => `"${s}"`).join(", ")}]`);
  parts.push("---");
  parts.push("");
  parts.push(`# ${company} 知识索引`);
  parts.push("");

  // Section 1: Service Map
  parts.push("## 服务地图");
  parts.push("");
  parts.push("| 服务 | 角色 | 技术栈 | 关键约束 |");
  parts.push("|------|------|--------|----------|");

  const allQuickRef = new Map<string, QuickRefInfo>();
  const allDistillates = new Map<string, DistillateInfo[]>();
  const allCrossRefs: CrossServiceRelation[] = [];

  for (const svc of services) {
    const constraintsStr =
      svc.constraints.length > 0 ? svc.constraints.slice(0, 3).join("; ") : "";
    parts.push(
      `| ${svc.name} | ${svc.role.slice(0, 40)} | ${svc.stack} | ${constraintsStr} |`,
    );

    // Parse quick-ref
    const qrp = quickRefPaths.get(svc.name);
    if (qrp) {
      const qrPath = join(kbDir, qrp);
      if (existsSync(qrPath)) {
        try {
          const qrContent = readFileSync(qrPath, "utf-8");
          allQuickRef.set(svc.name, parseQuickRef(qrContent));
        } catch {
          // ignore
        }
      }
    }

    // Parse distillates
    const distDir = join(kbDir, svc.name, "distillates");
    const dists = parseDistillates(distDir);
    if (dists.length > 0) allDistillates.set(svc.name, dists);

    // Parse cross-references
    const crossRefPath = join(distDir, "00-cross-references.md");
    if (existsSync(crossRefPath)) {
      try {
        const crContent = readFileSync(crossRefPath, "utf-8");
        allCrossRefs.push(...parseCrossReferences(crContent, svc.name));
      } catch {
        // ignore
      }
    }
  }

  parts.push("");

  // Section 2: Quick Reference
  parts.push("## 快速参考");
  parts.push("");
  for (const [svcName, qr] of allQuickRef) {
    parts.push(`### ${svcName}`);
    if (qr.verify.length > 0) {
      parts.push(`- 验证: ${qr.verify.slice(0, 4).join(", ")}`);
    }
    if (qr.apiEndpoints.length > 0) {
      parts.push(`- 关键 API: ${qr.apiEndpoints.slice(0, 5).join(", ")}`);
    }
    if (qr.constraints.length > 0) {
      parts.push(`- 关键约束: ${qr.constraints.slice(0, 3).join("; ")}`);
    }
    if (qr.pitfalls.length > 0) {
      parts.push(`- 易错点: ${qr.pitfalls.slice(0, 3).join("; ")}`);
    }
    parts.push("");
  }

  // Section 3: Cross-Service Relations
  if (allCrossRefs.length > 0) {
    parts.push("## 跨服务关系");
    parts.push("");
    const seen = new Set<string>();
    for (const rel of allCrossRefs) {
      const key = `${rel.from}|${rel.to}|${rel.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const detail = rel.detail ? `: ${rel.detail}` : "";
      parts.push(`- ${rel.from} → ${rel.to} (${rel.type})${detail}`);
    }
    parts.push("");
  }

  // Section 4: Fragment Index
  parts.push("## 知识片段索引");
  parts.push("");
  for (const [svcName, dists] of allDistillates) {
    parts.push(`### ${svcName} 片段`);
    parts.push("| 片段 | 主题 | 摘要 |");
    parts.push("|------|------|------|");
    for (const d of dists) {
      if (d.file.startsWith("00-cross")) continue;
      const summary = d.summary.slice(0, 80);
      parts.push(`| ${d.file} | ${d.topic} | ${summary} |`);
    }
    parts.push("");
  }

  // Section 5: Query Routing Patterns
  parts.push("## 查询路由模式");
  parts.push("");
  const coveredTopics = new Set<string>();
  for (const dists of allDistillates.values()) {
    for (const d of dists) {
      if (QUERY_ROUTING[d.topic]) coveredTopics.add(d.topic);
    }
  }
  for (const topic of coveredTopics) {
    parts.push(`- ${QUERY_ROUTING[topic]}`);
  }
  parts.push("- 问跨服务/依赖关系 → 加载 00-cross-references");
  parts.push("");

  const content = parts.join("\n");
  return { content, estimatedTokens: estimateTokens(content) };
}

// ── Knowledge Base Discovery ──────────────────────────────────────

function findKnowledgeBaseDir(
  workspaceRoot: string,
  target?: string,
): string | null {
  if (target) {
    const abs = resolve(workspaceRoot, target);
    if (
      existsSync(join(abs, "routing-table.md")) ||
      existsSync(abs)
    ) {
      return abs;
    }
  }

  const candidates = [
    join(workspaceRoot, "company-edith"),
    join(workspaceRoot, "skills", "company-edith"),
    join(workspaceRoot, "skills", "edith"),
    workspaceRoot,
  ];

  for (const c of candidates) {
    if (existsSync(join(c, "routing-table.md"))) return c;
  }

  return null;
}

// ── Main Execution ────────────────────────────────────────────────

export function executeIndex(
  params: IndexParams,
  workspaceRoot: string,
): IndexOutcome {
  const { target, output_path, services: filterServices } = params;
  const absRoot = resolve(workspaceRoot);

  // Find knowledge base directory
  const kbDir = findKnowledgeBaseDir(absRoot, target);
  if (!kbDir) {
    return {
      ok: false,
      error: {
        code: "ROUTING_TABLE_NOT_FOUND",
        message: "找不到知识库目录（需要 routing-table.md）",
        suggestion:
          "请先使用 edith_distill 蒸馏至少一个服务，或指定正确的知识库目录路径。",
      },
    };
  }

  // Load routing table
  const rtPath = join(kbDir, "routing-table.md");
  let rtContent: string;
  try {
    rtContent = readFileSync(rtPath, "utf-8");
  } catch {
    return {
      ok: false,
      error: {
        code: "ROUTING_TABLE_NOT_FOUND",
        message: "routing-table.md 无法读取",
        suggestion: "检查文件权限。",
      },
    };
  }

  const { services, quickRefPaths } = parseRoutingTable(rtContent);
  if (services.length === 0) {
    return {
      ok: false,
      error: {
        code: "NO_SERVICES_FOUND",
        message: "路由表中没有服务条目",
        suggestion: "请先蒸馏至少一个服务。",
      },
    };
  }

  // Filter services if specified
  const filtered = filterServices
    ? services.filter((s) =>
        filterServices.some(
          (f) => f.toLowerCase() === s.name.toLowerCase(),
        ),
      )
    : services;

  if (filtered.length === 0 && filterServices) {
    return {
      ok: false,
      error: {
        code: "NO_SERVICES_FOUND",
        message: `指定的服务 ${filterServices.join(", ")} 在路由表中未找到`,
        suggestion: `已有服务: ${services.map((s) => s.name).join(", ")}`,
      },
    };
  }

  // Derive company name from directory
  const company = basename(kbDir);

  // Generate index
  const { content, estimatedTokens } = generateIndex(
    kbDir,
    filtered,
    quickRefPaths,
    company,
  );

  // Determine output path
  const outPath = output_path
    ? resolve(absRoot, output_path)
    : join(kbDir, `${company}-knowledge-index.md`);

  // Ensure output directory exists
  const outDir = resolve(outPath, "..");
  if (!existsSync(outDir)) {
    try {
      mkdirSync(outDir, { recursive: true });
    } catch {
      return {
        ok: false,
        error: {
          code: "OUTPUT_WRITE_FAILED",
          message: `无法创建输出目录: ${outDir}`,
          suggestion: "检查目录权限。",
        },
      };
    }
  }

  // Write index
  try {
    writeFileSync(outPath, content, "utf-8");
  } catch {
    return {
      ok: false,
      error: {
        code: "OUTPUT_WRITE_FAILED",
        message: `无法写入索引文件: ${outPath}`,
        suggestion: "检查文件写入权限。",
      },
    };
  }

  // Count fragments and cross-relations
  let fragmentsCount = 0;
  let crossRefCount = 0;
  for (const svc of filtered) {
    const distDir = join(kbDir, svc.name, "distillates");
    if (existsSync(distDir)) {
      try {
        const files = readdirSync(distDir).filter(
          (f) => f.endsWith(".md") && !f.startsWith("00-"),
        );
        fragmentsCount += files.length;
      } catch {
        // ignore
      }
    }
  }

  return {
    ok: true,
    result: {
      output_path: outPath,
      services_count: filtered.length,
      fragments_count: fragmentsCount,
      cross_relations_count: crossRefCount,
      estimated_tokens: estimatedTokens,
    },
  };
}

// ── Output Formatting ─────────────────────────────────────────────

export function formatIndexSummary(result: IndexResult): string {
  const lines: string[] = [
    "EDITH 知识索引生成完成",
    "",
    `  输出: ${result.output_path}`,
    `  服务: ${result.services_count}`,
    `  片段: ${result.fragments_count}`,
    `  跨服务关系: ${result.cross_relations_count}`,
    `  预估 Token: ${result.estimated_tokens}`,
    "",
    "外部 Agent 使用方法:",
    "  将索引文件放入 .claude/skills/ 或 Agent 的 Skill 目录即可自动加载。",
  ];

  if (result.estimated_tokens > MAX_INDEX_TOKENS) {
    lines.push("");
    lines.push(
      `  ⚠ 索引超过 ${MAX_INDEX_TOKENS} token 预算，建议指定 --services 缩小范围。`,
    );
  }

  return lines.join("\n");
}

export function formatIndexError(error: IndexError): string {
  return [
    "EDITH 知识索引生成失败",
    "",
    `  错误: ${error.message}`,
    `  代码: ${error.code}`,
    `  建议: ${error.suggestion}`,
  ].join("\n");
}
