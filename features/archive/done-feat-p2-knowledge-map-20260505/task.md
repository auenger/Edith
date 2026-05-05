# Tasks: feat-p2-knowledge-map

## Task Breakdown

### 1. 图谱数据接入
- [x] 消费 GET /api/graph 获取 graph.json
- [x] 数据转换层（graph.json → D3.js 数据格式）
- [x] 处理大规模图谱的分片加载

### 2. 力导向图渲染
- [x] D3.js 力导向图初始化
- [x] 节点渲染（服务节点 + 概念节点）
- [x] 连线渲染（服务间依赖关系）
- [x] 节点大小 = 知识完整度
- [x] 线条粗细 = 调用频率

### 3. 交互功能
- [x] 节点点击：展开服务摘要信息
- [x] 节点拖拽：调整布局
- [x] 双击节点：展开 API 列表
- [x] 缩放和平移
- [x] 选中节点高亮 + 关联节点高亮

### 4. 视图切换
- [x] 服务依赖视图（默认）
- [x] 概念拓扑视图（按实体/概念聚类）
- [x] 视图切换动画

### 5. 置信度标注
- [x] EXTRACTED 关系：绿色实线
- [x] INFERRED 关系：黄色实线
- [x] AMBIGUOUS 关系：红色虚线
- [x] 图例说明

### 6. 性能优化
- [x] 大规模图谱的 LOD（Level of Detail）
- [x] 节点数量超过阈值时启用聚合
- [x] 渲染性能监控

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
| 2026-05-05 | Spec enriched | Reference Code: 5 files, Related Features: 4 (2 前置 + 1 关联 + 1 已完成归档) |
| 2026-05-05 | All 6 tasks completed | ForceGraph (D3.js), GraphControls, GraphLegend, NodeDetailPanel, page.tsx — TypeScript clean |
