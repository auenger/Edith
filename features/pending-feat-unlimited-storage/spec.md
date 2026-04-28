# Feature: feat-unlimited-storage 存储与消费分离

## Basic Information
- **ID**: feat-unlimited-storage
- **Name**: 知识产物存储与消费分离
- **Priority**: 80
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-28

## Description

当前 EDITH 的 token_budget 同时控制了「存多少」和「用多少」，导致蒸馏阶段就
开始截断知识产物，丢失了老项目的完整信息。本 feature 将存储和消费彻底分离：

- **存储阶段**：蒸馏产出完整 Markdown，不截断。distillate 可以是 8000 token、
  20000 token，全部保存到磁盘。
- **消费阶段**：query/route 时根据相关性评分选择加载哪些 fragment，控制的是
  「一次对话中放多少进上下文」，而非「磁盘上存多少」。

## User Value Points

### V1: 存储完整性保证
蒸馏阶段不再截断，所有知识产物完整保存。用户对老项目的任何细节查询都能
找到完整信息。

### V2: 消费时智能选择
query/route 不再硬切内容或固定数量限制，而是根据查询相关性评分选择最相关
的 fragment 加载，在上下文窗口内最大化信息密度。

### V3: 配置模型简化
token_budget 只控制「消费端上下文预算」，不再影响存储。用户理解成本降低。

## Context Analysis

### Reference Code
- `agent/src/tools/distill.ts` — 蒸馏工具，6 处截断逻辑
- `agent/src/query.ts` — 查询引擎，fragment 加载截断
- `agent/src/tools/route.ts` — 路由工具，片段数量限制
- `agent/src/config.ts` — TokenBudget 类型定义和默认值
- `edith-skills/distillator/scripts/analyze_sources.py` — Python 端处理阈值

### Related Documents
- `SCALABILITY-ANALYSIS.md` — 三层加载设计
- `agent/company-edith/LiteMes/distillates/02-api-contracts.md` — 已被截断的实际产出物

### Related Features
- feat-tool-distill (completed) — 当前 distill 工具实现
- feat-tool-query (completed) — 当前 query 引擎实现
- feat-tool-route (completed) — 当前 route 工具实现

## Technical Solution

### 改动范围

#### 1. config.ts — 配置模型调整

**Before:**
```typescript
interface TokenBudget {
  routing_table: number;      // 存储 + 消费共用
  quick_ref: number;          // 存储 + 消费共用
  distillate_fragment: number; // 存储 + 消费共用
}
```

**After:**
```typescript
interface ContextBudget {
  routing_table: number;      // 消费端：Layer 0 加载上限 (default 500)
  quick_ref: number;          // 消费端：Layer 1 加载上限 (default 2000)
  distillate_per_query: number; // 消费端：单次查询最大 fragment token (default 6000)
  max_fragments_per_route: number; // 消费端：路由时最大 fragment 数 (default 5)
}
```

存储端无配置项——永远是完整保存。

#### 2. distill.ts — 移除所有存储截断

移除以下截断点：
- Layer 0 routing-table 的 500 token 硬限制 → 完整输出所有服务条目
- Layer 1 quick-ref 的 2000 token API 端点删除逻辑 → 完整保留所有端点
- Layer 2 distillate_fragment 的 4000 token 硬切 → 完整输出
- 角色描述 80 字符截断 → 移除
- 约束列表 top 5 限制 → 完整保留所有约束

保留的：文件级别的语义拆分逻辑（按模块/接口拆成多个 fragment 文件仍然是合理的，
只是每个 fragment 内不再截断）。

#### 3. query.ts — 相关性优先的智能加载

**Before:** 每个 fragment 切到 2000 token
**After:**
1. 根据查询关键词对所有 fragment 做相关性评分
2. 按评分排序，从高分开始加载
3. 加载到总量接近 `distillate_per_query` 预算时停止
4. 未加载的 fragment 列出标题和摘要（索引不倾倒原则）

#### 4. route.ts — 动态 fragment 选择

**Before:** 每种变更类型固定 2-3 个 fragment
**After:**
1. 按变更类型筛选候选 fragment
2. 相关性评分排序
3. 加载到 `max_fragments_per_route` 个为止
4. 无硬性数量限制，根据相关性决定

#### 5. analyze_sources.py — 移除处理阈值

移除 `SINGLE_COMPRESSOR_MAX_TOKENS` 和 `SINGLE_DISTILLATE_MAX_TOKENS` 限制，
允许大文件完整处理。如果单个源文件太大，仍然按语义拆分，但不丢弃内容。

### 向后兼容

- `edith.yaml` 中旧的 `token_budget` 配置自动映射到新的 `context_budget`
- 无配置文件时使用新的默认值
- 已有的知识产物不需要重新蒸馏（但可以增量蒸馏来补全被截断的部分）

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望蒸馏产生的知识产物是完整的、不截断的，
这样我查询老项目的任何细节时都能获得完整信息。

### Scenarios

#### Scenario 1: 大型服务完整蒸馏
```gherkin
Given 一个包含 50+ API 端点的微服务
When 执行 edith_distill
Then 所有 API 端点都出现在 quick-ref.md 中
And 所有接口契约都出现在 distillates/ 目录中
And 没有任何 "[... truncated ...]" 标记
```

#### Scenario 2: 复杂数据模型不截断
```gherkin
Given 一个包含 30+ 字段的数据模型
When 该模型被蒸馏为 distillate fragment
Then fragment 包含所有 30+ 字段的完整定义
And fragment 不包含截断标记
```

#### Scenario 3: 查询时智能加载
```gherkin
Given 知识库中有 20 个 distillate fragment
When 用户查询 "订单服务的退款流程"
Then 系统根据相关性评分选择最相关的 fragment 加载
And 加载总量不超过 context_budget
And 未加载的 fragment 以标题列表形式呈现
```

#### Scenario 4: 路由时动态选择
```gherkin
Given 一个变更影响了 8 个相关的 distillate fragment
When 执行 edith_route 分析影响范围
Then 系统按相关性排序后选择最重要的 fragment 加载
And 不限于固定 2-3 个，而是按 context_budget 动态决定
```

#### Scenario 5: 旧配置向后兼容
```gherkin
Given 一个使用旧 token_budget 格式的 edith.yaml
When EDITH Agent 启动并加载配置
Then 旧配置自动映射到新的 context_budget
And Agent 正常启动不报错
```

### General Checklist
- [ ] 所有存储截断逻辑移除
- [ ] 消费端使用相关性评分加载
- [ ] 配置模型更新并保持向后兼容
- [ ] 已有知识产物不需要重新蒸馏
- [ ] Python 脚本阈值移除或调整
