# Tasks: feat-subagent-support

## Task Breakdown

### 1. SubAgent 管理器核心
- [ ] 创建 `agent/src/tools/subagent.ts`
- [ ] 实现 `SubAgentManager` 类
- [ ] 实现 `execute()` — 单个子代理执行（spawn 子进程）
- [ ] 实现 `parallel()` — 并行执行（Promise.allSettled）
- [ ] 实现 `chain()` — 串行链式执行（前一个输出→下一个输入）
- [ ] 超时控制（默认 120s，可配置）
- [ ] 并发限制（同时最多 3 个）
- [ ] 错误处理和结果解析

### 2. Agent 定义文件
- [ ] 创建 `agent/src/agents/` 目录
- [ ] 创建 `base-agent.md` — 基础模板
- [ ] 创建 `distill-agent.md` — 蒸馏专用代理定义
- [ ] 创建 `explore-agent.md` — 探索专用代理定义

### 3. 命令注册与集成
- [ ] 在 `agent/src/extension.ts` 注册 `/delegate` 命令
- [ ] 实现任务类型自动识别（蒸馏→distill-agent，探索→explore-agent）
- [ ] 实现结果回传和渲染

### 4. 渲染模块
- [ ] 创建 `agent/src/theme/subagent-panel.ts`
- [ ] 实现子代理状态面板（等待/执行/完成）
- [ ] 实现结果摘要渲染

### 5. 集成测试
- [ ] 测试 `/delegate` 基本执行
- [ ] 测试超时场景
- [ ] 测试子代理执行失败的处理
- [ ] 测试主 session 不被阻塞

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | pi SDK 无内置 subAgent，采用子进程模式 |
