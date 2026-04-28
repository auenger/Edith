# Feature: feat-context-command Context 上下文命令

## Basic Information
- **ID**: feat-context-command
- **Name**: Context 上下文查看命令
- **Priority**: 70
- **Size**: S
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-28

## Description

新增 `/context` REPL 命令，让用户在对话过程中实时查看当前 session 的上下文占用情况。类似 Claude Code 的 context bar 设计，以直观的方式展示 token 用量、对话轮次、工具调用统计等信息。

### 核心诉求
- 用户需要感知当前对话的上下文消耗，决定是否需要 compact 或开新 session
- 类似 `/clear`、`/new`、`/compact` 的命令体验
- 不需要中断当前对话

## User Value Points

### VP1: Token 用量可视化
用户执行 `/context` 后，看到当前 session 的 token 消耗和占比，帮助判断是否接近上下文窗口上限。

### VP2: 对话统计面板
展示对话轮次、工具调用次数、输入/输出 token 分项统计，形成完整的 session 状态概览。

## Context Analysis

### Reference Code
- `agent/src/extension.ts` — 命令注册入口，通过 `pi.registerCommand()` 注册
- `agent/src/agent-startup.ts` — REPL 循环，命令的执行上下文
- `agent/src/theme/` — TUI 渲染工具（Banner、渐变色、状态栏）

### pi SDK API 可用性
经调研确认，pi SDK 提供以下关键 API：
- **`session.getSessionStats()`** → `SessionStats`（含 userMessages, assistantMessages, toolCalls, toolResults, tokens{input, output, cacheRead, cacheWrite, total}, cost）
- **`session.getContextUsage()`** → `ContextUsage`（含 tokens, contextWindow, percent）
- **`pi.registerCommand(name, { handler, description })`** — 命令注册，支持 async handler

### Related Documents
- `agent/edith.yaml` — token_budget 配置项（routing_table: 500, quick_ref: 2000, distillate_fragment: 4000）

### Related Features
- `feat-tui-branding`（已完成）— TUI 主题渲染基础设施
- `feat-extension-core`（已完成）— Extension 命令注册路由层

## Technical Solution

### 实现方案

在 `agent/src/extension.ts` 中注册 `/context` 命令：

```typescript
pi.registerCommand("context", {
  description: "显示当前 session 的上下文占用和统计信息",
  handler: async (args: string, ctx: ExtensionCommandContext) => {
    const stats = ctx.session.getSessionStats();
    const usage = ctx.session.getContextUsage();
    // 使用 theme 渲染格式化输出
    renderContextPanel(stats, usage);
  }
});
```

### 输出格式设计

```
╭─ Context ─────────────────────────────────────╮
│                                                │
│  Tokens    ████████░░░░░░  12,450 / 200,000   │
│  Usage     6.2%                                │
│                                                │
│  Messages  User: 8   Assistant: 7              │
│  Tools     Calls: 12   Results: 12            │
│                                                │
│  Token Detail                                  │
│    Input:   9,200  Output: 3,250               │
│    Cache:   R: 5,100  W: 2,300                 │
│    Cost:    $0.042                              │
│                                                │
╰────────────────────────────────────────────────╯
```

### 文件变更
1. `agent/src/extension.ts` — 新增 `/context` 命令注册
2. `agent/src/theme/context-panel.ts`（新建）— 上下文面板渲染逻辑

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我想在对话中执行 `/context` 查看当前 session 的上下文占用，以便决定是否需要压缩或开新 session。

### Scenarios

#### Scenario 1: 查看基本 token 用量
```gherkin
Given 用户已启动 EDITH Agent 并进行若干轮对话
When 用户输入 /context
Then 系统显示当前 session 的 token 总量和占比百分比
And 显示上下文窗口上限
And 使用进度条可视化 token 使用比例
```

#### Scenario 2: 查看详细对话统计
```gherkin
Given 用户已执行多次工具调用
When 用户输入 /context
Then 系统显示用户消息数和助手消息数
And 显示工具调用次数和工具结果数
And 显示分项 token 统计（input/output/cache_read/cache_write）
And 显示累计费用
```

#### Scenario 3: 空 session 的 context 显示
```gherkin
Given 用户刚启动 EDITH Agent 尚未对话
When 用户输入 /context
Then 系统显示初始化 token 用量（system prompt 占用）
And 显示 "No conversation yet" 提示
And 不报错或崩溃
```

### General Checklist
- [ ] 命令不中断当前对话流程
- [ ] 输出使用 EDITH 主题色彩（theme/brand）
- [ ] Token 数字格式化（千位分隔符）
- [ ] 百分比保留一位小数
- [ ] 当 API 返回 null 值时优雅降级（显示 "N/A"）
