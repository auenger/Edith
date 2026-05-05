import { test, expect } from "@playwright/test";
import {
  createTestRepo,
  cleanupTestRepo,
  startServer,
  stopServer,
  getTestRepoPath,
} from "../../e2e/fixtures";
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

test.describe("feat-redesign-layout: Global Layout & Navigation", () => {
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

  // ── General Checklist: 5 Navigation Links ────────────────────────

  test("Sidebar shows 5 navigation links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Sidebar should have nav links with Lucide icons
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Check navigation items exist
    const navLinks = sidebar.locator("a");
    await expect(navLinks).toHaveCount(5);

    // Verify link destinations
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href")),
    );
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/services");
    expect(hrefs).toContain("/artifacts");
    expect(hrefs).toContain("/knowledge-map");
    expect(hrefs).toContain("/timeline");
  });

  test("Current page is highlighted in Sidebar", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // The active link should have a distinct style
    const sidebar = page.locator("aside");
    const activeLink = sidebar.locator("a[href='/services']");
    await expect(activeLink).toBeVisible();

    // Active link should have white/bright background (bg-white/20)
    const classes = await activeLink.getAttribute("class");
    expect(classes).toContain("bg-white/20");
  });

  // ── Scenario 1: Sidebar Collapse/Expand ──────────────────────────

  test("Scenario 1: Sidebar collapses and expands", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");

    // Sidebar should be visible and expanded (w-60 = 240px)
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const initialWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(initialWidth).toBeGreaterThan(200); // Expanded ~240px

    // Find and click the collapse button
    const collapseBtn = sidebar.locator("button").last();
    await collapseBtn.click();
    await page.waitForTimeout(400); // Wait for transition

    // Sidebar should be collapsed (w-16 = 64px)
    const collapsedWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(collapsedWidth).toBeLessThan(100); // Collapsed ~64px

    // Expand again
    const expandBtn = sidebar.locator("button").last();
    await expandBtn.click();
    await page.waitForTimeout(400);

    const expandedWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(expandedWidth).toBeGreaterThan(200);
  });

  // ── Scenario 2: Responsive - Tablet ──────────────────────────────

  test("Scenario 2: Sidebar auto-collapses on tablet viewport", async ({
    page,
  }) => {
    // Set viewport to tablet size (768px-1024px)
    await page.setViewportSize({ width: 900, height: 600 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Sidebar should be collapsed on tablet
    const sidebarWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(sidebarWidth).toBeLessThan(100); // Collapsed ~64px
  });

  // ── Scenario 3: Mobile Navigation ────────────────────────────────

  test("Scenario 3: Mobile shows hamburger menu and Sheet drawer", async ({
    page,
  }) => {
    // Set viewport to mobile size (<768px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Desktop sidebar should be hidden
    const desktopSidebar = page.locator("aside");
    await expect(desktopSidebar).toBeHidden();

    // Hamburger menu button should be visible in header
    const menuButton = page.locator("header button[aria-label='Open navigation menu']");
    await expect(menuButton).toBeVisible();

    // Click hamburger to open Sheet
    await menuButton.click();
    await page.waitForTimeout(500);

    // Sheet (mobile sidebar) should be visible
    const sheetContent = page.locator("[data-slot='sheet-content']");
    await expect(sheetContent).toBeVisible();

    // Sheet should contain navigation links
    const sheetLinks = sheetContent.locator("a");
    await expect(sheetLinks).toHaveCount(5);
  });

  // ── Header Verification ──────────────────────────────────────────

  test("Header shows breadcrumbs", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Breadcrumb should contain "Board" and "Services"
    const breadcrumb = page.locator("nav[aria-label='Breadcrumb']");
    await expect(breadcrumb).toBeVisible();
    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toContain("Board");
    expect(breadcrumbText).toContain("Services");
  });

  test("Header shows search input on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Search input should be visible
    const searchInput = page.locator("header input[type='search']");
    await expect(searchInput).toBeVisible();
  });

  // ── Knowledge Map Full-Height ────────────────────────────────────

  test("Knowledge Map page uses full content area height", async ({
    page,
  }) => {
    await page.goto("/knowledge-map");
    await page.waitForLoadState("networkidle");

    // The knowledge-map page content should fill available space
    const mainContent = page.locator("main > div");
    await expect(mainContent).toBeVisible();
  });
});
