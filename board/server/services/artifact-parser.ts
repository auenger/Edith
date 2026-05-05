/**
 * EDITH Board Artifact Parser
 *
 * Parses knowledge artifacts from the EDITH knowledge repository:
 *   - routing-table.md (Layer 0)
 *   - quick-ref.md (Layer 1)
 *   - distillates/*.md (Layer 2)
 *   - graph.json (Graphify index)
 *
 * Reuses parsing patterns from agent/src/tools/index.ts and agent/src/query.ts.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename, extname, relative } from "node:path";
import type {
  ServiceInfo,
  QuickRefData,
  DistillateFragment,
  LayerStatus,
  FileTreeNode,
  GraphData,
} from "../types/index.js";

// ── Token Estimation ────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// ── Routing Table Parser (Layer 0) ──────────────────────────────

export interface RoutingTableEntry {
  service: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string[];
  quickRefPath: string | null;
  distillatesPath: string | null;
}

export function parseRoutingTable(content: string): RoutingTableEntry[] {
  const entries: RoutingTableEntry[] = [];
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
    const cells = rawCells.slice(1, -1).map((c) => c.trim());

    if (section === "services" && cells.length >= 4 && cells[0] !== "Service") {
      entries.push({
        service: cells[0],
        role: cells[1] || "",
        stack: cells[2] || "",
        owner: cells[3] || "",
        constraints: (cells[4] || "")
          .split(/[；;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        quickRefPath: null,
        distillatesPath: null,
      });
    }

    if (section === "quickref" && cells.length >= 2 && cells[0] !== "Service") {
      quickRefPaths.set(cells[0], cells[1]);
    }
  }

  // Fill quickRefPaths into entries
  for (const entry of entries) {
    entry.quickRefPath = quickRefPaths.get(entry.service) || null;
    entry.distillatesPath = join("distillates", entry.service);
  }

  return entries;
}

/**
 * Find and parse the routing-table.md from the knowledge repo.
 */
export function loadRoutingTable(repoPath: string): RoutingTableEntry[] {
  const routingTablePath = findRoutingTable(repoPath);
  if (!routingTablePath) return [];

  const content = readFileSync(routingTablePath, "utf-8");
  return parseRoutingTable(content);
}

/**
 * Locate routing-table.md in the knowledge repo.
 */
export function findRoutingTable(repoPath: string): string | null {
  // Check common locations
  const candidates = [
    join(repoPath, "routing-table.md"),
    join(repoPath, "skills", "company-edith", "routing-table.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Search recursively (limited depth)
  return searchFile(repoPath, "routing-table.md", 3);
}

function searchFile(dir: string, filename: string, maxDepth: number): string | null {
  if (maxDepth <= 0) return null;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name === filename) {
        return join(dir, filename);
      }
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        const found = searchFile(join(dir, entry.name), filename, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch {
    // Permission denied or other FS errors
  }
  return null;
}

// ── Quick-Ref Parser (Layer 1) ──────────────────────────────────

export function parseQuickRef(content: string): QuickRefData {
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
    const end = i + 1 < positions.length ? positions[i + 1].start : content.length;
    sections.set(positions[i].title, content.slice(positions[i].start, end).trim());
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

// ── Distillates Parser (Layer 2) ────────────────────────────────

const TOPIC_MAP: Record<string, string> = {
  "01-overview": "Architecture Overview",
  "02-api-contracts": "API Contracts",
  "03-data-models": "Data Models",
  "04-business-logic": "Business Logic",
  "05-development-guide": "Development Guide",
  "00-cross-references": "Cross-References",
};

export function parseDistillates(
  distillatesDir: string,
): DistillateFragment[] {
  if (!existsSync(distillatesDir)) return [];

  const fragments: DistillateFragment[] = [];

  try {
    const files = readdirSync(distillatesDir)
      .filter((f) => f.endsWith(".md"))
      .sort();

    for (const file of files) {
      const filePath = join(distillatesDir, file);
      const content = readFileSync(filePath, "utf-8");
      const name = basename(file, ".md");

      fragments.push({
        file,
        topic: inferTopic(name),
        summary: extractSummary(content),
        estimatedTokens: estimateTokens(content),
      });
    }
  } catch {
    // Directory read error
  }

  return fragments;
}

function inferTopic(filename: string): string {
  const lower = filename.toLowerCase();
  if (TOPIC_MAP[lower]) return TOPIC_MAP[lower];

  if (lower.includes("api") || lower.includes("contract")) return "API Contracts";
  if (lower.includes("data") || lower.includes("model") || lower.includes("schema"))
    return "Data Models";
  if (lower.includes("logic") || lower.includes("business")) return "Business Logic";
  if (lower.includes("deploy") || lower.includes("dev") || lower.includes("guide"))
    return "Development Guide";
  if (lower.includes("cross") || lower.includes("ref")) return "Cross-References";

  return filename;
}

function extractSummary(content: string): string {
  // Extract the first non-empty paragraph after any heading
  const lines = content.split("\n");
  let foundHeading = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#")) {
      foundHeading = true;
      continue;
    }
    if (foundHeading && line.trim().length > 0) {
      summaryLines.push(line.trim());
      if (summaryLines.length >= 2) break;
    }
  }

  return summaryLines.join(" ").slice(0, 200) || "(No summary)";
}

// ── Graph JSON Parser ───────────────────────────────────────────

export function parseGraph(graphPath: string): GraphData | null {
  if (!existsSync(graphPath)) return null;

  try {
    const content = readFileSync(graphPath, "utf-8");
    const data = JSON.parse(content);
    return data as GraphData;
  } catch {
    return null;
  }
}

// ── File Tree Builder ───────────────────────────────────────────

export function buildFileTree(dir: string, baseDir: string = dir): FileTreeNode[] {
  if (!existsSync(dir)) return [];

  const nodes: FileTreeNode[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    // Sort: directories first, then files, alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;

      const fullPath = join(dir, entry.name);
      const relPath = relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        const children = buildFileTree(fullPath, baseDir);
        nodes.push({
          name: entry.name,
          path: relPath,
          type: "directory",
          children,
        });
      } else if (entry.name.endsWith(".md") || entry.name.endsWith(".json")) {
        const stat = statSync(fullPath);
        nodes.push({
          name: entry.name,
          path: relPath,
          type: "file",
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }
  } catch {
    // Directory read error
  }

  return nodes;
}

// ── Service Layer Status ────────────────────────────────────────

export function getServiceLayerStatus(
  repoPath: string,
  entry: RoutingTableEntry,
): LayerStatus {
  const serviceBase = findServiceBase(repoPath, entry.service);

  // Layer 0: routing-table entry exists (we already parsed it)
  const layer0Path = findRoutingTable(repoPath) || "";
  const layer0Exists = layer0Path.length > 0;

  // Layer 1: quick-ref.md
  const quickRefPath = entry.quickRefPath
    ? resolve(repoPath, entry.quickRefPath)
    : serviceBase
      ? join(serviceBase, "quick-ref.md")
      : null;
  const layer1Exists = quickRefPath ? existsSync(quickRefPath) : false;
  const layer1Sections = layer1Exists && quickRefPath
    ? getSectionTitles(readFileSync(quickRefPath, "utf-8"))
    : [];

  // Layer 2: distillates/
  const distillatesPath = entry.distillatesPath
    ? resolve(repoPath, entry.distillatesPath)
    : serviceBase
      ? join(serviceBase, "distillates")
      : null;
  const layer2Exists = distillatesPath ? existsSync(distillatesPath) : false;
  const fragments = layer2Exists && distillatesPath
    ? parseDistillates(distillatesPath)
    : [];

  return {
    service: entry.service,
    layer0: { exists: layer0Exists, path: layer0Path ? relative(repoPath, layer0Path) : "" },
    layer1: {
      exists: layer1Exists,
      path: quickRefPath ? relative(repoPath, quickRefPath) : "",
      sections: layer1Sections,
    },
    layer2: {
      exists: layer2Exists,
      path: distillatesPath ? relative(repoPath, distillatesPath) : "",
      fragmentCount: fragments.length,
      totalTokens: fragments.reduce((sum, f) => sum + f.estimatedTokens, 0),
    },
  };
}

export function findServiceBase(repoPath: string, serviceName: string): string | null {
  const candidates = [
    join(repoPath, "skills", serviceName),
    join(repoPath, serviceName),
    join(repoPath, "workspace", serviceName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function getSectionTitles(content: string): string[] {
  const titles: string[] = [];
  const pattern = /^##?\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  return titles;
}

// ── Service Info Builder ────────────────────────────────────────

export function buildServiceInfo(
  repoPath: string,
  entry: RoutingTableEntry,
): ServiceInfo {
  const serviceBase = findServiceBase(repoPath, entry.service);

  // Check quick-ref
  const quickRefPath = entry.quickRefPath
    ? resolve(repoPath, entry.quickRefPath)
    : serviceBase
      ? join(serviceBase, "quick-ref.md")
      : null;
  const hasQuickRef = quickRefPath ? existsSync(quickRefPath) : false;

  // Check distillates
  const distillatesPath = entry.distillatesPath
    ? resolve(repoPath, entry.distillatesPath)
    : serviceBase
      ? join(serviceBase, "distillates")
      : null;
  const distillateCount =
    distillatesPath && existsSync(distillatesPath)
      ? readdirSync(distillatesPath).filter((f) => f.endsWith(".md")).length
      : 0;

  return {
    name: entry.service,
    role: entry.role,
    stack: entry.stack,
    owner: entry.owner,
    constraints: entry.constraints,
    layers: {
      routingTable: true, // If we have a routing table entry, Layer 0 exists
      quickRef: hasQuickRef,
      distillates: distillateCount,
    },
  };
}
