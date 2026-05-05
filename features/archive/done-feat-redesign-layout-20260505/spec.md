# Feature: feat-redesign-layout 全局布局 & 导航

## Basic Information
- **ID**: feat-redesign-layout
- **Name**: 全局布局 & 导航（Sidebar + Header + 响应式框架 + 页面过渡）
- **Priority**: 85
- **Size**: S
- **Dependencies**: [feat-redesign-system]
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
重新设计 Board 全局布局框架。包括：新 Sidebar 导航（折叠/展开）、Header 面包屑、响应式布局、页面过渡动画、移动端适配。

### 设计要点
- **Sidebar**: 从 60px 图标导航 → Bento 风格可折叠侧栏（展开 240px / 折叠 64px）
- **Header**: 面包屑 + 全局搜索 + 通知 + 用户头像
- **响应式**: 桌面 Sidebar 展开 → 平板 Sidebar 折叠 → 手机 Sidebar 隐藏 + 汉堡菜单
- **过渡**: 页面切换动画（fade / slide）

## User Value Points
1. **高效导航** — 清晰的页面结构，快速跳转
2. **空间利用** — 可折叠 Sidebar 根据需要调节内容区域大小
3. **移动适配** — 在任何设备上都能正常使用

## Context Analysis
### Reference Code
- `board/src/app/layout.tsx` — 当前根布局（需完全重写）
  - 当前结构: 固定 Sidebar w-60 + Header h-14 + Content flex-1 + Footer h-8
  - Sidebar 导航内联在 layout.tsx 中（5 项: Dashboard, Services, Artifacts, Knowledge Map, Timeline）
  - 品牌渐变: `style={{ background: "linear-gradient(135deg, #1e40af, #7c3aed)" }}`
  - WebSocket 状态指示器在 Sidebar 底部
  - 知识图谱页面使用 `-m-6` 负边距打破内边距（重设计后需考虑此用例）
- `board/src/components/` — 当前无独立 Sidebar/Header 组件（全部内联在 layout.tsx）
- `board/src/app/globals.css` — 将使用 feat-redesign-system 建立的 Bento Grid 令牌

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — 布局重设计总体方向
- 兄弟 spec: `features/pending-feat-redesign-system/spec.md` — 设计令牌基础

### Related Features
- feat-redesign-system (前置) — 提供 Bento Grid 设计令牌和 shadcn/ui 组件
- feat-p2-board-scaffold (已完成) — 建立了当前 layout.tsx，需完全重写
  - 当前 API 代理配置 (`next.config.js` rewrites) 不受影响
  - `board/src/lib/api.ts` 中的 WebSocket 单例 `getBoardWebSocket()` 需在新布局中保留连接
- feat-p2-e2e-playwright (已完成) — E2E 测试中有页面导航断言，布局变更需更新测试选择器

### Archive Implementation Patterns
- **当前布局**: Sidebar 使用 `position: fixed w-60`，main 使用 `ml-60`，所有页面共享此布局
- **页面路由**: `/` (Dashboard), `/services`, `/artifacts`, `/knowledge-map`, `/timeline`
- **图标方案**: 当前使用 Unicode 符号（📊 📋 📁 🧠 📅），重设计后应使用 Lucide 图标（已在 dependencies 中）
- **WebSocket 状态**: 当前在 Sidebar 底部显示 `wsStatus` 文本，需在新 Sidebar 中保留

## Technical Solution
### 方案: 组件化 Sidebar + Header + 响应式断点

**1. Sidebar 组件化**（`components/layout/Sidebar.tsx`）
- Client Component（`"use client"`），管理折叠状态 `useState`
- 展开 240px / 折叠 64px，使用 `transition-all duration-300` 平滑动画
- 5 个导航项使用 Lucide 图标（LayoutDashboard, Server, FolderOpen, Brain, Clock）
- 当前页面高亮: `usePathname()` 匹配 + 品牌色背景
- 底部保留 WebSocket 状态指示器

**2. Header 组件**（`components/layout/Header.tsx`）
- 面包屑: 基于 `usePathname()` 生成层级
- 全局搜索框: shadcn/ui Input（搜索功能后续迭代，本阶段仅 UI）
- 连接状态指示灯 + 版本信息

**3. 响应式策略**
- ≥ 1024px (桌面): Sidebar 展开 240px
- 768px-1024px (平板): Sidebar 折叠 64px
- < 768px (手机): Sidebar 隐藏，Header 显示汉堡按钮，Sidebar 以 shadcn/ui Sheet 抽屉形式打开

**4. 根布局重写**（`app/layout.tsx`）
- 保持 Server Component（不使用 `"use client"`）
- Sidebar 作为 Client Component 嵌入
- Content 区域使用 `flex-1 ml-64` / `ml-16` / `ml-0` 响应式边距
- 保留品牌渐变和 EDITH Logo

## Acceptance Criteria (Gherkin)
### User Story
作为用户，我希望有一个清晰的全局导航，以便在 5 个页面间快速切换。

### Scenarios (Given/When/Then)

#### Scenario 1: Sidebar 折叠/展开
```gherkin
Given Sidebar 默认展开（240px）
When 用户点击折叠按钮
Then Sidebar 收起至 64px（仅图标）
And 内容区域自动扩展
```

#### Scenario 2: 响应式适配
```gherkin
Given 用户在平板设备上（768px-1024px）
When 页面加载
Then Sidebar 自动折叠为图标模式
And 内容区域自适应宽度
```

#### Scenario 3: 移动端导航
```gherkin
Given 用户在手机上（< 768px）
When 页面加载
Then Sidebar 隐藏，显示汉堡菜单按钮
When 用户点击汉堡菜单
Then Sidebar 以抽屉形式从左侧滑出
```

### General Checklist
- [ ] Sidebar 导航正确显示 5 个页面链接
- [ ] 折叠/展开动画流畅
- [ ] 响应式在桌面/平板/手机正常
- [ ] 当前页面高亮状态正确

## Merge Record

- **completed_at**: 2026-05-05T22:00:00+08:00
- **merged_branch**: feature/redesign-layout
- **merge_commit**: 15096eb3f94a2456c70b2fe424da23883caf1911
- **archive_tag**: feat-redesign-layout-20260505
- **conflicts**: none
- **verification_status**: passed
- **development_stats**:
  - started: 2026-05-05T21:50:00+08:00
  - duration: ~10min
  - commits: 1
  - files_changed: 17 (4 new, 6 modified, 7 doc/config)
