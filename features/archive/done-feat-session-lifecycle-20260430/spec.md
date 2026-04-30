# Feature: feat-session-lifecycle Session 生命周期命令修复

## Basic Information
- **ID**: feat-session-lifecycle
- **Name**: Session 生命周期命令修复（/new, /clear, /compact）
- **Priority**: 85
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-29

## Description

TUI 的 `/new`、`/clear`、`/compact` 三个 session 管理命令当前无法真正操作 SDK session 状态。
UI 层显示"executed"但底层 session 没有变化，导致用户以为命令执行了，但 AI 仍保留完整旧上下文。

### 根因分析

**`/new` 和 `/clear` — `commandContextActions` 未绑定：**

pi SDK 的 extension command 机制分两层：
1. `bindCore()` — 绑定通用 actions（compact、getContextUsage 等），AgentSession 初始化时自动调用
2. `bindCommandContext()` — 绑定会话管理 actions（newSession、fork、switchSession、reload），需要宿主通过 `session.bindExtensions({ commandContextActions: {...} })` 注入

TUI 的 `useAgentSession.ts` 只调用了 `createAgentSession()` 从未调用 `session.bindExtensions()`。
extension handler 里的 `ctx.newSession()` 调用的是 runner 的默认 no-op：
```javascript
newSessionHandler = async () => ({ cancelled: false }); // 什么都没做
```

**`/compact` — SDK 已绑定但 TUI 不感知结果：**

`compact` 通过 `bindCore()` 正确绑定到了 `AgentSession.compact()`，命令确实执行了压缩。
但 TUI 没有监听 `compaction_start`/`compaction_end` 事件，context stats 不刷新，用户看不到效果。

**TUI state 清空（已修复）：**

本 feature 创建前已提交的修复：在 `types.ts` 添加 `CLEAR_ALL` action，`App.tsx` 在 `/new` `/clear` 后
dispatch 三个 reducer 的 `CLEAR_ALL` + `resetSessionState()` 重置 counter/monitor。
这部分已生效（UI 消息列表确实清空），但 SDK session 未变。

### 参考实现

pi SDK 内置 CLI（`interactive-mode.js`）的正确做法：

```javascript
// interactive-mode.js:1128-1191
async bindCurrentSessionExtensions() {
    const uiContext = this.createExtensionUIContext();
    await this.session.bindExtensions({
        uiContext,
        commandContextActions: {
            waitForIdle: () => this.session.agent.waitForIdle(),
            newSession: async (options) => {
                // 1. 停止 loading 动画
                // 2. 调用 this.runtimeHost.newSession(options) — AgentSessionRuntime
                // 3. 刷新 UI（renderCurrentSessionState）
                // 4. 返回 result
            },
            fork: async (entryId, options) => {
                // 调用 this.runtimeHost.fork(entryId, options)
                // 刷新 UI
            },
            switchSession: async (sessionPath, options) => {
                // 调用 this.handleResumeSession(sessionPath, options)
            },
            reload: async () => {
                // 调用 this.handleReloadCommand()
            },
        },
        shutdownHandler: () => { ... },
        onError: (error) => { ... },
    });
}
```

关键：内置 CLI 使用 `AgentSessionRuntime`（`agent-session-runtime.js`）管理 session 生命周期，
`runtimeHost.newSession()` 会：
1. 通知 extension `session_shutdown` 事件
2. 销毁旧 session
3. 创建新 SessionManager + AgentSession
4. 绑定新 extension runner
5. 通知 extension `session_start` 事件
6. 调用 `rebindSession` 回调更新宿主引用

## User Value Points

1. **真正的会话重置** — `/new` 和 `/clear` 应该让 AI 完全丢失旧上下文，开始全新对话
2. **上下文压缩可观测** — `/compact` 后用户应看到 token 数下降的反馈
3. **会话状态一致性** — TUI 显示的状态应与 SDK 内部状态一致，不应出现"看起来清了但 AI 还记得"

## Context Analysis

### Reference Code

| 文件 | 关键内容 |
|------|----------|
| `agent/src/tui/useAgentSession.ts` | session 创建（`initialize()` + `switchProfile()`）、`sessionRef` 管理、事件订阅 |
| `agent/src/tui/App.tsx` | 命令处理 `handleCommand()`、CLEAR_ALL dispatch（已修复） |
| `agent/src/tui/types.ts` | `CLEAR_ALL` action（已修复）、reducer |
| `agent/src/extension.ts:570-603` | `/new`、`/clear`、`/compact` extension command handler |
| `pi-coding-agent/dist/core/agent-session.js:1607` | `bindExtensions()` API |
| `pi-coding-agent/dist/core/agent-session.js:1664` | `_applyExtensionBindings()` — bindCommandContext + setUIContext |
| `pi-coding-agent/dist/core/agent-session.js:1683` | `_bindExtensionCore()` — compact 已绑定 |
| `pi-coding-agent/dist/core/agent-session-runtime.js` | `AgentSessionRuntime` — newSession/fork/switchSession 的参考实现 |
| `pi-coding-agent/dist/core/extensions/runner.js:186-202` | `bindCommandContext()` — 默认 no-op |
| `pi-coding-agent/dist/core/extensions/runner.js:437-467` | `createCommandContext()` — ctx 构造 |
| `pi-coding-agent/dist/modes/interactive/interactive-mode.js:1128-1191` | 内置 CLI 的 bindExtensions 参考实现 |

### Related Documents

- `agent/edith.yaml` — 多 Profile 配置（context_window、thresholds）
- `agent/src/config.ts` — 配置加载

### Related Features

- `feat-tui-slash-commands`（已完成）— TUI 斜杠命令系统
- `feat-tui-ctx-refresh`（已完成）— CTX 动态刷新

## Technical Solution

### 方案 A：绑定 `commandContextActions`（推荐）

在 `useAgentSession.ts` 的 `initialize()` 中，创建 session 后调用 `session.bindExtensions()`，
注入 `commandContextActions`。`newSession` handler 需要实现完整的 session 替换逻辑。

**难点：**
- TUI 没有 `AgentSessionRuntime`，需要自行实现 session 重建
- session 重建需要：销毁旧 session → 创建新 SessionManager → 创建新 AgentSession → 重新 subscribe → 发送 system prompt → 更新 sessionRef
- `switchProfile()` 已有类似逻辑，可提取为共享的 `createNewSession()` helper

**优点：** 与 SDK 设计一致，所有 extension command 都能正常工作

### 方案 B：TUI 直接绕过 extension command

在 `App.tsx` 的 `handleCommand()` 中，对 `/new` `/clear` 直接调用 hook 暴露的
`handleNewSession()` 方法，不经过 `sendSlashCommand` → extension command 路径。

**优点：** 改动最小，不依赖 SDK 内部 API
**缺点：** extension handler 里的 `ctx.newSession()` 仍是 no-op，如果未来有其他路径调用会不工作

### 方案 C：混合方案

- `commandContextActions.newSession` 绑定一个回调，触发 hook 的 `handleNewSession()`
- 这样无论从 TUI 命令还是从 extension 代码调用 `ctx.newSession()` 都能工作

### Compaction 事件监听

无论选哪个方案，都需要在 session subscribe 中处理 compaction 事件：
```typescript
if (event.type === "compaction_end") {
    // 刷新 context stats
    // 在 UI 显示压缩结果（token 变化）
}
```

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望 `/new`、`/clear`、`/compact` 命令能真正操作 session 状态，
而不是只更新 UI 显示。

### Scenarios

#### Scenario 1: /new 完全重置会话
```gherkin
Given 用户已进行多轮对话
And AI 已积累了关于项目的知识
When 用户输入 /new
Then TUI 清空所有消息和 tool call 显示
And SDK 内部创建全新的 session（旧上下文完全丢失）
When 用户发送 "你还记得刚才的对话吗"
Then AI 回复表示不记得之前的对话
And context stats 显示 token 数接近初始值
```

#### Scenario 2: /clear 清除上下文保留 system prompt
```gherkin
Given 用户已进行多轮对话
When 用户输入 /clear
Then TUI 清空所有消息显示
And SDK 创建新 session 并注入 steer message
When 用户发送新问题
And AI 仍具备 system prompt 中定义的能力（如 edith_query 等工具使用能力）
But 不记得 clear 之前的对话内容
```

#### Scenario 3: /compact 压缩历史并刷新统计
```gherkin
Given 用户已进行 10+ 轮对话
And context 占用超过 50%
When 用户输入 /compact
Then SDK 对历史消息进行摘要压缩
And TUI 显示压缩结果（如 "36,000 → 8,000 tokens"）
And context stats 刷新为压缩后的 token 数
When 用户继续对话
Then AI 仍能引用最近 3 轮的原始对话内容
But 早期对话以摘要形式存在
```

#### Scenario 4: session 重建后事件订阅正常
```gherkin
Given /new 或 /clear 已执行
When 用户发送新消息
Then TUI 正常显示 thinking block
And tool call 正常渲染
And context stats 正常更新
And 流式输出正常工作
```

### General Checklist
- [ ] `/new` 后 AI 不记得旧对话
- [ ] `/clear` 后 AI 不记得旧对话但保留 system prompt 能力
- [ ] `/compact` 后 context stats 反映压缩结果
- [ ] session 重建后所有 TUI 功能正常（thinking、tool call、streaming）
- [ ] 无 TypeScript 编译错误
- [ ] `npm run build` 通过
