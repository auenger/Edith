/**
 * E2E Test Fixtures
 *
 * Shared test infrastructure:
 *   - Creates a temporary knowledge repo with sample data
 *   - Starts/stops Fastify API server
 */

import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync, spawn, type ChildProcess } from "node:child_process";

// ── Sample Knowledge Repo Data ──────────────────────────────────

const ROUTING_TABLE = `# Routing Table

## Services
| Service | Role | Stack | Owner |
|---------|------|-------|-------|
| payment-service | Payment processing | Java/Spring | team-payments |
| user-service | User management | Go | team-auth |
`;

const QUICK_REF_PAYMENT = `# Payment Service Quick Ref

## Verify
- curl http://localhost:8080/health

## Constraints
- All amounts in cents

## Pitfalls
- Idempotency key required

## API Endpoints
- POST /api/payments
- GET /api/payments/:id

## Deep Dive
- See payment-flow.md
`;

const DISTILLATE_PAYMENT_API = `# Payment API Contract

## POST /api/payments
Creates a new payment.

Request: { amount: number, currency: string, idempotencyKey: string }
Response: { id: string, status: string }
`;

const DISTILLATE_PAYMENT_MODEL = `# Payment Data Model

## Payment
- id: UUID
- amount: number (cents)
- currency: string (ISO 4217)
- status: pending | completed | failed
- createdAt: ISO 8601
`;

const GRAPH_JSON = JSON.stringify({
  nodes: [
    { id: "payment-service", type: "service", knowledgeCompleteness: 0.85, endpoints: 2 },
    { id: "user-service", type: "service", knowledgeCompleteness: 0.6, endpoints: 3 },
    { id: "payment", type: "concept", knowledgeCompleteness: 0.9 },
  ],
  edges: [
    { source: "payment-service", target: "user-service", label: "validates user", confidence: "EXTRACTED", weight: 0.9 },
    { source: "payment-service", target: "payment", label: "implements", confidence: "EXTRACTED", weight: 1.0 },
  ],
  metadata: {
    generatedAt: "2026-05-05T10:00:00Z",
    languages: ["Java", "Go"],
    nodeCount: 3,
    edgeCount: 2,
  },
}, null, 2);

// ── Test Data Setup ─────────────────────────────────────────────

let testRepoPath = "";

export function getTestRepoPath(): string {
  return testRepoPath;
}

export function createTestRepo(): string {
  testRepoPath = mkdtempSync(join(tmpdir(), "edith-e2e-"));

  writeFileSync(join(testRepoPath, "routing-table.md"), ROUTING_TABLE);

  const paymentDir = join(testRepoPath, "payment-service");
  mkdirSync(paymentDir, { recursive: true });
  writeFileSync(join(paymentDir, "quick-ref.md"), QUICK_REF_PAYMENT);

  const distillatesDir = join(testRepoPath, "distillates", "payment-service");
  mkdirSync(distillatesDir, { recursive: true });
  writeFileSync(join(distillatesDir, "payment-api-contract.md"), DISTILLATE_PAYMENT_API);
  writeFileSync(join(distillatesDir, "payment-data-model.md"), DISTILLATE_PAYMENT_MODEL);

  const edithDir = join(testRepoPath, ".edith", "graphify-cache");
  mkdirSync(edithDir, { recursive: true });
  writeFileSync(join(edithDir, "graph.json"), GRAPH_JSON);

  execSync("git init", { cwd: testRepoPath });
  execSync('git config user.email "test@edith.ai"', { cwd: testRepoPath });
  execSync('git config user.name "Test"', { cwd: testRepoPath });
  execSync("git add -A", { cwd: testRepoPath });
  execSync('git commit -m "scan: initial knowledge base"', { cwd: testRepoPath });

  writeFileSync(join(testRepoPath, "extra.md"), "# Extra\n");
  execSync("git add -A", { cwd: testRepoPath });
  execSync('git commit -m "distill: add extra docs"', { cwd: testRepoPath });

  return testRepoPath;
}

export function cleanupTestRepo(): void {
  if (testRepoPath) {
    rmSync(testRepoPath, { recursive: true, force: true });
  }
}

// ── Server Management ───────────────────────────────────────────

let serverProcess: ChildProcess | null = null;

export async function startServer(repoPath: string, port = 13001): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        EDITH_REPO_PATH: repoPath,
        BOARD_PORT: String(port),
        WS_ENABLED: "true",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      reject(new Error("Server startup timed out"));
    }, 15_000);

    const onOutput = (data: Buffer) => {
      if (data.toString().includes("Server listening")) {
        clearTimeout(timeout);
        resolve();
      }
    };

    serverProcess.stdout!.on("data", onOutput);
    serverProcess.stderr!.on("data", onOutput);
  });
}

export async function stopServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
    await new Promise((r) => setTimeout(r, 500));
  }
}

// ── API Helper ──────────────────────────────────────────────────

const API_BASE = "http://localhost:13001";

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, init);
}
