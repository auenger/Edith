# Tasks: feat-p2-board-explorer

## Task Breakdown

### 1. Services 页面
- [x] 创建 Services 页面路由（/services）
- [x] 服务卡片组件（名称、描述、技术栈、Owner、端点数）
- [x] 三层产物状态标签（L0 ✓/✗ L1 ✓/✗ L2 ✓/✗）
- [x] 筛选器组件（全部/技术栈/状态）
- [x] 搜索框组件（实时搜索）

### 2. 服务详情
- [x] 服务详情弹窗或子页面
- [x] API 端点列表
- [x] 数据模型列表
- [x] 业务流程列表
- [x] Layer 补全操作按钮

### 3. Artifacts 页面
- [x] 创建 Artifacts 页面路由（/artifacts）
- [x] 左侧文件树组件（递归渲染目录结构）
- [x] 文件树节点展开/折叠交互
- [x] 当前选中文件高亮

### 4. Markdown 预览
- [x] 右侧预览区组件
- [x] Markdown 渲染（markdown-it 或类似库）
- [x] 代码块语法高亮
- [x] 切换视图模式：Markdown / Raw / Token Count

### 5. Token 计数
- [x] Token 计数组件（实际 Token / 预算 Token）
- [x] 预算进度条

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
| 2026-05-05 | Spec enriched | Reference Code: 6 files, Related Features: 4 (1 前置 + 1 关联 + 2 已完成归档) |
| 2026-05-05 | Implementation complete | 7 files created: services page + 3 components, artifacts page + 2 components. TypeScript passes. |
