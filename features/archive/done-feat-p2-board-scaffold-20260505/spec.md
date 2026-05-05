# Feature: feat-p2-board-scaffold Board 项目脚手架 + Git 数据层

## Basic Information
- **ID**: feat-p2-board-scaffold
- **Name**: Board 项目脚手架 + Git 数据层
- **Priority**: 75
- **Size**: M
- **Dependencies**: []
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
初始化 EDITH Board 前端项目（Next.js + React）和后端 API Server（Node.js + Fastify），实现 Git 知识仓库的只读读取层。这是所有 Board 页面的基础。

### 来源
- EDITH-PRODUCT-DESIGN.md §3.4 Board 技术架构
- EDITH-INTEGRATION-DESIGN.md §五 Board 承接关系

## User Value Points
1. **项目基础设施** — 建立可运行的 Board 开发环境
2. **Git 只读数据层** — API Server 能读取知识仓库的三层产物和 graph.json
3. **文件变更监听** — 实时感知知识仓库的更新

## Context Analysis
### Reference Code
- `agent/src/config.ts` (1088 行) — `EdithConfig` 接口定义，Board 配置模型（端口、知识仓库路径、WebSocket 等）应遵循相同的嵌套接口 + `validateConfig()` + `applyDefaults()` 模式
- `agent/src/query.ts` (1052 行) — 三层渐进加载逻辑（routing-table → quick-ref → distillates），Board API Server 的 data-reader.ts 应复用相同的解析和分层加载逻辑
- `agent/src/tools/index.ts` (667 行) — `ServiceInfo` / `CrossServiceRelation` / `QuickRefInfo` / `DistillateInfo` 类型定义，Board API 响应格式应直接复用这些类型
- `agent/src/tools/scan.ts` (2690 行) — scan 产出物结构（workspace/{service}/docs/、quick-ref.md、distillates/），Board 数据读取层需理解此目录结构
- `agent/src/tools/distill.ts` (1365 行) — 蒸馏产物元数据（片段名、Token 计数、时间戳），Board artifact-parser.ts 需解析这些字段
- `agent/edith.yaml` — Agent 配置文件，Board 需知道 workspace.root 和 repos 配置以定位知识仓库

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.4 Board 技术架构
- EDITH-INTEGRATION-DESIGN.md §五 Board 承接关系

### Related Features
- feat-p2-board-dashboard (下游) — 消费 Board API 的 /api/health、/api/services、/api/timeline 端点
- feat-p2-board-explorer (下游) — 消费 /api/services、/api/artifacts/tree、/api/artifacts/:path 端点
- feat-p2-knowledge-map (下游) — 消费 /api/graph 端点
- feat-p2-timeline (下游) — 消费 /api/timeline 端点
- feat-unlimited-storage (已完成 2026-04-28) — 知识产物存储与消费分离架构，Board 是纯消费端，不修改任何产出物
- feat-agent-scaffold (已完成 2026-04-27) — Agent 项目骨架模式参考（TypeScript + npm 项目结构、构建配置）

## Technical Solution

### 技术栈
| 组件 | 技术 | 说明 |
|---|---|---|
| 前端 | React + Next.js | SSR + 静态生成 |
| 后端 | Node.js + Fastify | REST API + WebSocket |
| 数据源 | Git 知识仓库 | 只读，监听变更 |
| 部署 | Docker / Vercel | 按需选择 |

### 项目结构
```
board/
├── package.json
├── next.config.js
├── src/
│   ├── app/              ← Next.js App Router 页面
│   ├── components/       ← 共享组件
│   ├── lib/              ← 工具函数
│   └── styles/           ← 全局样式
├── server/
│   ├── index.ts          ← Fastify 入口
│   ├── routes/           ← API 路由
│   ├── services/         ← 业务逻辑
│   │   ├── data-reader.ts ← 统一数据读取（知识仓库 + graph.json + Git history）
│   │   ├── file-watcher.ts ← 文件变更监听（知识仓库 + .edith/ 缓存）
│   │   └── artifact-parser.ts ← 产物解析（三层 + graph.json）
│   └── types/            ← 类型定义
└── docker-compose.yml
```

### API 设计
```
GET  /api/health                    — 知识库健康度
GET  /api/services                  — 服务列表
GET  /api/services/:name            — 服务详情
GET  /api/services/:name/layers     — 服务三层产物状态
GET  /api/artifacts/tree            — 产出物文件树
GET  /api/artifacts/:path           — 产出物内容（Markdown）
GET  /api/graph                     — graph.json 数据
GET  /api/timeline                  — 变更时间线
WS   /ws/changes                    — 实时变更推送
```

### 关键原则
- Board **只读**，不修改任何数据
- 知识生产唯一入口是 Agent

### 数据源分层
| 层级 | 数据源 | 路径/来源 | 写入者 |
|------|--------|----------|--------|
| 核心层 | 三层知识产物 | 知识仓库（routing-table / quick-ref / distillates） | Agent (edith_distill) |
| 索引层 | graph.json | `.edith/graphify-cache/graph.json` | Graphify |
| 历史层 | 变更时间线 | Git commit history | Git |
| 运行时 | Agent 执行日志 | Agent 运行时输出（未来扩展） | Agent |

### Scope
**IN**: Next.js 前端脚手架 + Fastify API Server + Git 只读数据层 + 文件变更监听 + WebSocket 推送 + Docker 部署
**OUT**: 用户认证/权限系统、Agent 写入操作、Board → Agent 反向控制、知识产出物的编辑/删除

### API 响应格式
```typescript
// 统一响应格式
interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error?: { code: string; message: string };
}

// 错误码
const ErrorCodes = {
  REPO_NOT_FOUND: "知识仓库路径不存在或不可读",
  REPO_EMPTY:     "知识仓库中没有知识产物",
  PARSE_FAILED:   "产出物解析失败",
  FILE_NOT_FOUND: "请求的文件不存在",
  INTERNAL:       "服务内部错误",
};
```

### graph.json 核心结构（消费约定）
```typescript
interface GraphData {
  nodes: Array<{
    id: string;           // 服务/实体名
    type: "service" | "concept";
    knowledgeCompleteness: number;  // 0-1
    endpoints?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;        // 调用描述
    confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
    weight: number;       // 调用频率
  }>;
  metadata: {
    generatedAt: string;
    languages: string[];
    nodeCount: number;
    edgeCount: number;
  };
}
```

## Acceptance Criteria (Gherkin)
### User Story
作为开发者，我需要 Board 项目脚手架和 API Server，以便后续开发 Board 页面。

### Scenarios
```gherkin
Scenario: 项目初始化
  Given 开发环境已准备（Node.js 18+）
  When 运行 npm install && npm run dev
  Then Next.js 前端在 localhost:3000 启动
  And Fastify API Server 在 localhost:3001 启动
  And 前端能成功调用 /api/health

Scenario: Git 知识仓库读取
  Given 知识仓库 company-edith 存在且包含三层产物
  And Board 配置指向该仓库路径
  When 调用 GET /api/services
  Then 返回 routing-table.md 中注册的所有服务
  And 每个服务包含其三层产物的完整状态

Scenario: 文件变更监听
  Given Board 正在运行
  And 文件变更监听已启动
  When 知识仓库中的文件发生变更
  Then WebSocket 推送变更事件到前端
  And 前端收到事件后刷新对应数据

Scenario: 知识仓库路径不存在
  Given Board 配置中的知识仓库路径不存在
  When 调用 GET /api/health
  Then 返回 { ok: false, error: { code: "REPO_NOT_FOUND" } }
  And 前端显示配置错误提示，引导用户检查仓库路径

Scenario: 空知识仓库
  Given 知识仓库存在但没有任何知识产物
  When 调用 GET /api/services
  Then 返回 { ok: true, data: [] }
  And 前端各面板显示空状态引导（"运行 edith_scan 开始构建知识库"）

Scenario: WebSocket 断连重连
  Given Board 前端已连接 WebSocket
  When 网络中断导致 WebSocket 断开
  Then 前端显示"连接中断"状态指示
  When 网络恢复
  Then 前端自动重连 WebSocket 并刷新数据
```

### General Checklist
- [x] Next.js + React 项目脚手架
- [x] Fastify API Server 骨架
- [x] Git 知识仓库只读读取层
- [x] 文件变更监听 + WebSocket 推送
- [x] 产出物解析器（routing-table / quick-ref / distillates / graph.json）
- [x] API 路由骨架（8 个端点）
- [x] Docker Compose 配置
- [x] TypeScript 全栈类型安全

## Merge Record
- **Completed:** 2026-05-05
- **Branch:** feature/p2-board-scaffold
- **Merge Commit:** 4fff9cf
- **Archive Tag:** feat-p2-board-scaffold-20260505
- **Conflicts:** none
- **Verification:** passed (6/6 Gherkin scenarios, TypeScript clean, API tested with real data)
- **Stats:** 20 files, 5376 insertions, 34 tasks, 1 commit
