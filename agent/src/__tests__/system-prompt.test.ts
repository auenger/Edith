/**
 * Unit tests for EDITH System Prompt (system-prompt.ts)
 *
 * Tests all 8 scenarios from the spec:
 *   Scenario 1: Keyword trigger accuracy — scan intent
 *   Scenario 2: Knowledge source citation format
 *   Scenario 3: No internal name leakage
 *   Scenario 4: Ambiguous intent — clarification
 *   Scenario 5: Multi-intent sequential execution
 *   Scenario 6: Tool unavailable — graceful degradation
 *   Scenario 7: Mixed language input handling
 *   Scenario 8: Long conversation context management
 *
 * Uses Node.js built-in test runner.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildSystemPrompt,
  validatePromptNoLeaks,
  validatePromptSections,
} from "../system-prompt.js";

// ── Scenario 1: Keyword trigger accuracy ───────────────────────────

describe("Scenario 1: Keyword trigger accuracy", () => {
  it("Chinese prompt contains scan trigger keywords", () => {
    const prompt = buildSystemPrompt("zh");

    // Scan-related keywords should map to scan operation
    const scanKeywords = ["扫描", "分析代码", "项目结构"];
    for (const keyword of scanKeywords) {
      assert.ok(prompt.includes(keyword), `Missing scan keyword: ${keyword}`);
    }
  });

  it("Chinese prompt contains distill trigger keywords", () => {
    const prompt = buildSystemPrompt("zh");
    const distillKeywords = ["蒸馏", "知识提取", "生成文档"];
    for (const keyword of distillKeywords) {
      assert.ok(prompt.includes(keyword), `Missing distill keyword: ${keyword}`);
    }
  });

  it("Chinese prompt contains query trigger keywords", () => {
    const prompt = buildSystemPrompt("zh");
    const queryKeywords = ["查询", "某个接口", "数据模型"];
    for (const keyword of queryKeywords) {
      assert.ok(prompt.includes(keyword), `Missing query keyword: ${keyword}`);
    }
  });

  it("Chinese prompt contains route trigger keywords", () => {
    const prompt = buildSystemPrompt("zh");
    const routeKeywords = ["路由", "需求归谁", "哪个服务"];
    for (const keyword of routeKeywords) {
      assert.ok(prompt.includes(keyword), `Missing route keyword: ${keyword}`);
    }
  });

  it("English prompt contains scan trigger keywords", () => {
    const prompt = buildSystemPrompt("en");
    assert.ok(prompt.includes("scan"));
    assert.ok(prompt.includes("analyze code"));
    assert.ok(prompt.includes("project structure"));
  });

  it("English prompt contains distill trigger keywords", () => {
    const prompt = buildSystemPrompt("en");
    assert.ok(prompt.includes("distill"));
    assert.ok(prompt.includes("extract knowledge"));
    assert.ok(prompt.includes("generate docs"));
  });

  it("Trigger mapping covers all 4 tools", () => {
    const prompt = buildSystemPrompt("zh");

    // The mapping table should cover all 4 operations
    assert.ok(prompt.includes("知识扫描"), "Missing: 知识扫描");
    assert.ok(prompt.includes("知识蒸馏"), "Missing: 知识蒸馏");
    assert.ok(prompt.includes("知识查询"), "Missing: 知识查询");
    assert.ok(prompt.includes("需求路由"), "Missing: 需求路由");
  });

  it("Trigger mapping includes English keywords", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("scan"), "Missing English keyword: scan");
    assert.ok(prompt.includes("distill"), "Missing English keyword: distill");
    assert.ok(prompt.includes("query"), "Missing English keyword: query");
    assert.ok(prompt.includes("route"), "Missing English keyword: route");
  });
});

// ── Scenario 2: Knowledge source citation format ───────────────────

describe("Scenario 2: Knowledge source citation format", () => {
  it("Chinese prompt defines citation format", () => {
    const prompt = buildSystemPrompt("zh");

    // Citation format should use the spec format
    assert.ok(
      prompt.includes("来源:") || prompt.includes("Source:"),
      "Missing citation format marker"
    );
    assert.ok(
      prompt.includes("片段:") || prompt.includes("Section:"),
      "Missing section/fragment marker in citation"
    );
  });

  it("English prompt defines citation format", () => {
    const prompt = buildSystemPrompt("en");
    assert.ok(prompt.includes("Source:"), "Missing 'Source:' in English prompt");
    assert.ok(prompt.includes("Section:"), "Missing 'Section:' in English prompt");
  });

  it("Citation format includes example paths", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("distillates/") || prompt.includes("quick-ref"),
      "Missing example paths in citation format"
    );
  });

  it("Citation format rules are defined", () => {
    const prompt = buildSystemPrompt("zh");
    // Should mention that only real paths should be cited
    assert.ok(
      prompt.includes("只标注实际") || prompt.includes("不标注未加载"),
      "Missing citation rule about real paths only"
    );
  });
});

// ── Scenario 3: No internal name leakage ───────────────────────────

describe("Scenario 3: No internal name leakage", () => {
  it("Chinese prompt passes leak validation", () => {
    const prompt = buildSystemPrompt("zh");
    const violations = validatePromptNoLeaks(prompt);
    assert.deepStrictEqual(violations, [], "Prompt contains forbidden internal name leaks");
  });

  it("English prompt passes leak validation", () => {
    const prompt = buildSystemPrompt("en");
    const violations = validatePromptNoLeaks(prompt);
    assert.deepStrictEqual(violations, [], "Prompt contains forbidden internal name leaks");
  });

  it("Behavior constraints explicitly forbid internal names", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("禁止暴露"), "Missing explicit prohibition of name exposure");
    assert.ok(
      prompt.includes("document-project") || prompt.includes("内部名称"),
      "Behavior constraints should reference forbidden names"
    );
  });
});

// ── Scenario 4: Ambiguous intent — clarification ───────────────────

describe("Scenario 4: Ambiguous intent clarification", () => {
  it("Chinese prompt defines clarification mode", () => {
    const prompt = buildSystemPrompt("zh");

    // Should include clarification mode description
    assert.ok(prompt.includes("澄清模式") || prompt.includes("澄清"), "Missing clarification mode");
  });

  it("Prompt includes clarification examples", () => {
    const prompt = buildSystemPrompt("zh");

    // Should include at least one clarification example
    assert.ok(
      prompt.includes("您是想") && prompt.includes("还是"),
      "Missing clarification examples with '您是想...还是...'"
    );
  });

  it("Prompt defines 2-3 candidate intents for clarification", () => {
    const prompt = buildSystemPrompt("zh");
    // Should offer multiple choices in brackets
    const bracketPattern = /\[[^\]]+\]/g;
    const matches = prompt.match(bracketPattern);
    assert.ok(matches && matches.length >= 3, "Should have at least 3 candidate intent options in brackets");
  });
});

// ── Scenario 5: Multi-intent sequential execution ──────────────────

describe("Scenario 5: Multi-intent sequential execution", () => {
  it("Prompt defines multi-intent recognition", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("多意图"), "Missing multi-intent recognition section");
  });

  it("Prompt defines sequential execution rule", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("顺序执行") || prompt.includes("按顺序"),
      "Missing sequential execution rule"
    );
  });

  it("Prompt defines progress reporting", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("进度报告") || prompt.includes("报告进度"), "Missing progress reporting rule");
  });

  it("Prompt includes multi-intent example", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("扫描") && prompt.includes("蒸馏") && prompt.includes("并"),
      "Missing multi-intent example (scan + distill)"
    );
  });
});

// ── Scenario 6: Tool unavailable — graceful degradation ────────────

describe("Scenario 6: Tool unavailable graceful degradation", () => {
  it("Prompt defines empty knowledge base script", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("知识库") && prompt.includes("扫描"),
      "Missing empty knowledge base handling script"
    );
  });

  it("Prompt defines tool unavailable script", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("暂时无法") || prompt.includes("稍后再试"),
      "Missing tool unavailable handling script"
    );
  });

  it("Prompt forbids fabricating content", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("禁止编造") || prompt.includes("不编造") || prompt.includes("不要猜测"),
      "Missing prohibition against fabricating content"
    );
  });

  it("Prompt defines at least 3 degradation scenarios", () => {
    const prompt = buildSystemPrompt("zh");
    // Count the script template headings
    const scriptHeadings = [
      "知识库为空",
      "意图模糊",
      "工具不可用",
      "服务未找到",
      "操作失败",
    ];
    let found = 0;
    for (const heading of scriptHeadings) {
      if (prompt.includes(heading)) found++;
    }
    assert.ok(found >= 3, `Expected at least 3 degradation scenarios, found ${found}`);
  });
});

// ── Scenario 7: Mixed language input handling ──────────────────────

describe("Scenario 7: Mixed language input handling", () => {
  it("Prompt defines mixed language rules", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("混合语言"), "Missing mixed language section");
  });

  it("Prompt defines language matching rule", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("语言一致") || prompt.includes("语言匹配") || prompt.includes("用户语言"),
      "Missing language matching rule"
    );
  });

  it("Prompt includes bilingual keyword mapping", () => {
    const prompt = buildSystemPrompt("zh");
    // Should map Chinese and English keywords
    assert.ok(
      prompt.includes("扫描") && prompt.includes("scan"),
      "Missing bilingual keyword mapping for scan"
    );
  });
});

// ── Scenario 8: Long conversation context management ───────────────

describe("Scenario 8: Long conversation context management", () => {
  it("Prompt defines context management strategy", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(prompt.includes("上下文管理"), "Missing context management section");
  });

  it("Prompt defines compression trigger condition", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("10") && prompt.includes("轮"),
      "Missing 10-round compression trigger"
    );
  });

  it("Prompt defines retention priority", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("保留优先级") || prompt.includes("优先") || prompt.includes("最高"),
      "Missing retention priority definition"
    );
  });

  it("Prompt defines never-lose rules", () => {
    const prompt = buildSystemPrompt("zh");
    assert.ok(
      prompt.includes("不丢失") || prompt.includes("绝不丢失"),
      "Missing never-lose rules"
    );
    assert.ok(
      prompt.includes("约束条件"),
      "Missing constraint preservation rule"
    );
  });
});

// ── Section Completeness ───────────────────────────────────────────

describe("Prompt section completeness", () => {
  it("Chinese prompt has all 8 required sections", () => {
    const prompt = buildSystemPrompt("zh");
    const missing = validatePromptSections(prompt, "zh");
    assert.deepStrictEqual(missing, [], `Missing sections: ${missing.join(", ")}`);
  });

  it("English prompt has all 8 required sections", () => {
    const prompt = buildSystemPrompt("en");
    const missing = validatePromptSections(prompt, "en");
    assert.deepStrictEqual(missing, [], `Missing sections: ${missing.join(", ")}`);
  });

  it("Both language prompts are non-empty", () => {
    const zh = buildSystemPrompt("zh");
    const en = buildSystemPrompt("en");
    assert.ok(zh.length > 500, "Chinese prompt too short");
    assert.ok(en.length > 500, "English prompt too short");
  });

  it("Role definition identifies as EDITH", () => {
    const zh = buildSystemPrompt("zh");
    const en = buildSystemPrompt("en");
    assert.ok(zh.includes("EDITH"), "Chinese prompt missing EDITH identity");
    assert.ok(en.includes("EDITH"), "English prompt missing EDITH identity");
  });

  it("Core responsibilities list 4 capabilities", () => {
    const prompt = buildSystemPrompt("zh");
    const capabilities = ["知识提取", "知识管理", "知识查询", "需求路由"];
    for (const cap of capabilities) {
      assert.ok(prompt.includes(cap), `Missing capability: ${cap}`);
    }
  });
});
