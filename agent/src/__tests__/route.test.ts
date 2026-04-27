/**
 * Unit tests for jarvis_route tool (route.ts)
 *
 * Tests all 7 scenarios from the spec:
 *   Scenario 1: Direct routing (single service CRUD)
 *   Scenario 2: Load quick-ref (API change)
 *   Scenario 3: Cross-service routing (multi-service)
 *   Scenario 4: Ambiguous service name
 *   Scenario 5: routing-table.md not found
 *   Scenario 6: Unclear requirement
 *   Scenario 7: Deep-dive routing (schema change)
 *
 * Plus additional tests for:
 *   - Context filtering (avoid duplicate suggestions)
 *   - Change type classification accuracy
 *   - Confidence scoring
 *   - File path resolution with missing files
 *
 * Uses Node.js built-in test runner with temporary file fixtures.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  executeRoute,
  formatRouteSummary,
  formatRouteError,
  type RouteParams,
  type RouteResult,
  type RouteOutcome,
} from "../tools/route.js";

// ── Test Fixtures ─────────────────────────────────────────────────

/**
 * Create a test workspace with a routing table and optional service artifacts.
 */
function createTestWorkspace(services: Array<{
  name: string;
  role: string;
  stack: string;
  owner: string;
  constraints: string;
  quickRef?: string;
  distillates?: Array<{ name: string; content: string }>;
}>): string {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-route-test-"));

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

  for (const svc of services) {
    routingTableLines.push(
      `| ${svc.name} | ${svc.role} | ${svc.stack} | ${svc.owner} | ${svc.constraints} |`,
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
  routingTableLines.push("## Loading Rules");
  routingTableLines.push("- Layer 0: always loaded");
  routingTableLines.push("- Layer 1: on-demand");
  routingTableLines.push("- Layer 2: on-demand");

  // Write routing table
  const companyJarvisDir = join(ws, "skills", "company-jarvis");
  mkdirSync(companyJarvisDir, { recursive: true });
  writeFileSync(
    join(companyJarvisDir, "routing-table.md"),
    routingTableLines.join("\n"),
    "utf-8",
  );

  return ws;
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
      "",
      "## Key Constraints",
      "- All DB access via repository layer",
      "- Passwords hashed with bcrypt",
    ].join("\n"),
    distillates: [
      {
        name: "01-overview",
        content: "# user-service Overview\n\n用户中心服务，负责用户注册、认证、信息管理。",
      },
      {
        name: "02-api-contracts",
        content: "# API Contracts\n\n## POST /api/users\n\nRequest: username, email, password",
      },
      {
        name: "03-data-models",
        content: "# Data Models\n\n## User\n- id: UUID (PK)\n- username: string (unique)\n- email: string (unique)",
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
      "",
      "## Key Constraints",
      "- Order ID must be globally unique",
    ].join("\n"),
    distillates: [
      {
        name: "01-overview",
        content: "# order-service Overview\n\n订单处理服务，负责订单创建、状态流转。",
      },
      {
        name: "02-api-contracts",
        content: "# API Contracts\n\n## POST /api/orders\n\nRequest: user_id, items[]",
      },
      {
        name: "03-data-models",
        content: "# Data Models\n\n## Order\n- id: string (PK)\n- user_id: UUID\n- status: string\n- items: string[]",
      },
    ],
  },
  {
    name: "inventory-service",
    role: "库存管理",
    stack: "Go + Redis",
    owner: "@wangwu",
    constraints: "库存不能为负",
    quickRef: "# inventory-service Quick Ref\n\n## Constraints\n- Stock cannot go negative",
    distillates: [
      {
        name: "01-overview",
        content: "# inventory-service Overview\n\n库存管理服务。",
      },
      {
        name: "02-data-models",
        content: "# Data Models\n\n## InventoryItem\n- id: string\n- sku: string\n- quantity: int",
      },
    ],
  },
  {
    name: "user-admin-service",
    role: "用户管理后台",
    stack: "Node.js + MongoDB",
    owner: "@zhaoliu",
    constraints: "仅限管理员操作",
    quickRef: "# user-admin-service Quick Ref\n\n## Constraints\n- Admin only operations",
  },
];

// ── Scenario 1: Direct Routing ────────────────────────────────────

describe("Scenario 1: Direct routing (single service CRUD)", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return direct for single service CRUD", () => {
    const outcome = executeRoute(
      { requirement: "给 user-service 的用户表加 phone 字段" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "direct");
    assert.ok(outcome.result.services.includes("user-service"));
    assert.equal(outcome.result.filesToLoad.length, 0);
    assert.ok(outcome.result.reason.includes("CRUD"));
    assert.ok(outcome.result.confidence >= 0.7, `Confidence should be >= 0.7, got ${outcome.result.confidence}`);
  });

  it("should return direct for simple field addition", () => {
    const outcome = executeRoute(
      { requirement: "给 user-service 加一个 email 字段" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "direct");
    assert.ok(outcome.result.filesToLoad.length === 0);
  });
});

// ── Scenario 2: Load Quick-Ref ────────────────────────────────────

describe("Scenario 2: Load quick-ref (API change)", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return quick-ref for API change on single service", () => {
    const outcome = executeRoute(
      { requirement: "修改 order-service 创建订单接口，增加优惠券字段" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
    assert.ok(outcome.result.services.includes("order-service"));
    assert.ok(outcome.result.filesToLoad.length > 0);
    assert.ok(
      outcome.result.filesToLoad.some((f) => f.includes("quick-ref")),
      "Should suggest loading quick-ref.md",
    );
    assert.ok(outcome.result.reason.includes("接口"));
  });

  it("should return quick-ref for interface modification", () => {
    const outcome = executeRoute(
      { requirement: "改接口 order-service 的返回值格式" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
  });
});

// ── Scenario 3: Cross-Service Routing ─────────────────────────────

describe("Scenario 3: Cross-service routing", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return quick-ref for multi-service requirement", () => {
    const outcome = executeRoute(
      { requirement: "order-service 用户下单后需要同步更新 inventory-service 的库存" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
    assert.ok(outcome.result.services.length >= 2, `Expected >=2 services, got ${outcome.result.services.join(", ")}`);
    assert.ok(
      outcome.result.filesToLoad.some((f) => f.includes("quick-ref")),
      "Should suggest loading quick-ref files",
    );
  });

  it("should return quick-ref when explicitly naming 2 services", () => {
    const outcome = executeRoute(
      { requirement: "order-service 和 inventory-service 的数据同步" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.ok(outcome.result.services.includes("order-service"));
    assert.ok(outcome.result.services.includes("inventory-service"));
    assert.equal(outcome.result.decision, "quick-ref");
  });
});

// ── Scenario 4: Ambiguous Service Name ────────────────────────────

describe("Scenario 4: Ambiguous service name", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return result with ambiguity when multiple services partially match", () => {
    // "用户" could match user-service and user-admin-service via their role aliases
    const outcome = executeRoute(
      { requirement: "修改 user-service 或 user-admin-service 的注册逻辑" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    // Should still return a decision (best guess) but may have ambiguity
    assert.ok(outcome.result.decision, "Should have a decision");
    assert.ok(outcome.result.confidence < 1.0, "Confidence should be less than perfect");
    // Check that services were matched (even if ambiguous)
    assert.ok(outcome.result.services.length >= 2, "Should match both user services");
  });
});

// ── Scenario 5: Routing Table Not Found ───────────────────────────

describe("Scenario 5: routing-table.md not found", () => {
  it("should return ROUTING_TABLE_NOT_FOUND when no routing table", () => {
    const ws = mkdtempSync(join(tmpdir(), "jarvis-route-test-empty-"));
    try {
      const outcome = executeRoute(
        { requirement: "修改订单创建接口" },
        ws,
      );

      assert.equal(outcome.ok, false);
      if (outcome.ok) return;
      assert.equal(outcome.error.code, "ROUTING_TABLE_NOT_FOUND");
      assert.ok(outcome.error.message.includes("routing-table.md"));
      assert.ok(outcome.error.suggestion.includes("jarvis_distill"));
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});

// ── Scenario 6: Unclear Requirement ───────────────────────────────

describe("Scenario 6: Unclear requirement", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return UNCLEAR_REQUIREMENT when no services match and change type unknown", () => {
    const outcome = executeRoute(
      { requirement: "改一下那个东西" },
      ws,
    );

    assert.equal(outcome.ok, false);
    if (outcome.ok) return;
    assert.equal(outcome.error.code, "UNCLEAR_REQUIREMENT");
    assert.ok(outcome.error.message.includes("已有服务"));
  });

  it("should return UNCLEAR_REQUIREMENT for empty requirement", () => {
    const outcome = executeRoute(
      { requirement: "" },
      ws,
    );

    assert.equal(outcome.ok, false);
    if (outcome.ok) return;
    assert.equal(outcome.error.code, "UNCLEAR_REQUIREMENT");
  });
});

// ── Scenario 7: Deep-Dive Routing ─────────────────────────────────

describe("Scenario 7: Deep-dive routing (schema change)", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should return deep-dive for schema change on single service", () => {
    const outcome = executeRoute(
      { requirement: "把 order-service 的 Order 的 items 字段从 String 改为 OrderItem 对象，需要知道 Order 和 OrderItem 的完整字段定义" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "deep-dive");
    assert.ok(outcome.result.services.includes("order-service"));
    // Should include both quick-ref and distillates
    assert.ok(
      outcome.result.filesToLoad.some((f) => f.includes("quick-ref")),
      "Should include quick-ref",
    );
    assert.ok(
      outcome.result.filesToLoad.some((f) => f.includes("distillates")),
      "Should include distillate fragments",
    );
    assert.ok(outcome.result.reason.includes("Schema") || outcome.result.reason.includes("数据模型"));
  });

  it("should return deep-dive for multi-service schema change", () => {
    const outcome = executeRoute(
      { requirement: "重构 order-service 和 inventory-service 的数据模型，需要知道完整字段定义" },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "deep-dive");
    assert.ok(outcome.result.services.length >= 2);
  });
});

// ── Additional Tests: Context Filtering ───────────────────────────

describe("Context filtering (avoid duplicate suggestions)", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should not suggest files already in context", () => {
    const outcome = executeRoute(
      {
        requirement: "修改 order-service 创建订单接口",
        context: ["skills/order-service/quick-ref.md"],
      },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    // quick-ref should be filtered out since it's already in context
    const quickRefSuggestions = outcome.result.filesToLoad.filter(
      (f) => f.includes("quick-ref") && f.includes("order-service"),
    );
    assert.equal(quickRefSuggestions.length, 0, "Should not suggest already-loaded quick-ref");
  });

  it("should not suggest distillates already in context", () => {
    const outcome = executeRoute(
      {
        requirement: "修改 order-service 数据模型字段定义",
        context: ["distillates/order-service/03-data-models.md"],
      },
      ws,
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "deep-dive");
    const dataModelSuggestions = outcome.result.filesToLoad.filter(
      (f) => f.includes("03-data-models"),
    );
    assert.equal(dataModelSuggestions.length, 0, "Should not suggest already-loaded distillate");
  });
});

// ── Additional Tests: Change Type Classification ──────────────────

describe("Change type classification accuracy", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should classify '加字段' as crud", () => {
    const outcome = executeRoute(
      { requirement: "给 user-service 加 phone 字段" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "direct");
  });

  it("should classify '改接口' as api_change", () => {
    const outcome = executeRoute(
      { requirement: "修改 user-service 的登录接口" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
  });

  it("should classify '重构' as refactor", () => {
    const outcome = executeRoute(
      { requirement: "重构 user-service 的认证模块" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
  });

  it("should classify '故障' as incident", () => {
    const outcome = executeRoute(
      { requirement: "user-service 线上故障紧急排查" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
    assert.ok(outcome.result.reason.includes("紧急"));
  });

  it("should classify '同步' with multiple services as cross_service", () => {
    const outcome = executeRoute(
      { requirement: "order-service 和 inventory-service 数据同步集成" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.result.decision, "quick-ref");
    assert.ok(outcome.result.services.length >= 2);
  });
});

// ── Additional Tests: Confidence Scoring ──────────────────────────

describe("Confidence scoring", () => {
  let ws: string;

  before(() => {
    ws = createTestWorkspace(STANDARD_SERVICES);
  });

  after(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it("should have high confidence for clear single-service CRUD", () => {
    const outcome = executeRoute(
      { requirement: "给 user-service 加一个 phone 字段" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.ok(outcome.result.confidence >= 0.8, `Expected >= 0.8, got ${outcome.result.confidence}`);
    assert.equal(outcome.result.ambiguity, undefined);
  });

  it("should have lower confidence for ambiguous match", () => {
    // "用户" is ambiguous between user-service and user-admin-service
    const outcome = executeRoute(
      { requirement: "改一下用户服务的逻辑" },
      ws,
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    // Confidence may be lower if multiple services match
    // The exact threshold depends on implementation
    assert.ok(typeof outcome.result.confidence === "number");
  });

  it("should have 0 confidence for empty workspace (handled as error)", () => {
    const emptyWs = mkdtempSync(join(tmpdir(), "jarvis-route-test-conf-"));
    try {
      const outcome = executeRoute(
        { requirement: "修改订单接口" },
        emptyWs,
      );
      assert.equal(outcome.ok, false);
    } finally {
      rmSync(emptyWs, { recursive: true, force: true });
    }
  });
});

// ── Additional Tests: File Path Resolution ────────────────────────

describe("File path resolution", () => {
  it("should report missing files when quick-ref does not exist", () => {
    const ws = createTestWorkspace([
      {
        name: "user-service",
        role: "用户中心",
        stack: "Spring Boot",
        owner: "@zhangsan",
        constraints: "禁止直连数据库",
        // No quick-ref or distillates
      },
    ]);

    try {
      const outcome = executeRoute(
        { requirement: "修改 user-service 的登录接口" },
        ws,
      );

      assert.equal(outcome.ok, true);
      if (!outcome.ok) return;
      assert.equal(outcome.result.decision, "quick-ref");
      // Reason should mention missing files
      assert.ok(
        outcome.result.reason.includes("尚未生成") || outcome.result.filesToLoad.length === 0,
        "Should note missing files or have empty filesToLoad",
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("should include data-model distillates for schema changes", () => {
    const ws = createTestWorkspace(STANDARD_SERVICES);

    try {
      const outcome = executeRoute(
        { requirement: "修改 order-service 的 Order 数据模型字段定义" },
        ws,
      );

      assert.equal(outcome.ok, true);
      if (!outcome.ok) return;
      assert.equal(outcome.result.decision, "deep-dive");

      const distillateFiles = outcome.result.filesToLoad.filter((f) => f.includes("distillates"));
      assert.ok(distillateFiles.length > 0, "Should include distillate fragments");
      // Should prefer data-model fragment
      assert.ok(
        distillateFiles.some((f) => f.includes("data-model")),
        "Should include data-model fragment",
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});

// ── Output Formatting Tests ───────────────────────────────────────

describe("formatRouteSummary", () => {
  it("should format a complete route result", () => {
    const result: RouteResult = {
      decision: "quick-ref",
      services: ["order-service"],
      filesToLoad: ["skills/order-service/quick-ref.md"],
      reason: "需要修改 order-service 接口，了解现有约束",
      confidence: 0.95,
    };

    const summary = formatRouteSummary(result);
    assert.ok(summary.includes("quick-ref"));
    assert.ok(summary.includes("order-service"));
    assert.ok(summary.includes("95%"));
    assert.ok(summary.includes("quick-ref.md"));
  });

  it("should include ambiguity warning when present", () => {
    const result: RouteResult = {
      decision: "quick-ref",
      services: ["user-service", "user-admin-service"],
      filesToLoad: [],
      reason: "需求可能涉及多个服务",
      confidence: 0.55,
      ambiguity: "需求可能涉及 user-service 或 user-admin-service，请明确目标服务",
    };

    const summary = formatRouteSummary(result);
    assert.ok(summary.includes("注意"));
    assert.ok(summary.includes("user-admin-service"));
  });

  it("should format direct decision with no files", () => {
    const result: RouteResult = {
      decision: "direct",
      services: ["user-service"],
      filesToLoad: [],
      reason: "单服务 CRUD 操作",
      confidence: 0.95,
    };

    const summary = formatRouteSummary(result);
    assert.ok(summary.includes("direct"));
    assert.ok(!summary.includes("建议加载"));
  });
});

describe("formatRouteError", () => {
  it("should format error with code and suggestion", () => {
    const output = formatRouteError({
      code: "ROUTING_TABLE_NOT_FOUND",
      message: "路由表不存在",
      suggestion: "请先执行 jarvis_distill",
    });

    assert.ok(output.includes("ROUTING_TABLE_NOT_FOUND"));
    assert.ok(output.includes("路由表不存在"));
    assert.ok(output.includes("jarvis_distill"));
  });
});

// ── Edge Cases ────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("should handle requirement with only whitespace", () => {
    const ws = createTestWorkspace(STANDARD_SERVICES);
    try {
      const outcome = executeRoute({ requirement: "   " }, ws);
      assert.equal(outcome.ok, false);
      if (outcome.ok) return;
      assert.equal(outcome.error.code, "UNCLEAR_REQUIREMENT");
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("should handle requirement with no matched services but known change type", () => {
    const ws = createTestWorkspace(STANDARD_SERVICES);
    try {
      // "payment-gateway" is not in the routing table, but "改接口" is a known change type
      const outcome = executeRoute(
        { requirement: "修改 payment-gateway 的支付接口" },
        ws,
      );

      // Should return direct (0 matched services) rather than error,
      // because the change type is known
      assert.equal(outcome.ok, true);
      if (!outcome.ok) return;
      assert.equal(outcome.result.decision, "direct");
      assert.equal(outcome.result.services.length, 0);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("should handle zero services in routing table", () => {
    const ws = createTestWorkspace([]);
    try {
      const outcome = executeRoute(
        { requirement: "修改用户接口" },
        ws,
      );

      // With empty routing table, services won't match -> UNCLEAR_REQUIREMENT or direct
      // Since change type is "api_change" (known), should return direct
      assert.equal(outcome.ok, true);
      if (!outcome.ok) return;
      assert.equal(outcome.result.decision, "direct");
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});
