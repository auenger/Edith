# Feature: feat-tui-ctx-refresh CTX 动态刷新 + Token 计数修复

## Basic Information
- **ID**: feat-tui-ctx-refresh
- **Name**: CTX 动态刷新 + Token 计数修复
- **Priority**: 75
- **Size**: S
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

修复 EDITH Agent TUI 状态栏 CTX（上下文使用量）不动态刷新的问题，以及 ThinkingIndicator 中 token 计数只统计最终文本输出、不含 tool 调用 token 的问题。

### 问题 1: CTX 状态栏不刷新
**根因**：`monitorData` 仅在 `agent_end` 事件时更新（`useAgentSession.ts:259`），非 Anthropic provider 的 `getContextUsage()` 可能返回 undefined，导致状态栏显示固定初始值（如 `CTX 9.3K/1.0M (0.9%)`），整个对话期间不变。

**现象**：
```
Model: MiMo-V2.5-Pro │ CTX 9.3K/1.0M (0.9%) Cache: 92%
```
这个值从第一轮对话后就不更新了。

### 问题 2: Token 计数不完整
**根因**：`outputChars`（`useAgentSession.ts:181`）只累计 `text_delta` 的字符数，用于 ThinkingIndicator 的 `↓ Nk tokens` 显示。Tool 调用的输入/输出 token 完全不计入。

**现象**：Agent 执行了多个工具调用，但 ThinkingIndicator 只显示最后一个文本输出的估算 token 数。

## User Value Points

### VP1: 实时上下文使用量
用户在对话过程中能实时看到上下文使用量变化，包括工具调用后的增量。状态栏的 CTX 值应在每轮对话完成后更新，而不是从第一轮后就固定不变。

### VP2: 准确的 Token 计数
ThinkingIndicator 显示的 token 数应包含所有 token 消耗：思考 token + 工具调用 token + 文本输出 token，而不是只计最后一个文本输出。

## Context Analysis

### Reference Code
- `agent/src/tui/useAgentSession.ts` — monitorData 更新逻辑（L259-264），outputChars 累计逻辑（L181）
- `agent/src/tui/StatusBarMetrics.tsx` — CTX 显示组件
- `agent/src/tui/ThinkingIndicator.tsx` — token 计数显示（L57: formatTokenEstimate）
- `agent/src/context-monitor.ts` — ContextMonitor 类，record() 方法

### Related Features
- `feat-tui-context-monitor` (completed) — Context 监控基础设施
- `feat-tui-tool-rendering` (pending) — Tool 渲染重设计（独立 feature）

## Technical Solution

### CTX 动态刷新

1. **useAgentSession.ts** — 在 `agent_end` 事件中增加 fallback 逻辑：
   - 优先使用 `session.getContextUsage()`
   - 如果返回 undefined（非 Anthropic provider），从 `session.getSessionStats()` 推算
   - 使用 `sdkStats.tokens.total` 作为 context tokens 的估算值
   - 使用 config 中的 `context_window` 作为窗口大小

2. **context-monitor.ts** — 增加 `recordFromEstimate()` 方法：
   - 接受总 token 数和配置的 context_window
   - 估算 percent = totalTokens / contextWindow

3. **StatusBarMetrics.tsx** — 显示"估算"标记：
   - 当数据来自估算时，显示 `CTX ~N/WM`（波浪号表示估算值）

### Token 计数修复

1. **useAgentSession.ts** — 新增 `totalTokensUsed` state：
   - 在 `agent_end` 事件中累计 `sdkStats.tokens.total`
   - 或在 streaming 期间从 `getSessionStats()` 获取中间值

2. **ThinkingIndicator.tsx** — 使用实际 token 数而非字符估算：
   - 新增 `totalTokens` prop
   - 优先显示实际 token 数：`↓ 12.3k tokens`
   - 无实际数据时 fallback 到字符估算

### 关键文件改动
- `useAgentSession.ts` — monitorData 更新逻辑 + token 计数
- `context-monitor.ts` — 估算模式支持
- `StatusBarMetrics.tsx` — 估算值显示
- `ThinkingIndicator.tsx` — 使用实际 token 数

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH Agent 用户，我希望状态栏的 CTX 值能在每轮对话后正确更新，且 ThinkingIndicator 显示的 token 数包含所有消耗（思考+工具+输出）。

### Scenarios

```gherkin
Scenario: CTX 每轮对话后更新
  Given 用户与 Agent 进行了第一轮对话
  And 状态栏显示 "CTX 9.3K/1.0M (0.9%)"
  When 用户发送第二条消息，Agent 完成回复
  Then 状态栏 CTX 值更新为新值（大于 9.3K）

Scenario: 非 Anthropic provider 的 CTX 估算
  Given 用户配置了自定义 provider（如 MiMo）
  And session.getContextUsage() 返回 undefined
  When 一轮对话完成
  Then 状态栏显示估算的 CTX 值（带 ~ 标记）
  And 使用 sdkStats.tokens.total 推算

Scenario: Token 计数包含工具调用
  Given Agent 在一轮对话中执行了 3 个工具调用
  And 最终文本输出约 500 字符
  When ThinkingIndicator 显示 token 计数
  Then 显示的 token 数大于纯文本估算（500/4 = 125）
  And 包含工具调用的 token 消耗

Scenario: 首轮对话后 CTX 立即可用
  Given Agent 刚完成初始化
  When 用户发送第一条消息，Agent 完成回复
  Then 状态栏立即显示 CTX 值（非空）
```

### General Checklist
- [ ] 不影响 Anthropic provider 的精确 CTX 显示
- [ ] 非 Anthropic provider 有合理的 fallback
- [ ] Token 计数准确包含所有消耗
