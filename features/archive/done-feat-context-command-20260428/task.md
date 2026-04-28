# Tasks: feat-context-command

## Task Breakdown

### 1. Context Panel 渲染模块
- [x] 创建 `agent/src/theme/context-panel.ts`
- [x] 实现 `renderContextPanel(stats: SessionStats, usage?: ContextUsage)` 函数
- [x] 实现 token 进度条可视化（ANSI 渐变色）
- [x] 实现数字格式化（千位分隔符、百分比）
- [x] 处理 null/undefined 值的优雅降级

### 2. 命令注册
- [x] 在 `agent/src/extension.ts` 中注册 `/context` 命令
- [x] 从 session 获取 `SessionStats` 和 `ContextUsage`
- [x] 调用 `renderContextPanel()` 输出格式化结果
- [x] 错误处理（session 未初始化等）

### 3. 集成测试
- [ ] 启动 Agent，空 session 执行 `/context`
- [ ] 进行若干轮对话后执行 `/context`
- [ ] 验证 token 数字合理性
- [ ] 验证进度条渲染正确

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | pi SDK API 调研确认可用 |
