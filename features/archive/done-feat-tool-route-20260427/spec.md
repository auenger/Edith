# Feature: feat-tool-route edith_route 工具

## Basic Information
- **ID**: feat-tool-route
- **Name**: edith_route 工具（对接 requirement-router Skill）
- **Priority**: 85
- **Size**: S
- **Dependencies**: [feat-extension-core]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Merge Record
- **Completed**: 2026-04-27T23:00:00+08:00
- **Branch**: feature/feat-tool-route
- **Merge commit**: c9c6f46 (rebased), merge via --no-ff
- **Archive tag**: feat-tool-route-20260427
- **Conflicts**: 1 (agent/src/extension.ts — import merge with feat-tool-distill)
- **Verification**: PASS (31 route + 24 regression = 55 tests, 7/7 scenarios)

## Description

实现 edith_route 工具：需求路由分析，判断用户需求是否需要加载额外上下文，以及加载策略（direct / quick-ref / deep-dive）。

## User Value Points

1. **智能路由决策** — 自动判断需求复杂度，避免简单需求加载过多上下文
2. **上下文加载建议** — 给出明确的加载层级和文件建议

## Context Analysis

### Reference Code
- `edith-skills/requirement-router/SKILL.md` — requirement-router Skill 定义

### Related Documents
- `EDITH-PRODUCT-DESIGN.md` § 2.2 问答模式中的路由示例
- `templates/en/routing-table.md` — 路由表消费规则

## Technical Solution

路由逻辑：
1. 解析需求描述，提取涉及的服务名和改动类型
2. 查询 routing-table.md 判断涉及服务数
3. 路由决策：
   - 0 个已知服务 → direct（直接工作）
   - 1 个服务 + 简单 CRUD → direct
   - 1 个服务 + 改接口 → load quick-ref
   - 2+ 个服务 → load 对应 quick-ref
   - 需要具体 Schema → load distillates 片段

### Parameter Contract

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `requirement` | string | Yes | - | 用户的需求描述 |
| `context` | string[] | No | [] | 已加载的上下文文件（避免重复建议） |

### Routing Decision Table

| Condition | Decision | Files to Load |
|-----------|----------|--------------|
| 0 个已知服务 | `direct` | 无 |
| 1 服务 + 简单 CRUD | `direct` | 无 |
| 1 服务 + 改接口/改逻辑 | `quick-ref` | `{service}/quick-ref.md` |
| 1 服务 + 需具体 Schema | `deep-dive` | `{service}/quick-ref.md` + 相关 `distillates/*.md` |
| 2+ 服务 | `quick-ref` (multi) | 所有相关 `{service}/quick-ref.md` |
| 2+ 服务 + 需具体 Schema | `deep-dive` (multi) | 所有相关 quick-ref + 相关 distillates |

### Result Structure

```typescript
interface RouteResult {
  decision: "direct" | "quick-ref" | "deep-dive";
  services: string[];           // 匹配到的服务名
  filesToLoad: string[];        // 建议加载的文件路径
  reason: string;               // 路由决策原因说明
  confidence: number;           // 0-1 决策置信度
  ambiguity?: string;           // 置信度 <0.7 时的歧义说明
}
```

## Scope

### IN Scope
- 接收需求描述并解析参数
- 从需求中提取服务名和改动类型
- 查询 routing-table.md 进行服务匹配
- 根据路由决策表输出加载策略建议
- 返回建议加载的文件清单

### OUT Scope
- **不执行工具调用**：不实际加载文件（只建议加载什么）
- **不修改知识库**：不写入、不更新路由表或知识产物
- **不做路由表生成**：不创建或更新 routing-table.md（由 feat-tool-distill 负责）
- **不做需求执行**：不执行需求本身（如不写代码、不修改配置）
- **不做需求拆解**：不做任务拆分、不做排期建议

## Acceptance Criteria (Gherkin)

### Happy Path Scenarios

**Scenario 1: 直接路由**
```gherkin
Given 知识库中有 user-service 的产物
And routing-table.md 已加载
When 用户说 "给用户表加 phone 字段"
Then 提取服务: user-service
And 识别改动类型: 简单 CRUD
And 路由决策: direct
And 说明: 单服务 CRUD，无需加载额外上下文
And RouteResult.decision = "direct"
And RouteResult.filesToLoad 为空
```

**Scenario 2: 需要加载上下文**
```gherkin
Given 知识库中有 order-service 的产物
And routing-table.md 已加载
When 用户说 "修改订单创建接口，增加优惠券字段"
Then 提取服务: order-service
And 识别改动类型: 改接口
And 路由决策: load quick-ref
And 建议: 加载 order-service/quick-ref.md
And RouteResult.decision = "quick-ref"
And RouteResult.filesToLoad = ["workspace/order-service/quick-ref.md"]
```

**Scenario 3: 跨服务路由**
```gherkin
Given 知识库中有 order-service 和 inventory-service 的产物
And routing-table.md 已加载
When 用户说 "用户下单后需要同步更新库存"
Then 提取服务: order-service, inventory-service
And 识别改动类型: 跨服务调用
And 路由决策: load quick-ref (multi)
And 建议: 加载 order-service 和 inventory-service 的 quick-ref.md
And RouteResult.decision = "quick-ref"
And RouteResult.filesToLoad = ["workspace/order-service/quick-ref.md", "workspace/inventory-service/quick-ref.md"]
```

### Error / Sad-Path Scenarios

**Scenario 4: 歧义的服务名**
```gherkin
Given 知识库中有 user-service 和 user-admin-service
And routing-table.md 已加载
When 用户说 "修改用户注册逻辑"
Then 匹配到 2 个服务: user-service, user-admin-service
And confidence < 0.7
And RouteResult.ambiguity = "需求可能涉及 user-service 或 user-admin-service，请明确目标服务"
And RouteResult.decision 仍返回最佳猜测，但附带歧义说明
```

**Scenario 5: routing-table.md 不存在**
```gherkin
Given 知识库中不存在 routing-table.md
When 用户说 "修改订单创建接口"
Then 返回错误 "路由表不存在，请先蒸馏至少一个服务以生成 routing-table.md"
And 错误类型为 ROUTING_TABLE_NOT_FOUND
And 建议执行 edith_distill
```

**Scenario 6: 需求描述不清晰**
```gherkin
Given 知识库中有 5 个服务的产物
And routing-table.md 已加载
When 用户说 "改一下那个东西"
Then 无法提取任何服务名
And 无法识别改动类型
And 返回错误 "无法从需求描述中识别目标服务。已有服务: user-service, order-service, ..."
And 错误类型为 UNCLEAR_REQUIREMENT
And 建议用户补充服务名或更详细的描述
```

**Scenario 7: 需要具体 Schema 的深度路由**
```gherkin
Given 知识库中有 order-service 的完整三层产物
And routing-table.md 已加载
When 用户说 "把 Order 的 items 字段从 String 改为 OrderItem 对象，需要知道 Order 和 OrderItem 的完整字段定义"
Then 提取服务: order-service
And 识别改动类型: Schema 变更（需要具体数据模型）
And 路由决策: deep-dive
And RouteResult.filesToLoad 包含 quick-ref.md + distillates/ 中数据模型相关片段
```

### Routing Decision Logic (Pseudocode)

```
function route(requirement, routingTable, loadedContext):
  services = extractServices(requirement, routingTable)
  changeType = classifyChange(requirement)

  if services.length == 0:
    if cannotParse(requirement):
      return error(UNCLEAR_REQUIREMENT)
    return RouteResult(direct, [], "无需特定服务上下文")

  if services.length == 1:
    if changeType == "crud":
      return RouteResult(direct, [], "单服务 CRUD")
    if changeType == "schema_change":
      return RouteResult(deep-dive, [quickRef, relevantDistillates], "需要具体 Schema")
    return RouteResult(quick-ref, [quickRef], "需要接口/逻辑上下文")

  // services.length >= 2
  if changeType == "schema_change":
    return RouteResult(deep-dive, allQuickRefs + relevantDistillates, "多服务 Schema 变更")
  return RouteResult(quick-ref, allQuickRefs, "跨服务变更")
```

### Error Code Summary

| Error Code | Trigger | Response |
|------------|---------|----------|
| `ROUTING_TABLE_NOT_FOUND` | routing-table.md 不存在 | 阻断，建议先 distill |
| `UNCLEAR_REQUIREMENT` | 无法提取服务名和改动类型 | 阻断，列出已有服务 |
| `AMBIGUOUS_SERVICE` | 多个服务匹配且 confidence < 0.7 | 返回最佳猜测 + 歧义说明 |
