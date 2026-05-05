# Feature: feat-p2-e2e-playwright Playwright E2E 测试

## Basic Information
- **ID**: feat-p2-e2e-playwright
- **Name**: Playwright E2E Browser Testing
- **Priority**: 75
- **Size**: M
- **Dependencies**: [feat-p2-timeline, feat-p2-knowledge-map, feat-p2-board-explorer, feat-p2-board-dashboard]
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-05-05

## Description
Phase 2 全部 7 个 feature 开发完成，需要用 Playwright 对 EDITH Board 进行端到端浏览器测试。覆盖 5 个页面 UI 交互、8 个 API 端点响应、WebSocket 实时推送。

## User Value Points

### VP1: 全页面 UI 冒烟 + 交互测试
- 验证 Dashboard / Services / Artifacts / Knowledge Map / Timeline 五个页面正常渲染
- 验证页面间导航、筛选、弹窗、分页等交互功能
- 验证 Loading / Empty / Error 状态展示

### VP2: API 端点完整性测试
- 验证 8 个 REST API 端点返回正确格式和数据
- 验证错误场景（服务不存在、仓库不存在等）
- 验证查询参数（Timeline 的 limit/offset/type/service）

### VP3: WebSocket 实时推送测试
- 验证 WebSocket 连接建立和状态切换
- 验证文件变更事件推送触发数据刷新

## Context Analysis

### Reference Code
- `board/src/app/page.tsx` — Dashboard 页面
- `board/src/app/services/page.tsx` — Services 页面
- `board/src/app/artifacts/page.tsx` — Artifacts 页面
- `board/src/app/knowledge-map/page.tsx` — Knowledge Map 页面
- `board/src/app/timeline/page.tsx` — Timeline 页面
- `board/src/lib/api.ts` — API 客户端（8 个端点 + WebSocket）
- `board/server/routes/index.ts` — 服务端路由（8 个端点）
- `board/server/index.ts` — Fastify 服务器入口

### Related Documents
- Phase 2 completed features spec（archive 中）

### Related Features
- feat-p2-board-scaffold（Board 脚手架）
- feat-p2-board-dashboard（Dashboard 页面）
- feat-p2-board-explorer（Services + Artifacts 浏览器）
- feat-p2-knowledge-map（Knowledge Map 图谱）
- feat-p2-timeline（Timeline 时间线）

## Technical Solution

### 测试基础设施
- **目录**: `board/e2e/`
- **框架**: Playwright + TypeScript
- **配置**: `board/playwright.config.ts`
- **脚本**: `board/package.json` 添加 `test:e2e` 命令

### 测试架构
```
board/e2e/
  fixtures.ts          — 共享 fixtures（启动 dev server、API mock / 真实 server）
  pages/
    dashboard.spec.ts   — Dashboard 页面测试
    services.spec.ts    — Services 页面测试
    artifacts.spec.ts   — Artifacts 页面测试
    knowledge-map.spec.ts — Knowledge Map 页面测试
    timeline.spec.ts    — Timeline 页面测试
  api/
    health.spec.ts      — /api/health
    services.spec.ts    — /api/services, /api/services/:name, /api/services/:name/layers
    artifacts.spec.ts   — /api/artifacts/tree, /api/artifacts/*
    graph.spec.ts       — /api/graph
    timeline.spec.ts    — /api/timeline（含查询参数）
  ws/
    websocket.spec.ts   — WebSocket 连接与事件推送
```

### 测试策略
- **API 测试**: 直接请求 Fastify server（端口 3001），验证响应格式和数据
- **UI 测试**: 启动 Next.js dev server + Fastify server，用浏览器访问页面
- **WebSocket 测试**: 建立 WS 连接，触发文件变更，验证推送
- **Mock 策略**: 准备最小测试数据集（company-edith 样例），不依赖真实大规模仓库

### 依赖安装
```
npm install -D @playwright/test
npx playwright install
```

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 开发者，我需要 Playwright E2E 测试来自动验证 Board 的所有页面、API 和 WebSocket 功能，以便在后续迭代中快速发现回归问题。

### Scenarios (Given/When/Then)

#### VP1: 页面 UI 测试

**Scenario: Dashboard 页面正常加载**
```gherkin
Given Board 服务器正在运行
And 知识仓库存在且包含至少 1 个服务
When 用户访问 "/"
Then 页面标题显示 "Dashboard"
And Health Panel 显示健康状态
And Service Coverage Panel 显示服务列表
And Recent Changes Panel 显示最近变更
And Artifact Stats Panel 显示统计信息
```

**Scenario: Dashboard 空状态展示**
```gherkin
Given Board 服务器正在运行
And 知识仓库存在但不包含任何服务
When 用户访问 "/"
Then 显示空状态提示 "No knowledge base found"
And 显示 "Scan New Service" 按钮
```

**Scenario: Services 页面列表和筛选**
```gherkin
Given Board 服务器正在运行
And 知识仓库包含多个服务
When 用户访问 "/services"
Then 显示服务卡片列表
When 用户输入筛选关键词
Then 服务列表根据关键词过滤
When 用户点击某个服务卡片
Then 弹出服务详情 Modal
```

**Scenario: Artifacts 页面文件树和预览**
```gherkin
Given Board 服务器正在运行
And 知识仓库包含 distillate 文件
When 用户访问 "/artifacts"
Then 显示文件树结构
When 用户点击一个文件
Then 右侧显示文件内容预览
```

**Scenario: Knowledge Map 页面图谱渲染**
```gherkin
Given Board 服务器正在运行
And graph.json 存在
When 用户访问 "/knowledge-map"
Then D3 力导向图渲染完成
And 显示节点和边
And 显示图例和控制面板
When 用户点击一个节点
Then 显示节点详情面板
```

**Scenario: Timeline 页面时间线展示**
```gherkin
Given Board 服务器正在运行
And 知识仓库有 Git 历史
When 用户访问 "/timeline"
Then 显示按月分组的时间线事件
When 用户选择类型筛选
Then 事件列表根据类型过滤
When 用户滚动到底部
Then 加载更多事件（分页）
```

#### VP2: API 端点测试

**Scenario: Health API 返回正确格式**
```gherkin
Given Fastify 服务器运行在端口 3001
When 发送 GET /api/health
Then 响应状态码为 200
And 响应体包含 { ok: true, data: { status, repoPath, servicesCount, ... } }
```

**Scenario: Services API 返回服务列表**
```gherkin
Given 知识仓库存在
When 发送 GET /api/services
Then 响应包含服务列表
And 每个服务包含 name, role, stack, layers
```

**Scenario: Service Detail API**
```gherkin
Given 服务 "example-service" 存在
When 发送 GET /api/services/example-service
Then 响应包含服务详情（quickRef + distillates）
```

**Scenario: Service Not Found**
```gherkin
Given 服务 "nonexistent" 不存在
When 发送 GET /api/services/nonexistent
Then 响应包含 { ok: false, error: { code: "FILE_NOT_FOUND", ... } }
```

**Scenario: Artifacts Tree API**
```gherkin
Given 知识仓库存在
When 发送 GET /api/artifacts/tree
Then 响应包含文件树结构
```

**Scenario: Graph API**
```gherkin
Given graph.json 存在
When 发送 GET /api/graph
Then 响应包含 nodes 和 edges 数组
```

**Scenario: Timeline API with query params**
```gherkin
Given 知识仓库有 Git 历史
When 发送 GET /api/timeline?limit=10&offset=0&type=scan
Then 响应包含 { events, total, offset, limit }
And events 仅包含 type="scan" 的事件
```

**Scenario: Repo Not Found 错误**
```gherkin
Given 知识仓库路径不存在
When 发送 GET /api/services
Then 响应包含 { ok: false, error: { code: "REPO_NOT_FOUND", ... } }
```

#### VP3: WebSocket 测试

**Scenario: WebSocket 连接建立**
```gherkin
Given Fastify 服务器运行
When 建立 WebSocket 连接到 /ws/changes
Then 连接状态变为 "connected"
```

**Scenario: 文件变更推送**
```gherkin
Given WebSocket 连接已建立
When 知识仓库中文件发生变更
Then WebSocket 收到 { type: "change", data: [...] } 消息
```

### General Checklist
- [ ] 所有测试可通过 `npm run test:e2e` 执行
- [ ] CI 可运行（无 headed 模式依赖）
- [ ] 测试数据隔离，不依赖特定环境
- [ ] 测试运行时间 < 60s
