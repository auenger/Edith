/**
 * EDITH Board API Routes
 *
 * Registers all REST API routes on the Fastify server.
 * Routes: /api/health, /api/services, /api/services/:name,
 *         /api/services/:name/layers, /api/artifacts/tree,
 *         /api/artifacts/:path, /api/graph, /api/timeline
 */

import type { FastifyInstance } from "fastify";
import type { DataReader } from "../services/data-reader.js";
import { ok, err, ErrorCodes } from "../types/index.js";

export function registerRoutes(
  fastify: FastifyInstance,
  reader: DataReader,
): void {
  // ── GET /api/health ─────────────────────────────────────────

  fastify.get("/api/health", async (_request, _reply) => {
    const health = reader.getHealth();
    return ok(health);
  });

  // ── GET /api/services ───────────────────────────────────────

  fastify.get("/api/services", async (_request, _reply) => {
    const health = reader.getHealth();

    if (!health.repoExists) {
      return err(ErrorCodes.REPO_NOT_FOUND, `Knowledge repository not found: ${health.repoPath}`);
    }

    const services = reader.getServices();
    return ok(services);
  });

  // ── GET /api/services/:name ─────────────────────────────────

  fastify.get("/api/services/:name", async (request, _reply) => {
    const { name } = request.params as { name: string };
    const service = reader.getService(name);

    if (!service) {
      return err(ErrorCodes.FILE_NOT_FOUND, `Service not found: ${name}`);
    }

    return ok(service);
  });

  // ── GET /api/services/:name/layers ──────────────────────────

  fastify.get("/api/services/:name/layers", async (request, _reply) => {
    const { name } = request.params as { name: string };
    const layers = reader.getServiceLayers(name);

    if (!layers) {
      return err(ErrorCodes.FILE_NOT_FOUND, `Service not found: ${name}`);
    }

    return ok(layers);
  });

  // ── GET /api/artifacts/tree ─────────────────────────────────

  fastify.get("/api/artifacts/tree", async (_request, _reply) => {
    const health = reader.getHealth();

    if (!health.repoExists) {
      return err(ErrorCodes.REPO_NOT_FOUND, `Knowledge repository not found: ${health.repoPath}`);
    }

    const tree = reader.getArtifactsTree();
    return ok(tree);
  });

  // ── GET /api/artifacts/:path ────────────────────────────────
  // Use wildcard to capture paths with slashes

  fastify.get("/api/artifacts/*", async (request, _reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    if (!wildcard) {
      return err(ErrorCodes.FILE_NOT_FOUND, "No artifact path provided");
    }

    const artifact = reader.getArtifact(wildcard);

    if (!artifact) {
      return err(ErrorCodes.FILE_NOT_FOUND, `Artifact not found: ${wildcard}`);
    }

    return ok(artifact);
  });

  // ── GET /api/graph ──────────────────────────────────────────

  fastify.get("/api/graph", async (_request, _reply) => {
    const graph = reader.getGraph();

    if (!graph) {
      return err(ErrorCodes.FILE_NOT_FOUND, "graph.json not found. Run edith_graphify first.");
    }

    return ok(graph);
  });

  // ── GET /api/timeline ───────────────────────────────────────

  fastify.get("/api/timeline", async (request, _reply) => {
    const query = request.query as { limit?: string };
    const limit = Math.min(parseInt(query.limit || "50", 10), 200);

    const health = reader.getHealth();
    if (!health.repoExists) {
      return err(ErrorCodes.REPO_NOT_FOUND, `Knowledge repository not found: ${health.repoPath}`);
    }

    const timeline = reader.getTimeline(limit);
    return ok(timeline);
  });
}
