# Feature: feat-redesign-timeline Timeline 时间线

## Basic Information
- **ID**: feat-redesign-timeline
- **Name**: Timeline 时间线 Bento Grid 重设计
- **Priority**: 65
- **Size**: S
- **Dependencies**: [feat-redesign-layout]
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
重新设计 Timeline 知识时间线页面，采用 Bento Grid 卡片布局，提升时间线可视化和交互体验。

### 设计要点
- **时间线布局**: 垂直时间轴 + 事件卡片，按月份分组
- **事件卡片**: Bento Card 风格（时间戳 + 描述 + 类型标签）
- **交互**: 月份折叠/展开、事件类型筛选、分页加载
- **视觉**: 时间轴线渐变色、事件类型颜色编码

## User Value Points
1. **时间浏览** — 清晰的时间线视图浏览知识演变
2. **快速筛选** — 按类型和时间范围筛选事件
3. **信息密度** — 紧凑但不拥挤的事件卡片

## Context Analysis
### Reference Code
- `board/src/app/timeline/page.tsx` — 当前 Timeline 页面（需重写）
  - 当前模式: `"use client"` + useState(offset, hasMore, data, loading, error, wsStatus, filters)
  - 分页: `PAGE_SIZE = 20`，"加载更早事件" 按钮 → `offset + PAGE_SIZE` + `append=true`
  - 筛选: type + service 双维度筛选
  - WebSocket: `getBoardWebSocket().connect()` → `"change"` 事件 → 重新 fetch
  - 数据获取: `api.timeline({ offset, limit, type, service })` → `{ events, total, offset, limit }`
- `board/src/components/timeline/TimelineEventItem.tsx` — 单个事件渲染（→ Bento Card 重写）
  - 使用 `timeline-helpers.ts` 中的 `EVENT_TYPE_CONFIG` 获取图标、标签、颜色
- `board/src/components/timeline/TimelineFilters.tsx` — 类型 + 服务筛选下拉（→ shadcn/ui Select）
- `board/src/components/timeline/MonthGroupHeader.tsx` — 月份分组标题（→ 重写，添加折叠/展开）
- `board/src/components/timeline/timeline-helpers.ts` — 共享工具函数
  - `EVENT_TYPE_CONFIG`: scan/distill/ingest/graphify/other 的图标、标签、点类、图标背景
  - `groupByMonth()`: 事件按月分组
  - `formatDate()`, `formatMonth()`: 日期格式化
  - **注意**: 此文件也被 Dashboard 的 `RecentChangesPanel` 使用（来自 feat-p2-timeline）

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — Timeline Bento Grid 设计要点
- 兄弟 spec: `features/pending-feat-redesign-system/spec.md` — Bento Card 令牌

### Related Features
- feat-redesign-system (前置) — 提供 Bento Grid 令牌和 shadcn/ui 组件
- feat-redesign-layout (前置) — 提供新布局框架
- feat-p2-timeline (已完成) — 建立了当前 Timeline 页面和组件（将完全重写渲染层）
- feat-p2-board-dashboard (已完成) — Dashboard 的 `RecentChangesPanel` 使用 `timeline-helpers.ts`，修改需保持兼容
- feat-p2-e2e-playwright (已完成) — Timeline 页面有 E2E 测试，需适配新选择器

### Archive Implementation Patterns
- **分页模式** (来自 feat-p2-timeline): `PAGE_SIZE = 20` + "加载更早事件" 按钮追加
  - 此模式已验证，重设计保留分页逻辑，仅优化 UI（可考虑无限滚动替代按钮）
- **共享工具函数**: `timeline-helpers.ts` 是 Dashboard 和 Timeline 的共享模块，不可删除或大幅修改接口
- **事件类型系统**: 6 种事件类型 (scan/distill/ingest/graphify/other) 的颜色编码需在 Bento Card 中保持一致

## Technical Solution
### 方案: 垂直时间轴 + Bento Card 事件卡片 + 月份折叠

**1. 页面布局**
- 页面顶部: 筛选控件（shadcn/ui Select: 事件类型 + 服务筛选）
- 内容区: 垂直时间轴（左侧时间轴线 + 右侧事件卡片）
- 每个月份: MonthGroupHeader（可折叠/展开，shadcn/ui Collapsible）
- 时间轴线: CSS 渐变色（品牌色蓝紫渐变）

**2. 事件卡片重写**
- 使用 shadcn/ui `Card` 组件（`.bento-card` 风格）
- 卡片内容: 时间戳 + 事件描述 + 类型 Badge（颜色编码来自 `EVENT_TYPE_CONFIG`）+ 作者 + 文件名
- hover 效果: `.bento-card-hover`（上浮 + 阴影增强）

**3. 交互增强**
- 月份折叠/展开: shadcn/ui `Collapsible` 组件
- 事件类型筛选: shadcn/ui `Select` 组件，实时过滤
- 分页: 保留 "加载更早事件" 按钮模式（或升级为 IntersectionObserver 无限滚动）
- 保留所有现有数据获取逻辑和 WebSocket 实时更新

**4. 共享模块保持**
- `timeline-helpers.ts` 保持接口不变（`EVENT_TYPE_CONFIG`, `groupByMonth()` 等）
- Dashboard `RecentChangesPanel` 依赖此模块，修改需确保兼容

## Acceptance Criteria (Gherkin)
### User Story
作为用户，我希望通过时间线视图了解知识基础设施的演变历史。

### Scenarios (Given/When/Then)

#### Scenario 1: 时间线渲染
```gherkin
Given 用户访问 /timeline 页面
When 数据加载完成
Then 事件按时间倒序排列在垂直时间轴上
And 事件按月份分组
And 每个月份组有标题头
```

#### Scenario 2: 事件筛选
```gherkin
Given Timeline 页面已加载
When 用户选择筛选条件（事件类型）
Then 时间线只显示匹配的事件
And 不匹配的月份组自动隐藏
```

#### Scenario 3: 分页加载
```gherkin
Given Timeline 数据量较大
When 用户滚动到底部
Then 自动加载更多事件（无限滚动或分页按钮）
```

### General Checklist
- [x] 时间线 Bento Grid 布局
- [x] 事件卡片样式统一
- [x] 筛选功能正常
- [x] 分页/加载更多正常
- [x] 空状态处理

## Merge Record
- **Completed**: 2026-05-07T00:20:00+08:00
- **Branch**: feature/redesign-timeline
- **Merge Commit**: 25ede62
- **Archive Tag**: feat-redesign-timeline-20260506
- **Conflicts**: none
- **Verification**: passed (3/3 scenarios)
- **Stats**: started 2026-05-06T23:50:00+08:00, duration ~30min, commits: 1, files_changed: 5
