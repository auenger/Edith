# Feature: feat-tui-layout 对话布局修正 + 渲染修复

## Basic Information
- **ID**: feat-tui-layout
- **Name**: 对话布局修正 + Markdown 渲染修复 + 思考指示器
- **Priority**: 72
- **Size**: M
- **Dependencies**: [feat-tui-context-fix]
- **Parent**: feat-tui-interaction-optimize
- **Children**: []
- **Created**: 2026-04-28

## Description
修正 TUI 对话内容的渲染位置问题、Markdown 渲染 `[object Object]` 问题、以及增加思考过程指示器。

### 问题 C：对话布局溢出
当前实现中，用户对话内容会溢出到 EDITH Logo（Banner）上方。

**根因**：`ContentArea.tsx:78` 使用 ink 的 `Static` 组件渲染已完成消息。`Static` 会将 items "冻结"到终端输出上方，导致已完成消息被推到 Banner 上方。

### 问题 D：Markdown 渲染 `[object Object]`
Markdown 标题渲染出现 `## [object Object]`，表格也出现 `[object Object]`。

**根因**：`MarkdownRenderer.tsx:85` 使用 `+` 拼接字符串和 React 元素：
```tsx
{"  " + "#".repeat(level) + " " + (h.tokens ? renderInline(h.tokens) : h.text)}
```
`renderInline()` 返回 `React.ReactNode[]`，用 `+` 拼接时调用 `.toString()` 产生 `[object Object]`。

### 问题 E：缺少思考过程指示器
Agent 处理请求时，用户无法感知进度，可能以为卡死。需要类似 Claude Code 的效果：
```
✶ Pollinating… (6m 36s · ↓ 5.5k tokens)
```
在输入框上方显示实时状态：思考中/调用工具/生成回复 + 持续时间 + token 数。

### 期望布局
```
╔══════════════════════════════╗
║  EDITH Banner (固定顶部)      ║
╠══════════════════════════════╣
║                              ║
║  [思考过程 - 折叠]            ║
║  [Tool 调用状态]              ║
║                              ║
║  你: hello                   ║
║  EDITH:                      ║
║    你好！我是 EDITH...        ║
║                              ║
║  (可滚动内容区域)             ║
║                              ║
╠══════════════════════════════╣
║  ✶ Thinking… (1m 23s · ↓ 800)║  ← 思考指示器（处理时显示）
║  CTX 9.0K/1.0M  Cache: 96%  ║
║  > 用户输入框                 ║
╚══════════════════════════════╝
```

## User Value Points
1. **稳定的对话布局**: 消息始终在 Banner 和输入框之间，不溢出
2. **正确的 Markdown 渲染**: 标题、表格等不再显示 `[object Object]`
3. **思考过程实时反馈**: 类似 Claude Code 的状态指示器，让用户知道 Agent 在工作中

## Context Analysis
### Reference Code
- `agent/src/tui/App.tsx:97-109` — 主布局结构
- `agent/src/tui/ContentArea.tsx:57-99` — 消息渲染（Static 组件问题）
- `agent/src/tui/MarkdownRenderer.tsx:85` — `[object Object]` bug（`+` 拼接 React 元素）
- `agent/src/tui/MarkdownRenderer.tsx:152` — 表格 header 渲染
- `agent/src/tui/InputArea.tsx` — 输入区域（需集成思考指示器）
- `agent/src/tui/ThinkingBlock.tsx` — 思考过程组件
- `agent/src/tui/ToolCallIndicator.tsx` — Tool 调用指示器
- `agent/src/tui/useAgentSession.ts:49-58` — `isProcessing` 状态

### ink 框架约束
- `Static` 组件将 items 渲染到 "frozen" 区域（上方），脱离 flex 布局
- React 元素不能用 `+` 拼接字符串，需用 JSX children

### Related Features
- feat-tui-ink-layout (completed) — TUI 布局框架
- feat-tui-thinking (completed) — 思考过程展示
- feat-tui-streaming (completed) — 流式输出

## Technical Solution

### Merge Record
- **Completed:** 2026-04-28
- **Branch:** feature/tui-layout → main
- **Merge commit:** c8fd57a
- **Archive tag:** feat-tui-layout-20260428
- **Conflicts:** None
- **Verification:** 6/6 Gherkin scenarios passed, TypeScript 0 errors

### 修复方案 C：布局
移除 `Static` 组件，改用普通 `Box` 渲染所有消息 + 窗口化渲染管理长对话。

### 修复方案 D：Markdown 渲染
将字符串拼接改为 JSX children：
```tsx
// Before (bug):
{"  " + "#".repeat(level) + " " + renderInline(h.tokens)}

// After (fix):
{"  " + "#".repeat(level) + " "}
{h.tokens ? renderInline(h.tokens) : h.text}
```

### 修复方案 E：思考指示器
在 InputArea 上方新增 `ThinkingIndicator` 组件：
- 状态文本：Thinking… / Running tools… / Generating…
- 持续时间计时器
- Token 计数（输出 tokens）
- 动画效果（旋转符号 `✶` 或 spinner）

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望对话布局稳定、Markdown 渲染正确、且能实时感知 Agent 工作状态。

### Scenarios (Given/When/Then)
#### Scenario 1: 首轮对话布局正确
- Given Agent 已启动并显示 Banner
- When 用户发送消息并收到回复
- Then 消息显示在 Banner 和输入框之间
- And Banner 保持在顶部
- And 输入框保持在底部

#### Scenario 2: 多轮对话布局稳定
- Given Agent 已完成 5 轮对话
- Then 所有历史消息仍在 Banner 和输入框之间
- And 布局不混乱

#### Scenario 3: Markdown 标题正确渲染
- Given AI 回复包含 Markdown 标题（`## Heading`）
- Then 标题正确显示为文字内容，不出现 `[object Object]`

#### Scenario 4: Markdown 表格正确渲染
- Given AI 回复包含 Markdown 表格
- Then 表格 header 和 cell 正确显示，不出现 `[object Object]`

#### Scenario 5: 思考指示器显示
- Given Agent 正在处理用户请求
- When Agent 进入思考状态
- Then 输入框上方显示状态指示器（包含动画、持续时间、token 计数）
- And 用户能感知 Agent 正在工作中

#### Scenario 6: 思考指示器消失
- Given Agent 处理完成
- Then 思考指示器消失
- And 恢复为普通输入状态

### UI/Interaction Checkpoints
- 多轮对话后布局检查
- Markdown 标题/表格/列表正确渲染
- 思考指示器动画流畅
- 长消息不破坏布局

### General Checklist
- [ ] 不引入新的渲染性能问题
- [ ] 保持流式输出正常工作
- [ ] 保持思考过程折叠/展开功能
