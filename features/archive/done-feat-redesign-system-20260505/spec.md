# Feature: feat-redesign-system Design System 基础

## Basic Information
- **ID**: feat-redesign-system
- **Name**: Design System 基础（Bento Grid + shadcn/ui + 配色/字体/间距）
- **Priority**: 90
- **Size**: S
- **Dependencies**: []
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
建立 EDITH Board 统一设计系统基础。包括：Bento Grid 设计令牌定义、shadcn/ui 安装配置、配色系统、字体系统、间距系统、CSS 变量体系。

### 设计决策
- **设计风格**: Bento Grid — 模块化网格布局、卡片化设计、信息密度高
- **组件库**: shadcn/ui（Radix UI + Tailwind CSS v4）
- **配色**: 基于 EDITH 品牌色（蓝紫渐变）+ 语义色（成功/警告/错误/信息）
- **字体**: 系统字体栈或 Google Fonts（待确认）
- **间距**: 4px 基础单位，8/12/16/24/32/48 间距阶梯

## User Value Points
1. **统一视觉语言** — 所有页面共享一致的设计令牌
2. **高效开发** — shadcn/ui 组件开箱即用，减少重复劳动
3. **可维护性** — 设计变更只需修改令牌，全局生效

## Context Analysis
### Reference Code
- `board/package.json` — 当前依赖（Next.js 15, React 19, Tailwind CSS v4, Lucide, D3.js v7.9.0）
  - 注意: shadcn/ui 已在 dependencies 中列出但实际未使用，需确认版本兼容性
- `board/src/app/globals.css` — 当前 CSS 变量体系（需重写）
  - 已有: `--color-primary`, `--sidebar-bg` 等
  - 已有工具类: `.card-hover`, `.status-dot-live`, 自定义滚动条
- `board/src/app/layout.tsx` — 根布局（Sidebar w-60 + Header h-14 + Content + Footer h-8）
  - 品牌渐变: `#1e40af → #7c3aed`（需在设计令牌中保留）
  - Sidebar 背景: `#0f172a`
- `board/postcss.config.mjs` — PostCSS 配置
- `board/src/lib/api.ts` — API 客户端 + 类型定义（了解现有类型命名风格）

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — 重构总体设计决策
- `EDITH-PRODUCT-DESIGN.md` — 产品设计文档（Agent / Board / Artifacts 三件套）

### Related Features
- feat-p2-board-scaffold (已完成 2026-05-05) — Board 项目脚手架，建立了当前 CSS 变量体系和布局基础
  - 当前 `globals.css` 的变量命名风格和 Tailwind v4 `@import` 方式需保持
  - 当前 layout.tsx 的 Sidebar 尺寸 (w-60) 将在 feat-redesign-layout 中重设计
- feat-p2-board-dashboard (已完成) — Dashboard 5 个面板使用了 `.card-hover` 工具类，需确保 Bento Card 令牌兼容
- feat-p2-e2e-playwright (已完成) — 22 个 E2E 测试，设计令牌变更不应破坏现有测试选择器

### Archive Implementation Patterns
- **CSS 变量命名**: 当前使用 `--color-primary`, `--sidebar-bg` 等扁平命名，Bento Grid 需扩展为语义化体系
- **Tailwind v4**: 使用 `@import "tailwindcss"` 而非 v3 的 `@tailwind` 指令，shadcn/ui init 需兼容 v4
- **已知债务**: shadcn/ui 在 package.json 中列出但从未使用；`formatTimeAgo()` 在 3 处重复；`getServiceStatus()` 有 2 个副本

## Technical Solution
### 方案: CSS 变量 + Tailwind v4 自定义主题 + shadcn/ui

**1. shadcn/ui 集成策略**
- 执行 `npx shadcn@latest init` 配置 Tailwind v4 兼容模式
- `components.json` 配置: 样式 "new-york", 基础色 "slate", CSS 变量模式
- 安装核心组件: Button, Card, Badge, Input, Separator, Skeleton, Tooltip, Sheet, Dialog, Select

**2. Bento Grid 设计令牌体系**
- 在 `globals.css` 中定义 CSS 自定义属性，覆盖: 配色/字体/间距/圆角/阴影/动画
- 通过 Tailwind v4 `@theme` 扩展注册令牌为 Tailwind 工具类
- 保留现有品牌色（`#1e40af → #7c3aed` 渐变）和 Sidebar 深色主题（`#0f172a`）

**3. Bento Grid 布局工具类**
- `.bento-grid` — CSS Grid 容器（`grid-template-columns: repeat(auto-fill, minmax(var(--bento-min-width), 1fr))`）
- `.bento-card` — 卡片基础（圆角 + 微阴影 + 内边距 + 过渡动画）
- `.bento-span-{n}` — 跨列辅助（`grid-column: span n`）
- 替代现有 `.card-hover` 为统一的 Bento Card hover 效果

**4. 不变更项**
- `board/server/` 后端代码不受影响
- `board/src/lib/api.ts` 数据层不受影响
- 现有 E2E 测试选择器不受影响（仅 CSS 变量和工具类变更）

## Acceptance Criteria (Gherkin)
### User Story
作为开发者，我需要一个统一的设计系统基础，以便高效开发一致的 UI 组件。

### Scenarios (Given/When/Then)

#### Scenario 1: shadcn/ui 安装成功
```gherkin
Given board/ 项目使用 Next.js 15 + Tailwind CSS v4
When 执行 shadcn/ui init 命令
Then shadcn/ui 正确安装并配置
And components.json 配置文件存在
And 至少一个 shadcn/ui 组件（如 Button）可正常导入使用
```

#### Scenario 2: Bento Grid 设计令牌
```gherkin
Given 设计系统已建立
When 开发者查看 globals.css 或 tailwind 配置
Then Bento Grid 相关令牌已定义（grid-template, gap, card-radius, card-shadow）
And 配色令牌覆盖 brand / success / warning / danger / neutral
And 字体令牌覆盖 heading / body / mono
And 间距令牌使用 4px 基础单位
```

#### Scenario 3: 设计令牌全局生效
```gherkin
Given 所有设计令牌已定义
When 在任意页面组件中使用 Tailwind 类名引用令牌
Then 视觉效果与设计规范一致
```

### General Checklist
- [x] shadcn/ui 安装并配置完成
- [x] CSS 变量 / Tailwind 令牌体系建立
- [x] Bento Grid 核心布局工具类可用
- [x] 基础 shadcn/ui 组件导入测试通过

## Merge Record
- **completed_at**: 2026-05-05T21:45:00+08:00
- **merged_branch**: feature/feat-redesign-system
- **merge_commit**: 5e6b539
- **archive_tag**: feat-redesign-system-20260505
- **conflicts**: none
- **verification**: passed (3/3 Gherkin scenarios, 20/20 tasks, build succeeds)
- **duration**: ~15min
- **commits**: 2
- **files_changed**: 18
