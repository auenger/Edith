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
- 依赖 feat-p2-board-scaffold 提供的 API 层和数据层

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Dashboard — 知识库健康度、服务覆盖率、最近变更、产出物统计、快速操作

### Related Features
- feat-p2-board-scaffold (前置) — API 和数据层
- feat-p2-multimodal-ingestion (关联) — 摄入状态面板数据来源

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
```

### General Checklist
- [ ] 知识库健康度面板（完整率、新鲜度、上次扫描时间）
- [ ] 服务覆盖率面板（各服务状态列表）
- [ ] 最近变更面板（最近 5 条变更）
- [ ] 产出物统计面板
- [ ] 快速操作按钮
- [ ] WebSocket 实时更新
- [ ] 响应式布局
