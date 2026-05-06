/**
 * EDITH Board Governance Types
 *
 * Type definitions for the governance data consumed by the Board API.
 * These types mirror the JSON files produced by the governance engine
 * in .edith/governance/.
 */

// ── Governance Health ────────────────────────────────────────────

export interface GovernanceHealth {
  overall: number;
  breakdown: {
    freshness: number;
    confidence: number;
    completeness: number;
    humanReviewed: number;
  };
  lifecycle: {
    scaffold: number;
    reviewed: number;
    mature: number;
    stale: number;
  };
  last_updated: string;
}

// ── Governance Lifecycle ─────────────────────────────────────────

export interface GovernanceLifecycle {
  services: Array<{
    name: string;
    status_counts: {
      scaffold: number;
      reviewed: number;
      mature: number;
      stale: number;
    };
  }>;
  updated_at: string;
}

// ── Governance Conflicts ─────────────────────────────────────────

export interface GovernanceConflict {
  file: string;
  type: "content_overlap";
  summary: string;
  new_content_excerpt: string;
  human_content_excerpt: string;
  detected_at: string;
}

// ── Vault File Node ──────────────────────────────────────────────

export interface VaultFileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  governance_status?: "scaffold" | "reviewed" | "mature" | "stale" | "none";
  children?: VaultFileNode[];
}

// ── Governance Events (WebSocket) ────────────────────────────────

export type GovernanceEventType =
  | "lifecycle_change"
  | "conflict_detected"
  | "conflict_resolved"
  | "health_change";

export interface GovernanceWsEvent {
  type: GovernanceEventType;
  data: {
    file?: string;
    status?: string;
    health?: GovernanceHealth;
  };
}
