# Feature: feat-tool-distill edith_distill 工具

## Basic Information
- **ID**: feat-tool-distill
- **Name**: edith_distill 工具（对接 distillator Skill）
- **Priority**: 90
- **Size**: M
- **Dependencies**: [feat-extension-core, feat-tool-scan]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

实现 edith_distill 工具，对接 distillator Skill。将源文档蒸馏为三层知识产物：Layer 0 routing-table.md（<500 token 全局路由表）、Layer 1 quick-ref.md（~5% 原文速查卡）、Layer 2 distillates/*.md（语义拆分的蒸馏片段）。

## User Value Points

1. **一键蒸馏** — 用户说"蒸馏 user-service"，自动从 scan 产出生成三层知识产物
2. **Token 预算控制** — 每层有 token 上限，确保知识产物可直接作为 Agent 上下文

## Context Analysis

### Reference Code
- `edith-skills/distillator/SKILL.md` — distillator Skill 完整定义
- `edith-skills/distillator/scripts/analyze_sources.py` — 唯一 Python 脚本
- `edith-skills/distillator/templates/` — 蒸馏模板

### Related Documents
- `EDITH-PRODUCT-DESIGN.md` § 4.1 产出物格式、§ 4.3 产出物自说明性
- `SCALABILITY-ANALYSIS.md` — 三层加载设计的分析基础
- `templates/en/routing-table.md` — Layer 0 模板
- `templates/en/quick-ref-card.md` — Layer 1 模板

### Related Features
- feat-tool-scan（前置，提供源文档）
- feat-tool-query（后续，消费蒸馏产物）

## Technical Solution

蒸馏流程：
1. 读取 scan 产出的源文档
2. Layer 0：提取服务名、角色、技术栈、Owner、关键约束 → routing-table.md
3. Layer 1：验证命令、关键约束、易错点、API 端点 → quick-ref.md（~5% 原文）
4. Layer 2：按语义拆分为接口契约、数据模型、业务逻辑 → distillates/*.md

### Parameter Contract

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | string | Yes | - | 服务名（对应 edith.yaml repos 中的 key） |
| `token_budget` | object | No | edith.yaml 配置 | 各层 token 预算覆盖 |

### Token Budget Configuration

```yaml
# edith.yaml
token_budget:
  routing_table: 500      # Layer 0 硬上限
  quick_ref: 2000         # Layer 1 软上限
  distillate_per_file: 1500  # Layer 2 单文件软上限
```

### Result Structure

```typescript
interface DistillResult {
  service: string;
  layers: {
    layer0: { file: string; tokens: number; budget: number; };
    layer1: { file: string; tokens: number; budget: number; };
    layer2: { files: string[]; totalTokens: number; };
  };
  totalTokens: number;
  truncated: boolean;       // 是否有层被截断
  warnings: string[];       // 截断/质量警告
  distilledAt: string;      // ISO timestamp
}
```

## Scope

### IN Scope
- 接收蒸馏请求并解析参数
- 读取 scan 产出的源文档（workspace/{service}/docs/）
- 生成 Layer 0 routing-table.md（<500 token）
- 生成 Layer 1 quick-ref.md（~5% 原文）
- 生成 Layer 2 distillates/*.md（语义拆分片段）
- Token 预算控制与截断策略
- 将蒸馏产物写入 workspace/{service}/ 对应位置

### OUT Scope
- **不做扫描**：不分析代码，不调用 document-project Skill（由 feat-tool-scan 负责）
- **不做查询**：不回答用户关于知识库的问题（由 feat-tool-query 负责）
- **不做路由决策**：不分析需求应该加载哪层知识（由 feat-tool-route 负责）
- **不做增量更新**：不支持 diff 式蒸馏，每次都是全量生成
- **不做多语言翻译**：蒸馏产物语言跟随源文档，不做自动翻译

## Acceptance Criteria (Gherkin)

### Happy Path Scenarios

**Scenario 1: 完整蒸馏流程**
```gherkin
Given user-service 已扫描（docs/ 存在且包含 overview.md, api-endpoints.md, data-models.md）
When 用户说 "蒸馏 user-service"
Then 生成 Layer 0 routing-table.md（<500 token）
And 生成 Layer 1 quick-ref.md（~5% 原文）
And 生成 Layer 2 distillates/（语义拆分的片段）
And DistillResult.truncated = false
And DistillResult.warnings 为空
```

**Scenario 2: Token 预算控制**
```gherkin
Given edith.yaml 中 token_budget.quick_ref = 2000
When Layer 1 生成完成
Then quick-ref.md 的 token 数 <= 2000
And 如超出预算，应用截断策略并设置 DistillResult.truncated = true
And warnings 中包含截断说明
```

**Scenario 3: 未扫描时的提示**
```gherkin
Given user-service 未扫描（docs/ 不存在）
When 用户说 "蒸馏 user-service"
Then 提示 "user-service 尚未扫描，请先执行 edith scan user-service"
And 错误类型为 SOURCE_NOT_FOUND
```

### Error / Sad-Path Scenarios

**Scenario 4: Token 预算超限（截断策略）**
```gherkin
Given user-service 已扫描且源文档非常庞大（超过 50000 token）
And token_budget.quick_ref = 2000
When edith_distill 蒸馏 user-service
Then Layer 1 生成时超出 2000 token 预算
And 应用截断策略：保留验证命令和关键约束，裁剪 API 端点列表
And DistillResult.truncated = true
And warnings 包含 "quick-ref 超出预算，已截断 API 端点列表（保留 X/Y 个）"
And Layer 0 routing-table.md 不受影响（始终 <500 token）
```

**Scenario 5: 部分层生成失败**
```gherkin
Given user-service 已扫描但 api-endpoints.md 内容为空或损坏
When edith_distill 蒸馏 user-service
Then Layer 0 和 Layer 1 正常生成
And Layer 2 中依赖 api-endpoints.md 的片段（如 02-api-contracts.md）标记为 incomplete
And DistillResult.warnings 包含 "02-api-contracts.md 因源文档不完整而跳过"
And 其他 Layer 2 片段正常生成
And 整体结果标记为 partial success
```

**Scenario 6: 源文档损坏**
```gherkin
Given user-service 已扫描但 docs/overview.md 内容不是合法 Markdown（如二进制文件）
When edith_distill 蒸馏 user-service
Then 返回错误 "源文档格式异常: overview.md 不是有效的 Markdown 文件"
And 错误类型为 CORRUPTED_SOURCE
And 建议用户重新扫描该服务
```

**Scenario 7: Routing Table 全局合并冲突**
```gherkin
Given 知识库中已有 order-service 的 routing-table 条目
And user-service 的 Layer 0 蒸馏完成
When 将 user-service 条目写入全局 routing-table.md
Then 合并后 routing-table.md 总 token 数 <= 500
And 如超出预算，按服务优先级裁剪低优先级条目的描述
And 记录合并冲突的 warning
```

### Error Code Summary

| Error Code | Trigger | Severity |
|------------|---------|----------|
| `SOURCE_NOT_FOUND` | scan 产出目录不存在 | error |
| `CORRUPTED_SOURCE` | 源文档格式异常 | error |
| `BUDGET_EXCEEDED` | 超出 token 预算（截断后继续） | warning |
| `PARTIAL_GENERATION` | 部分层/片段生成失败 | warning |
| `MERGE_CONFLICT` | routing-table 全局合并冲突 | warning |

## Merge Record

- **Completed**: 2026-04-27T22:50:00+08:00
- **Merged Branch**: feature/feat-tool-distill
- **Merge Commit**: 001c88c
- **Archive Tag**: feat-tool-distill-20260427
- **Conflicts**: None
- **Verification**: Passed (7/7 Gherkin scenarios, 41/41 tasks, TypeScript clean)
- **Stats**: 1 commit, 3 files changed, 5786 insertions, 18 deletions, ~20 min duration
