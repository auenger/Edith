# Feature: feat-redesign-dashboard Dashboard Bento Grid

## Basic Information
- **ID**: feat-redesign-dashboard
- **Name**: Dashboard Bento Grid 重设计
- **Priority**: 80
- **Size**: M
- **Dependencies**: [feat-redesign-layout]
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
将 Dashboard 页面从当前网格布局重构为 Bento Grid 模块化卡片设计。重新设计 6 个面板（Health / Service Coverage / Recent Changes / Artifact Stats / Quick Actions）的展示方案和渲染方案。

### 设计要点
- **Bento Grid**: 不等宽网格，关键卡片占据更大面积
- **卡片设计**: 圆角 + 微阴影 + hover 上浮效果 + 状态指示条
- **信息密度**: 紧凑但不拥挤，关键数据一眼可见
- **交互**: 卡片点击 → 详情展开 / 跳转

## User Value Points
1. **一眼总览** — Bento Grid 让关键指标高优展示
2. **快速定位** — 点击卡片直达相关详情页
3. **实时状态** — 健康状态、服务覆盖实时更新

## Context Analysis
### Reference Code
- `board/src/app/page.tsx` — 当前 Dashboard 页面（需完全重写）
  - 当前模式: `"use client"` + useState(data/loading/error/wsStatus) + useCallback fetch + useEffect + WebSocket
  - 数据获取: `api.health()`, `api.services()`, `api.timeline()`, `api.artifactsTree()`
  - WebSocket: `getBoardWebSocket().connect()` + `"change"` 事件订阅 → 重新 fetch
- `board/src/components/dashboard/HealthPanel.tsx` — 健康状态进度条 + 统计数字
  - 使用 `formatTimeAgo()` 工具函数（需迁移到共享位置）
- `board/src/components/dashboard/ServiceCoveragePanel.tsx` — 服务列表 + 状态点
- `board/src/components/dashboard/RecentChangesPanel.tsx` — 最近 5 个时间线事件
  - 使用 `timeline-helpers.ts` 中的 `EVENT_TYPE_CONFIG`（来自 feat-p2-timeline）
- `board/src/components/dashboard/ArtifactStatsPanel.tsx` — 路由表/快速参考/蒸馏物数量统计
- `board/src/components/dashboard/QuickActionsPanel.tsx` — 操作按钮组
- `board/src/lib/api.ts` — API 客户端（HealthStatus, ServiceInfo[], TimelineEvent[], FileTreeNode[] 类型）

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — Dashboard Bento Grid 设计要点
- 兄弟 spec: `features/pending-feat-redesign-system/spec.md` — Bento Card 令牌

### Related Features
- feat-redesign-system (前置) — 提供 Bento Grid 令牌、`.bento-card`、`.bento-grid` 工具类
- feat-redesign-layout (前置) — 提供新 Sidebar + Header + 响应式框架
- feat-p2-board-dashboard (已完成) — 建立了当前 Dashboard 页面和 5 个面板组件（将完全重写）
- feat-p2-timeline (已完成) — `timeline-helpers.ts` 的 `EVENT_TYPE_CONFIG` 被 RecentChangesPanel 使用
- feat-p2-e2e-playwright (已完成) — Dashboard 页面有 E2E 测试，需适配新选择器

### Archive Implementation Patterns
- **页面组件模式** (来自 feat-p2-board-dashboard): `"use client"` → useState → useCallback fetch → useEffect → WebSocket → render
  - 此模式已验证可行，重设计后保留数据获取和 WebSocket 逻辑，仅重写渲染层
- **共享工具函数**: `formatTimeAgo()` 当前在 HealthPanel.tsx 和 page.tsx 中各有一份副本，重设计时应统一到 `lib/` 下
- **RecentChangesPanel 复用**: 当前从 `/api/timeline` 取最近 5 条事件，与 Timeline 页面共享 API，需保持兼容

## Technical Solution
### 方案: Bento Grid 不等宽布局 + shadcn/ui Card 组件

**1. 布局方案**
- 使用 CSS Grid 定义不等宽 Bento 布局（来自 feat-redesign-system 的 `.bento-grid`）
- Health Panel: `bento-span-2`（占据 2 列，大面积显示健康状态）
- Service Coverage + Artifact Stats: 并排各 1 列
- Recent Changes + Quick Actions: 并排各 1 列

**2. 面板组件重写策略**
- 每个面板使用 shadcn/ui `Card` 组件（CardHeader + CardContent）
- 保留现有数据获取逻辑（`api.xxx()` + WebSocket 订阅），仅重写 JSX 渲染
- 统一空状态: shadcn/ui `Skeleton` 加载态 + 友好空状态提示
- 统一 hover 效果: `.bento-card-hover`（来自 feat-redesign-system）

**3. 卡片交互**
- Health Panel: 点击跳转无（首页指标卡）
- Service Coverage: 点击跳转 `/services`
- Artifact Stats: 点击跳转 `/artifacts`
- Recent Changes: 点击跳转 `/timeline`
- Quick Actions: 各按钮直接执行操作

**4. 数据层**
- 保留所有 API 调用（`api.health()`, `api.services()`, `api.timeline()`, `api.artifactsTree()`）
- 保留 WebSocket 实时更新机制
- 迁移 `formatTimeAgo()` 到 `board/src/lib/format.ts` 共享模块

## Acceptance Criteria (Gherkin)
### User Story
作为用户，我希望在 Dashboard 首页一眼看到知识基础设施的关键指标和状态。

### Scenarios (Given/When/Then)

#### Scenario 1: Bento Grid 布局
```gherkin
Given Dashboard 页面加载完成
When 用户查看页面
Then 页面使用 Bento Grid 不等宽布局
And Health Panel 占据较大面积（2 列）
And Service Coverage 和 Artifact Stats 并排
And Recent Changes 和 Quick Actions 在下方
```

#### Scenario 2: 卡片交互
```gherkin
Given Dashboard 卡片已渲染
When 用户悬浮在 Service Coverage 卡片上
Then 卡片上浮 + 阴影增强
When 用户点击 Service Coverage 卡片
Then 跳转到 /services 页面
```

#### Scenario 3: 健康状态实时更新
```gherkin
Given WebSocket 连接正常
When 后端知识库状态变化
Then Health Panel 实时更新状态指示（绿/黄/红）
And 无需手动刷新页面
```

### General Checklist
- [ ] 6 个面板全部使用 Bento Card 组件重写
- [ ] 不等宽网格布局正确
- [ ] 卡片 hover + click 交互正常
- [ ] WebSocket 实时更新正常
- [ ] 数据为空时显示优雅的空状态
