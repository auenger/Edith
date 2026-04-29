# Feature: feat-p2-knowledge-map Knowledge Map 知识图谱可视化

## Basic Information
- **ID**: feat-p2-knowledge-map
- **Name**: Knowledge Map 知识图谱可视化
- **Priority**: 60
- **Size**: M
- **Dependencies**: [feat-p2-graphify-index, feat-p2-board-scaffold]
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
基于 Graphify 产出的 graph.json，使用 D3.js 力导向图实现交互式服务依赖和概念拓扑可视化。支持服务依赖关系展示、概念拓扑双视图、置信度标注着色、节点详情查看。

### 来源
- EDITH-PRODUCT-DESIGN.md §3.3 Knowledge Map 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 Knowledge Map 承接关系

## User Value Points
1. **服务依赖全景** — 一张图看懂所有服务之间的调用关系和数据流向
2. **交互式探索** — 点击节点查看服务详情，拖拽调整布局，双击展开 API 列表
3. **知识完整度可视化** — 节点大小反映知识完整度，线条粗细反映调用频率

## Context Analysis
### Reference Code
- 依赖 feat-p2-graphify-index 产出 graph.json
- 依赖 feat-p2-board-scaffold 提供 API 层

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Knowledge Map
- EDITH-INTEGRATION-DESIGN.md §五 Knowledge Map 承接关系

### Related Features
- feat-p2-graphify-index (前置) — 产出 graph.json 数据源
- feat-p2-board-scaffold (前置) — API 和前端框架

## Technical Solution

### 图谱布局
```
                 ┌──────────────┐
       ┌────────▶│ user-service │◀───────┐
       │         │   (23 EP)    │         │
       │         └──────┬───────┘         │
       │                │                 │
  查询用户信息       验证用户        获取用户地址
       │                │                 │
       │                ▼                 │
┌──────┴───────┐  ┌──────────────┐  ┌───┴────────────┐
│   payment    │  │    order     │  │   logistics    │
│   service    │──│   service    │──│   service      │
│   (12 EP)    │  │   (31 EP)    │  │   (18 EP)      │
└──────────────┘  └──────┬───────┘  └────────────────┘
                         │
                    扣减库存
                         │
                  ┌──────▼───────┐
                  │  inventory   │
                  │   service    │
                  │   (15 EP)    │
                  └──────────────┘

── 依赖关系   EP = API Endpoints
● 节点大小 = 知识完整度
线条粗细 = 调用频率
```

### 技术选型
- **图谱引擎**: D3.js 力导向图 或 react-force-graph
- **数据源**: GET /api/graph → graph.json
- **交互**: 点击、拖拽、双击、缩放

### 置信度着色
- EXTRACTED（绿色）— 源码硬逻辑，高置信度
- INFERRED（黄色）— 语义推断，中置信度
- AMBIGUOUS（红色）— 存在歧义，需人工确认

## Acceptance Criteria (Gherkin)
### User Story
作为架构师，我希望看到服务间的依赖关系图谱，以便理解系统整体架构和识别关键路径。

### Scenarios
```gherkin
Scenario: 加载服务依赖图谱
  Given 知识库中有 5 个已扫描服务
  And Graphify 已生成 graph.json 包含服务间依赖关系
  When 用户访问 Knowledge Map 页面
  Then 页面显示力导向图，节点为各服务
  And 节点间连线表示服务间调用关系
  And 节点大小反映知识完整度

Scenario: 查看节点详情
  Given 服务依赖图谱已渲染
  When 用户点击 user-service 节点
  Then 显示该服务的摘要信息（技术栈、端点数、Owner）
  And 高亮与该服务直接关联的上下游服务

Scenario: 切换视图模式
  Given 服务依赖图谱已渲染
  When 用户切换到"概念拓扑"视图
  Then 图谱按概念/实体聚类显示（而非服务粒度）
  When 用户切换回"服务依赖"视图
  Then 恢复服务粒度显示

Scenario: 置信度标注
  Given graph.json 中包含置信度分级
  When 图谱渲染完成
  Then EXTRACTED 关系显示为绿色连线
  And INFERRED 关系显示为黄色连线
  And AMBIGUOUS 关系显示为红色虚线
```

### General Checklist
- [ ] D3.js 力导向图组件
- [ ] 消费 graph.json 数据渲染服务节点和关系连线
- [ ] 节点点击展开服务详情
- [ ] 节点大小 = 知识完整度，线条粗细 = 调用频率
- [ ] 置信度标注着色（EXTRACTED/INFERRED/AMBIGUOUS）
- [ ] 服务依赖 + 概念拓扑双视图切换
- [ ] 拖拽、缩放、双击交互
- [ ] graph.json 分片按需加载（大规模场景）
