# Feature: feat-knowledge-index-skill Knowledge Index Skill

## Basic Information
- **ID**: feat-knowledge-index-skill
- **Name**: Knowledge Index Skill（蒸馏知识库 → 外部 Agent 可消费的索引 Skill）
- **Priority**: 88
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

新增一个 EDITH Skill，将一个或多个已蒸馏的知识库（routing-table + quick-ref + distillates）打包成标准化的索引 Skill 文件。该索引 Skill 可被外部 Agent（如 Claude Code）直接加载，获得项目知识，无需运行 EDITH Agent。

核心价值：EDITH 的蒸馏产物是纯 Markdown、Agent 无关的，但目前只能在 EDITH 内部消费。这个 Skill 打通"知识出口"——让任何 Agent 通过加载一个 Markdown 文件就能获得完整的项目知识索引。

### 输入
- 1~N 个知识库目录（包含 routing-table.md、quick-ref.md、distillates/*.md）
- 或 edith.yaml 中已配置的 repos 列表

### 输出
- 标准化的 Markdown 索引 Skill 文件（可放入任何 Agent 的 skill 目录）
- 包含：服务地图、快速参考、知识片段索引、跨服务关系、查询路由模式

### 消费方式
- 外部 Agent（如 Claude Code）将索引 Skill 文件放入 `.claude/skills/` 目录
- Agent 启动时自动加载，获得项目知识
- 索引内包含"查询路由模式"——指导 Agent 在面对不同类型问题时加载哪个知识片段

## User Value Points

### VP1: 一键索引生成
用户选择 1~N 个蒸馏知识库，自动解析三层结构，生成统一索引。无需手动编排。

### VP2: 外部 Agent 即插即用
生成的索引 Skill 是纯 Markdown，任何支持 Markdown Skill 的 Agent（Claude Code、Cursor 等）可直接消费。知识出口标准化。

### VP3: 跨服务交叉索引
多个知识库之间的服务依赖、共享实体、API 交互关系自动提取并体现在索引中。

## Context Analysis

### Reference Code
- `edith-skills/distillator/` — 蒸馏引擎，已有 5 步压缩管线和交叉引用检测
- `edith-skills/requirement-router/` — 路由引擎，已有需求→Layer 的路由逻辑
- `agent/src/tools/distill.ts` — edith_distill 工具实现（1300+ 行）
- `agent/src/tools/query.ts` — edith_query 工具（三层加载查询）
- `agent/src/tools/route.ts` — edith_route 工具（需求路由）
- `agent/src/query.ts` — 查询实现

### Related Documents
- `agent/company-edith/routing-table.md` — Layer 0 路由表示例
- `agent/company-edith/LiteMes/quick-ref.md` — Layer 1 快速参考示例
- `agent/company-edith/DoNetMes/quick-ref.md` — Layer 1 快速参考示例（更完整）
- `agent/company-edith/LiteMes/distillates/00-cross-references.md` — 交叉引用示例
- `templates/en/quick-ref-card.md` — 快速参考模板
- `templates/en/routing-table.md` — 路由表模板

### Related Features
- `feat-p2-graphify-index`（Phase 2）— Graphify 认知图谱索引，可视为本 Feature 的演进方向
- `feat-unlimited-storage`（已完成）— 知识产物存储与消费分离，已建立分层加载基础

## Technical Solution

### 索引 Skill 输出格式

```markdown
---
name: {company}-knowledge-index
description: 项目知识索引 — {service_names}。加载后 Agent 自动获得项目知识。
version: 1.0
generated_by: edith-knowledge-index
generated_at: {timestamp}
services: [{service_list}]
---

# {Company} 知识索引

## 服务地图
| 服务 | 角色 | 技术栈 | 关键约束 |
|------|------|--------|----------|

## 快速参考
### {ServiceName}
- 验证: {build/test/lint commands}
- 关键 API: {endpoints}
- 关键约束: {constraints}
- 易错点: {pitfalls}

## 跨服务关系
- {ServiceA} → {ServiceB}: {relationship}
- 共享实体: {entities}

## 知识片段索引
### {ServiceName} 片段
| 片段 | 主题 | 包含内容摘要 |
|------|------|-------------|

## 查询路由模式
- 问架构/技术栈 → 加载 01-overview
- 问 API/接口 → 加载 02-api-contracts
- 问数据模型/实体 → 加载 03-data-models
- 问业务逻辑/规则 → 加载 04-business-logic
- 问开发/部署 → 加载 05-development-guide
```

### 实现方案

1. **新增 Skill**: `edith-skills/knowledge-index/` — 包含 SKILL.md（索引生成逻辑）
2. **新增工具**: `agent/src/tools/index.ts` — `edith_index` 工具实现
3. **注册工具**: 在 `agent/src/extension.ts` 中注册 `edith_index`
4. **增强 edith_query**: 在查询时优先检查索引 Skill，利用索引加速定位

### 关键设计决策
- 索引 Skill 输出为单文件 Markdown（非目录），最大化便携性
- 知识片段内容不内联到索引中，只记录路径和摘要（保持索引轻量）
- 查询路由模式是"指导性"的（告诉 Agent 什么时候该加载什么），不是"强制性"的
- 支持增量更新：知识库变更后重新生成索引，旧索引被替换

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我想要将已蒸馏的知识库一键导出为索引 Skill，以便外部 Agent（如 Claude Code）能直接加载并获得项目知识。

### Scenarios (Given/When/Then)

#### Scenario 1: 单知识库索引生成
```gherkin
Given 一个包含 routing-table.md、quick-ref.md、distillates/ 的知识库目录
When 用户执行 edith_index 并指定该目录
Then 生成一个标准化 Markdown 索引 Skill 文件
And 文件包含服务地图、快速参考、知识片段索引、查询路由模式
And 文件大小 < 5000 tokens
```

#### Scenario 2: 多知识库交叉索引
```gherkin
Given 两个知识库目录（LiteMes 和 DoNetMes）
When 用户执行 edith_index 并指定两个目录
Then 生成包含两个服务的统一索引
And 索引包含跨服务关系（依赖、共享实体、API 交互）
And 每个服务的知识片段独立索引
```

#### Scenario 3: 索引 Skill 外部消费
```gherkin
Given 已生成的索引 Skill Markdown 文件
When 将文件放入 Claude Code 的 .claude/skills/ 目录
Then Claude Code 在对话中能正确回答项目相关问题
And Agent 能根据查询路由模式定位到具体知识片段
```

#### Scenario 4: edith_query 利用索引加速
```gherkin
Given 已生成的索引 Skill 文件存在
When 用户通过 edith_query 查询 API 相关问题
Then 查询优先利用索引定位到正确的 Layer 2 片段
And 加载的 token 数少于无索引时的全量扫描
```

### General Checklist
- [ ] 索引 Skill 为纯 Markdown，无外部依赖
- [ ] 索引文件包含完整的 YAML frontmatter 元数据
- [ ] 支持单知识库和多知识库两种模式
- [ ] 跨服务关系自动提取（基于 cross-references 和 routing-table）
- [ ] 查询路由模式覆盖常见的 5 种查询类型
- [ ] 生成的索引在 Claude Code 中验证可用
- [ ] edith_query 集成索引加速路径

## Merge Record

- **Completed**: 2026-04-29
- **Branch**: feature/knowledge-index-skill
- **Merge commit**: 3bec1b7
- **Archive tag**: feat-knowledge-index-skill-20260429
- **Conflicts**: none
- **Verification**: 4/4 Gherkin scenarios passed
- **Files changed**: 3 (index.ts new, extension.ts modified, query.ts modified)
- **Duration**: ~15 min
