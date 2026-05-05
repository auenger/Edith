# Tasks: feat-redesign-layout

## Task Breakdown

### 1. Sidebar 组件（`components/layout/Sidebar.tsx`）
- [ ] 创建 Client Component，`"use client"` + `useState` 管理折叠状态
- [ ] 展开 240px / 折叠 64px，使用 `transition-all duration-300`（替代当前 layout.tsx 内联 Sidebar）
- [ ] EDITH Logo 品牌区域（保留渐变 `#1e40af → #7c3aed`，来自当前 layout.tsx）
- [ ] 5 个导航项使用 Lucide 图标（LayoutDashboard / Server / FolderOpen / Brain / Clock）
  - 路由: `/` / `/services` / `/artifacts` / `/knowledge-map` / `/timeline`
  - 当前页面高亮: `usePathname()` + 品牌色背景
- [ ] 折叠/展开切换按钮（shadcn/ui Button，ChevronLeft/ChevronRight 图标）
- [ ] 底部 WebSocket 状态指示器（保留当前功能，使用 `getBoardWebSocket()` 单例）

### 2. Header 组件（`components/layout/Header.tsx`）
- [ ] 创建 Client Component
- [ ] 面包屑导航（基于 `usePathname()` 生成，如 "Board > Services"）
- [ ] 全局搜索框（shadcn/ui Input + Lucide Search 图标，本阶段仅 UI）
- [ ] 连接状态指示灯（复用 `getBoardWebSocket()` 的 `onStatusChange` 模式）
- [ ] 版本信息显示

### 3. 根布局重构（重写 `app/layout.tsx`）
- [ ] 保持 Server Component，将 Sidebar 作为 Client Component 嵌入
- [ ] Sidebar + Header + Main 三栏结构（使用 Bento Grid 令牌，来自 feat-redesign-system）
- [ ] Content 区域响应式边距: `lg:ml-60` / `md:ml-16` / `ml-0`
- [ ] 保留 `<html>`, `<body>` 基础结构和 metadata

### 4. 响应式适配（Tailwind 断点）
- [ ] 桌面 `lg:` (≥ 1024px): Sidebar 展开 240px
- [ ] 平板 `md:` (768px-1024px): Sidebar 折叠 64px，自动触发折叠状态
- [ ] 手机 ( < 768px): Sidebar 隐藏，Header 显示汉堡按钮
- [ ] 手机端 Sidebar 以 shadcn/ui Sheet (侧边抽屉) 形式打开

### 5. 知识图谱页面适配
- [ ] 确认知识图谱页面（当前使用 `-m-6` 负边距打破内边距）在新布局中正常工作
- [ ] 可能需要调整 Content 区域的 padding 方案以适配全高图表

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | 全局布局 & 导航 |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 18, Archive refs: feat-p2-board-scaffold, feat-p2-e2e-playwright |
