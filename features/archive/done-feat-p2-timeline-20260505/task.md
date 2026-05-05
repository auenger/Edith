# Tasks: feat-p2-timeline

## Task Breakdown

### 1. 页面布局
- [x] 创建 Timeline 页面路由（/timeline）
- [x] 时间线容器组件
- [x] 月份分组标题组件

### 2. 事件组件
- [x] 时间线事件项组件（时间 + 图标 + 服务名 + 描述）
- [x] 事件类型图标映射（扫描/蒸馏/回写/摄入/图谱更新/路由表更新）
- [x] 事件详情展开/折叠

### 3. 筛选功能
- [x] 按事件类型筛选
- [x] 按服务名筛选
- [x] 筛选器组件

### 4. 分页加载
- [x] 初始加载最近 20 条
- [x] 向上滚动加载更早的记录
- [x] 加载状态指示器

### 5. 数据对接
- [x] 消费 GET /api/timeline
- [x] Git 提交历史解析
- [x] 事件类型推断逻辑

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
| 2026-05-05 | Spec enriched | Reference Code: 6 files, Related Features: 4 (1 前置 + 3 关联同层级) |
| 2026-05-05 | Implementation complete | All tasks done. New: timeline page + 4 components. Modified: API route + api.ts + fix pre-existing ServiceStatus export bug |
