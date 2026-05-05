# Tasks: feat-redesign-system

## Task Breakdown

### 1. shadcn/ui 安装与配置
- [x] 执行 `npx shadcn@latest init` 配置 shadcn/ui（样式 "new-york", 基础色 "slate"）
- [x] 确认 `components.json` 配置正确（Tailwind v4 兼容，`@/*` 路径别名与 tsconfig 对齐）
- [x] 安装基础组件：Button, Card, Badge, Input, Separator, Skeleton, Tooltip, Sheet, Dialog, Select
- [x] 验证 shadcn/ui 组件在 Next.js 15 + React 19 + Tailwind v4 环境下正常渲染

### 2. Bento Grid 设计令牌（修改 `board/src/app/globals.css`）
- [x] 保留现有 `@import "tailwindcss"` 导入方式（Tailwind v4 规范，来自 feat-p2-board-scaffold）
- [x] 保留品牌渐变色 `#1e40af → #7c3aed` 和 Sidebar 深色 `#0f172a`（来自当前 layout.tsx）
- [x] 定义配色令牌: brand-{50..950} / semantic (success/warning/danger/info) / neutral (slate 系列)
- [x] 定义字体令牌: heading (系统无衬线) / body (系统无衬线) / mono (等宽)
- [x] 定义间距令牌: 4px 基础单位 → 1/2/3/4/6/8/12 (Tailwind spacing 兼容)
- [x] 定义圆角令牌: sm (4px) / md (8px) / lg (12px) / xl (16px) / 2xl (20px)
- [x] 定义阴影令牌: sm / md / lg（用于 Bento Card 分层效果）
- [x] 通过 Tailwind v4 `@theme` 注册令牌为 Tailwind 工具类

### 3. Bento Grid 布局工具类（在 globals.css 中定义）
- [x] `.bento-grid` — CSS Grid 容器（`grid-template-columns: repeat(auto-fill, minmax(var(--bento-min-width), 1fr))`）
- [x] `.bento-card` — 卡片基础（圆角 + 微阴影 + 内边距 + `transition-all duration-200`）
- [x] `.bento-span-{2..4}` — 跨列辅助（`grid-column: span n`）
- [x] `.bento-card-hover` — 替代现有 `.card-hover`（上浮 + 阴影增强，统一 hover 效果）

### 4. 清理已知债务
- [x] 验证 `board/package.json` 中 shadcn/ui 依赖版本一致性（当前已列出但未使用）
- [x] 确认新 CSS 变量不影响现有 E2E 测试选择器（22 个 Playwright 测试，来自 feat-p2-e2e-playwright）

### 5. 验证
- [x] 创建 `/design-system` 示例页面（开发阶段用，不入生产）展示所有令牌和 shadcn/ui 组件
- [x] 确认令牌在深色/浅色模式下均可正确应用

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | 设计系统基础 |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 14, Archive refs: feat-p2-board-scaffold, feat-p2-e2e-playwright |
| 2026-05-05 | Implementation complete | shadcn/ui init (base-nova → new-york/slate), 10 components installed, Bento Grid tokens + utilities, /design-system demo page, build pass (9 pages) |
