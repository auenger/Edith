# Feature: feat-board-redesign Board 前端全部页面重构

## Basic Information
- **ID**: feat-board-redesign
- **Name**: Board 前端全部页面重构（Bento Grid + shadcn/ui）
- **Priority**: 80
- **Size**: L
- **Dependencies**: []
- **Parent**: null
- **Children**: [feat-redesign-system, feat-redesign-layout, feat-redesign-dashboard, feat-redesign-explorer, feat-redesign-knowledge-map, feat-redesign-timeline]
- **Created**: 2026-05-05

## Description
使用 /ui-ux-pro-max 对 EDITH Board 全部前端页面进行完全重构。采用 Bento Grid 模块化布局设计风格，引入 shadcn/ui 组件库，建立统一设计系统，更换数据可视化方案（D3.js → 更现代方案），重新设计 5 个页面的展示方案和渲染方案。

### 设计决策
- **设计风格**: Bento Grid（模块化网格布局、卡片化设计、信息密度高）
- **组件库**: shadcn/ui（Radix UI + Tailwind CSS）
- **可视化方案**: 更换 D3.js，使用更现代的可视化库
- **重构范围**: 全部 5 个页面 + 设计系统 + 组件库，从头设计

## User Value Points
1. **统一设计语言** — 建立 Bento Grid 设计系统，所有页面视觉一致性
2. **现代化组件库** — shadcn/ui 带来更好的交互体验和无障碍支持
3. **信息密度提升** — Bento Grid 卡片化布局让数据展示更紧凑高效
4. **可视化升级** — 更现代的可视化方案提升交互性和视觉效果
5. **响应式体验** — 适配不同屏幕尺寸的完整响应式设计

## Sub-Features
### 1. feat-redesign-system (S) — Design System 基础
建立 Bento Grid 设计令牌、shadcn/ui 集成、配色/字体/间距系统。
- **Dependencies**: 无
- **Priority**: 90

### 2. feat-redesign-layout (S) — 全局布局 & 导航
新 Sidebar + Header + 响应式框架 + 页面过渡动画。
- **Dependencies**: feat-redesign-system
- **Priority**: 85

### 3. feat-redesign-dashboard (M) — Dashboard Bento Grid
模块化卡片仪表盘：Health / Coverage / Changes / Stats / Actions。
- **Dependencies**: feat-redesign-layout
- **Priority**: 80

### 4. feat-redesign-explorer (M) — Services + Artifacts 浏览器
浏览/搜索/筛选/预览重设计，统一交互模式。
- **Dependencies**: feat-redesign-layout
- **Priority**: 75

### 5. feat-redesign-knowledge-map (M) — Knowledge Map 可视化
更换 D3.js → react-flow / echarts 交互式知识图谱。
- **Dependencies**: feat-redesign-layout
- **Priority**: 70

### 6. feat-redesign-timeline (S) — Timeline 时间线
时间线页面 Bento Grid 重设计。
- **Dependencies**: feat-redesign-layout
- **Priority**: 65

## Context Analysis
### Reference Code
- `board/src/app/` — 5 个页面路由
- `board/src/components/` — 当前组件（dashboard / services / artifacts / knowledge-map / timeline）
- `board/src/app/globals.css` — 当前 CSS 变量和样式
- `board/src/app/layout.tsx` — 根布局
- `board/package.json` — 依赖管理

### Related Documents
- `EDITH-PRODUCT-DESIGN.md` — 产品设计（Agent / Board / Artifacts）
- 已完成的 P2 Board 子特性（scaffold / dashboard / explorer / knowledge-map / timeline）

### Related Features
- feat-p2-board-scaffold (已完成) — Board 项目脚手架
- feat-p2-board-dashboard (已完成) — Dashboard 总览仪表盘
- feat-p2-board-explorer (已完成) — Services + Artifacts 浏览器
- feat-p2-knowledge-map (已完成) — Knowledge Map 知识图谱可视化
- feat-p2-timeline (已完成) — Timeline 知识时间线

## Technical Solution
<!-- To be filled during implementation -->

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望看到一个现代化、统一设计的 Board 界面，以便高效浏览和管理知识基础设施。

### Scenarios (Given/When/Then)

#### Scenario 1: 设计系统一致性
```gherkin
Given 所有 5 个页面已完成重构
When 用户在页面间导航
Then 所有页面使用统一的 Bento Grid 设计语言
And 配色、字体、间距、组件风格一致
```

#### Scenario 2: shadcn/ui 组件集成
```gherkin
Given shadcn/ui 已安装和配置
When 用户与任何交互组件交互（按钮、下拉框、模态框）
Then 组件行为符合 shadcn/ui 规范
And 组件支持键盘导航和屏幕阅读器
```

#### Scenario 3: 可视化交互升级
```gherkin
Given Knowledge Map 和 Timeline 使用新的可视化方案
When 用户查看知识图谱或时间线
Then 图表支持缩放、拖拽、悬浮提示
And 交互响应流畅，无卡顿
```

#### Scenario 4: 响应式适配
```gherkin
Given Board 已完成全部重设计
When 用户在不同屏幕尺寸下访问（桌面 / 平板 / 手机）
Then 布局自动适配，内容可读可用
```

### UI/Interaction Checkpoints
- [ ] Bento Grid 卡片布局在 Dashboard 页面正确展示
- [ ] Sidebar 导航折叠/展开动画流畅
- [ ] 所有卡片支持 hover 效果和交互反馈
- [ ] 知识图谱节点点击 → 详情面板弹出
- [ ] 时间线时间轴交互（缩放、筛选）正常
- [ ] Services / Artifacts 搜索筛选实时响应

### General Checklist
- [ ] 所有页面视觉一致性
- [ ] 无障碍基本合规（ARIA、键盘导航）
- [ ] 页面加载性能不退化
- [ ] 现有 E2E 测试（Playwright）适配更新
