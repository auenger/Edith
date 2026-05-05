/**
 * EDITH Board API Server
 *
 * Fastify-based REST API + WebSocket server for the EDITH Board.
 * Reads knowledge artifacts from the configured Git repository.
 *
 * Usage:
 *   tsx server/index.ts
 *
 * Environment:
 *   EDITH_REPO_PATH  — Path to knowledge repository (default: ./company-edith)
 *   BOARD_PORT       — Server port (default: 3001)
 *   WS_ENABLED       — Enable WebSocket (default: true)
 */

import Fastify from "fastify";
import { loadConfig } from "./types/index.js";
import { DataReader } from "./services/data-reader.js";
import { FileWatcher } from "./services/file-watcher.js";
import { registerRoutes } from "./routes/index.js";

// ── Server Bootstrap ────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const reader = new DataReader(config);

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: "info",
    },
  });

  // ── CORS ──────────────────────────────────────────────────────

  await fastify.register(import("@fastify/cors"), {
    origin: true, // Allow all origins in development
    methods: ["GET"],
  });

  // ── WebSocket ─────────────────────────────────────────────────

  const connectedClients = new Set<any>();

  if (config.wsEnabled) {
    try {
      await fastify.register(import("@fastify/websocket"));

      fastify.get("/ws/changes", { websocket: true }, (socket) => {
        connectedClients.add(socket);
        console.log(`[WS] Client connected. Total: ${connectedClients.size}`);

        socket.on("close", () => {
          connectedClients.delete(socket);
          console.log(`[WS] Client disconnected. Total: ${connectedClients.size}`);
        });

        socket.on("error", (err: Error) => {
          console.error("[WS] Client error:", err);
          connectedClients.delete(socket);
        });
      });

      console.log("[WS] WebSocket endpoint registered at /ws/changes");
    } catch (err) {
      console.warn("[WS] WebSocket plugin not available, skipping:", err);
    }
  }

  // ── File Watcher ──────────────────────────────────────────────

  const watcher = new FileWatcher({
    repoPath: config.repoPath,
    debounceMs: 500,
  });

  watcher.onChange((events) => {
    console.log(`[Watcher] ${events.length} file change(s) detected`);

    // Push changes to connected WebSocket clients
    for (const socket of connectedClients) {
      try {
        socket.send(JSON.stringify({ type: "change", data: events }));
      } catch {
        // Socket might be closed
        connectedClients.delete(socket);
      }
    }
  });

  // ── Register API Routes ───────────────────────────────────────

  registerRoutes(fastify, reader);

  // ── Start Server ──────────────────────────────────────────────

  try {
    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`\n  EDITH Board API Server running at http://localhost:${config.port}`);
    console.log(`  Knowledge repo: ${config.repoPath}`);
    console.log(`  WebSocket: ${config.wsEnabled ? "enabled" : "disabled"}`);
    console.log();

    // Start file watcher after server is up
    watcher.start();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // ── Graceful Shutdown ─────────────────────────────────────────

  const shutdown = async () => {
    console.log("\nShutting down...");
    watcher.stop();
    await fastify.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
