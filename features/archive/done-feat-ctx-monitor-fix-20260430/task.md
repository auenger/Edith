# Tasks: feat-ctx-monitor-fix

## Task Breakdown

### 1. useAgentSession — ctxTokens fallback 逻辑修复
- [x] 提取 `resolveContextTokens(contextUsage, tokenTotal, ctxWindow)` helper 函数
- [x] 逻辑：优先 contextUsage.tokens → 其次 percent * ctxWindow → 最后 tokenTotal
- [x] 替换 `subscribeSessionEvents` 中 3 处 `ctxTokens = contextUsage?.tokens ?? tokenTotal`

### 2. compaction_end 后强制刷新
- [x] compaction_end 事件中，确保读取最新的 getContextUsage()
- [x] 如果 contextUsage 仍为 null，用 estimated 值刷新 monitor

### 3. 验证
- [x] Anthropic provider：contextUsage.tokens 有值时不走 fallback
- [x] 非 Anthropic provider：用 percent 反推
- [x] `npm run build` 通过

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-30 | 创建 feature | 从 feat-session-lifecycle 实施中发现的问题 |
| 2026-04-30 | 实施完成 | 3/3 tasks done, tsc --noEmit pass |
