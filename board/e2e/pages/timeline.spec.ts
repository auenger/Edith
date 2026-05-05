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

test.describe("Timeline Page", () => {
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

  test("displays timeline events", async ({ page }) => {
    await page.goto("/timeline");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    const hasEvent =
      body?.includes("scan") ||
      body?.includes("distill") ||
      body?.includes("initial") ||
      body?.includes("commit");
    expect(hasEvent).toBeTruthy();
  });

  test("shows filter controls", async ({ page }) => {
    await page.goto("/timeline");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Should have type filter (select or buttons)
    const filterElement =
      page.locator('select, button:has-text("scan"), button:has-text("all"), [class*="filter"]').first();
    const hasFilter = await filterElement.isVisible().catch(() => false);
    expect(hasFilter).toBeTruthy();
  });

  test("events grouped by month", async ({ page }) => {
    await page.goto("/timeline");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    // Test data created with current date, should show month grouping
    const hasMonth =
      body?.includes("2026") ||
      body?.includes("May") ||
      body?.includes("月");
    expect(hasMonth).toBeTruthy();
  });
});
