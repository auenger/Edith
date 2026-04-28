# Feature: feat-tui-context-fix Context 数据修复 + 状态栏位置

## Basic Information
- **ID**: feat-tui-context-fix
- **Name**: Context 数据修复 + 状态栏位置调整
- **Priority**: 72
- **Size**: S
- **Dependencies**: []
- **Parent**: feat-tui-interaction-optimize
- **Children**: []
- **Created**: 2026-04-28

## Description
修复两个问题：

### 问题 A：`/context` 命令数据不准确
执行 `/context` 后，仅 Tokens 行数据正确（来自 `ctx.getContextUsage()`），其余字段全部异常：
- Messages: User: 0, Assistant: 0
- Tools: Calls: 0, Results: 0
- Token Detail: Input: N/A, Output: N/A, Cache: R: N/A W: N/A, Cost: N/A

**根因**：`extension.ts:622` 通过 `(ctx as any).session` 获取 SessionStats，pi SDK 的 command context 不直接暴露 session 对象，导致 `s?.getSessionStats` 返回 undefined。

### 问题 B：CTX 状态栏位置
当前 CTX 状态栏 (`StatusBarMetrics`) 放在 `App.tsx:100` 的 BannerArea 下方（顶部），用户需要视线大幅移动才能查看。应将 CTX/Cache 信息移到 InputArea 上方或内部，保持"输入区 → 状态 → 内容"的信息流。

## User Value Points
1. **完整准确的 Context 信息**: `/context` 命令返回完整 session 统计（消息数、工具调用数、token 明细、费用）
2. **便捷的状态栏位置**: CTX/Cache 信息始终在视野范围内（输入区域附近）

## Context Analysis
### Reference Code
- `agent/src/extension.ts:604-641` — `/context` 命令注册
  - L614: `ctx.getContextUsage()` 正常工作
  - L622: `(ctx as any).session` → `getSessionStats()` 不可靠
- `agent/src/theme/context-panel.ts` — `SessionStats` 接口和渲染
- `agent/src/tui/App.tsx:11-30` — `ContextStatusBar` 组件
- `agent/src/tui/App.tsx:100` — 状态栏放置位置
- `agent/src/tui/StatusBarMetrics.tsx` — 状态栏渲染组件
- `agent/src/tui/InputArea.tsx` — 输入区域组件
- `agent/src/tui/useAgentSession.ts:138-172` — `agent_end` 事件中收集 stats
- `agent/src/context-monitor.ts` — `ContextMonitor` 类

### Root Cause Analysis
**问题 A 根因**：
1. pi SDK 的 `ExtensionCommandContext` 不暴露 `session` 对象
2. `(ctx as any).session` 可能为 undefined 或对象上没有 `getSessionStats` 方法
3. 需要寻找替代方案：通过 extension 状态共享、或 pi SDK 提供的其他 API

**问题 B**：布局调整，将 `ContextStatusBar` 从 `BannerArea` 下移到 `InputArea` 上方。

### Related Features
- feat-tui-context-monitor (completed) — 已有 ContextMonitor 收集 stats
- feat-context-command (completed) — `/context` 命令实现

## Technical Solution
### 采用方案：方案 1 + 方案 3 组合

**方向 A**：创建 `shared-stats.ts` 模块作为 TUI 层和 Extension 层的桥梁。
- `useAgentSession.ts` 在 `agent_end` 事件中：
  - 从 pi SDK session 获取 token 数据（`session.getSessionStats()`）
  - 自维护计数器统计 userMessages / assistantMessages / toolCalls / toolResults
  - 构建 `SessionStats` 写入 `shared-stats.ts` 模块变量
- `extension.ts` `/context` 命令从 `getSharedStats()` 读取，替代不可靠的 `(ctx as any).session`

**方向 B**：将 `ContextStatusBar` 从 BannerArea 下方移到 ContentArea 下方、InputArea 上方。

### 方向 A：修复 Context 数据
**方案 1**：在 `useAgentSession.ts` 的 `agent_end` 事件中收集完整 stats，存储到 shared state，`/context` 命令从 shared state 读取而非直接访问 session
**方案 2**：探索 pi SDK 的 `ExtensionCommandContext` 是否有其他 API（如 `ctx.getStats()`）
**方案 3**：自行维护计数器（在 useAgentSession 中 track messages/tools）

### 方向 B：状态栏位置
将 `StatusBarMetrics` 从 `App.tsx` 顶部移到 `InputArea` 内部或紧邻其上方。

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望 `/context` 命令返回完整准确的信息，且 CTX 状态栏始终在视野范围内。

### Scenarios (Given/When/Then)
#### Scenario 1: Context 命令完整数据
- Given Agent 已完成至少一轮对话（有 user/assistant 消息和 tool 调用）
- When 用户输入 `/context`
- Then Tokens 行正确显示 token 用量和进度条
- And Messages 行显示正确的 User 和 Assistant 消息数
- And Tools 行显示正确的 Calls 和 Results 数
- And Token Detail 显示 Input、Output、Cache R/W 数值（非 N/A）
- And Cost 显示费用（非 N/A）

#### Scenario 2: 多轮对话后 Context 准确
- Given Agent 已完成 3 轮对话
- When 用户输入 `/context`
- Then 所有计数正确反映累计值

#### Scenario 3: CTX 状态栏在输入框附近
- Given Agent 已启动且 context monitor 已启用
- Then CTX/Cache 信息显示在输入区域附近
- And 信息始终可见，无需滚动

### UI/Interaction Checkpoints
- `/context` 输出面板不再有 N/A 或 0（首轮后）
- CTX 状态栏在底部区域持续可见

### General Checklist
- [x] 不破坏现有 context monitor 功能
- [x] 保持向后兼容

## Merge Record
- **Completed**: 2026-04-29
- **Branch**: feature/tui-context-fix
- **Merge Commit**: 1e6074e
- **Archive Tag**: feat-tui-context-fix-20260429
- **Conflicts**: None
- **Verification**: 3/3 Gherkin scenarios passed
- **Stats**: 4 files changed, 66 insertions, 22 deletions
