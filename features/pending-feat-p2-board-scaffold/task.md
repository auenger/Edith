# Tasks: feat-p2-board-scaffold

## Task Breakdown

### 1. 前端脚手架
- [ ] 初始化 Next.js + React 项目（App Router）
- [ ] 配置 TypeScript + ESLint + Prettier
- [ ] 安装 UI 依赖（Tailwind CSS / shadcn/ui）
- [ ] 建立项目目录结构（app / components / lib / styles）
- [ ] 配置布局骨架（Sidebar + Content + Footer）

### 2. 后端 API Server
- [ ] 初始化 Fastify 项目
- [ ] 配置 TypeScript + 路由注册
- [ ] 实现 CORS 和 WebSocket 支持
- [ ] 建立 server 目录结构（routes / services / types）

### 3. 数据读取层（多源）
- [ ] 实现 data-reader.ts — 统一数据读取入口
- [ ] 核心层：读取 routing-table.md / quick-ref.md / distillates/（知识仓库）
- [ ] 索引层：读取 `.edith/graphify-cache/graph.json`（Graphify 缓存）
- [ ] 历史层：读取 Git commit history（变更时间线数据源）

### 4. 文件变更监听
- [ ] 实现 file-watcher.ts（chokidar 监听文件变更）
- [ ] 监听范围覆盖知识仓库 + `.edith/` 缓存目录
- [ ] 变更事件通过 WebSocket 推送到前端
- [ ] 增量更新缓存（不每次全量重读）

### 5. 产物解析器
- [ ] 实现 artifact-parser.ts
- [ ] routing-table 解析器（提取服务列表、依赖关系）
- [ ] quick-ref 解析器（提取结构化数据）
- [ ] distillates 解析器（片段列表、Token 计数）
- [ ] graph.json 解析器（节点、边、置信度）

### 6. API 路由实现
- [ ] GET /api/health — 知识库健康度
- [ ] GET /api/services — 服务列表
- [ ] GET /api/services/:name — 服务详情
- [ ] GET /api/services/:name/layers — 三层产物状态
- [ ] GET /api/artifacts/tree — 文件树
- [ ] GET /api/artifacts/:path — 产出物内容
- [ ] GET /api/graph — graph.json 数据
- [ ] GET /api/timeline — 变更时间线
- [ ] WS /ws/changes — 实时变更推送

### 7. 部署配置
- [ ] Dockerfile（前端 + 后端）
- [ ] docker-compose.yml
- [ ] 环境变量配置模板

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
| 2026-05-05 | Spec review fix | 数据源分层：核心层/索引层/历史层/运行时 |
| 2026-05-05 | Spec enriched | Reference Code: 6 files, Related Features: 6 (4 下游 + 2 已完成归档) |
