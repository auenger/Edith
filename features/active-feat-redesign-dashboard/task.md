# Tasks: feat-redesign-dashboard

## Task Breakdown

### 1. 共享工具函数整理
- [x] 提取 `formatTimeAgo()` 到 `board/src/lib/format.ts`（当前在 HealthPanel.tsx 和 page.tsx 各有一份副本，已知债务）
- [x] Dashboard 页面和面板组件引用新的共享模块

### 2. Bento Grid 布局（重写 `board/src/app/page.tsx`）
- [x] 保留现有数据获取逻辑: `api.health()`, `api.services()`, `api.timeline()`, `api.artifactsTree()`
- [x] 保留 WebSocket 实时更新: `getBoardWebSocket().connect()` + `"change"` 订阅
- [x] 重写 JSX 渲染层: 使用 `.bento-grid` + `.bento-card`（来自 feat-redesign-system）
- [x] 定义不等宽网格: Health Panel `bento-span-2`, 其余各 span-1

### 3. 面板组件重写（使用 shadcn/ui Card）
- [x] `components/dashboard/HealthPanel.tsx` → Bento Card（`bento-span-2` 大面积 + 实时状态指示条 + 统计数字）
  - 保留 `api.health()` → `HealthStatus` 数据接口
- [x] `components/dashboard/ServiceCoveragePanel.tsx` → Bento Card（服务列表 + 状态点 + 覆盖率）
  - 保留 `api.services()` → `ServiceInfo[]` 数据接口，点击跳转 `/services`
- [x] `components/dashboard/RecentChangesPanel.tsx` → Bento Card（最近 5 条变更事件）
  - 保留 `api.timeline({ limit: 5 })` 调用和 `timeline-helpers.ts` 的 `EVENT_TYPE_CONFIG`
  - 点击跳转 `/timeline`
- [x] `components/dashboard/ArtifactStatsPanel.tsx` → Bento Card（路由表/快速参考/蒸馏物统计数字）
  - 保留 `api.artifactsTree()` 数据接口，点击跳转 `/artifacts`
- [x] `components/dashboard/QuickActionsPanel.tsx` → Bento Card（快捷操作按钮组，使用 shadcn/ui Button）

### 4. 交互与状态
- [x] 卡片 hover: `.bento-card-hover`（上浮 + 阴影增强，来自 feat-redesign-system 令牌）
- [x] 卡片点击跳转: 使用 `next/link` 或 `router.push()`
- [x] 空状态: shadcn/ui Card + 友好提示文案
- [x] 加载状态: shadcn/ui Skeleton 替代当前加载显示

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Dashboard Bento Grid |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 14, Archive refs: feat-p2-board-dashboard, feat-p2-timeline, feat-p2-e2e-playwright |
| 2026-05-05 | Implementation complete | All 14 tasks done: format.ts shared util, page.tsx Bento Grid, 5 panel rewrites with shadcn/ui Card/Skeleton + design tokens |
