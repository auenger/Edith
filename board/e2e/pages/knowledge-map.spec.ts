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

    // react-flow renders a container div with the graph
    const reactFlowContainer = page.locator(".react-flow");
    await expect(reactFlowContainer).toBeVisible({ timeout: 10_000 });
  });

  test("displays nodes in the graph", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // react-flow renders custom HTML nodes with data-testid or bento card classes
    const nodes = page.locator(".react-flow__node");
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("displays legend or controls", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    const hasControls =
      body?.includes("Service") ||
      body?.includes("Concept") ||
      body?.includes("Confidence") ||
      body?.includes("Interactions");
    expect(hasControls).toBeTruthy();
  });

  test("click node shows detail panel", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Click the first react-flow node (Bento Card)
    const node = page.locator(".react-flow__node").first();
    if (await node.isVisible()) {
      await node.click();
      await page.waitForTimeout(500);

      // Detail panel should show node info
      const body = await page.textContent("body");
      const hasDetail =
        body?.includes("Completeness") ||
        body?.includes("Connections") ||
        body?.includes("Confidence Breakdown");
      expect(hasDetail).toBeTruthy();
    }
  });

  test("view mode toggle works", async ({ page }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Click Concept Topology toggle
    const conceptButton = page.locator("button", { hasText: "Concept Topology" });
    if (await conceptButton.isVisible()) {
      await conceptButton.click();
      await page.waitForTimeout(500);

      // Page should still show graph
      const reactFlowContainer = page.locator(".react-flow");
      await expect(reactFlowContainer).toBeVisible();
    }
  });
});
