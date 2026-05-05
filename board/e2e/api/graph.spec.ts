import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath, apiFetch } from "../fixtures";

test.describe("GET /api/graph", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("returns graph data with nodes and edges", async () => {
    const resp = await apiFetch("/api/graph");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      nodes: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          type: expect.stringMatching(/^(service|concept)$/),
          knowledgeCompleteness: expect.any(Number),
        }),
      ]),
      edges: expect.arrayContaining([
        expect.objectContaining({
          source: expect.any(String),
          target: expect.any(String),
          label: expect.any(String),
          confidence: expect.stringMatching(/^(EXTRACTED|INFERRED|AMBIGUOUS)$/),
          weight: expect.any(Number),
        }),
      ]),
    });
  });

  test("includes metadata", async () => {
    const resp = await apiFetch("/api/graph");
    const body = await resp.json();
    expect(body.data.metadata).toMatchObject({
      generatedAt: expect.any(String),
      languages: expect.any(Array),
      nodeCount: expect.any(Number),
      edgeCount: expect.any(Number),
    });
  });

  test("node and edge counts match metadata", async () => {
    const resp = await apiFetch("/api/graph");
    const body = await resp.json();
    expect(body.data.nodes.length).toBe(body.data.metadata.nodeCount);
    expect(body.data.edges.length).toBe(body.data.metadata.edgeCount);
  });
});
