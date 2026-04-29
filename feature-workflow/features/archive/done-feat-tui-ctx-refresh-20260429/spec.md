# feat-tui-ctx-refresh: CTX 动态刷新 + Token 计数修复

## Feature Description

修复状态栏 CTX 不动态刷新（仅在 agent_end 更新，非 Anthropic provider 无数据 fallback）和 ThinkingIndicator token 计数不含工具调用 token 的问题。

## Bug 1: CTX 状态栏不动态刷新

### 现状
`useAgentSession.ts` 中 CTX 数据（token 用量、context window 占比）**仅在 `agent_end` 事件**时通过 `mon.record()` 收集并更新到 `monitorData` state。

这意味着：
- Agent 执行工具调用期间，CTX 状态栏显示旧数据
- 长时间工具调用（edith_scan 等）期间用户无法感知 token 变化
- 对于非 Anthropic provider，`getContextUsage()` 可能返回 undefined，导致完全不更新

### 根因
- `agent/src/tui/useAgentSession.ts:236-296` — 只在 `agent_end` 分支调用 `mon.record()` + `setMonitorData()`
- `tool_execution_end`、`message_update`（text_delta）等事件不触发 CTX 更新

### 修复方案

在 `tool_execution_end` 事件中增加增量 CTX 更新：
1. 在 `tool_execution_end` handler 中调用 `session.getSessionStats()` 获取最新 token 统计
2. 调用 `mon.record()` 更新监控数据
3. 调用 `setMonitorData()` 触发 UI 重渲染

对于非 Anthropic provider 无 `getContextUsage()` 的 fallback：
4. 从 `session.getSessionStats()` 的 `tokens.total` 和 model 的 `contextWindow` 手动计算占比
5. 在 `agent_end` 事件中补全 fallback 逻辑

## Bug 2: ThinkingIndicator token 计数不含工具调用

### 现状
`ThinkingIndicator.tsx` 使用 `outputChars / 4` 估算 token 数。`outputChars` 仅在 `text_delta` 事件中累加字符数（`useAgentSession.ts:204`），**不包含工具调用的 token 消耗**。

### 根因
- `agent/src/tui/ThinkingIndicator.tsx:22-26` — `formatTokenEstimate(chars)` 仅基于文本字符数
- `agent/src/tui/useAgentSession.ts:204` — `setOutputCharCount((c) => c + sub.delta.length)` 只计文本输出
- 工具调用期间无任何 token 累加机制

### 修复方案

1. 新增 `accumulatedTokens` state，在每次 `tool_execution_end` 时从 `session.getSessionStats()` 获取增量 token
2. 传入 ThinkingIndicator 替代 `outputChars` 的字符数估算
3. 当 `accumulatedTokens > 0` 时直接使用实际 token 数，否则回退到字符估算

## Context Analysis

### 关键文件
| 文件 | 作用 |
|------|------|
| `agent/src/tui/useAgentSession.ts` | Session 事件订阅、state 管理、monitor 更新 |
| `agent/src/tui/ThinkingIndicator.tsx` | 思考指示器 UI 组件 |
| `agent/src/tui/App.tsx` | ContextStatusBar 组件，消费 monitorData |
| `agent/src/tui/StatusBarMetrics.tsx` | 状态栏指标渲染 |

### SDK API
- `session.getSessionStats()` → `{ tokens: { input, output, cacheRead, cacheWrite, total }, cost }`
- `session.getContextUsage()` → `{ tokens, contextWindow, percent }` (仅 Anthropic provider 可靠)

## Acceptance Criteria

1. CTX 状态栏在每次 `tool_execution_end` 后刷新（不再等到 `agent_end`）
2. 非 Anthropic provider 有合理的 fallback（基于 tokens.total / contextWindow 估算）
3. ThinkingIndicator 显示的 token 数包含工具调用消耗
4. 不引入额外的渲染闪烁或性能问题
5. TypeScript 编译通过
