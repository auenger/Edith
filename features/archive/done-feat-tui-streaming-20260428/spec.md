# Feature: feat-tui-streaming 流式输出增强

## Basic Information
- **ID**: feat-tui-streaming
- **Name**: 流式输出增强（Markdown 渲染 + 进度指示）
- **Priority**: 60
- **Size**: M
- **Dependencies**: [feat-tui-ink-layout]
- **Parent**: feat-tui-redesign
- **Children**: []
- **Created**: 2026-04-28

## Description
在 TUI 布局框架基础上，增强流式输出的渲染能力。实现终端内 Markdown 渲染（代码块高亮、列表、标题等）、工具调用进度指示器、以及更好的状态展示。让 AI 的最终输出和中间过程在视觉上更清晰易读。

## User Value Points
1. **可读性提升** — Markdown 渲染让代码块、列表、标题等内容在终端中结构化显示
2. **过程可视化** — 工具调用的进度指示让用户知道 Agent 正在做什么

## Context Analysis
### Reference Code
- `src/tui/ContentArea.tsx` (将在 feat-tui-ink-layout 中创建) — 需替换纯文本渲染为 Markdown 渲染
- `src/tui/MessageList.tsx` (将在 feat-tui-ink-layout 中创建) — 消息列表需支持富文本

### Related Documents
- ink-markdown (社区组件) 或 自定义 Markdown 渲染方案
- ink-syntax-highlight (代码高亮)

### Related Features
- feat-tui-ink-layout — 前置依赖，提供布局和基础消息系统

## Technical Solution
### 新增组件
```
<MarkdownRenderer>       — Markdown 内容渲染
  <CodeBlock />          — 代码块（带语法高亮）
  <Heading />            — 标题
  <List />               — 列表
  <InlineCode />         — 行内代码
</MarkdownRenderer>

<ToolCallIndicator>      — 工具调用状态指示
  <Spinner />            — 执行中旋转指示器
  <StatusBadge />        — 完成状态标签
</ToolCallIndicator>
```

### Markdown 渲染策略
1. 解析 Markdown AST（使用 marked 或 remark）
2. 逐节点映射到 ink 组件
3. 代码块使用 chalk 高亮（支持常见语言）
4. 流式渲染：逐 token 追加，实时更新 AST

### 工具调用进度
- 显示工具名称 + spinner + 耗时
- 完成后显示结果摘要（如 "扫描完成：12 个文件"）

## Acceptance Criteria (Gherkin)
### Scenarios (Given/When/Then)
```gherkin
Scenario: Markdown 代码块渲染
  Given TUI 界面已显示
  When AI 回复包含代码块
  Then 代码块应有语法高亮
  And 代码块有边框或背景色区分

Scenario: 工具调用进度指示
  Given AI 正在调用 edith_scan 工具
  Then 显示旋转 spinner + "edith_scan 执行中..."
  When 工具执行完成
  Then spinner 停止并显示结果摘要

Scenario: 流式 Markdown 渲染
  Given AI 正在流式输出回复
  When 输出包含 Markdown 格式
  Then 标题、列表、代码等格式应实时渲染
  And 渲染过程不闪烁不跳变

Scenario: 不完整 Markdown 容错渲染
  Given AI 正在流式输出包含代码块的内容
  When 代码块尚未收到闭合标记 ```
  Then 渲染器应优雅处理不完整 AST
  And 显示已接收的部分内容而非报错
  When 闭合标记到达
  Then 代码块应正确渲染语法高亮

Scenario: 大输出性能降级
  Given AI 回复超过 1000 行 Markdown
  When 内容追加到渲染区
  Then 渲染帧率不低于 15fps
  And 超过 500 行的历史内容可截断或折叠
  And 用户向上滚动时加载完整内容
```

### UI/Interaction Checkpoints
- 代码块有明显的视觉边界（边框或背景色）
- 语法高亮支持至少 TS/JS/Python/YAML/JSON
- 列表缩进正确，层次分明
- 工具调用进度清晰，不干扰主内容

## Merge Record
- **Completed**: 2026-04-28T22:35:00+08:00
- **Merged Branch**: feature/tui-streaming
- **Merge Commit**: 731af6d
- **Archive Tag**: feat-tui-streaming-20260428
- **Conflicts**: task.md (auto-resolved — kept completed version)
- **Verification**: 5/5 scenarios passed
- **Stats**: 1 commit, 7 files changed, 427 insertions, duration ~20 min
