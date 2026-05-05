import { test, expect } from "@playwright/test";
import {
  createTestRepo,
  cleanupTestRepo,
  startServer,
  stopServer,
  getTestRepoPath,
} from "../fixtures";
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";

let nextProcess: ChildProcess | null = null;

async function startNext(): Promise<void> {
  return new Promise((resolve, reject) => {
    nextProcess = spawn("npx", ["next", "dev", "-p", "13000"], {
      cwd: join(import.meta.dirname, "../.."),
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      reject(new Error("Next.js startup timed out"));
    }, 60_000);

    nextProcess.stdout!.on("data", (data: Buffer) => {
      if (data.toString().includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });

    nextProcess.stderr!.on("data", (data: Buffer) => {
      if (data.toString().includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

async function stopNext(): Promise<void> {
  if (nextProcess) {
    nextProcess.kill("SIGTERM");
    nextProcess = null;
    await new Promise((r) => setTimeout(r, 1000));
  }
}

test.describe("Knowledge Map Page", () => {
  test.beforeAll(async () => {
    createTestRepo();
    await startServer(getTestRepoPath(), 13001);
    await startNext();
  });

  test.afterAll(async () => {
    await stopNext();
    await stopServer();
    cleanupTestRepo();
  });

  test("renders graph visualization", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // D3 renders SVG elements
    const svg = page.locator("svg");
    await expect(svg).toBeVisible({ timeout: 10_000 });
  });

  test("displays nodes in the graph", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Should have circles (nodes) in SVG
    const circles = page.locator("svg circle");
    const count = await circles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("displays legend or controls", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    const hasControls =
      body?.includes("service") ||
      body?.includes("concept") ||
      body?.includes("Legend") ||
      body?.includes("legend");
    expect(hasControls).toBeTruthy();
  });

  test("click node shows detail panel", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const node = page.locator("svg circle").first();
    if (await node.isVisible()) {
      await node.click();
      await page.waitForTimeout(500);

      // Detail panel should show node info
      const body = await page.textContent("body");
      const hasDetail =
        body?.includes("payment-service") ||
        body?.includes("user-service") ||
        body?.includes("payment") ||
        body?.includes("Completeness");
      expect(hasDetail).toBeTruthy();
    }
  });
});
