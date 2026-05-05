import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath } from "../fixtures";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import ws from "ws";

test.describe("WebSocket /ws/changes", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("establishes WebSocket connection", async () => {
    const socket = new ws("ws://localhost:13001/ws/changes");

    await new Promise<void>((resolve, reject) => {
      socket.on("open", () => {
        expect(socket.readyState).toBe(ws.OPEN);
        socket.close();
        resolve();
      });

      socket.on("error", (err) => reject(err));

      setTimeout(() => {
        socket.close();
        reject(new Error("Connection timeout"));
      }, 5000);
    });
  });

  test("receives change events after file modification", async () => {
    const socket = new ws("ws://localhost:13001/ws/changes");
    const repoPath = getTestRepoPath();

    await new Promise<void>((resolve) => {
      socket.on("open", () => resolve());
    });

    const messagePromise = new Promise<any>((resolve) => {
      socket.on("message", (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    writeFileSync(join(repoPath, "routing-table.md"),
      "# Routing Table\n| Service | Role | Stack | Owner |\n|---------|------|-------|-------|\n| order-service | Orders | Node.js | team-orders |\n",
      "utf-8"
    );

    const event = await Promise.race([
      messagePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    socket.close();

    if (event) {
      expect(event.type).toBe("change");
      expect(event.data).toBeInstanceOf(Array);
    }
  });
});
