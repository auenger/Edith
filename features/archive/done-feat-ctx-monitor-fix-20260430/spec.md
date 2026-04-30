# Feature: feat-ctx-monitor-fix Context Monitor 非 Anthropic Provider 统计修复

## Basic Information
- **ID**: feat-ctx-monitor-fix
- **Name**: Context Monitor 非 Anthropic Provider 统计修复
- **Priority**: 80
- **Size**: S
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-30

## Description

对非 Anthropic provider（如 MiMo、DeepSeek），`session.getContextUsage()` 返回的 `tokens` 可能为 null。
当前代码 fallback 到 `sdkStats.tokens.total`（累计 token，只增不减），导致：
- 状态栏 context 占用只增不减（如显示 276K/131K = 211%）
- compact 后数值不降，用户以为 compact 没生效
- pressure 预警持续误报

### 根因分析

`useAgentSession.ts` 中所有 `mon.record()` 调用的 fallback 逻辑：
```typescript
const ctxTokens = contextUsage?.tokens ?? tokenTotal;  // tokenTotal 是累计值
```

SDK 的 `getContextUsage()` 对 Anthropic provider 返回精确的 context tokens，
但对 OpenAI-compatible provider 不提供此字段。此时 `percent` 字段仍可能可用（SDK 用其他方式估算）。

### 修复方案

**方案 A：用 percent 反推 tokens**
```typescript
// 如果有 percent，用它反推：tokens = percent * contextWindow
const ctxPercent = contextUsage?.percent;
const ctxTokens = contextUsage?.tokens
  ?? (ctxPercent != null ? ctxPercent * ctxWindow : tokenTotal);
```

优点：简单直接，利用 SDK 可能提供的 percent 字段
缺点：percent 也可能为 null

**方案 B：分离累计值和 context 占用**
- 状态栏显示 `contextUsage` 的数据（当可用时）
- 不可用时显示 "~estimated" 标记
- 累计 token 另存为统计信息

**方案 C（推荐）：用 percent 反推 + 累计值降级**

1. 优先使用 `contextUsage.tokens`（Anthropic provider 精确值）
2. 其次用 `contextUsage.percent * contextWindow` 反推
3. 最后才 fallback 到 `sdkStats.tokens.total`，但标注为 "累计" 而非 "context"

同时在 compaction_end 事件后，强制用新 session 的数据刷新 monitor。

## User Value Points

1. **准确的 context 占用显示** — 状态栏显示当前实际 context 占用，compact 后数值下降

## Context Analysis

### Reference Code

| 文件 | 关键内容 |
|------|----------|
| `agent/src/tui/useAgentSession.ts` | `subscribeSessionEvents` 中所有 `mon.record()` 调用的 fallback 逻辑 |
| `agent/src/tui/App.tsx` | `ContextStatusBar` 组件消费 monitorData |
| `agent/src/context-monitor.ts` | `ContextMonitor` 类的 `record()` 和 `reset()` |

### Related Features

- `feat-session-lifecycle`（已完成）— compaction 事件监听
- `feat-tui-ctx-refresh`（已完成）— CTX 动态刷新

## Technical Solution

### 方案：percent 反推 + 降级标注

修改 `subscribeSessionEvents` 中所有 `ctxTokens` 计算逻辑：

```typescript
// Before:
const ctxTokens = contextUsage?.tokens ?? tokenTotal;

// After:
const ctxPercent = contextUsage?.percent;
const ctxTokens = contextUsage?.tokens
  ?? (ctxPercent != null ? Math.round(ctxPercent * ctxWindow) : tokenTotal);
```

涉及位置（共 4 处）：
1. `tool_execution_end` 事件 — 增量 CTX 刷新
2. `compaction_end` 事件 — 压缩后刷新
3. `agent_end` 事件 — 轮次结束刷新

每处都需同样修改 fallback 逻辑。

## Acceptance Criteria (Gherkin)

### User Story
作为使用 MiMo/DeepSeek provider 的 EDITH 用户，我希望状态栏显示准确的当前 context 占用，
compact 后能看到数值下降，不会被误报的 pressure 预警干扰。

### Scenarios

#### Scenario 1: 非 Anthropic provider 显示 context 占用
```gherkin
Given 用户使用 MiMo provider（getContextUsage().tokens 为 null）
And getContextUsage().percent = 0.35
And context_window = 131072
When 用户进行多轮对话
Then 状态栏显示 context tokens 约为 45,875（0.35 × 131072）
And 不显示累计 token 数值
```

#### Scenario 2: compact 后数值下降
```gherkin
Given 状态栏显示 context 占用 211%
When 用户执行 /compact
And compaction 成功执行
Then 状态栏 context 占用百分比下降
And compaction_end 消息显示 "Compacted: X → Y tokens" 中的 Y 为实际值
```

#### Scenario 3: Anthropic provider 行为不变
```gherkin
Given 用户使用 Anthropic provider
And getContextUsage().tokens 返回精确值
Then 状态栏显示精确的 context tokens
And 不受 fallback 逻辑影响
```

### General Checklist
- [ ] 非 Anthropic provider 状态栏显示 context 占用而非累计 token
- [ ] compact 后数值下降
- [ ] Anthropic provider 行为不变
- [ ] `npm run build` 通过
