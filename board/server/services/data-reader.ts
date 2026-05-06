/**
 * EDITH Board Data Reader
 *
 * Unified data reading layer for the Board API server.
 * Reads from three data source layers:
 *   - Core Layer: Knowledge artifacts (routing-table / quick-ref / distillates)
 *   - Index Layer: Graphify cache (graph.json)
 *   - History Layer: Git commit history (timeline data)
 *
 * Board is read-only: never modifies any knowledge artifact.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { execSync } from "node:child_process";
import type {
  BoardConfig,
  HealthStatus,
  ServiceInfo,
  ServiceDetail,
  LayerStatus,
  FileTreeNode,
  ArtifactContent,
  GraphData,
  TimelineEvent,
  GovernanceHealth,
  GovernanceLifecycle,
  GovernanceConflict,
  VaultFileNode,
} from "../types/index.js";
import {
  loadRoutingTable,
  parseQuickRef,
  parseDistillates,
  parseGraph,
  buildFileTree,
  getServiceLayerStatus,
  buildServiceInfo,
  findRoutingTable,
  findServiceBase,
} from "./artifact-parser.js";

// ── Cache ───────────────────────────────────────────────────────

interface DataCache {
  services: ServiceInfo[] | null;
  routingTableEntries: ReturnType<typeof loadRoutingTable> | null;
  graphData: GraphData | null;
  governanceHealth: GovernanceHealth | null;
  governanceLifecycle: GovernanceLifecycle | null;
  governanceConflicts: GovernanceConflict[] | null;
  vaultTree: VaultFileNode[] | null;
  lastRefresh: number;
}

let cache: DataCache = {
  services: null,
  routingTableEntries: null,
  graphData: null,
  governanceHealth: null,
  governanceLifecycle: null,
  governanceConflicts: null,
  vaultTree: null,
  lastRefresh: 0,
};

export function invalidateCache(): void {
  cache = {
    services: null,
    routingTableEntries: null,
    graphData: null,
    governanceHealth: null,
    governanceLifecycle: null,
    governanceConflicts: null,
    vaultTree: null,
    lastRefresh: 0,
  };
}

// ── Core Data Reader ────────────────────────────────────────────

export class DataReader {
  private config: BoardConfig;

  constructor(config: BoardConfig) {
    this.config = config;
  }

  get repoPath(): string {
    return resolve(this.config.repoPath);
  }

  // ── Health Check ──────────────────────────────────────────────

  getHealth(): HealthStatus {
    const repoPath = this.repoPath;
    const repoExists = existsSync(repoPath);
    const errors: string[] = [];

    if (!repoExists) {
      return {
        status: "error",
        repoPath,
        repoExists: false,
        servicesCount: 0,
        artifactsCount: 0,
        lastUpdated: null,
        errors: [`Knowledge repository not found: ${repoPath}`],
      };
    }

    const entries = this.getRoutingTableEntries();
    const servicesCount = entries.length;

    let artifactsCount = 0;
    try {
      artifactsCount = this.countArtifacts();
    } catch {
      errors.push("Failed to count artifacts");
    }

    let lastUpdated: string | null = null;
    try {
      lastUpdated = this.getLastGitCommitDate();
    } catch {
      // No git history
    }

    const status: HealthStatus["status"] =
      servicesCount === 0 ? "degraded" : "healthy";

    return {
      status,
      repoPath,
      repoExists: true,
      servicesCount,
      artifactsCount,
      lastUpdated,
      errors,
    };
  }

  // ── Routing Table (Core Layer) ────────────────────────────────

  private getRoutingTableEntries() {
    if (!cache.routingTableEntries) {
      cache.routingTableEntries = loadRoutingTable(this.repoPath);
    }
    return cache.routingTableEntries;
  }

  // ── Services ──────────────────────────────────────────────────

  getServices(): ServiceInfo[] {
    if (cache.services) return cache.services;

    const entries = this.getRoutingTableEntries();
    cache.services = entries.map((entry) =>
      buildServiceInfo(this.repoPath, entry),
    );
    cache.lastRefresh = Date.now();
    return cache.services;
  }

  getService(name: string): ServiceDetail | null {
    const entries = this.getRoutingTableEntries();
    const entry = entries.find((e) => e.service === name);
    if (!entry) return null;

    const baseInfo = buildServiceInfo(this.repoPath, entry);

    // Load quick-ref content
    let quickRef;
    const serviceBase = findServiceBase(this.repoPath, name);
    const quickRefPath = entry.quickRefPath
      ? resolve(this.repoPath, entry.quickRefPath)
      : serviceBase
        ? join(serviceBase, "quick-ref.md")
        : null;

    if (quickRefPath && existsSync(quickRefPath)) {
      try {
        quickRef = parseQuickRef(readFileSync(quickRefPath, "utf-8"));
      } catch {
        // Parse error
      }
    }

    // Load distillates
    const distillatesPath = entry.distillatesPath
      ? resolve(this.repoPath, entry.distillatesPath)
      : serviceBase
        ? join(serviceBase, "distillates")
        : null;

    const distillates =
      distillatesPath && existsSync(distillatesPath)
        ? parseDistillates(distillatesPath)
        : [];

    return {
      ...baseInfo,
      quickRef,
      distillates,
    };
  }

  getServiceLayers(name: string): LayerStatus | null {
    const entries = this.getRoutingTableEntries();
    const entry = entries.find((e) => e.service === name);
    if (!entry) return null;

    return getServiceLayerStatus(this.repoPath, entry);
  }

  // ── Artifacts ─────────────────────────────────────────────────

  getArtifactsTree(): FileTreeNode[] {
    return buildFileTree(this.repoPath);
  }

  getArtifact(artifactPath: string): ArtifactContent | null {
    const fullPath = resolve(this.repoPath, artifactPath);

    // Security: ensure path is within repo
    if (!fullPath.startsWith(this.repoPath)) {
      return null;
    }

    if (!existsSync(fullPath)) return null;

    try {
      const stat = statSync(fullPath);
      if (!stat.isFile()) return null;

      const content = readFileSync(fullPath, "utf-8");
      return {
        path: artifactPath,
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }

  // ── Graph Data (Index Layer) ──────────────────────────────────

  getGraph(): GraphData | null {
    if (cache.graphData !== null) return cache.graphData;

    // Check common locations for graph.json
    const candidates = [
      join(this.repoPath, ".edith", "graphify-cache", "graph.json"),
      join(this.repoPath, "graph.json"),
    ];

    for (const candidate of candidates) {
      const graph = parseGraph(candidate);
      if (graph) {
        cache.graphData = graph;
        return graph;
      }
    }

    return null;
  }

  // ── Governance Data ────────────────────────────────────────────

  getGovernanceHealth(): GovernanceHealth | null {
    if (cache.governanceHealth !== null) return cache.governanceHealth;

    const govDir = join(this.repoPath, ".edith", "governance");
    const healthPath = join(govDir, "health.json");

    if (!existsSync(healthPath)) return null;

    try {
      const content = readFileSync(healthPath, "utf-8");
      cache.governanceHealth = JSON.parse(content) as GovernanceHealth;
      return cache.governanceHealth;
    } catch {
      return null;
    }
  }

  getGovernanceLifecycle(): GovernanceLifecycle | null {
    if (cache.governanceLifecycle !== null) return cache.governanceLifecycle;

    const govDir = join(this.repoPath, ".edith", "governance");
    const lifecyclePath = join(govDir, "lifecycle.json");

    if (!existsSync(lifecyclePath)) return null;

    try {
      const content = readFileSync(lifecyclePath, "utf-8");
      cache.governanceLifecycle = JSON.parse(content) as GovernanceLifecycle;
      return cache.governanceLifecycle;
    } catch {
      return null;
    }
  }

  getGovernanceConflicts(): GovernanceConflict[] {
    if (cache.governanceConflicts !== null) return cache.governanceConflicts;

    const govDir = join(this.repoPath, ".edith", "governance");
    const conflictsPath = join(govDir, "conflicts.json");

    if (!existsSync(conflictsPath)) {
      cache.governanceConflicts = [];
      return [];
    }

    try {
      const content = readFileSync(conflictsPath, "utf-8");
      const parsed = JSON.parse(content);
      // Support both { conflicts: [...] } and direct array formats
      cache.governanceConflicts = Array.isArray(parsed)
        ? parsed
        : parsed.conflicts || [];
      return cache.governanceConflicts;
    } catch {
      cache.governanceConflicts = [];
      return [];
    }
  }

  // ── Vault Tree ─────────────────────────────────────────────────

  getVaultTree(): VaultFileNode[] {
    if (cache.vaultTree !== null) return cache.vaultTree;

    // Find Vault directory — check common locations
    const vaultCandidates = [
      join(this.repoPath, ".edith", "vault"),
      join(this.repoPath, "vault"),
    ];

    let vaultPath: string | null = null;
    for (const candidate of vaultCandidates) {
      if (existsSync(candidate)) {
        vaultPath = candidate;
        break;
      }
    }

    if (!vaultPath) {
      cache.vaultTree = [];
      return [];
    }

    // Load governance status map for files
    const statusMap = this.buildGovernanceStatusMap();

    cache.vaultTree = this.buildVaultTree(vaultPath, vaultPath, statusMap);
    return cache.vaultTree;
  }

  private buildGovernanceStatusMap(): Map<string, string> {
    const statusMap = new Map<string, string>();
    const govDir = join(this.repoPath, ".edith", "governance");

    // Try to extract status from lifecycle.json
    const lifecyclePath = join(govDir, "lifecycle.json");
    if (existsSync(lifecyclePath)) {
      try {
        const content = readFileSync(lifecyclePath, "utf-8");
        // The lifecycle file may contain file-level status info
        // For now, we use a simple heuristic from the health lifecycle counts
      } catch {
        // Ignore parse errors
      }
    }

    // Try to read per-file governance status from health.json or a dedicated map
    const statusFiles = [
      join(govDir, "file-status.json"),
      join(govDir, "health.json"),
    ];

    for (const statusFile of statusFiles) {
      if (!existsSync(statusFile)) continue;
      try {
        const content = readFileSync(statusFile, "utf-8");
        const data = JSON.parse(content);
        if (data.file_statuses && typeof data.file_statuses === "object") {
          for (const [path, status] of Object.entries(data.file_statuses)) {
            statusMap.set(path, status as string);
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    return statusMap;
  }

  private buildVaultTree(
    dir: string,
    baseDir: string,
    statusMap: Map<string, string>,
  ): VaultFileNode[] {
    if (!existsSync(dir)) return [];

    const nodes: VaultFileNode[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      const sorted = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of sorted) {
        if (entry.name.startsWith(".")) continue;

        const fullPath = join(dir, entry.name);
        const relPath = relative(baseDir, fullPath);

        if (entry.isDirectory()) {
          const children = this.buildVaultTree(fullPath, baseDir, statusMap);
          nodes.push({
            name: entry.name,
            path: relPath,
            type: "directory",
            children,
          });
        } else if (
          entry.name.endsWith(".md") ||
          entry.name.endsWith(".json")
        ) {
          const govStatus = statusMap.get(relPath) || statusMap.get(entry.name);
          nodes.push({
            name: entry.name,
            path: relPath,
            type: "file",
            governance_status: (govStatus as VaultFileNode["governance_status"]) || "none",
          });
        }
      }
    } catch {
      // Directory read error
    }

    return nodes;
  }

  // ── Timeline (History Layer) ──────────────────────────────────

  getTimeline(limit: number = 50): TimelineEvent[] {
    try {
      return this.readGitHistory(limit);
    } catch {
      return [];
    }
  }

  private readGitHistory(limit: number): TimelineEvent[] {
    // Use git log to get commit history
    const format = "%H|%ai|%an|%s";
    const output = execSync(
      `git log --max-count=${limit} --pretty=format:"${format}" --name-only`,
      {
        cwd: this.repoPath,
        encoding: "utf-8",
        timeout: 5000,
      },
    );

    const events: TimelineEvent[] = [];
    const commits = output.split("\n\n");

    for (const commit of commits) {
      const lines = commit.split("\n");
      const header = lines[0];

      if (!header || !header.includes("|")) continue;

      const [hash, date, author, ...messageParts] = header.split("|");
      const message = messageParts.join("|"); // Re-join in case message contains |
      const files = lines.slice(1).filter((l) => l.trim().length > 0);

      events.push({
        hash,
        date,
        author,
        message,
        files,
        type: classifyCommit(message, files),
      });
    }

    return events;
  }

  // ── Helpers ───────────────────────────────────────────────────

  private countArtifacts(): number {
    let count = 0;

    const countMd = (dir: string) => {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) count++;
        else if (entry.isDirectory() && !entry.name.startsWith(".")) {
          countMd(join(dir, entry.name));
        }
      }
    };

    countMd(this.repoPath);
    return count;
  }

  private getLastGitCommitDate(): string | null {
    try {
      const output = execSync("git log -1 --pretty=format:%ai", {
        cwd: this.repoPath,
        encoding: "utf-8",
        timeout: 3000,
      });
      return output.trim() || null;
    } catch {
      return null;
    }
  }
}

// ── Commit Classification ───────────────────────────────────────

function classifyCommit(
  message: string,
  files: string[],
): TimelineEvent["type"] {
  const lower = message.toLowerCase();

  if (lower.includes("scan") || lower.includes("扫描")) return "scan";
  if (lower.includes("distill") || lower.includes("蒸馏")) return "distill";
  if (lower.includes("ingest") || lower.includes("摄入")) return "ingest";
  if (lower.includes("graphif") || lower.includes("图谱")) return "graphify";

  // Classify by file paths
  const allFiles = files.join(" ");
  if (allFiles.includes("distillates/")) return "distill";
  if (allFiles.includes("routing-table")) return "scan";
  if (allFiles.includes("graph.json")) return "graphify";

  return "other";
}
