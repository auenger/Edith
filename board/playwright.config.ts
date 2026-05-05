import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:13000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "api", testDir: "./e2e/api" },
    { name: "ws", testDir: "./e2e/ws" },
    { name: "pages", testDir: "./e2e/pages" },
  ],
});
