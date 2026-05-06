/**
 * EDITH Board Governance API Routes
 *
 * REST API routes for governance data:
 *   GET /api/governance/health      — Knowledge health score & breakdown
 *   GET /api/governance/lifecycle   — Lifecycle distribution per service
 *   GET /api/governance/conflicts   — Active conflict list
 *   GET /api/vault/tree             — Vault directory tree with governance status
 */

import type { FastifyInstance } from "fastify";
import type { DataReader } from "../services/data-reader.js";
import { ok, err, ErrorCodes } from "../types/index.js";

export function registerGovernanceRoutes(
  fastify: FastifyInstance,
  reader: DataReader,
): void {
  // ── GET /api/governance/health ───────────────────────────────

  fastify.get("/api/governance/health", async (_request, _reply) => {
    const health = reader.getGovernanceHealth();

    if (!health) {
      // Return empty structure instead of 404 for graceful degradation
      return ok({
        overall: 0,
        breakdown: {
          freshness: 0,
          confidence: 0,
          completeness: 0,
          humanReviewed: 0,
        },
        lifecycle: {
          scaffold: 0,
          reviewed: 0,
          mature: 0,
          stale: 0,
        },
        last_updated: new Date().toISOString(),
        _noData: true,
      });
    }

    return ok(health);
  });

  // ── GET /api/governance/lifecycle ────────────────────────────

  fastify.get("/api/governance/lifecycle", async (_request, _reply) => {
    const lifecycle = reader.getGovernanceLifecycle();

    if (!lifecycle) {
      return ok({
        services: [],
        updated_at: new Date().toISOString(),
        _noData: true,
      });
    }

    return ok(lifecycle);
  });

  // ── GET /api/governance/conflicts ────────────────────────────

  fastify.get("/api/governance/conflicts", async (_request, _reply) => {
    const conflicts = reader.getGovernanceConflicts();

    return ok({
      conflicts,
      count: conflicts.length,
    });
  });

  // ── GET /api/vault/tree ──────────────────────────────────────

  fastify.get("/api/vault/tree", async (_request, _reply) => {
    const vaultTree = reader.getVaultTree();

    if (!vaultTree || vaultTree.length === 0) {
      return ok({
        tree: [],
        _noData: true,
      });
    }

    return ok({ tree: vaultTree });
  });
}
