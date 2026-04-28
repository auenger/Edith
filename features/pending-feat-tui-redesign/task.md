# Tasks: feat-tui-redesign

## Task Breakdown

> 父级索引 feature（split=true），开发工作由子特性承担。

### 1. 子特性协调
- [ ] 确认 feat-tui-ink-layout 接口稳定后，通知 feat-tui-thinking / feat-tui-streaming / feat-tui-context-monitor 可以启动
- [ ] 协调子特性间的共享类型定义（消息类型、状态类型）

### 2. 集成验收
- [ ] 所有 4 个子特性通过各自 checklist 验收
- [ ] 全部子特性合并到 main 后，执行端到端集成测试
- [ ] 验证现有工具（scan/distill/route/query）在新 TUI 下正常工作

### 3. 清理
- [ ] 移除 readline REPL 相关废弃代码
- [ ] 更新 CLAUDE.md / project-context.md 反映新 TUI 架构

## Sub-feature Status
| Sub-feature | Status | Score |
|-------------|--------|-------|
| feat-tui-ink-layout | pending | 84/100 |
| feat-tui-thinking | pending | 82/100 |
| feat-tui-streaming | pending | 76/100 |
| feat-tui-context-monitor | pending | 90/100 |

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 父级索引，4 个子特性 |
