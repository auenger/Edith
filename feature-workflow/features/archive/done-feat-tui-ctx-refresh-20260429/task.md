# Tasks: feat-tui-ctx-refresh

## Task 1: CTX 状态栏在 tool_execution_end 时增量更新
- [ ] 在 `tool_execution_end` handler 中调用 `session.getSessionStats()` 获取最新 token 统计
- [ ] 调用 `mon.record()` + `setMonitorData()` 触发状态栏刷新
- [ ] 确保仅在 `context_monitor.enabled` 时执行

## Task 2: 非 Anthropic provider fallback 逻辑
- [ ] 当 `getContextUsage()` 返回 undefined 时，从 `tokens.total` 和 model `contextWindow` 手动计算 percent
- [ ] 应用到 `agent_end` 和 `tool_execution_end` 两个路径

## Task 3: ThinkingIndicator token 计数修复
- [ ] 新增 `accumulatedTokens` state 追踪真实 token 数
- [ ] 在 `tool_execution_end` 和 `text_delta`（如有 SDK 数据）时更新
- [ ] 修改 ThinkingIndicator props，传入实际 token 数
- [ ] 优先显示实际 token，回退字符估算

## Task 4: TypeScript 编译验证
- [ ] `npx tsc --noEmit` 通过
- [ ] 无类型错误
