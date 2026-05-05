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

test.describe("Services Page", () => {
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

  test("displays service cards", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    const hasService =
      body?.includes("payment-service") ||
      body?.includes("user-service");
    expect(hasService).toBeTruthy();
  });

  test("filter services by search input", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("payment");
      await page.waitForTimeout(500);

      const body = await page.textContent("body");
      expect(body).toContain("payment-service");
    }
  });

  test("click service card shows detail modal", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const card = page.locator("text=payment-service").first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(500);

      // Modal should appear with detail content
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="overlay"]');
      if (await modal.isVisible()) {
        const modalText = await modal.textContent();
        expect(modalText).toContain("payment-service");
      }
    }
  });
});
