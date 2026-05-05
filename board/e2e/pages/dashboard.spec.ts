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

test.describe("Dashboard Page", () => {
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

  test("loads and displays Dashboard title", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dashboard should show heading or service content
    const content = page.locator("main");
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test("shows health panel content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show health-related content (status indicator or text)
    const body = await page.textContent("body");
    const hasHealth =
      body?.includes("Health") ||
      body?.includes("healthy") ||
      body?.includes("status");
    expect(hasHealth).toBeTruthy();
  });

  test("shows service coverage panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should mention services from test data
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    const hasServices =
      body?.includes("payment-service") ||
      body?.includes("Service") ||
      body?.includes("service");
    expect(hasServices).toBeTruthy();
  });
});
