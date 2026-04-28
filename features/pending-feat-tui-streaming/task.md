# Tasks: feat-tui-streaming

## Task Breakdown

### 1. Markdown 渲染引擎
- [ ] 调研 ink-markdown 或自定义渲染方案
- [ ] 安装 Markdown 解析依赖 (marked / remark)
- [ ] 创建 `src/tui/MarkdownRenderer.tsx` — Markdown 到 ink 组件映射
- [ ] 实现代码块组件 `src/tui/CodeBlock.tsx` — 语法高亮
- [ ] 实现标题/列表/行内代码组件

### 2. 流式 Markdown 渲染
- [ ] 实现流式 AST 更新（逐 token 追加）
- [ ] 优化渲染性能（避免频繁全量重渲染）
- [ ] 处理不完整 Markdown（如半个代码块）

### 3. 工具调用进度指示
- [ ] 创建 `src/tui/ToolCallIndicator.tsx` — 工具调用状态组件
- [ ] 集成 ink-spinner
- [ ] 显示工具名称、状态、耗时、结果摘要

### 4. 集成与优化
- [ ] 将 MarkdownRenderer 集成到 MessageList
- [ ] 将 ToolCallIndicator 集成到 ContentArea
- [ ] 性能优化：大输出（>1000 行）不卡顿

### 5. 测试
- [ ] Markdown 渲染正确性测试
- [ ] 语法高亮测试（TS/JS/Python/YAML/JSON）
- [ ] 流式渲染平滑度测试
- [ ] 工具调用进度展示测试

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 等待 feat-tui-ink-layout 完成 |
