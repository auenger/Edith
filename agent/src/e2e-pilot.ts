/**
 * E2E Pilot Test Script
 *
 * Executes the full JARVIS pipeline: scan -> distill -> query -> route
 * using the JARVIS repo itself as the test project.
 * Generates pilot-report.md with results.
 */

import { resolve, join } from "node:path";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

import { loadConfig } from "./config.js";
import { executeScan, formatScanSummary, type ScanResult } from "./tools/scan.js";
import { executeDistill, formatDistillSummary, estimateTokens, type DistillResult } from "./tools/distill.js";
import { executeRoute, formatRouteSummary, type RouteResult } from "./tools/route.js";
import { executeQuery, validateQueryParams, type QueryResult } from "./query.js";

// ── Pilot Configuration ─────────────────────────────────────────────

const TEST_TARGET = "jarvis-repo";
const WORKSPACE = resolve("./company-jarvis");

// 5 test queries
const TEST_QUERIES = [
  {
    question: "jarvis-repo 的技术栈是什么",
    expectedContains: ["Node.js", "Python", "TypeScript"],
    description: "查询技术栈",
  },
  {
    question: "jarvis-repo 有哪些 API 端点",
    expectedContains: ["endpoints"],
    description: "查询 API 端点",
  },
  {
    question: "jarvis-repo 的数据模型是什么",
    expectedContains: ["model"],
    description: "查询数据模型",
  },
  {
    question: "jarvis-repo 的核心业务流程是什么",
    expectedContains: ["flow", "业务"],
    description: "查询业务流程",
  },
  {
    question: "jarvis-repo 的配置管理是如何实现的",
    expectedContains: ["jarvis.yaml", "config"],
    description: "查询配置管理",
  },
];

// 3 test route requirements
const TEST_ROUTES = [
  {
    requirement: "给 jarvis-repo 加一个新的扫描模式，支持增量扫描",
    expectedDecision: "quick-ref" as const,
    expectedService: "jarvis-repo",
    description: "功能变更路由",
  },
  {
    requirement: "修改 jarvis-repo 的数据模型，添加新字段到 scan result",
    expectedDecision: "deep-dive" as const,
    expectedService: "jarvis-repo",
    description: "Schema 变更路由",
  },
  {
    requirement: "紧急修复 jarvis-repo 扫描超时问题",
    expectedDecision: "quick-ref" as const,
    expectedService: "jarvis-repo",
    description: "故障修复路由",
  },
];

// ── Result Types ─────────────────────────────────────────────────────

interface PilotResult {
  scanSuccess: boolean;
  scanResult?: ScanResult;
  scanError?: string;
  distillSuccess: boolean;
  distillResult?: DistillResult;
  distillError?: string;
  queryResults: Array<{
    query: typeof TEST_QUERIES[0];
    result: QueryResult;
    correct: boolean;
    notes: string;
  }>;
  routeResults: Array<{
    route: typeof TEST_ROUTES[0];
    result: { ok: true; result: RouteResult } | { ok: false; error: any };
    correct: boolean;
    notes: string;
  }>;
  zeroAdaptResult: {
    pass: boolean;
    details: string;
  };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("=== JARVIS E2E Pilot Test ===\n");
  console.log(`Target: ${TEST_TARGET}`);
  console.log(`Workspace: ${WORKSPACE}\n`);

  const pilot: PilotResult = {
    scanSuccess: false,
    distillSuccess: false,
    queryResults: [],
    routeResults: [],
    zeroAdaptResult: { pass: false, details: "" },
  };

  // Load config
  let config;
  try {
    config = loadConfig();
    console.log("[CONFIG] Loaded successfully");
    console.log(`  Workspace root: ${config.workspace.root}`);
    console.log(`  Repos: ${config.repos.map((r) => r.name).join(", ")}`);
  } catch (err) {
    console.error(`[CONFIG] Failed: ${(err as Error).message}`);
    generatePilotReport(pilot);
    return;
  }

  // ═══ Phase B: Scan ══════════════════════════════════════════════════
  console.log("\n═══ Phase B: Scan ═════════════════════════════════════════\n");

  try {
    const scanOutcome = await executeScan(
      { target: TEST_TARGET, mode: "full" },
      config.repos,
      config.workspace.root,
    );

    if (scanOutcome.ok) {
      pilot.scanSuccess = true;
      pilot.scanResult = scanOutcome.result;
      console.log(formatScanSummary(scanOutcome.result));
    } else {
      pilot.scanError = `${scanOutcome.error.code}: ${scanOutcome.error.message}`;
      console.error(`[SCAN] Failed: ${pilot.scanError}`);
    }
  } catch (err) {
    pilot.scanError = (err as Error).message;
    console.error(`[SCAN] Exception: ${pilot.scanError}`);
  }

  if (!pilot.scanSuccess) {
    console.log("\n[PILOT] Scan failed, cannot proceed with distill/query/route.");
    generatePilotReport(pilot);
    return;
  }

  // ═══ Phase C: Distill ═══════════════════════════════════════════════
  console.log("\n═══ Phase C: Distill ═════════════════════════════════════════\n");

  try {
    const distillOutcome = executeDistill(
      { target: TEST_TARGET },
      config,
      config.repos,
    );

    if (distillOutcome.ok) {
      pilot.distillSuccess = true;
      pilot.distillResult = distillOutcome.result;
      console.log(formatDistillSummary(distillOutcome.result));
    } else {
      pilot.distillError = `${distillOutcome.error.code}: ${distillOutcome.error.message}`;
      console.error(`[DISTILL] Failed: ${pilot.distillError}`);
    }
  } catch (err) {
    pilot.distillError = (err as Error).message;
    console.error(`[DISTILL] Exception: ${pilot.distillError}`);
  }

  // ═══ Phase D: Query ═════════════════════════════════════════════════
  console.log("\n═══ Phase D: Query ═══════════════════════════════════════════\n");

  for (const query of TEST_QUERIES) {
    try {
      const result = executeQuery(
        {
          question: query.question,
          services: [TEST_TARGET],
          max_depth: 2,
        },
        config,
      );

      // Check correctness: answer should exist and contain expected keywords
      const answerLower = result.answer.toLowerCase();
      let correct = true;
      let notes: string[] = [];

      if (result.error) {
        correct = false;
        notes.push(`Error: ${result.error.message}`);
      } else if (!result.answer || result.answer.trim().length < 10) {
        correct = false;
        notes.push("Answer is empty or too short");
      } else {
        // Check if any expected keyword is present
        const hasExpected = query.expectedContains.some((kw) =>
          answerLower.includes(kw.toLowerCase())
        );
        if (!hasExpected) {
          correct = false;
          notes.push(`Expected keywords not found: ${query.expectedContains.join(", ")}`);
        }

        // Check source citations
        if (result.sources.length === 0) {
          correct = false;
          notes.push("No source citations");
        }
      }

      if (correct) {
        notes.push("OK");
      }

      pilot.queryResults.push({
        query,
        result,
        correct,
        notes: notes.join("; "),
      });

      console.log(`[QUERY] "${query.question}"`);
      console.log(`  Correct: ${correct}`);
      console.log(`  Layers: ${result.layersLoaded.join(", ")}`);
      console.log(`  Tokens: ${result.tokensConsumed}`);
      console.log(`  Notes: ${notes.join("; ")}`);
      console.log("");
    } catch (err) {
      pilot.queryResults.push({
        query,
        result: {
          answer: "",
          sources: [],
          layersLoaded: [],
          tokensConsumed: 0,
          servicesQueried: [],
          warnings: [],
          error: { code: "CORRUPTED_FILE", message: (err as Error).message },
        },
        correct: false,
        notes: `Exception: ${(err as Error).message}`,
      });
      console.error(`[QUERY] Exception for "${query.question}": ${(err as Error).message}`);
    }
  }

  // ═══ Phase E: Route ═════════════════════════════════════════════════
  console.log("\n═══ Phase E: Route ═══════════════════════════════════════════\n");

  for (const route of TEST_ROUTES) {
    try {
      const result = executeRoute(
        { requirement: route.requirement },
        config.workspace.root,
      );

      let correct = false;
      let notes: string[] = [];

      if (result.ok) {
        // Check decision matches expected
        if (result.result.decision === route.expectedDecision) {
          correct = true;
        } else {
          notes.push(`Decision mismatch: expected=${route.expectedDecision}, got=${result.result.decision}`);
        }

        // Check service match
        const hasService = result.result.services.some((s) =>
          s.toLowerCase().includes(TEST_TARGET.toLowerCase().split("-")[0])
        );
        if (!hasService && result.result.services.length > 0) {
          notes.push(`Service mismatch: expected to contain ${TEST_TARGET}, got ${result.result.services.join(", ")}`);
          correct = false;
        }

        if (correct) {
          notes.push("OK");
        }

        pilot.routeResults.push({
          route,
          result: result as { ok: true; result: RouteResult },
          correct,
          notes: notes.join("; "),
        });

        console.log(`[ROUTE] "${route.requirement.slice(0, 40)}..."`);
        console.log(`  Decision: ${result.result.decision}`);
        console.log(`  Services: ${result.result.services.join(", ")}`);
        console.log(`  Confidence: ${(result.result.confidence * 100).toFixed(0)}%`);
        console.log(`  Correct: ${correct}`);
        console.log(`  Notes: ${notes.join("; ")}`);
        console.log("");
      } else {
        pilot.routeResults.push({
          route,
          result: result as { ok: false; error: any },
          correct: false,
          notes: `Route error: ${result.error.message}`,
        });
        console.error(`[ROUTE] Error: ${result.error.message}`);
      }
    } catch (err) {
      pilot.routeResults.push({
        route,
        result: { ok: false, error: { code: "UNCLEAR_REQUIREMENT", message: (err as Error).message } },
        correct: false,
        notes: `Exception: ${(err as Error).message}`,
      });
      console.error(`[ROUTE] Exception: ${(err as Error).message}`);
    }
  }

  // ═══ Phase F: Zero-Adapt Verification ══════════════════════════════
  console.log("\n═══ Phase F: Zero-Adapt Verification ═══════════════════════\n");

  const routingTablePath = join(WORKSPACE, "routing-table.md");
  if (existsSync(routingTablePath)) {
    try {
      const routingTableContent = readFileSync(routingTablePath, "utf-8");
      const hasServices = routingTableContent.includes("| Service");
      const hasQuickRef = routingTableContent.includes("Quick-Ref");
      const hasLoadingRules = routingTableContent.includes("Loading Rules");
      const isMarkdown = routingTableContent.startsWith("---") || routingTableContent.startsWith("#");

      pilot.zeroAdaptResult = {
        pass: hasServices && hasQuickRef && hasLoadingRules && isMarkdown,
        details: [
          `Has Services table: ${hasServices}`,
          `Has Quick-Ref paths: ${hasQuickRef}`,
          `Has Loading Rules: ${hasLoadingRules}`,
          `Is valid Markdown: ${isMarkdown}`,
          `File size: ${routingTableContent.length} chars`,
          `Estimated tokens: ${estimateTokens(routingTableContent)}`,
        ].join("; "),
      };

      console.log(`Zero-adapt verification: ${pilot.zeroAdaptResult.pass ? "PASS" : "FAIL"}`);
      console.log(`  ${pilot.zeroAdaptResult.details}`);
    } catch (err) {
      pilot.zeroAdaptResult = {
        pass: false,
        details: `Failed to read routing-table.md: ${(err as Error).message}`,
      };
    }
  } else {
    pilot.zeroAdaptResult = {
      pass: false,
      details: "routing-table.md not found",
    };
  }

  // ═══ Generate Report ════════════════════════════════════════════════
  generatePilotReport(pilot);
}

// ── Report Generation ────────────────────────────────────────────────

function generatePilotReport(pilot: PilotResult): void {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push("# JARVIS Pilot Report");
  lines.push("");
  lines.push("## 基本信息");
  lines.push(`- 试点项目: JARVIS Repo (自扫描)`);
  lines.push(`- 试点日期: ${now}`);
  lines.push(`- JARVIS 版本: 0.1.0 (Phase 1 MVP)`);
  lines.push("");

  // Coverage metrics
  lines.push("## 覆盖率指标");
  lines.push("| 维度 | 指标 | 结果 |");
  lines.push("|------|------|------|");

  const scan = pilot.scanResult;
  lines.push(`| 扫描状态 | scan 执行 | ${pilot.scanSuccess ? "成功" : "失败"} |`);
  if (scan) {
    lines.push(`| 技术栈 | 识别的技术栈 | ${scan.techStack.join(", ") || "未识别"} |`);
    lines.push(`| 端点 | 识别的端点文件数 | ${scan.endpoints} |`);
    lines.push(`| 模型 | 识别的模型文件数 | ${scan.models} |`);
    lines.push(`| 流程 | 识别的业务流程文件数 | ${scan.flows} |`);
    lines.push(`| 扫描产出 | 生成文件数 | ${scan.files.length} |`);
  }
  lines.push("");

  // Quality assessment
  lines.push("## 质量评估");
  const distill = pilot.distillResult;
  if (distill) {
    const l0Budget = distill.layers.layer0.budget;
    const l0Tokens = distill.layers.layer0.tokens;
    const l1Budget = distill.layers.layer1.budget;
    const l1Tokens = distill.layers.layer1.tokens;

    lines.push(`- routing-table.md token 数量: ${l0Tokens} (budget: ${l0Budget}) ${l0Tokens <= l0Budget ? "OK" : "EXCEEDED"}`);
    lines.push(`- quick-ref.md token 数量: ${l1Tokens} (budget: ${l1Budget}) ${l1Tokens <= l1Budget ? "OK" : "EXCEEDED"}`);

    // Calculate compression ratio
    const l2Files = distill.layers.layer2.files.length;
    lines.push(`- distillates 语义完整性: ${l2Files} fragments generated`);
    lines.push(`- 总 token 数: ${distill.totalTokens}`);
    lines.push(`- 截断: ${distill.truncated ? "是" : "否"}`);

    if (distill.warnings.length > 0) {
      lines.push(`- 警告: ${distill.warnings.length}`);
      for (const w of distill.warnings) {
        lines.push(`  - ${w}`);
      }
    }
  } else {
    lines.push(`- 蒸馏状态: ${pilot.distillSuccess ? "成功" : "失败"}`);
    if (pilot.distillError) {
      lines.push(`- 错误: ${pilot.distillError}`);
    }
  }
  lines.push("");

  // Query accuracy
  lines.push("## 查询准确性");
  lines.push("| 查询问题 | 正确 | 说明 |");
  lines.push("|----------|------|------|");

  let queryCorrectCount = 0;
  for (const qr of pilot.queryResults) {
    if (qr.correct) queryCorrectCount++;
    lines.push(`| ${qr.query.description} | ${qr.correct ? "Y" : "N"} | ${qr.notes} |`);
  }

  const queryTotal = pilot.queryResults.length;
  const queryAccuracy = queryTotal > 0 ? Math.round((queryCorrectCount / queryTotal) * 100) : 0;
  lines.push("");
  lines.push(`**查询准确率: ${queryCorrectCount}/${queryTotal} = ${queryAccuracy}%**`);
  lines.push("");

  // Route accuracy
  lines.push("## 路由准确性");
  lines.push("| 测试需求 | 期望决策 | 实际决策 | 正确 | 说明 |");
  lines.push("|----------|----------|----------|------|------|");

  let routeCorrectCount = 0;
  for (const rr of pilot.routeResults) {
    if (rr.correct) routeCorrectCount++;
    const actualDecision = rr.result.ok ? rr.result.result.decision : "error";
    lines.push(`| ${rr.route.description} | ${rr.route.expectedDecision} | ${actualDecision} | ${rr.correct ? "Y" : "N"} | ${rr.notes} |`);
  }

  const routeTotal = pilot.routeResults.length;
  const routeAccuracy = routeTotal > 0 ? Math.round((routeCorrectCount / routeTotal) * 100) : 0;
  lines.push("");
  lines.push(`**路由准确率: ${routeCorrectCount}/${routeTotal} = ${routeAccuracy}%**`);
  lines.push("");

  // Zero-adapt verification
  lines.push("## 零适配消费验证");
  lines.push(`- 消费 Agent: 任何 Markdown 阅读器`);
  lines.push(`- 结果: ${pilot.zeroAdaptResult.pass ? "PASS" : "FAIL"}`);
  lines.push(`- 说明: ${pilot.zeroAdaptResult.details}`);
  lines.push("");

  // Known issues
  lines.push("## 已知问题");
  lines.push("| # | 问题描述 | 严重程度 | 归属 Feature |");
  lines.push("|---|---------|---------|-------------|");

  let issueNum = 1;
  if (!pilot.scanSuccess) {
    lines.push(`| ${issueNum++} | 扫描失败: ${pilot.scanError} | P1 | feat-tool-scan |`);
  }
  if (!pilot.distillSuccess) {
    lines.push(`| ${issueNum++} | 蒸馏失败: ${pilot.distillError} | P1 | feat-tool-distill |`);
  }
  if (queryAccuracy < 80) {
    lines.push(`| ${issueNum++} | 查询准确率低于 80% (${queryAccuracy}%) | P2 | feat-tool-query |`);
  }
  if (routeAccuracy < 80) {
    lines.push(`| ${issueNum++} | 路由准确率低于 80% (${routeAccuracy}%) | P2 | feat-tool-route |`);
  }
  if (distill && distill.layers.layer0.tokens > distill.layers.layer0.budget) {
    lines.push(`| ${issueNum++} | routing-table.md 超出 token 预算 | P2 | feat-tool-distill |`);
  }
  if (!pilot.zeroAdaptResult.pass) {
    lines.push(`| ${issueNum++} | 零适配消费验证未通过 | P2 | feat-tool-distill |`);
  }

  if (issueNum === 1) {
    lines.push("| - | 无已知问题 | - | - |");
  }
  lines.push("");

  // Pilot-ready declaration
  lines.push("## Pilot-Ready 声明");
  lines.push("");
  lines.push(`- [${pilot.scanSuccess ? "x" : " "}] 基本流程全部走通`);
  lines.push(`- [${pilot.distillSuccess ? "x" : " "}] 产出物格式正确`);
  lines.push(`- [${queryAccuracy >= 80 ? "x" : " "}] 查询准确率 >= 80%`);
  lines.push(`- [${routeAccuracy >= 80 ? "x" : " "}] 路由准确率 >= 80%`);
  lines.push(`- [${!pilot.scanSuccess || !pilot.distillSuccess ? " " : "x"}] 无 P1 级问题`);
  lines.push(`- [${pilot.zeroAdaptResult.pass ? "x" : " "}] 零适配消费验证通过`);
  lines.push("");

  // Determine status
  const allChecks = [
    pilot.scanSuccess,
    pilot.distillSuccess,
    queryAccuracy >= 80,
    routeAccuracy >= 80,
    !pilot.scanSuccess || !pilot.distillSuccess ? false : true,
    pilot.zeroAdaptResult.pass,
  ];
  const ready = allChecks.every(Boolean);

  lines.push(`Status: **${ready ? "READY" : "NOT-READY"}**`);
  lines.push("");
  lines.push(`---`);
  lines.push(`*Generated by JARVIS E2E Pilot at ${now}*`);

  // Write report
  const reportPath = resolve("./pilot-report.md");
  writeFileSync(reportPath, lines.join("\n"), "utf-8");
  console.log(`\nPilot report written to: ${reportPath}`);
  console.log(`Status: ${ready ? "READY" : "NOT-READY"}`);
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
