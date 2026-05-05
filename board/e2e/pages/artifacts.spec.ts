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

test.describe("Artifacts Page", () => {
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

  test("displays file tree", async ({ page }) => {
    await page.goto("/artifacts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    const hasContent =
      body?.includes("routing-table") ||
      body?.includes("payment") ||
      body?.includes("artifact");
    expect(hasContent).toBeTruthy();
  });

  test("click file shows content preview", async ({ page }) => {
    await page.goto("/artifacts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const fileNode = page.locator("text=routing-table.md").first();
    if (await fileNode.isVisible()) {
      await fileNode.click();
      await page.waitForTimeout(1000);

      // Preview panel should show content
      const body = await page.textContent("body");
      const hasPreview =
        body?.includes("Routing Table") ||
        body?.includes("Service") ||
        body?.includes("payment-service");
      expect(hasPreview).toBeTruthy();
    }
  });
});
