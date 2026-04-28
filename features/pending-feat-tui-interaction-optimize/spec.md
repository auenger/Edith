# Feature: feat-tui-interaction-optimize Agent TUI 交互优化

## Basic Information
- **ID**: feat-tui-interaction-optimize
- **Name**: Agent TUI 交互优化
- **Priority**: 72
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: [feat-tui-context-fix, feat-tui-layout]
- **Created**: 2026-04-28T24:00:00+08:00

## Description
优化 EDITH Agent TUI 的三个交互问题：
1. `/context` 命令输出中 Messages、Tools、Token Detail 字段显示为 0 或 N/A（仅 Tokens 正确）
2. CTX 状态栏（CTX 8.9K/1.0M Cache: 95%）位置不合理，应靠近输入框
3. 用户对话内容溢出到 Logo 上方，应保持在 Banner 和输入框中间

拆分为两个子 feature：
- **feat-tui-context-fix**: 问题 1+2（数据准确性 + 状态栏位置）
- **feat-tui-layout**: 问题 3（对话布局修正）

## User Value Points
1. **Context 数据准确性**: 用户执行 `/context` 时获得完整准确的 session 统计信息
2. **CTX 状态栏可用性**: CTX/Cache 信息在输入区域附近持续可见，无需滚动
3. **对话布局正确性**: 对话内容始终在 Banner 和输入框之间的区域，AI 思考/tool 调用渲染在中间位置

## Context Analysis
### Reference Code
- `agent/src/extension.ts:604-641` — `/context` 命令注册，通过 `(ctx as any).session` 获取 stats
- `agent/src/theme/context-panel.ts` — Context panel 渲染，SessionStats 接口定义
- `agent/src/tui/App.tsx:97-109` — 主布局：BannerArea → ContextStatusBar → WarningBar → ContentArea → InputArea
- `agent/src/tui/StatusBarMetrics.tsx` — CTX/Cache 状态栏组件
- `agent/src/tui/ContentArea.tsx:78` — 使用 ink `Static` 组件渲染已完成消息
- `agent/src/tui/useAgentSession.ts:142` — `session.getSessionStats?.()` 调用

### Related Documents
### Related Features
- feat-tui-ink-layout (completed) — TUI 布局框架
- feat-tui-context-monitor (completed) — Context 上下文监控
- feat-tui-streaming (completed) — 流式输出
- feat-tui-thinking (completed) — AI 思考过程展示

## Technical Solution
<!-- To be filled during implementation -->

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望 TUI 交互体验流畅、信息准确、布局合理。

### Scenarios (Given/When/Then)
#### Scenario 1: Context 命令完整数据
- Given Agent 已完成至少一轮对话
- When 用户输入 `/context`
- Then 显示完整的 Token 用量、Messages 计数、Tools 计数、Token Detail（Input/Output/Cache/Cost）

#### Scenario 2: CTX 状态栏位置
- Given Agent 已启动且 context monitor 已启用
- Then CTX/Cache 状态信息显示在输入框附近（底部区域）
- And 状态栏不遮挡对话内容区域

#### Scenario 3: 对话布局正确
- Given Agent 已启动
- When 用户发送消息并收到回复
- Then 用户消息和 AI 回复渲染在 Banner 和输入框之间
- And 消息不会溢出到 Banner 上方
- And AI 思考过程和 tool 调用默认在中间区域渲染

### UI/Interaction Checkpoints
- `/context` 输出面板信息完整性
- CTX 状态栏始终可见且位置合理
- 多轮对话后布局不混乱

### General Checklist
- [ ] 不引入新的渲染性能问题
- [ ] 保持 ink 框架的响应式特性
