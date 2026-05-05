# Tasks: feat-redesign-knowledge-map

## Task Breakdown

### 1. 可视化库安装与配置
- [ ] 安装 `@xyflow/react`（推荐，React 原生 + HTML 节点 + Tailwind 兼容）
- [ ] 安装布局算法库（dagre 或 elkjs，用于自动节点布局，替代 D3 force simulation）
- [ ] 适配新布局框架的全高图表区域（替代当前 `-m-6` 负边距方案）

### 2. 数据映射层（`components/knowledge-map/graphMapper.ts`）
- [ ] 创建 `GraphData` → `@xyflow/react Node[]` 映射函数
  - 节点 type: 自定义 `"bentoService"` 节点类型
  - 映射 knowledgeCompleteness → 节点大小, type → 颜色, endpoints → Badge
- [ ] 创建 `GraphData.edges` → `@xyflow/react Edge[]` 映射函数
  - confidence → 边颜色（extracted=绿, inferred=黄, fuzzy=红虚线）
  - weight → 边宽度
- [ ] 保留 `api.graph()` → `GraphData` 数据接口不变（来自 feat-p2-graphify-index）

### 3. 图谱组件重写
- [ ] 重写 `ForceGraph.tsx` → `BentoGraph.tsx`（使用 `<ReactFlow>` + 自定义节点）
  - 自定义节点: Bento Card 风格（服务名 + 状态色条 + 连接数 Badge + Tailwind 类名样式）
  - 自动布局: dagre/elkjs 计算初始位置
  - 交互: 内置缩放/平移/拖拽
- [ ] 重写 `GraphControls.tsx` → react-flow `<Controls>` + `<MiniMap>` + 视图模式切换
- [ ] 重写 `GraphLegend.tsx` → Bento 风格图例（confidence 颜色编码 + 服务类型）

### 4. 详情面板重写
- [ ] 重写 `NodeDetailPanel.tsx` → Bento Card 风格侧边面板
  - 服务基本信息（名称、角色、技术栈）
  - 关联服务列表（可点击跳转）
  - 知识产物数量统计
  - 保留节点双击导航: `/services?name=xxx`

### 5. 页面集成（重写 `app/knowledge-map/page.tsx`）
- [ ] 保留现有数据获取: `api.graph()` + WebSocket `"change"` 订阅
- [ ] 保留 ViewMode 切换（"service" | "concept"）
- [ ] 新布局: 全高图表区域 + 右侧叠加 NodeDetailPanel + 左下叠加 Controls/Legend

### 6. D3.js 清理
- [ ] 移除 `ForceGraph.tsx` 中的 D3 导入和 SVG 渲染代码
- [ ] 移除 `package.json` 中 `"d3": "^7.9.0"` 依赖（确认其他页面不使用 D3）
- [ ] 运行 E2E 测试确认无回归（来自 feat-p2-e2e-playwright）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-05-05 | Feature created | Knowledge Map 可视化 |
| 2026-05-05 | Spec enriched | Value points: 3, Scenarios: 3, Tasks: 16, Archive refs: feat-p2-knowledge-map, feat-p2-graphify-index, feat-p2-e2e-playwright |
