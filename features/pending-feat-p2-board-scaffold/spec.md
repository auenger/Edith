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
- `agent/` — 现有 Agent 项目，Board 为独立项目

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.4 Board 技术架构
- EDITH-INTEGRATION-DESIGN.md §五 Board 承接关系

### Related Features
- 下游: feat-p2-board-dashboard, feat-p2-board-explorer, feat-p2-knowledge-map, feat-p2-timeline

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
│   │   ├── git-reader.ts ← Git 知识仓库只读读取
│   │   ├── file-watcher.ts ← 文件变更监听
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
- Board **只读**，不修改 Agent 产出物
- 知识生产唯一入口是 Agent
- 所有数据从 Git 知识仓库读取

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
```

### General Checklist
- [ ] Next.js + React 项目脚手架
- [ ] Fastify API Server 骨架
- [ ] Git 知识仓库只读读取层
- [ ] 文件变更监听 + WebSocket 推送
- [ ] 产出物解析器（routing-table / quick-ref / distillates / graph.json）
- [ ] API 路由骨架（8 个端点）
- [ ] Docker Compose 配置
- [ ] TypeScript 全栈类型安全
