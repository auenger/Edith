# Tasks: feat-tui-tool-rendering

## Task Breakdown

### 1. 数据模型重构 (types.ts)
- [ ] 新增 `ToolCallBlock` 接口（id, toolName, args, status, result, timestamp）
- [ ] 新增 `DisplayItem` 联合类型（Message | ToolCallBlock | ThinkingBlock）
- [ ] 新增 `toolCallReducer` 处理 tool call 状态变化
- [ ] 简化 `ThinkingBlock` 类型（移除 toolCalls 字段）
- [ ] 更新 `MessageAction` 联合类型

### 2. 展开式 Tool Call 组件 (ToolCallBlock.tsx)
- [ ] 创建 `ToolCallBlock` 组件
- [ ] Running 状态：⏺ + Spinner + 工具名 + 参数摘要
- [ ] Complete 状态：⏺ + 工具名 + 结果（⎿ 格式，截断到终端宽度）
- [ ] Error 状态：⏺ + 红色工具名 + 错误信息

### 3. 消息流交错渲染 (ContentArea.tsx)
- [ ] 合并 messages + toolCallBlocks + thinkingBlocks 为统一 DisplayItem[]
- [ ] 按 timestamp 排序
- [ ] 交错渲染：Message → Thinking → ToolCall → ToolCall → Text

### 4. 事件处理分离 (useAgentSession.ts)
- [ ] tool_execution_start/end 创建独立 ToolCallBlock（不再写入 ThinkingBlock）
- [ ] 新增 toolCallBlocks state + reducer
- [ ] 暴露 toolCallBlocks 给 ContentArea

### 5. 清理 ThinkingBlock.tsx
- [ ] 移除 toolCalls 渲染逻辑
- [ ] 保留纯思考内容的折叠/展开
- [ ] 更新 ThinkingDetail 组件

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 需求分析 + spec 编写 |
