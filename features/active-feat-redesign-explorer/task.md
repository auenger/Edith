# Tasks: feat-redesign-explorer

## Task Breakdown

### 1. Services Page Redesign (`board/src/app/services/page.tsx`)
- [x] Preserve data fetching: `api.services()` + WebSocket `"change"` subscription
- [x] Preserve `useMemo` filter logic (search -> techStack -> status), remove `getStatus()` duplicate in page.tsx (use `service-status.ts` only)
- [x] Rewrite JSX rendering: Bento Grid card grid (`.bento-grid` + `.bento-card`)
- [x] Rewrite `components/services/ServiceCard.tsx` -> Bento Card (status dot + tech stack Badge + doc count + `.bento-card-hover`)
- [x] Rewrite `components/services/ServiceFilters.tsx` -> shadcn/ui Select (tech stack/status) + shadcn/ui Badge
- [x] Rewrite `components/services/ServiceDetailModal.tsx` -> shadcn/ui Sheet (side sliding panel, Bento Card style)

### 2. Artifacts Page Redesign (`board/src/app/artifacts/page.tsx`)
- [x] Preserve data fetching: `api.artifactsTree()` + `api.artifactContent(path)`
- [x] Preserve dual-pane layout structure (left file tree + right preview)
- [x] Rewrite `components/artifacts/FileTree.tsx` -> shadcn/ui style tree component (Lucide FolderOpen/File icons)
- [x] Rewrite `components/artifacts/ArtifactPreview.tsx` -> Markdown rendering + code highlighting + shadcn/ui Tabs (Markdown/Raw/Tokens switch)

### 3. Shared Interaction Components
- [x] Search bar component: shadcn/ui Input + Lucide Search icon + real-time filtering
- [x] Empty state component: shadcn/ui Card + friendly prompt
- [x] Loading skeleton screen: shadcn/ui Skeleton

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Services + Artifacts browser |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 13, Archive refs: feat-p2-board-explorer, feat-p2-e2e-playwright |
| 2026-05-06 | Implementation complete | All 13 tasks done. Services: Bento Grid + shadcn/ui Sheet + Select. Artifacts: Lucide FileTree + Tabs preview. Shared: SearchBar, EmptyState, CardGridSkeleton, Tabs UI component. Build passes. |
