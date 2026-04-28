# Feature: feat-tool-query edith_query 工具

## Basic Information
- **ID**: feat-tool-query
- **Name**: edith_query 工具（三层加载查询）
- **Priority**: 90
- **Size**: M
- **Dependencies**: [feat-extension-core]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Merge Record
- **Completed**: 2026-04-27T22:20:00+08:00
- **Merged Branch**: feature/feat-tool-query
- **Merge Commit**: 0022024
- **Archive Tag**: feat-tool-query-20260427
- **Conflicts**: none
- **Verification**: 24/24 tests passed, 8/8 Gherkin scenarios verified
- **Duration**: ~10 min
- **Commits**: 1
- **Files Changed**: 10 (3 new, 2 modified, 2 renamed, 2 deleted, 1 new evidence)

## Description

实现 edith_query 工具：三层渐进加载策略查询知识库。Layer 0 routing-table.md 常驻（<500 token），Layer 1 quick-ref.md 按需加载，Layer 2 distillates/*.md 精准定位。

## User Value Points

1. **渐进式上下文加载** — 先加载路由表判断方向，再按需加载详细知识，最小化 token 消耗
2. **带来源引用的问答** — 回答时标注知识来源文件和层级

## Context Analysis

### Reference Code
- `SCALABILITY-ANALYSIS.md` — 三层加载策略的理论基础

### Related Documents
- `EDITH-PRODUCT-DESIGN.md` § 4.2 消费方式—零适配、§ 4.3 产出物自说明性
- `templates/en/routing-table.md` — 路由表头部包含消费规则

## Technical Solution

查询流程：
1. 读取 Layer 0 routing-table.md（常驻）
2. 根据问题定位相关服务
3. 加载对应 Layer 1 quick-ref.md
4. 如需具体 Schema/细节，加载 Layer 2 对应片段
5. 组装回答，标注来源层级和文件

### Parameter Contract

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `question` | string | Yes | - | 用户的问题 |
| `services` | string[] | No | auto-detect | 限定查询的服务范围 |
| `max_depth` | 0 \| 1 \| 2 | No | 2 | 最大加载深度（0=仅路由表, 1=到quick-ref, 2=到distillates） |

### Result Structure

```typescript
interface QueryResult {
  answer: string;
  sources: SourceCitation[];
  layersLoaded: (0 | 1 | 2)[];
  tokensConsumed: number;
  servicesQueried: string[];
}

interface SourceCitation {
  layer: 0 | 1 | 2;
  file: string;          // e.g., "workspace/order-service/distillates/02-api-contracts.md"
  section?: string;      // 锚点定位
  relevance: number;     // 0-1 相关度
}
```

## Scope

### IN Scope
- 接收查询问题并解析参数
- 读取 Layer 0 routing-table.md（常驻加载）
- 按需加载 Layer 1 quick-ref.md
- 精准加载 Layer 2 distillates 片段
- 从知识产物中提取答案
- 组装带来源引用的回答

### OUT Scope
- **不做知识生产**：不扫描代码、不蒸馏文档（由 feat-tool-scan / feat-tool-distill 负责）
- **不做路由决策**：不分析需求应该使用哪种加载策略（由 feat-tool-route 负责）
- **不做知识修改**：不写入、不更新知识库文件
- **不做跨知识库查询**：仅在当前 workspace 知识库内查询
- **不做自然语言生成**：回答基于知识产物提取，不做开放式 NLG

## Acceptance Criteria (Gherkin)

### Happy Path Scenarios

**Scenario 1: 简单查询**
```gherkin
Given 知识库中有 user-service 的三层产物
And routing-table.md 已加载
When 用户问 "user-service 的认证流程是什么？"
Then 先读 routing-table.md 定位到 user-service
And 再读 user-service/quick-ref.md 获取概要
And 如需细节，读 distillates/user-service/02-api-contracts.md
And 回答中标注来源文件
And sources 包含 layer, file, section 信息
```

**Scenario 2: 跨服务查询**
```gherkin
Given 知识库中有 user-service 和 order-service
And routing-table.md 中记录了两者关系
When 用户问 "订单创建调用了哪些外部服务？"
Then 读 routing-table.md 了解服务依赖
And 加载 order-service 的 quick-ref.md
And 回答涉及的所有服务
And sources 包含多个服务的引用
```

**Scenario 3: 知识库为空**
```gherkin
Given 知识库中没有任何服务
And routing-table.md 不存在或为空
When 用户提问
Then 返回 "知识库为空，请先扫描并蒸馏至少一个服务"
And 错误类型为 KNOWLEDGE_BASE_EMPTY
```

### Error / Sad-Path Scenarios

**Scenario 4: 缺失 Layer 1 文件**
```gherkin
Given 知识库中有 user-service 的 Layer 0 (routing-table 条目)
And user-service 缺少 quick-ref.md 文件
When 用户问 "user-service 有哪些 API 端点？"
Then 从 Layer 0 routing-table 返回基本信息
And 回答附带 warning: "user-service 缺少 quick-ref.md，回答可能不完整，建议重新蒸馏"
And layersLoaded 仅包含 [0]
```

**Scenario 5: 缺失 Layer 2 文件**
```gherkin
Given 知识库中有 user-service 的 Layer 0 和 Layer 1
And user-service 的 distillates/ 目录为空
When 用户问 "user-service 的 User 模型有哪些字段？"（需要 Layer 2 细节）
Then 从 Layer 1 quick-ref 返回可用的概要信息
And 回答附带 warning: "缺少 distillates 片段，无法提供精确 Schema，建议重新蒸馏"
And layersLoaded 为 [0, 1]
```

**Scenario 6: 损坏的 Markdown 文件**
```gherkin
Given 知识库中有 order-service 的三层产物
And order-service/quick-ref.md 包含无效 YAML frontmatter 或损坏的 Markdown
When edith_query 尝试加载该文件
Then 跳过该文件，仅使用 Layer 0 信息
And 返回 warning: "order-service/quick-ref.md 格式异常，已跳过"
And 降级到仅 Layer 0 回答
```

**Scenario 7: 大型知识库性能**
```gherkin
Given 知识库中有 50 个服务的产物
And routing-table.md 包含 50 条服务条目
When 用户问 "payment-service 的支付回调流程是什么？"
Then 仅加载 payment-service 相关的 Layer 1 和 Layer 2
And 不加载其他 49 个服务的任何文件
And tokensConsumed 不超过 routing-table(500) + quick-ref(2000) + distillates(1500) = 4000
```

**Scenario 8: 问题无法匹配到任何服务**
```gherkin
Given 知识库中有 user-service 和 order-service
When 用户问 "报表系统的导出功能怎么用？"
And routing-table 中没有 "报表系统" 相关条目
Then 返回 "未在知识库中找到与'报表系统'相关的服务。已有服务: user-service, order-service"
And 错误类型为 SERVICE_NOT_FOUND
And 建议用户检查服务名称或先扫描新服务
```

### Error Code Summary

| Error Code | Trigger | Response Strategy |
|------------|---------|------------------|
| `KNOWLEDGE_BASE_EMPTY` | routing-table.md 不存在或为空 | 阻断，提示先 scan + distill |
| `SERVICE_NOT_FOUND` | 问题无法匹配到已知服务 | 阻断，列出已有服务 |
| `MISSING_LAYER1` | 服务缺少 quick-ref.md | 降级到 Layer 0 + warning |
| `MISSING_LAYER2` | 服务缺少 distillates/ | 降级到 Layer 0+1 + warning |
| `CORRUPTED_FILE` | Markdown 格式异常 | 跳过该文件 + warning |
