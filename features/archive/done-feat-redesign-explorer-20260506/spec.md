# Feature: feat-redesign-explorer Services + Artifacts 浏览器

## Basic Information
- **ID**: feat-redesign-explorer
- **Name**: Services + Artifacts 浏览器重设计
- **Priority**: 75
- **Size**: M
- **Dependencies**: [feat-redesign-layout]
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
重新设计 Services 和 Artifacts 两个浏览页面。采用 Bento Grid 卡片布局，统一的搜索/筛选/预览交互模式。

### 设计要点
- **Services**: 卡片网格展示服务，支持按分类/状态筛选，点击展开详情面板
- **Artifacts**: 文件树 + 预览双栏布局，Bento 风格文件卡片
- **统一交互**: 搜索框、筛选器、排序使用 shadcn/ui 组件

## User Value Points
1. **快速搜索** — 实时搜索和筛选快速定位服务/文档
2. **详情预览** — 不离开页面即可查看详情
3. **一致体验** — 两个浏览页面交互模式统一

## Context Analysis
### Reference Code
- `board/src/app/services/page.tsx` — 当前 Services 页面（需重写）
  - 当前模式: `"use client"` + 筛选状态 (search, techStack, status) + `useMemo` 过滤
  - 已知债务: `getStatus()` 函数在 page.tsx 和 `service-status.ts` 中各有一份副本
  - 数据获取: `api.services()` → `ServiceInfo[]`
  - WebSocket: `getBoardWebSocket().connect()` → `"change"` 事件 → 重新 fetch
- `board/src/app/artifacts/page.tsx` — 当前 Artifacts 页面（需重写）
  - 当前布局: 左侧边栏 w-72 (文件树) + 右侧 flex-1 (预览)
  - 数据获取: `api.artifactsTree()` → `FileTreeNode[]`, `api.artifactContent(path)` → 内容
  - 预览模式: Markdown / Raw / Tokens 三种视图切换
- `board/src/components/services/ServiceCard.tsx` — 服务卡片（→ 重写为 Bento Card）
- `board/src/components/services/ServiceDetailModal.tsx` — 详情模态框（→ shadcn/ui Sheet）
- `board/src/components/services/ServiceFilters.tsx` — 筛选控件（→ shadcn/ui Select + Badge）
- `board/src/components/artifacts/FileTree.tsx` — 递归文件树（→ shadcn/ui 风格树组件）
- `board/src/components/artifacts/ArtifactPreview.tsx` — 预览面板（→ Markdown 渲染 + 代码高亮）
- `board/src/lib/service-status.ts` — 共享 `getServiceStatus()` 工具函数
- `board/src/lib/api.ts` — API 客户端（ServiceInfo, ServiceDetail, FileTreeNode, ArtifactContent 类型）

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — Explorer 重设计要点
- 兄弟 spec: `features/pending-feat-redesign-system/spec.md` — Bento Card 令牌

### Related Features
- feat-redesign-system (前置) — 提供 Bento Grid 令牌和 shadcn/ui 组件
- feat-redesign-layout (前置) — 提供新布局框架
- feat-p2-board-explorer (已完成) — 建立了 Services + Artifacts 页面和组件（将完全重写）
- feat-p2-e2e-playwright (已完成) — Services 和 Artifacts 页面各有 E2E 测试，需适配新选择器

### Archive Implementation Patterns
- **Services 筛选模式** (来自 feat-p2-board-explorer): `useMemo` 依次应用 search → techStack → status 过滤
  - `availableStacks` 从 services 数据中动态计算，此模式应保留
- **Artifacts 分屏布局**: 左侧 w-72 文件树 + 右侧 flex-1 预览，此布局结构良好应保留
- **已知债务**: `getServiceStatus()` 有 2 个副本（service-status.ts 和 services/page.tsx），重设计时应统一
- **服务详情模态框**: 当前使用自定义模态框，重设计使用 shadcn/ui Sheet (侧边滑出面板，更符合 Bento 风格)

## Technical Solution
### 方案: Bento Card 网格 + shadcn/ui Sheet + 双栏保留

**1. Services 页面**
- 页面顶部: 搜索框 (shadcn/ui Input) + 筛选器 (shadcn/ui Select + Badge)
- 内容区: Bento Grid 卡片网格（`.bento-grid` + `.bento-card`）
- 每张卡片: 服务名 + 技术栈 Badge + 状态指示灯 + 文档数量
- 点击卡片: shadcn/ui Sheet 侧边滑出详情面板（替代当前模态框）
- 保留现有 `useMemo` 筛选逻辑

**2. Artifacts 页面**
- 保留双栏布局（文件树 + 预览），使用 Bento 风格重新设计
- 文件树: 左侧面板使用 shadcn/ui Collapsible + Lucide 图标（Folder/File）
- 预览面板: 右侧使用 shadcn/ui Tabs 切换 Markdown / Raw / Tokens 视图
- 保留现有数据获取逻辑

**3. 共享组件**
- 搜索框组件: shadcn/ui Input + Lucide Search 图标 + 实时过滤
- 空状态: shadcn/ui Card + 友好提示
- 加载状态: shadcn/ui Skeleton

## Acceptance Criteria (Gherkin)
### User Story
作为用户，我希望高效浏览和搜索所有服务和知识产物。

### Scenarios (Given/When/Then)

#### Scenario 1: Services 卡片网格
```gherkin
Given 用户访问 /services 页面
When 页面加载完成
Then 服务以 Bento 卡片网格展示
And 每张卡片显示服务名、状态指示、文档数
```

#### Scenario 2: 搜索筛选
```gherkin
Given Services 页面已加载
When 用户在搜索框输入关键词
Then 卡片列表实时过滤匹配结果
And 搜索结果为空时显示友好提示
```

#### Scenario 3: Artifacts 文件树 + 预览
```gherkin
Given 用户访问 /artifacts 页面
When 用户点击文件树中的文件
Then 右侧预览面板显示文件内容
And 预览面板支持 Markdown 渲染
```

### General Checklist
- [ ] Services 页面 Bento Grid 卡片布局
- [ ] Artifacts 页面双栏布局（文件树 + 预览）
- [ ] 搜索筛选功能正常
- [ ] 详情面板/模态框正常
- [ ] 加载和空状态处理

## Merge Record
- **Completed**: 2026-05-06T23:45:00+08:00
- **Branch**: feature/redesign-explorer
- **Merge Commit**: 5bfe4fe
- **Archive Tag**: feat-redesign-explorer-20260506
- **Conflicts**: checklist.md, task.md (resolved: kept feature branch versions with completed status)
- **Verification**: PASS (13/13 tasks, build passes, 3/3 Gherkin scenarios verified)
- **Stats**: 14 files changed, 881 insertions, 733 deletions, 4 new files
