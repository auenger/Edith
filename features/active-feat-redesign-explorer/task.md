# Tasks: feat-redesign-explorer

## Task Breakdown

### 1. Services 页面重构（`board/src/app/services/page.tsx`）
- [ ] 保留现有数据获取: `api.services()` → `ServiceInfo[]` + WebSocket `"change"` 订阅
- [ ] 保留 `useMemo` 筛选逻辑（search → techStack → status），消除 page.tsx 中的 `getStatus()` 副本（统一使用 `service-status.ts`）
- [ ] 重写 JSX 渲染: Bento Grid 卡片网格（`.bento-grid` + `.bento-card`）
- [ ] 重写 `components/services/ServiceCard.tsx` → Bento Card（状态指示灯 + 技术栈 Badge + 文档数 + `.bento-card-hover`）
- [ ] 重写 `components/services/ServiceFilters.tsx` → shadcn/ui Select（技术栈/状态）+ shadcn/ui Badge
- [ ] 重写 `components/services/ServiceDetailModal.tsx` → shadcn/ui Sheet（侧边滑出面板，Bento Card 风格）

### 2. Artifacts 页面重构（`board/src/app/artifacts/page.tsx`）
- [ ] 保留现有数据获取: `api.artifactsTree()` → `FileTreeNode[]`, `api.artifactContent(path)` → 内容
- [ ] 保留双栏布局结构（左侧文件树 + 右侧预览）
- [ ] 重写 `components/artifacts/FileTree.tsx` → shadcn/ui 风格树组件（Collapsible + Lucide FolderOpen/File 图标）
- [ ] 重写 `components/artifacts/ArtifactPreview.tsx` → Markdown 渲染 + 代码高亮 + shadcn/ui Tabs（Markdown/Raw/Tokens 切换）

### 3. 共享交互组件
- [ ] 搜索框组件: shadcn/ui Input + Lucide Search 图标 + 实时过滤
- [ ] 空状态组件: shadcn/ui Card + 友好提示
- [ ] 加载骨架屏: shadcn/ui Skeleton

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Services + Artifacts 浏览器 |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 13, Archive refs: feat-p2-board-explorer, feat-p2-e2e-playwright |
