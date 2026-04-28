# Tasks: feat-tui-context-fix

## Task Breakdown
### 1. 修复 Context 数据准确性
- [x] 分析 pi SDK ExtensionCommandContext 可用 API，确认获取 stats 的正确方式
- [x] 实现 SessionStats 数据收集（方案：shared-stats 模块 + 自维护计数器）
- [x] 更新 `/context` 命令 handler，使用 shared-stats 数据源
- [x] 验证 Tokens、Messages、Tools、Token Detail、Cost 全部正确显示

### 2. 调整 CTX 状态栏位置
- [x] 将 `StatusBarMetrics` 从 App 顶部移到 InputArea 上方
- [x] 确保 CTX/Cache 信息始终可见
- [x] 验证不影响对话内容区域

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 待实现 |
| 2026-04-29 | Implementation complete | shared-stats 桥接 + 状态栏移位 |
