# Tasks: feat-subagent-support

## Task Breakdown

### 1. SubAgent 管理器核心
- [x] 创建 `agent/src/tools/subagent.ts`
- [x] 实现 `SubAgentManager` 类
- [x] 实现 `execute()` — 单个子代理执行（spawn 子进程）
- [x] 实现 `parallel()` — 并行执行（Promise.allSettled）
- [x] 实现 `chain()` — 串行链式执行（前一个输出→下一个输入）
- [x] 超时控制（默认 120s，可配置）
- [x] 并发限制（同时最多 3 个）
- [x] 错误处理和结果解析

### 2. Agent 定义文件
- [x] 创建 `agent/src/agents/` 目录
- [x] 创建 `base-agent.md` — 基础模板
- [x] 创建 `distill-agent.md` — 蒸馏专用代理定义
- [x] 创建 `explore-agent.md` — 探索专用代理定义

### 3. 命令注册与集成
- [x] 在 `agent/src/extension.ts` 注册 `/delegate` 命令
- [x] 实现任务类型自动识别（蒸馏→distill-agent，探索→explore-agent）
- [x] 实现结果回传和渲染

### 4. 渲染模块
- [x] 创建 `agent/src/theme/subagent-panel.ts`
- [x] 实现子代理状态面板（等待/执行/完成）
- [x] 实现结果摘要渲染

### 5. 集成测试
- [x] TypeScript 编译通过（类型检查零错误）
- [x] 命令注册结构正确
- [x] 子代理管理器单元逻辑验证
- [x] 注：运行时测试需要 pi CLI 可用，验证阶段覆盖

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | pi SDK 无内置 subAgent，采用子进程模式 |
| 2026-04-28 | Implementation complete | 全部 4 个模块实现，类型检查通过 |
