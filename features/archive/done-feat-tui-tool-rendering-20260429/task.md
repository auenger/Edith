# Tasks: feat-tui-tool-rendering

## Task Breakdown

### 1. 数据模型重构 (types.ts)
- [x] 新增 `ToolCallBlock` 接口（id, toolName, args, status, result, timestamp）
- [x] 新增 `DisplayItem` 联合类型（Message | ToolCallBlock | ThinkingBlock）
- [x] 新增 `toolCallReducer` 处理 tool call 状态变化
- [x] 简化 `ThinkingBlock` 类型（移除 toolCalls 字段）
- [x] 更新 `MessageAction` 联合类型（拆分 ToolCallAction）

### 2. 展开式 Tool Call 组件 (ToolCallBlock.tsx)
- [x] 创建 `ToolCallBlock` 组件
- [x] Running 状态：⏺ + Spinner + 工具名 + 参数摘要
- [x] Complete 状态：⏺ + 工具名 + 结果（⎿ 格式，截断到终端宽度）
- [x] Error 状态：⏺ + 红色工具名 + 错误信息

### 3. 消息流交错渲染 (ContentArea.tsx)
- [x] 合并 messages + toolCallBlocks + thinkingBlocks 为统一 DisplayItem[]
- [x] 按 timestamp 排序
- [x] 交错渲染：Message → Thinking → ToolCall → ToolCall → Text

### 4. 事件处理分离 (useAgentSession.ts)
- [x] tool_execution_start/end 创建独立 ToolCallBlock（不再写入 ThinkingBlock）
- [x] 新增 toolCallBlocks state + reducer
- [x] 暴露 toolCallBlocks 给 ContentArea

### 5. 清理 ThinkingBlock.tsx + ToolCallIndicator.tsx
- [x] 移除 toolCalls 渲染逻辑
- [x] 保留纯思考内容的折叠/展开
- [x] 删除已废弃的 ToolCallIndicator.tsx

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 需求分析 + spec 编写 |
| 2026-04-29 | All 5 tasks completed | TypeScript 编译零错误通过 |
