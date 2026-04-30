# Tasks: feat-session-lifecycle

## Task Breakdown

### 1. useAgentSession — Session 创建逻辑重构
- [x] 提取 `initialize()` 和 `switchProfile()` 的重复代码为 `createAndBindSession()` helper
- [x] helper 职责：创建 AgentSession → bindExtensions → subscribe 事件 → 发送 system prompt → 更新 sessionRef
- [x] `switchProfile()` 改为调用 helper
- [x] 提取 `subscribeSessionEvents()` 消除事件订阅重复代码

### 2. useAgentSession — bindExtensions 集成
- [x] 在 `createAndBindSession()` 中调用 `session.bindExtensions()`
- [x] 注入 `commandContextActions`：
  - `waitForIdle` → `() => session.agent.waitForIdle()`
  - `newSession` → 通过 handleNewSessionRef 调用 handleNewSession
  - `fork` / `navigateTree` / `switchSession` / `reload` → stub 实现
- [x] 注入 `onError` 回调，将 extension error 传递到 TUI

### 3. useAgentSession — newSession 实现
- [x] 实现 `handleNewSession(options?)` 方法
- [x] 逻辑：resetSessionState → registerProvider → createAndBindSession → optional steer message
- [x] 暴露给 App.tsx

### 4. useAgentSession — Compaction 事件监听
- [x] 在 session subscribe 中处理 `compaction_start` / `compaction_end` 事件
- [x] compaction_end 时刷新 context stats
- [x] 通过 dispatch 将压缩结果发送到 TUI 显示（tokensBefore → tokensAfter）

### 5. App.tsx — 命令路由更新
- [x] `/new`：调用 `handleNewSession()` 替代 `sendSlashCommand`，然后 CLEAR_ALL + resetSessionState
- [x] `/clear`：调用 `handleNewSession({ withSteer: true })` 替代 `sendSlashCommand`，然后 CLEAR_ALL + resetSessionState
- [x] `/compact`：保留 `sendSlashCommand`（SDK 已绑定），依赖 compaction 事件监听显示结果

### 6. extension.ts — 简化 handler（可选）
- [x] 保持原样 — bindExtensions 的 commandContextActions 做实际工作，extension handler 不再需要改动

### 7. 验证
- [x] `npm run build` 通过
- [x] TypeScript 类型检查通过
- [ ] `/new` 后 AI 不记得旧对话（需运行时验证）
- [ ] `/clear` 后 AI 不记得旧对话（需运行时验证）
- [ ] `/compact` 后 context stats 刷新（需运行时验证）
- [ ] session 重建后 TUI 功能正常（需运行时验证）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | 初始分析完成 | 根因定位：commandContextActions 未绑定 + compaction 事件未监听 |
| 2026-04-29 | 部分 UI 修复已提交 | types.ts CLEAR_ALL + App.tsx dispatch + useAgentSession resetSessionState |
| 2026-04-30 | 完整实现完成 | 重构 useAgentSession：createAndBindSession + subscribeSessionEvents + handleNewSession + bindExtensions + compaction 事件。App.tsx 命令路由更新。Build 通过。 |
