# Tasks: feat-tui-ctx-refresh

## Task Breakdown

### 1. CTX 动态刷新 (useAgentSession.ts)
- [ ] agent_end 事件中增加 fallback：当 contextUsage 为 undefined 时，从 sdkStats 推算
- [ ] 使用 sdkStats.tokens.total 估算 context tokens
- [ ] 使用 config 中的 context_window 作为窗口大小
- [ ] 每次 agent_end 都更新 monitorData（即使数据不完美）

### 2. Context Monitor 估算支持 (context-monitor.ts)
- [ ] 新增 recordFromEstimate() 方法
- [ ] 接受 totalTokens + contextWindow，计算 percent
- [ ] 标记数据来源为 "estimate"

### 3. 状态栏估算显示 (StatusBarMetrics.tsx)
- [ ] 新增 estimated prop
- [ ] 估算值显示 ~ 前缀：`CTX ~9.3K/1.0M`

### 4. Token 计数修复 (useAgentSession.ts + ThinkingIndicator.tsx)
- [ ] 新增 totalTokensUsed state（从 sdkStats 获取）
- [ ] ThinkingIndicator 接收 totalTokens prop
- [ ] 优先显示实际 token 数，fallback 到字符估算

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 需求分析 + spec 编写 |
