/**
 * Unit tests for edith_query tool (query.ts)
 *
 * Tests all 8 scenarios from the spec:
 *   Scenario 1: Simple query
 *   Scenario 2: Cross-service query
 *   Scenario 3: Empty knowledge base
 *   Scenario 4: Missing Layer 1
 *   Scenario 5: Missing Layer 2
 *   Scenario 6: Corrupted Markdown file
 *   Scenario 7: Large knowledge base performance
 *   Scenario 8: Service not found
 *
 * Uses Node.js built-in test runner with temporary file fixtures.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  executeQuery,
  validateQueryParams,
  type QueryParams,
  type QueryResult,
} from "../query.js";
import type { EdithConfig } from "../config.js";

// ── Test Fixtures ─────────────────────────────────────────────────

let testWorkspace: string;

function createTestWorkspace(services: Array<{
  name: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
  quickRef?: string;
  distillates?: Array<{ name: string; content: string }>;
}>): string {
  const ws = mkdtempSync(join(tmpdir(), "edith-test-"));

  // Create routing table
  const routingTableLines: string[] = [
    "---",
    "name: test-routing-table",
    "layer: 0",
    "---",
    "",
    "# Test Service Routing Table",
    "",
    "## Services",
    "",
    "| Service | Role | Stack | Owner | Key Constraints |",
    "|---------|------|-------|-------|-----------------|",
  ];

  const quickRefPaths: string[] = [];

  for (const svc of services) {
    routingTableLines.push(
      `| ${svc.name} | ${svc.role} | ${svc.stack} | ${svc.owner} | ${svc.constraints} |`
    );
    quickRefPaths.push(
      `| ${svc.name} | skills/${svc.name}/quick-ref.md | distillates/${svc.name} |`
    );

    // Create skills directory and quick-ref
    if (svc.quickRef !== undefined) {
      const skillsDir = join(ws, "skills", svc.name);
      mkdirSync(skillsDir, { recursive: true });
      writeFileSync(join(skillsDir, "quick-ref.md"), svc.quickRef, "utf-8");
    }

    // Create distillates
    if (svc.distillates && svc.distillates.length > 0) {
      const distDir = join(ws, "distillates", svc.name);
      mkdirSync(distDir, { recursive: true });
      for (const frag of svc.distillates) {
        writeFileSync(join(distDir, `${frag.name}.md`), frag.content, "utf-8");
      }
    }
  }

  routingTableLines.push("");
  routingTableLines.push("## Quick-Ref Paths");
  routingTableLines.push("");
  routingTableLines.push("| Service | Quick-Ref (Layer 1) | Full Skill (Layer 2) |");
  routingTableLines.push("|---------|---------------------|----------------------|");
  routingTableLines.push(...quickRefPaths);
  routingTableLines.push("");
  routingTableLines.push("## Loading Rules");
  routingTableLines.push("- Layer 0: always loaded");
  routingTableLines.push("- Layer 1: on-demand");
  routingTableLines.push("- Layer 2: on-demand");

  // Write routing table to standard location
  const companyEdithDir = join(ws, "skills", "company-edith");
  mkdirSync(companyEdithDir, { recursive: true });
  writeFileSync(join(companyEdithDir, "routing-table.md"), routingTableLines.join("\n"), "utf-8");

  return ws;
}

function makeConfig(workspaceRoot: string): EdithConfig {
  return {
    llm: { provider: "test", model: "test-model" },
    workspace: { root: workspaceRoot, language: "zh" },
    repos: [],
    agent: {
      context_budget: {
        routing_table: 500,
        quick_ref: 2000,
        distillate_per_query: 6000,
        max_fragments_per_route: 5,
      },
      auto_refresh: true,
      refresh_interval: "24h",
    },
    context_monitor: {
      enabled: true,
      thresholds: { warning: 70, critical: 85, emergency: 95 },
    },
  };
}

const STANDARD_SERVICES = [
  {
    name: "user-service",
    role: "用户中心",
    stack: "Spring Boot + PostgreSQL",
    owner: "@zhangsan",
    constraints: "禁止直连数据库",
    quickRef: [
      "# user-service Quick Ref",
      "",
      "## Verify",
      "- Build: `mvn clean package`",
      "- Test: `mvn test`",
      "- Run: `java -jar target/user-service.jar`",
      "",
      "## Key Constraints",
      "- All DB access via repository layer",
      "- Passwords hashed with bcrypt",
      "",
      "## API Endpoints",
      "| Method | Path | Purpose |",
      "| POST | /api/users | Create user |",
      "| GET | /api/users/{id} | Get user by ID |",
    ].join("\n"),
    distillates: [
      {
        name: "01-overview",
        content: "# user-service Overview\n\n用户中心服务，负责用户注册、认证、信息管理。\n\n主要模块：认证模块、用户信息模块、权限模块。",
      },
      {
        name: "02-api-contracts",
        content:
          "# API Contracts\n\n## POST /api/users\n\nRequest:\n```json\n{ \"username\": \"string\", \"email\": \"string\", \"password\": \"string\" }\n```\n\nResponse:\n```json\n{ \"id\": \"uuid\", \"username\": \"string\", \"email\": \"string\" }\n```",
      },
      {
        name: "03-data-models",
        content:
          "# Data Models\n\n## User\n- id: UUID (PK)\n- username: string (unique)\n- email: string (unique)\n- password_hash: string\n- created_at: timestamp",
      },
    ],
  },
  {
    name: "order-service",
    role: "订单处理",
    stack: "Spring Boot + Redis + Kafka",
    owner: "@lisi",
    constraints: "订单号全局唯一",
    quickRef: [
      "# order-service Quick Ref",
      "",
      "## Verify",
      "- Build: `mvn clean package`",
      "- Test: `mvn test`",
      "",
      "## Key Constraints",
      "- Order ID must be globally unique",
      "- Order status transitions are strictly ordered",
      "",
      "## API Endpoints",
      "| Method | Path | Purpose |",
      "| POST | /api/orders | Create order |",
      "| GET | /api/orders/{id} | Get order |",
    ].join("\n"),
    distillates: [
      {
        name: "01-overview",
        content: "# order-service Overview\n\n订单处理服务，负责订单创建、状态流转、支付集成。\n\n依赖：user-service（用户校验）、payment-service（支付处理）。",
      },
      {
        name: "02-api-contracts",
        content:
          "# API Contracts\n\n## POST /api/orders\n\nRequest:\n```json\n{ \"user_id\": \"uuid\", \"items\": [{\"product_id\": \"string\", \"quantity\": 1}] }\n```\n\nResponse:\n```json\n{ \"order_id\": \"string\", \"status\": \"created\" }\n```",
      },
    ],
  },
];

// ── Tests ─────────────────────────────────────────────────────────

describe("validateQueryParams", () => {
  it("should accept valid parameters", () => {
    const err = validateQueryParams({ question: "test question" });
    assert.equal(err, null);
  });

  it("should reject missing question", () => {
    const err = validateQueryParams({ question: "" });
    assert.ok(err);
    assert.ok(err.includes("question"));
  });

  it("should reject invalid max_depth", () => {
    const err = validateQueryParams({ question: "test", max_depth: 3 as any });
    assert.ok(err);
    assert.ok(err.includes("max_depth"));
  });

  it("should accept max_depth 0, 1, 2", () => {
    assert.equal(validateQueryParams({ question: "test", max_depth: 0 }), null);
    assert.equal(validateQueryParams({ question: "test", max_depth: 1 }), null);
    assert.equal(validateQueryParams({ question: "test", max_depth: 2 }), null);
  });

  it("should reject non-array services", () => {
    const err = validateQueryParams({ question: "test", services: "bad" as any });
    assert.ok(err);
    assert.ok(err.includes("数组"));
  });

  it("should reject empty string in services", () => {
    const err = validateQueryParams({ question: "test", services: [""] });
    assert.ok(err);
  });

  it("should accept valid services array", () => {
    const err = validateQueryParams({ question: "test", services: ["svc-a"] });
    assert.equal(err, null);
  });
});

describe("executeQuery — Scenario 1: Simple query", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should load Layer 0, Layer 1, and Layer 2 for user-service", () => {
    const result = executeQuery(
      { question: "user-service 的认证流程是什么？", max_depth: 2 },
      config
    );

    assert.equal(result.error, undefined);
    assert.ok(result.layersLoaded.includes(0), "Layer 0 should be loaded");
    assert.ok(result.layersLoaded.includes(1), "Layer 1 should be loaded");
    assert.ok(result.layersLoaded.includes(2), "Layer 2 should be loaded");
    assert.ok(result.servicesQueried.includes("user-service"));
    assert.ok(result.sources.length >= 2, "Should have sources from multiple layers");
    assert.ok(result.tokensConsumed > 0);
    assert.ok(result.answer.includes("user-service"));
  });

  it("should include source citations with layer info", () => {
    const result = executeQuery(
      { question: "user-service API 端点", max_depth: 2 },
      config
    );

    const layer1Sources = result.sources.filter((s) => s.layer === 1);
    const layer2Sources = result.sources.filter((s) => s.layer === 2);

    assert.ok(layer1Sources.length > 0, "Should have Layer 1 sources");
    assert.ok(layer2Sources.length > 0, "Should have Layer 2 sources");

    for (const src of result.sources) {
      assert.ok(src.file, "Source should have a file");
      assert.ok(typeof src.relevance === "number");
    }
  });

  it("should respect max_depth=0 (only Layer 0)", () => {
    const result = executeQuery(
      { question: "user-service 是什么？", max_depth: 0 },
      config
    );

    assert.deepEqual(result.layersLoaded, [0]);
    assert.ok(!result.answer.includes("Quick Ref"));
  });

  it("should respect max_depth=1 (Layer 0 + 1)", () => {
    const result = executeQuery(
      { question: "user-service 有什么约束？", max_depth: 1 },
      config
    );

    assert.ok(result.layersLoaded.includes(0));
    assert.ok(result.layersLoaded.includes(1));
    assert.ok(!result.layersLoaded.includes(2));
  });
});

describe("executeQuery — Scenario 2: Cross-service query", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should match multiple services from question", () => {
    const result = executeQuery(
      { question: "order-service 和 user-service 的关系是什么？", max_depth: 1 },
      config
    );

    assert.ok(result.servicesQueried.includes("order-service"));
    assert.ok(result.servicesQueried.includes("user-service"));
    assert.ok(result.sources.length >= 3, "Should have sources from multiple services");
  });

  it("should list all matched services in answer", () => {
    const result = executeQuery(
      { question: "order-service 创建订单流程", max_depth: 2 },
      config
    );

    assert.ok(result.answer.includes("order-service"));
    assert.ok(result.servicesQueried.length >= 1);
  });
});

describe("executeQuery — Scenario 3: Empty knowledge base", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    // Create workspace with no routing table
    ws = mkdtempSync(join(tmpdir(), "edith-test-empty-"));
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return KNOWLEDGE_BASE_EMPTY when routing table missing", () => {
    const result = executeQuery(
      { question: "任何问题" },
      config
    );

    assert.ok(result.error);
    assert.equal(result.error.code, "KNOWLEDGE_BASE_EMPTY");
    assert.ok(result.answer.includes("知识库为空"));
    assert.equal(result.layersLoaded.length, 0);
  });

  it("should return KNOWLEDGE_BASE_EMPTY when routing table is empty", () => {
    const companyEdithDir = join(ws, "skills", "company-edith");
    mkdirSync(companyEdithDir, { recursive: true });
    writeFileSync(join(companyEdithDir, "routing-table.md"), "", "utf-8");

    const result = executeQuery(
      { question: "任何问题" },
      config
    );

    assert.ok(result.error);
    assert.equal(result.error.code, "KNOWLEDGE_BASE_EMPTY");
  });
});

describe("executeQuery — Scenario 4: Missing Layer 1", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace([
      {
        name: "user-service",
        role: "用户中心",
        stack: "Spring Boot",
        owner: "@zhangsan",
        constraints: "禁止直连数据库",
        // No quickRef!
        distillates: [
          { name: "01-overview", content: "# Overview\nTest content." },
        ],
      },
    ]);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should degrade to Layer 0 with MISSING_LAYER1 warning", () => {
    const result = executeQuery(
      { question: "user-service 有哪些 API 端点？", max_depth: 2 },
      config
    );

    assert.ok(result.layersLoaded.includes(0));
    assert.ok(!result.layersLoaded.includes(1), "Layer 1 should not be loaded");

    const missingLayer1Warning = result.warnings.find((w) => w.code === "MISSING_LAYER1");
    assert.ok(missingLayer1Warning, "Should have MISSING_LAYER1 warning");
    assert.ok(missingLayer1Warning.message.includes("quick-ref.md"));
  });
});

describe("executeQuery — Scenario 5: Missing Layer 2", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace([
      {
        name: "user-service",
        role: "用户中心",
        stack: "Spring Boot",
        owner: "@zhangsan",
        constraints: "禁止直连数据库",
        quickRef: "# Quick Ref\n\n## Verify\n- Build: mvn clean package",
        // No distillates!
      },
    ]);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should degrade to Layer 0+1 with MISSING_LAYER2 warning", () => {
    const result = executeQuery(
      { question: "user-service 的 User 模型有哪些字段？", max_depth: 2 },
      config
    );

    assert.ok(result.layersLoaded.includes(0));
    assert.ok(result.layersLoaded.includes(1));
    assert.ok(!result.layersLoaded.includes(2), "Layer 2 should not be loaded");

    const missingLayer2Warning = result.warnings.find((w) => w.code === "MISSING_LAYER2");
    assert.ok(missingLayer2Warning, "Should have MISSING_LAYER2 warning");
  });
});

describe("executeQuery — Scenario 6: Corrupted Markdown file", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace([
      {
        name: "order-service",
        role: "订单处理",
        stack: "Spring Boot",
        owner: "@lisi",
        constraints: "订单号全局唯一",
        quickRef: "", // Empty = corrupted
      },
    ]);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should skip corrupted file with CORRUPTED_FILE warning", () => {
    const result = executeQuery(
      { question: "order-service 有什么约束？", max_depth: 1 },
      config
    );

    assert.ok(result.layersLoaded.includes(0));
    assert.ok(!result.layersLoaded.includes(1));

    const corruptedWarning = result.warnings.find((w) => w.code === "CORRUPTED_FILE");
    assert.ok(corruptedWarning, "Should have CORRUPTED_FILE warning");
    assert.ok(corruptedWarning.message.includes("已跳过"));
  });
});

describe("executeQuery — Scenario 7: Large knowledge base", () => {
  it("should only load target service files, not all 50 services", () => {
    // Create workspace with 50 services
    const services = [];
    for (let i = 0; i < 50; i++) {
      services.push({
        name: `service-${i}`,
        role: `Service ${i}`,
        stack: "Node.js",
        owner: `@dev${i}`,
        constraints: `Constraint ${i}`,
        quickRef: `# service-${i} Quick Ref\n\n## Verify\n- Build: npm run build`,
        distillates: [
          { name: "01-overview", content: `# service-${i} Overview\nTest content for service ${i}.` },
        ],
      });
    }

    const ws = createTestWorkspace(services);
    const config = makeConfig(ws);

    try {
      const result = executeQuery(
        { question: "service-25 是什么？", max_depth: 2 },
        config
      );

      assert.ok(result.servicesQueried.includes("service-25"));
      assert.equal(result.servicesQueried.length, 1, "Should only load service-25");

      // Token budget should be bounded
      assert.ok(
        result.tokensConsumed < 6000,
        `Token consumption should be bounded, got ${result.tokensConsumed}`
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});

describe("executeQuery — Scenario 8: Service not found", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return SERVICE_NOT_FOUND for unknown service", () => {
    const result = executeQuery(
      { question: "报表系统的导出功能怎么用？" },
      config
    );

    assert.ok(result.error);
    assert.equal(result.error.code, "SERVICE_NOT_FOUND");
    assert.ok(result.answer.includes("未在知识库中找到"));
    assert.ok(result.answer.includes("user-service"), "Should list existing services");
    assert.ok(result.answer.includes("order-service"), "Should list existing services");
  });
});

describe("executeQuery — Parameter validation via executeQuery", () => {
  it("should return error for empty question", () => {
    const ws = createTestWorkspace(STANDARD_SERVICES);
    const config = makeConfig(ws);
    try {
      const result = executeQuery({ question: "" }, config);
      assert.ok(result.error);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("should return error for invalid max_depth", () => {
    const ws = createTestWorkspace(STANDARD_SERVICES);
    const config = makeConfig(ws);
    try {
      const result = executeQuery({ question: "test", max_depth: 5 as any }, config);
      assert.ok(result.error);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});

describe("executeQuery — Explicit services parameter", () => {
  let ws: string;
  let config: EdithConfig;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
    config = makeConfig(ws);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should use explicit services list instead of auto-detect", () => {
    const result = executeQuery(
      { question: "any question", services: ["user-service"], max_depth: 1 },
      config
    );

    assert.deepEqual(result.servicesQueried, ["user-service"]);
    assert.ok(result.layersLoaded.includes(1));
  });

  it("should report unmatched explicit services as warning", () => {
    const result = executeQuery(
      { question: "any question", services: ["nonexistent-svc"], max_depth: 1 },
      config
    );

    assert.ok(result.error);
    assert.equal(result.error.code, "SERVICE_NOT_FOUND");
    const unmatchedWarning = result.warnings.find(
      (w) => w.code === "SERVICE_NOT_FOUND" && w.service === "nonexistent-svc"
    );
    assert.ok(unmatchedWarning, "Should warn about unmatched explicit service");
  });
});
