/**
 * EDITH Board API Client
 *
 * Typed client for the EDITH Board Fastify backend.
 * All responses follow the unified ApiResponse<T> format.
 */

// ── Response Types ──────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
  };
}

// ── Data Types ──────────────────────────────────────────────────

export interface HealthStatus {
  status: "healthy" | "degraded" | "error";
  repoPath: string;
  repoExists: boolean;
  servicesCount: number;
  artifactsCount: number;
  lastUpdated: string | null;
  errors: string[];
}

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
  quickRef?: {
    verify: string[];
    constraints: string[];
    pitfalls: string[];
    apiEndpoints: string[];
    deepDive: string[];
  };
  distillates: Array<{
    file: string;
    topic: string;
    summary: string;
    estimatedTokens: number;
  }>;
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

// ── API Client ──────────────────────────────────────────────────

const API_BASE = "/api";

async function request<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      },
    };
  }
}

export const api = {
  health: () => request<HealthStatus>("/health"),
  services: () => request<ServiceInfo[]>("/services"),
  service: (name: string) => request<ServiceDetail>(`/services/${encodeURIComponent(name)}`),
  layers: (name: string) => request<LayerStatus>(`/services/${encodeURIComponent(name)}/layers`),
  artifactsTree: () => request<FileTreeNode[]>("/artifacts/tree"),
  artifact: (path: string) => request<ArtifactContent>(`/artifacts/${encodeURIComponent(path)}`),
  graph: () => request<GraphData>("/graph"),
  timeline: () => request<TimelineEvent[]>("/timeline"),
};

// ── WebSocket Client ────────────────────────────────────────────

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export class BoardWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private statusListeners: Set<(status: WsStatus) => void> = new Set();
  private status: WsStatus = "disconnected";
  private url: string;

  constructor(url?: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = url || `${protocol}//${window.location.host}/ws/changes`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setStatus("connecting");
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus("connected");
      };

      this.ws.onclose = () => {
        this.setStatus("disconnected");
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus("error");
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          const handlers = this.listeners.get(msg.type);
          if (handlers) {
            for (const handler of handlers) {
              handler(msg.data);
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };
    } catch {
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setStatus("disconnected");
  }

  on(event: string, handler: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  onStatusChange(handler: (status: WsStatus) => void): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  private setStatus(status: WsStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

/** Singleton WebSocket instance */
let wsInstance: BoardWebSocket | null = null;

export function getBoardWebSocket(): BoardWebSocket {
  if (!wsInstance) {
    wsInstance = new BoardWebSocket();
  }
  return wsInstance;
}
