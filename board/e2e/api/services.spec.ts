import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath, apiFetch } from "../fixtures";

test.describe("Services API", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("GET /api/services returns service list", async () => {
    const resp = await apiFetch("/api/services");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);

    const svc = body.data[0];
    expect(svc).toHaveProperty("name");
    expect(svc).toHaveProperty("role");
    expect(svc).toHaveProperty("stack");
    expect(svc).toHaveProperty("layers");
    expect(svc.layers).toHaveProperty("routingTable");
    expect(svc.layers).toHaveProperty("quickRef");
    expect(svc.layers).toHaveProperty("distillates");
  });

  test("GET /api/services/:name returns service detail", async () => {
    const resp = await apiFetch("/api/services/payment-service");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data.name).toBe("payment-service");
    expect(body.data).toHaveProperty("quickRef");
    expect(body.data.distillates).toBeInstanceOf(Array);
    expect(body.data.distillates.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/services/:name/layers returns layer status", async () => {
    const resp = await apiFetch("/api/services/payment-service/layers");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      service: "payment-service",
      layer0: { exists: expect.any(Boolean), path: expect.any(String) },
      layer1: { exists: expect.any(Boolean), path: expect.any(String), sections: expect.any(Array) },
      layer2: { exists: expect.any(Boolean), path: expect.any(String), fragmentCount: expect.any(Number), totalTokens: expect.any(Number) },
    });
  });

  test("GET /api/services/:name returns error for nonexistent service", async () => {
    const resp = await apiFetch("/api/services/nonexistent");
    const body = await resp.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FILE_NOT_FOUND");
  });
});
