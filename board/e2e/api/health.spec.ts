import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath, apiFetch } from "../fixtures";

test.describe("GET /api/health", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("returns healthy status with valid repo", async () => {
    const resp = await apiFetch("/api/health");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      status: expect.stringMatching(/^(healthy|degraded)$/),
      repoExists: true,
      servicesCount: expect.any(Number),
      artifactsCount: expect.any(Number),
    });
  });

  test("response includes repoPath", async () => {
    const resp = await apiFetch("/api/health");
    const body = await resp.json();
    expect(body.data.repoPath).toContain("edith-e2e-");
  });

  test("response includes errors array", async () => {
    const resp = await apiFetch("/api/health");
    const body = await resp.json();
    expect(Array.isArray(body.data.errors)).toBe(true);
  });
});
