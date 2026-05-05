# Feature: feat-p2-timeline Timeline 知识时间线

## Basic Information
- **ID**: feat-p2-timeline
- **Name**: Timeline 知识时间线
- **Priority**: 55
- **Size**: S
- **Dependencies**: [feat-p2-board-scaffold]
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
展示组织知识的演化过程。时间线聚合 Git 提交历史、edith_scan 执行日志、edith_distill 执行日志、MarkItDown 批处理日志、Graphify 重扫记录，形成完整的知识变更时间线。

### 来源
- EDITH-PRODUCT-DESIGN.md §3.3 Timeline 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 Timeline 承接关系

## User Value Points
1. **知识演化追溯** — 查看知识库从无到有的完整成长过程
2. **变更溯源** — 每次知识更新都能追溯到触发原因（代码变更、文档摄入、人工回写）
3. **事件分类** — 区分扫描记录、蒸馏记录、摄入记录、图谱更新等不同类型

## Context Analysis
### Reference Code
- feat-p2-board-scaffold 的 `board/server/routes/` — GET /api/timeline 端点，返回变更事件列表（支持 limit / offset / type / service 参数）
- feat-p2-board-scaffold 的 `board/server/services/data-reader.ts` — 历史层数据读取（Git commit history 解析），Timeline 页面的主要数据来源
- feat-p2-board-scaffold 的 `board/server/services/file-watcher.ts` — 文件变更监听，Timeline 可通过 WebSocket 接收实时变更事件
- `agent/src/tools/scan.ts` (2690 行) — scan 执行记录（`ScanResult.scannedAt` 时间戳），作为"扫描完成"事件的数据来源
- `agent/src/tools/distill.ts` (1365 行) — distill 执行记录（`DistillResult.distilledAt` 时间戳），作为"蒸馏完成"事件的数据来源
- `agent/src/tools/index.ts` (667 行) — `ServiceInfo` 类型，Timeline 事件与服务名的关联数据来源

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Timeline — 知识回写历史时间线
- EDITH-INTEGRATION-DESIGN.md §五 Timeline 承接关系

### Related Features
- feat-p2-board-scaffold (前置) — API 层、Git 读取层、WebSocket 推送，Timeline 页面的完整基础设施
- feat-p2-board-dashboard (关联) — Dashboard "最近变更"面板消费相同 /api/timeline 端点（limit=5），可共享时间线事件渲染组件
- feat-p2-multimodal-ingestion (关联) — MarkItDown 批处理日志作为"摄入完成"事件类型的数据来源
- feat-p2-graphify-index (关联) — Graphify 重扫记录作为"图谱更新"事件类型的数据来源

## Technical Solution

### 页面布局
```
┌──────────────────────────────────────────────────┐
│  EDITH Board > Timeline                          │
├──────────────────────────────────────────────────┤
│                                                  │
│  知识回写历史 — 组织知识的演化过程                  │
│                                                  │
│  2026-04                                         │
│  ═══════                                         │
│                                                  │
│  ──●── 04-27 14:30  order-service                │
│  │                  速查卡自动刷新                 │
│  │                  变更: 3 文件更新，2 个 API 新增 │
│  │                                               │
│  ──●── 04-27 10:15  order-service                │
│  │                  知识回写: 决策记录              │
│  │                  "订单号改为雪花算法..."          │
│  │                                               │
│  ──●── 04-26 16:00  inventory-service            │
│  │                  首次扫描完成                    │
│  │                                               │
│  ──●── 04-25 09:00  routing-table                │
│  │                  路由表更新                      │
│  │                                               │
│  ◀ 2026-03                                       │
└──────────────────────────────────────────────────┘
```

### 事件类型
| 类型 | 图标 | 来源 |
|---|---|---|
| 扫描完成 | 🔍 | edith_scan 执行日志 |
| 蒸馏完成 | 📝 | edith_distill 执行日志 |
| 知识回写 | ✏️ | 人工回写记录 |
| 摄入完成 | 📄 | MarkItDown 批处理日志 |
| 图谱更新 | 🔗 | Graphify 重扫记录 |
| 路由表更新 | 🗺️ | routing-table 变更 |

### 数据来源
- Git 提交历史（主要来源）
- YAML Frontmatter 时间戳
- Agent 执行日志（未来扩展）

### Scope
**IN**: 知识变更时间线（按月分组）+ 6 种事件类型 + 按服务/类型筛选 + 分页加载
**OUT**: 事件编辑/删除、自定义事件类型、导出时间线、实时推送（依赖 WebSocket）

## Acceptance Criteria (Gherkin)
### User Story
作为团队成员，我希望查看知识库的变更历史，以便了解组织知识的演化过程。

### Scenarios
```gherkin
Scenario: 查看知识时间线
  Given 知识库在过去一周有多条变更记录
  When 用户访问 Timeline 页面
  Then 按时间倒序显示所有变更事件
  And 事件按月份分组显示
  And 每个事件包含：时间、服务名、变更描述

Scenario: 按事件类型筛选
  Given 时间线页面已加载
  When 用户选择只看"蒸馏完成"类型
  Then 只显示 edith_distill 执行产生的事件

Scenario: 按服务筛选
  Given 时间线页面已加载
  When 用户选择 "order-service"
  Then 只显示该服务相关的变更事件

Scenario: 分页加载
  Given 知识库有 100+ 条变更记录
  When 用户访问 Timeline 页面
  Then 初始加载最近 20 条
  When 用户点击 "◀ 2026-03"
  Then 加载更早的记录

Scenario: 空时间线
  Given 知识库中没有任何变更记录
  When 用户访问 Timeline 页面
  Then 显示空状态提示 "暂无知识变更记录"
  And 筛选器隐藏或置灰

Scenario: API 请求失败
  Given Timeline 页面已加载
  When 用户请求加载更早的记录时 API 返回错误
  Then 显示 "加载失败" 提示和 [重试] 按钮
  And 已加载的事件保持显示（不丢失）
```

### General Checklist
- [x] 时间线组件（按月份分组，事件流布局）
- [x] 事件类型图标和颜色区分
- [x] 按服务/类型筛选
- [x] 分页或无限滚动加载
- [x] 事件详情展开

## Merge Record
- **Completed**: 2026-05-05T18:00:00+08:00
- **Merged Branch**: feature/p2-timeline
- **Merge Commit**: 1945f8a
- **Archive Tag**: feat-p2-timeline-20260505
- **Conflicts**: None (fast-forward merge)
- **Verification**: 6/6 Gherkin scenarios PASS, build PASS
- **Stats**: 12 files changed, 747 insertions, 29 deletions, 6 new files
