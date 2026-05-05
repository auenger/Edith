# Feature: feat-redesign-knowledge-map Knowledge Map 可视化

## Basic Information
- **ID**: feat-redesign-knowledge-map
- **Name**: Knowledge Map 可视化重设计（D3.js → 现代方案）
- **Priority**: 70
- **Size**: M
- **Dependencies**: [feat-redesign-layout]
- **Parent**: feat-board-redesign
- **Children**: []
- **Created**: 2026-05-05

## Description
更换 Knowledge Map 可视化方案，从 D3.js force-directed graph 迁移到更现代的交互式图谱方案（如 react-flow、@xyflow/react、或 echarts）。重新设计图谱展示、节点交互、详情面板。

### 设计要点
- **可视化库**: 从 D3.js → react-flow / @xyflow / echarts（实现时确定）
- **节点设计**: Bento 风格卡片节点，显示服务名 + 状态 + 连接数
- **交互**: 拖拽、缩放、节点点击 → 详情面板、双击 → 跳转
- **布局**: 自动力导向布局 + 手动调整
- **图例**: 服务类型颜色编码

## User Value Points
1. **更好的交互** — 现代可视化库提供更流畅的拖拽/缩放体验
2. **信息密度** — 卡片式节点比纯圆圈展示更多信息
3. **自定义布局** — 用户可拖拽调整节点位置

## Context Analysis
### Reference Code
- `board/src/app/knowledge-map/page.tsx` — 当前 Knowledge Map 页面（需完全重写）
  - 当前模式: `"use client"` + useState(selectedNode, viewMode, data, loading, error, wsStatus)
  - 数据获取: `api.graph()` → `GraphData { nodes, edges, metadata }`
  - 视图模式: `ViewMode = "service" | "concept"` — 服务依赖 vs 概念拓扑
  - 布局: 全高 (`-m-6` 负边距) 打破内容区域内边距
  - WebSocket: 实时更新图谱数据
- `board/src/components/knowledge-map/ForceGraph.tsx` — D3 力导向图 (SVG 渲染)（→ 完全替换）
  - 当前实现: D3 v7.9.0 SVG force simulation
  - 节点大小 = 知识完成度，边宽度 = 权重
  - 置信度颜色: extracted (绿) / inferred (黄) / fuzzy (红虚线)
- `board/src/components/knowledge-map/GraphControls.tsx` — 视图模式切换 + 缩放控制（→ 重写）
- `board/src/components/knowledge-map/GraphLegend.tsx` — 置信度颜色图例（→ 重写）
- `board/src/components/knowledge-map/NodeDetailPanel.tsx` — 选中节点信息（→ Bento Card 风格重写）
  - 当前: 节点双击导航到 `/services?name=xxx`
- `board/src/lib/api.ts` — `GraphData` 类型: `nodes { id, type, knowledgeCompleteness, endpoints }`, `edges { source, target, label, confidence, weight }`

### Related Documents
- 父 spec: `features/pending-feat-board-redesign/spec.md` — 可视化更换决策
- 兄弟 spec: `features/pending-feat-redesign-system/spec.md` — Bento Card 令牌

### Related Features
- feat-redesign-system (前置) — 提供 Bento Grid 令牌
- feat-redesign-layout (前置) — 提供新布局框架，需确认全高图表在新布局中的适配
- feat-p2-knowledge-map (已完成) — 建立了当前 D3.js 图谱实现（将完全替换）
- feat-p2-graphify-index (已完成) — 建立了 `graph.json` 数据格式，数据层保持不变
- feat-p2-e2e-playwright (已完成) — Knowledge Map 页面有 E2E 测试，需适配新选择器

### Archive Implementation Patterns
- **D3 → 现代方案迁移要点** (来自 feat-p2-knowledge-map):
  - 当前 SVG 渲染 → 新方案可能使用 Canvas 或 HTML 节点（react-flow 使用 HTML）
  - `GraphData` 类型接口不变（`nodes` + `edges`），只需适配新库的数据映射
  - 节点交互模式保留: 单击 → 详情面板，双击 → 跳转 `/services?name=xxx`
  - 全高布局: 当前使用 `-m-6` 负边距，在新布局中需替代方案
- **数据格式** (来自 feat-p2-graphify-index): `graph.json` 包含 `nodes[]` + `edges[]` + `metadata`
  - confidence 字段: `"extracted"` / `"inferred"` / `"fuzzy"` — 新图谱需保留颜色编码

## Technical Solution
### 方案: @xyflow/react (react-flow) — React 原生节点 + HTML 渲染

**推荐选型: @xyflow/react (react-flow v12+)**
- 优势: React 原生（非 SVG wrapper），节点使用 JSX/HTML 完全可定制为 Bento Card 风格
- 社区活跃，TypeScript 支持好，内置缩放/拖拽/平移
- 可直接使用 Tailwind 类名样式化节点（与 Bento Grid 设计系统一致）
- 替代候选: echarts（适合数据图表而非网络图），vis-network（React 集成较弱）

**1. 图谱组件重写**
- 使用 `@xyflow/react` 的 `<ReactFlow>` 组件
- 自定义节点: Bento Card 风格（圆角 + 微阴影 + 服务名 + 状态色条 + 连接数 Badge）
- 自定义边: 根据 confidence 字段设置颜色和样式（extracted=绿实线, inferred=黄虚线, fuzzy=红虚线）
- 布局: 使用 dagre 或 elkjs 计算自动布局（替代 D3 force simulation）

**2. 交互保留**
- 缩放/平移/拖拽: react-flow 内置支持
- 节点单击: `onNodeClick` → 显示 NodeDetailPanel（Bento Card 风格侧边面板）
- 节点双击: `onNodeDoubleClick` → `router.push('/services?name=xxx')`
- 画布控件: react-flow `<MiniMap>` + `<Controls>` + `<Background>`

**3. 数据映射**
- `GraphData.nodes` → react-flow `Node[]`（映射 type/knowledgeCompleteness/endpoints 到自定义节点）
- `GraphData.edges` → react-flow `Edge[]`（映射 confidence/weight 到边样式）
- 数据层 (`api.graph()`) 不变

**4. D3.js 清理**
- 移除 `d3` 依赖（`package.json` 中 `"d3": "^7.9.0"`）
- 如果 Timeline 页面也不使用 D3，可完全移除

## Acceptance Criteria (Gherkin)
### User Story
作为用户，我希望通过交互式知识图谱直观了解服务间关系和知识结构。

### Scenarios (Given/When/Then)

#### Scenario 1: 图谱渲染
```gherkin
Given Knowledge Map 页面加载
When 数据获取完成
Then 图谱以力导向布局渲染所有服务节点
And 节点显示服务名 + 状态颜色
And 连线表示服务间依赖关系
```

#### Scenario 2: 节点交互
```gherkin
Given 图谱已渲染
When 用户点击某个节点
Then 右侧弹出详情面板（Bento Card 风格）
And 面板显示服务详情、关联服务列表
When 用户双击节点
Then 跳转到对应 Services 详情页
```

#### Scenario 3: 图谱控制
```gherkin
Given 图谱已渲染
When 用户使用鼠标滚轮
Then 图谱缩放（带平滑动画）
When 用户拖拽空白区域
Then 画布平移
When 用户拖拽节点
Then 节点位置跟随移动
```

### General Checklist
- [ ] 新可视化库安装并正常工作
- [ ] D3.js 依赖可安全移除
- [ ] 节点渲染和交互正确
- [ ] 详情面板正常
- [ ] 缩放/拖拽/平移流畅
- [ ] 图例和控件正确
