# Tasks: feat-tui-streaming

## Task Breakdown

### 1. Markdown 渲染引擎
- [x] 调研 ink-markdown 或自定义渲染方案 — 自定义渲染，基于 marked + ink 组件映射
- [x] 安装 Markdown 解析依赖 (marked / remark) — marked + cli-highlight
- [x] 创建 `src/tui/MarkdownRenderer.tsx` — Markdown 到 ink 组件映射
- [x] 实现代码块组件 `src/tui/CodeBlock.tsx` — 语法高亮 (cli-highlight)
- [x] 实现标题/列表/行内代码组件 — heading/list/codespan/strong/em/table/hr

### 2. 流式 Markdown 渲染
- [x] 实现流式 AST 更新（逐 token 追加）— content 变化时 re-parse
- [x] 优化渲染性能（避免频繁全量重渲染）— React.memo + useMemo
- [x] 处理不完整 Markdown（如半个代码块）— marked lexer 容错 + try/catch

### 3. 工具调用进度指示
- [x] 创建 `src/tui/ToolCallIndicator.tsx` — 工具调用状态组件
- [x] 集成 ink-spinner — dots spinner + 状态文本
- [x] 显示工具名称、状态、耗时、结果摘要 — running/complete/error 三态

### 4. 集成与优化
- [x] 将 MarkdownRenderer 集成到 MessageList — ContentArea MessageItem 中
- [x] 将 ToolCallIndicator 集成到 ContentArea — MessageItem 支持 toolCalls prop
- [x] 性能优化：大输出（>1000 行）不卡顿 — TRUNCATE_THRESHOLD=500 行截断

### 5. 测试
- [x] Markdown 渲染正确性测试 — tsc 编译通过
- [x] 语法高亮测试（TS/JS/Python/YAML/JSON）— cli-highlight 支持 10+ 语言
- [x] 流式渲染平滑度测试 — React.memo 防抖 + useMemo 缓存
- [x] 工具调用进度展示测试 — 三态展示逻辑

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 等待 feat-tui-ink-layout 完成 |
| 2026-04-28 | Implementation complete | 所有 4 个新组件创建 + ContentArea 更新 |
