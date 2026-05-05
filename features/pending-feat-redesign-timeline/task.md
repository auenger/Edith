# Tasks: feat-redesign-timeline

## Task Breakdown

### 1. 页面布局重写（`board/src/app/timeline/page.tsx`）
- [ ] 保留现有数据获取: `api.timeline({ offset, limit, type, service })` + WebSocket `"change"` 订阅
- [ ] 保留分页逻辑: `PAGE_SIZE = 20` + offset 追加（来自 feat-p2-timeline 的已验证模式）
- [ ] 重写 JSX 渲染: 垂直时间轴布局（左侧轴线 + 右侧事件卡片）
  - 时间轴线: CSS 渐变色（品牌色 `#1e40af → #7c3aed`）

### 2. 组件重写
- [ ] `TimelineEventItem.tsx` → Bento Card（shadcn/ui Card + CardContent）
  - 时间戳 + 事件描述 + 类型 Badge（颜色来自 `EVENT_TYPE_CONFIG`）+ 作者 + 文件名
  - hover: `.bento-card-hover` 效果
- [ ] `TimelineFilters.tsx` → shadcn/ui Select（事件类型 + 服务筛选）
  - 保留现有 `type` 和 `service` 筛选参数
- [ ] `MonthGroupHeader.tsx` → 月份分组标题 + shadcn/ui Collapsible（折叠/展开）

### 3. 共享模块保持
- [ ] 确认 `timeline-helpers.ts` 接口不变（`EVENT_TYPE_CONFIG`, `groupByMonth()`, `formatDate()`, `formatMonth()`）
  - Dashboard 的 `RecentChangesPanel` 依赖此模块（来自 feat-p2-board-dashboard）

### 4. 交互与数据
- [ ] 月份折叠/展开: shadcn/ui Collapsible + 动画
- [ ] 事件类型筛选: shadcn/ui Select 实时过滤（保留 `useMemo` 筛选逻辑）
- [ ] 分页: 保留 "加载更早事件" 按钮（或升级为 IntersectionObserver 无限滚动）
- [ ] 加载状态: shadcn/ui Skeleton
- [ ] 空状态: shadcn/ui Card + 友好提示

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Timeline 时间线 |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 12, Archive refs: feat-p2-timeline, feat-p2-board-dashboard, feat-p2-e2e-playwright |
