# Feature: feat-p2-board-dashboard Dashboard 总览仪表盘

## Basic Information
- **ID**: feat-p2-board-dashboard
- **Name**: Dashboard 总览仪表盘
- **Priority**: 70
- **Size**: M
- **Dependencies**: [feat-p2-board-scaffold]
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29
- **Completed**: 2026-05-05
- **Merge Record**:
  - merged_to: main
  - merge_commit: bbcdb91
  - branch: feature/p2-board-dashboard (deleted)
  - tag: feat-p2-board-dashboard-20260505
  - verification: passed (5/5 Gherkin scenarios)
  - files_changed: 8 (6 new, 2 modified, 1043 insertions)

## Description
EDITH Board 首页，提供知识库的全局健康度视图：三层产物完整率、服务覆盖率、最近变更时间线、摄入状态面板、产出物统计、快速操作入口。

### 来源
- EDITH-PRODUCT-DESIGN.md §3.3 Dashboard 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 Dashboard 承接关系

## User Value Points
1. **知识库健康度一览** — 快速了解整体知识覆盖率和新鲜度
2. **最近变更追踪** — 知道知识库最近发生了什么变化
3. **快速操作入口** — 一键触发扫描、刷新、导出等操作

## Context Analysis
### Reference Code
- feat-p2-board-scaffold 的 `board/server/routes/` — API 端点定义，Dashboard 消费 GET /api/health、GET /api/services、GET /api/timeline?limit=5
- feat-p2-board-scaffold 的 `board/server/services/data-reader.ts` — 统一数据读取入口，Dashboard 通过 API 消费其聚合的健康度、覆盖率数据
- feat-p2-board-scaffold 的 `board/server/services/artifact-parser.ts` — 产物解析器，产出物统计面板消费解析后的路由表/速查卡/蒸馏片段计数
- `agent/src/tools/index.ts` (667 行) — `ServiceInfo` / `CrossServiceRelation` 类型，Dashboard 服务覆盖率面板消费此数据结构
- `agent/src/query.ts` (1052 行) — 三层渐进加载逻辑参考，健康度百分比计算逻辑可参考其分层加载统计

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Dashboard — 知识库健康度、服务覆盖率、最近变更、产出物统计、快速操作

### Related Features
- feat-p2-board-scaffold (前置) — API 和数据层，提供 GET /api/health、GET /api/services、GET /api/timeline 端点及 WebSocket 推送
- feat-p2-multimodal-ingestion (关联) — 摄入状态面板数据来源，MarkItDown 处理统计通过 /api/health 暴露
- feat-unlimited-storage (已完成 2026-04-28) — 存储与消费分离原则，Dashboard 只读消费知识产物，不触发任何写入操作

## Technical Solution

### 页面布局
```
┌──────────────────────────────────────────────────────┐
│  EDITH Board                                  user ▼ │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ 知识库健康度 ──────┐  ┌─ 服务覆盖 ───────────┐   │
│  │ 72% 已蒸馏          │  │ ●●● user ✅          │   │
│  │ 新鲜度: 85%         │  │ ●●● order ✅         │   │
│  │ 上次扫描: 2h ago    │  │ ●●○ inv ⚠️          │   │
│  └────────────────────┘  └──────────────────────┘   │
│                                                      │
│  ┌─ 最近变更 ──────────────────────────────────────┐ │
│  │ 10:30 user-service  速查卡已刷新（3 文件变更）    │ │
│  │ 09:15 order-service 新增蒸馏片段：优惠券逻辑      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ 产出物统计 ──────┐  ┌─ 快速操作 ────────────┐   │
│  │ 路由表  1 个       │  │ [扫描新服务]           │   │
│  │ 速查卡  4 个       │  │ [刷新所有知识]         │   │
│  │ 蒸馏片 16 个       │  │ [导出报告]            │   │
│  │ 决策记  8 条       │  │ [查看路由表]           │   │
│  └────────────────────┘  └──────────────────────┘   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Dashboard │ Services │ Knowledge Map │ Artifacts │ Timeline │
└──────────────────────────────────────────────────────┘
```

### 数据来源
| 面板 | API | 数据来源 |
|---|---|---|
| 知识库健康度 | GET /api/health | 三层产物元数据（完整率、新鲜度） |
| 服务覆盖率 | GET /api/services | routing-table.md 注册的服务 |
| 最近变更 | GET /api/timeline?limit=5 | Git log + distill 执行记录 |
| 摄入状态 | GET /api/health | MarkItDown 处理统计 |
| 产出物统计 | GET /api/health | 文件扫描统计 |

### Scope
**IN**: 5 个面板（健康度/服务覆盖/最近变更/产出物统计/快速操作）+ WebSocket 实时更新 + 响应式布局
**OUT**: 数据编辑/删除操作、用户认证、知识产出物修改、自定义面板排列

## Acceptance Criteria (Gherkin)
### User Story
作为团队管理者，我希望在浏览器中看到知识库的整体状态，以便了解团队知识的覆盖情况和健康度。

### Scenarios
```gherkin
Scenario: 查看知识库健康度
  Given 知识库中有 5 个服务，其中 3 个已完整蒸馏
  When 用户访问 Dashboard 页面
  Then 健康度面板显示 "60% 已蒸馏"
  And 显示各服务的覆盖状态（✅ 完整 / ⚠️ 部分 / ❌ 未扫描）

Scenario: 查看最近变更
  Given 知识库在最近 24h 内有变更
  When 用户访问 Dashboard 页面
  Then 最近变更面板显示最近 5 条变更记录
  And 每条记录包含时间、服务名、变更描述

Scenario: 实时更新
  Given Dashboard 页面已打开
  When Agent 完成一次蒸馏操作，知识仓库文件变更
  Then WebSocket 推送变更事件
  And Dashboard 自动刷新健康度和变更数据（无需手动刷新）

  Scenario: 空知识库首次访问
  Given 知识库中没有任何服务或知识产物
  When 用户首次访问 Dashboard 页面
  Then 健康度面板显示 "0% 已蒸馏"
  And 显示引导提示 "运行 edith_scan 开始构建知识库"
  And 快速操作面板高亮 [扫描新服务] 按钮

  Scenario: API 请求失败时的降级
  Given Dashboard 页面已打开
  When /api/health 请求超时或返回 500
  Then 健康度面板显示 "数据加载失败" 状态
  And 显示 [重试] 按钮
  And 其他面板保持上次成功加载的数据（不白屏）
```

### General Checklist
- [x] 知识库健康度面板（完整率、新鲜度、上次扫描时间）
- [x] 服务覆盖率面板（各服务状态列表）
- [x] 最近变更面板（最近 5 条变更）
- [x] 产出物统计面板
- [x] 快速操作按钮
- [x] WebSocket 实时更新
- [x] 响应式布局
