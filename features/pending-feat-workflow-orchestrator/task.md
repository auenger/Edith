# Tasks: feat-workflow-orchestrator

## Task Breakdown

### 1. 阶段定义与类型系统
- [ ] 定义 `Phase` 枚举和类型（8 个阶段）
- [ ] 为每个阶段定义 goal / output / stop condition / required artifacts
- [ ] 定义阶段间数据流类型（上游产出 → 下游输入）

### 2. 状态机引擎
- [ ] 实现 `WorkflowEngine`（状态机核心）
- [ ] 实现 forward（推进到下一阶段）
- [ ] 实现 backward（回退到上一阶段）
- [ ] 实现 skip（跳过可选阶段）
- [ ] 实现 validate（检查当前阶段 stop condition）

### 3. 状态持久化
- [ ] 设计 `.edith/workflow-state.json` schema
- [ ] 实现 StateManager（读写状态文件）
- [ ] 实现中断恢复逻辑
- [ ] 实现阶段产出物路径管理

### 4. 工具调度器
- [ ] 实现阶段→工具映射表
- [ ] 实现 Dispatcher（根据阶段自动选择工具）
- [ ] 集成现有 4 个工具的调用
- [ ] 处理工具调用结果→阶段产出物的转换

### 5. 人工确认门控
- [ ] 实现 Gate 机制（暂停等待确认）
- [ ] 实现确认清单生成
- [ ] 实现确认/拒绝交互流程
- [ ] 与 REPL 集成确认提示

### 6. 与现有架构集成
- [ ] 修改 extension.ts 注册 workflow 相关命令
- [ ] 修改 system-prompt.ts 加入阶段感知
- [ ] 修改 agent-startup.ts 加入恢复检查
- [ ] 确保不影响现有手动工具调用

## Progress Log

| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | Blocked — 待设计决策 |
