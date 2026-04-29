# Feature: feat-tui-tool-rendering Claude Code 风格 Tool 渲染重设计

## Basic Information
- **ID**: feat-tui-tool-rendering
- **Name**: Claude Code 风格 Tool Call 渲染
- **Priority**: 78
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

将 EDITH Agent TUI 的 tool call 渲染从当前折叠式 ThinkingBlock 重设计为 Claude Code 风格的展开式内联渲染。Tool calls 作为独立的消息流项显示，默认展开，带有 diff 风格的结果输出。

### 当前问题
- Tool calls 嵌套在 ThinkingBlock 内，默认折叠：`💭 N tools used [T] expand`
- 用户必须按键才能看到工具执行详情
- 整个响应在固定位置渲染，追加内容时视觉体验差
- 思考过程和工具调用混在一起，没有清晰的视觉分隔

### 目标效果（Claude Code 风格）
```
⏺ ToolName(args summary)
  ⎿  result line 1
  ⎿  result line 2

⏺ Bash(git log --oneline -3)
  ⎿  9be99d0 Merge feature/openai-compatible-provider
  ⎿  c957c0d feat(openai-compatible-provider): multi-profile
  ⎿  dac803d docs: archive feat-tui-slash-commands

⏺ Feature feat-openai-compatible-provider completed!

    start-feature     → branch + worktree created
    implement-feature → 5/5 tasks, 6 files changed (+377/-31)

  改动摘要：
  - config.ts — 新增 LlmProfile 接口...
  - App.tsx — /model 命令处理...
```

## User Value Points

### VP1: 内联展开式 Tool Call 渲染
用户在 Agent 执行过程中能实时看到每个工具调用的名称、参数摘要和执行结果，无需手动展开。Tool calls 作为消息流中的独立项，与最终文本输出交错显示。

### VP2: 保留折叠式 Thinking（仅思考内容）
纯思考过程（reasoning/thinking text）仍然使用折叠模式，但与 tool calls 分离显示。用户只看到 `💭 N lines [T] expand` 的纯思考内容，tool calls 不再混入其中。

## Context Analysis

### Reference Code
- `agent/src/tui/ThinkingBlock.tsx` — 当前折叠式思考块+工具调用渲染（需重构）
- `agent/src/tui/ContentArea.tsx` — 消息流渲染（需支持交错渲染）
- `agent/src/tui/ToolCallIndicator.tsx` — 工具状态指示器（需重设计为展开式）
- `agent/src/tui/types.ts` — 数据模型（需扩展）
- `agent/src/tui/useAgentSession.ts` — 会话状态管理（需调整事件处理）

### Related Documents
- `CLAUDE.md` — Agent 架构分层说明

### Related Features
- `feat-tui-redesign` (completed) — 初始 TUI 重设计
- `feat-tui-interaction-optimize` (completed) — TUI 交互优化
- `feat-tui-ctx-refresh` (pending) — CTX 动态刷新（独立 feature）

## Technical Solution

### 架构变更

1. **数据模型重构** (`types.ts`)
   - 新增 `ToolCallBlock` 类型：独立的工具调用消息项
   - `ThinkingBlock` 简化为仅包含思考文本（不含 toolCalls）
   - 消息流变为：`Message[]` + `ToolCallBlock[]` + `ThinkingBlock[]` 交错排列，统一用 `DisplayItem` 时间排序

2. **新增组件** (`ToolCallBlock.tsx`)
   - 展开式渲染：`⏺ ToolName(args)` + 结果区 `⎿ line`
   - Running 状态：Spinner + 工具名
   - Complete 状态：结果摘要（截断到终端宽度）
   - Error 状态：红色错误信息

3. **消息流重构** (`ContentArea.tsx`)
   - 将 messages、thinkingBlocks、toolCallBlocks 合并为统一的 `DisplayItem[]`
   - 按 timestamp 排序，交错渲染
   - 每轮对话的顺序：User msg → Thinking → Tool calls → Tool results → Assistant text

4. **事件处理调整** (`useAgentSession.ts`)
   - `tool_execution_start/end` 事件创建独立的 `ToolCallBlock`
   - 不再将 tool calls 追加到 ThinkingBlock

### 关键文件改动
- `types.ts` — 新增 ToolCallBlock 类型 + DisplayItem 联合类型 + 新 reducer
- `ToolCallBlock.tsx` — 新建展开式工具调用组件
- `ContentArea.tsx` — 合并交错渲染逻辑
- `ThinkingBlock.tsx` — 简化，移除 toolCalls 相关代码
- `useAgentSession.ts` — 事件处理分离

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH Agent 用户，我希望在 Agent 执行过程中看到每个工具调用的详细信息（名称、参数、结果），而不是折叠在一个思考块里，这样我能实时了解 Agent 在做什么。

### Scenarios

```gherkin
Scenario: Tool call 实时展开显示
  Given 用户发送了一条需要工具调用的消息
  When Agent 开始执行工具
  Then 显示 "⏺ ToolName(args)" 带有 spinner
  And 工具完成后 spinner 替换为结果摘要
  And 结果以 "⎿" 前缀显示

Scenario: 多个 Tool calls 顺序显示
  Given Agent 需要执行 3 个工具调用
  When 第一个工具完成，第二个开始
  Then 第一个工具显示完整结果
  And 第二个工具显示 spinner
  And 两个工具调用独立显示，不嵌套

Scenario: Thinking 内容折叠，Tool calls 展开
  Given Agent 有思考过程和工具调用
  When 渲染输出
  Then 思考内容显示为 "💭 N lines [T] expand"（折叠）
  And 工具调用默认展开显示

Scenario: 最终文本输出在所有工具之后
  Given Agent 执行了工具调用并生成了文本回复
  When 渲染完成
  Then 工具调用块在文本输出之前
  And 文本输出支持 Markdown 渲染

Scenario: Tool call 错误状态显示
  Given Agent 调用了一个工具但执行失败
  When 工具返回错误
  Then 显示 "⏺ ToolName" 带红色错误标记
  And 错误信息以红色 "⎿" 前缀显示
```

### UI/Interaction Checkpoints
- `⏺` 标记用于工具调用（借鉴 Claude Code 的圆圈标记）
- `⎿` 标记用于工具结果行
- Spinner 动画用于 running 状态
- 绿色 `✓` 用于完成，红色 `✗` 用于错误

### General Checklist
- [x] 不影响现有 ThinkingBlock 的折叠/展开功能
- [x] 保持向后兼容（event 接口不变）
- [x] 性能：大量 tool calls 时不过度重渲染
