/**
 * EDITH Board Server Types
 *
 * Shared type definitions for the Fastify API server.
 */

// ── API Response ────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
  };
}

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): ApiResponse<null> {
  return { ok: false, data: null, error: { code, message } };
}

export const ErrorCodes = {
  REPO_NOT_FOUND: "REPO_NOT_FOUND",
  REPO_EMPTY: "REPO_EMPTY",
  PARSE_FAILED: "PARSE_FAILED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  INTERNAL: "INTERNAL",
} as const;

// ── Knowledge Base Types ────────────────────────────────────────

export interface ServiceInfo {
  name: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string[];
  layers: {
    routingTable: boolean;
    quickRef: boolean;
    distillates: number;
  };
}

export interface ServiceDetail extends ServiceInfo {
  quickRef?: QuickRefData;
  distillates: DistillateFragment[];
}

export interface QuickRefData {
  verify: string[];
  constraints: string[];
  pitfalls: string[];
  apiEndpoints: string[];
  deepDive: string[];
}

export interface DistillateFragment {
  file: string;
  topic: string;
  summary: string;
  estimatedTokens: number;
}

export interface LayerStatus {
  service: string;
  layer0: { exists: boolean; path: string };
  layer1: { exists: boolean; path: string; sections: string[] };
  layer2: { exists: boolean; path: string; fragmentCount: number; totalTokens: number };
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  size?: number;
  modified?: string;
}

export interface ArtifactContent {
  path: string;
  content: string;
  size: number;
  modified: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "error";
  repoPath: string;
  repoExists: boolean;
  servicesCount: number;
  artifactsCount: number;
  lastUpdated: string | null;
  errors: string[];
}

export interface GraphData {
  nodes: Array<{
    id: string;
    type: "service" | "concept";
    knowledgeCompleteness: number;
    endpoints?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;
    confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
    weight: number;
  }>;
  metadata: {
    generatedAt: string;
    languages: string[];
    nodeCount: number;
    edgeCount: number;
  };
}

export interface TimelineEvent {
  hash: string;
  date: string;
  author: string;
  message: string;
  files: string[];
  type: "scan" | "distill" | "ingest" | "graphify" | "other";
}

export interface ChangeEvent {
  type: "create" | "update" | "delete";
  path: string;
  timestamp: string;
}

// ── Config Types ────────────────────────────────────────────────

export interface BoardConfig {
  repoPath: string;
  port: number;
  wsEnabled: boolean;
}

export function loadConfig(): BoardConfig {
  return {
    repoPath: process.env.EDITH_REPO_PATH || "./company-edith",
    port: parseInt(process.env.BOARD_PORT || "3001", 10),
    wsEnabled: process.env.WS_ENABLED !== "false",
  };
}
