import { test, expect } from "@playwright/test";
import { createTestRepo, cleanupTestRepo, startServer, stopServer, getTestRepoPath, apiFetch } from "../fixtures";

test.describe("GET /api/timeline", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath());
  });

  test.afterAll(async () => {
    await stopServer();
    cleanupTestRepo();
  });

  test("returns timeline events with pagination metadata", async () => {
    const resp = await apiFetch("/api/timeline");
    expect(resp.ok).toBeTruthy();

    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      events: expect.any(Array),
      total: expect.any(Number),
      offset: 0,
      limit: 50,
    });
  });

  test("events have required fields", async () => {
    const resp = await apiFetch("/api/timeline");
    const body = await resp.json();

    for (const event of body.data.events) {
      expect(event).toMatchObject({
        hash: expect.any(String),
        date: expect.any(String),
        author: expect.any(String),
        message: expect.any(String),
        files: expect.any(Array),
        type: expect.stringMatching(/^(scan|distill|ingest|graphify|other)$/),
      });
    }
  });

  test("filters by type parameter", async () => {
    const resp = await apiFetch("/api/timeline?type=scan");
    const body = await resp.json();
    expect(body.ok).toBe(true);

    for (const event of body.data.events) {
      expect(event.type).toBe("scan");
    }
  });

  test("respects limit parameter", async () => {
    const resp = await apiFetch("/api/timeline?limit=1");
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data.limit).toBe(1);
    expect(body.data.events.length).toBeLessThanOrEqual(1);
  });

  test("respects offset parameter", async () => {
    const resp0 = await apiFetch("/api/timeline?limit=1&offset=0");
    const body0 = await resp0.json();

    const resp1 = await apiFetch("/api/timeline?limit=1&offset=1");
    const body1 = await resp1.json();

    expect(body0.data.offset).toBe(0);
    expect(body1.data.offset).toBe(1);

    if (body0.data.events.length && body1.data.events.length) {
      expect(body0.data.events[0].hash).not.toBe(body1.data.events[0].hash);
    }
  });

  test("filters by service parameter", async () => {
    const resp = await apiFetch("/api/timeline?service=payment");
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.events)).toBe(true);
  });
});
