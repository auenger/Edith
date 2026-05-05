import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath, apiFetch } from "../fixtures";

test.describe("Artifacts API", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("GET /api/artifacts/tree returns file tree", async () => {
    const resp = await apiFetch("/api/artifacts/tree");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const names = body.data.map((n: { name: string }) => n.name);
    expect(names).toContain("routing-table.md");
  });

  test("GET /api/artifacts/* returns artifact content", async () => {
    const resp = await apiFetch("/api/artifacts/routing-table.md");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      path: "routing-table.md",
      content: expect.stringContaining("Routing Table"),
      size: expect.any(Number),
      modified: expect.any(String),
    });
  });

  test("GET /api/artifacts/* returns error for missing file", async () => {
    const resp = await apiFetch("/api/artifacts/nonexistent.md");
    const body = await resp.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FILE_NOT_FOUND");
  });

  test("tree nodes have correct type field", async () => {
    const resp = await apiFetch("/api/artifacts/tree");
    const body = await resp.json();

    const validateNode = (node: { type: string; children?: unknown[] }) => {
      expect(["file", "directory"]).toContain(node.type);
      if (node.children) {
        node.children.forEach(validateNode);
      }
    };

    body.data.forEach(validateNode);
  });
});
