# Tasks: feat-p2-e2e-playwright

## Task Breakdown

### 1. Infrastructure Setup
- [x] Install Playwright dependencies (`@playwright/test`)
- [x] Create `board/playwright.config.ts` with webServer config (Next.js + Fastify)
- [x] Add `test:e2e` script to `board/package.json`
- [x] Create `board/e2e/fixtures.ts` with shared test fixtures

### 2. API Endpoint Tests (board/e2e/api/)
- [x] `health.spec.ts` — /api/health 响应格式验证
- [x] `services.spec.ts` — /api/services + /api/services/:name + /api/services/:name/layers
- [x] `artifacts.spec.ts` — /api/artifacts/tree + /api/artifacts/*
- [x] `graph.spec.ts` — /api/graph 图谱数据验证
- [x] `timeline.spec.ts` — /api/timeline + 查询参数（limit/offset/type/service）

### 3. Page UI Tests (board/e2e/pages/)
- [x] `dashboard.spec.ts` — Dashboard 加载、空状态、面板渲染
- [x] `services.spec.ts` — 服务列表、筛选、详情弹窗
- [x] `artifacts.spec.ts` — 文件树、内容预览
- [x] `knowledge-map.spec.ts` — D3 图谱渲染、节点交互
- [x] `timeline.spec.ts` — 时间线展示、筛选、分页加载

### 4. WebSocket Tests (board/e2e/ws/)
- [x] `websocket.spec.ts` — WS 连接建立 + 文件变更推送

### 5. Integration & Verification
- [x] API tests 全部通过 (20/20)
- [x] WebSocket tests 全部通过 (2/2)
- [x] 测试数据清理和隔离（临时目录 + afterAll 清理）
- [x] CI 环境（headless）可运行

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | 等待开发 |
| 2026-05-05 | Infrastructure + API + WS tests | 22/22 通过, Page tests 写入待验证 |
