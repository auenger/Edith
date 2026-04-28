# Tasks: feat-tui-thinking

## Task Breakdown

### 1. Thinking 事件适配
- [x] 确认 pi SDK 的 thinking/reasoning 事件格式
- [x] 扩展 `useAgentSession.ts` 捕获 thinking 事件
- [x] 定义 ThinkingMessage 类型

### 2. ThinkingBlock 组件开发
- [x] 创建 `src/tui/ThinkingBlock.tsx` — 思考块容器
- [x] 创建 `src/tui/ThinkingSummary.tsx` — 折叠摘要视图
- [x] 创建 `src/tui/ThinkingDetail.tsx` — 展开详情视图

### 3. 交互与状态管理
- [x] 实现折叠/展开状态（thinkingReducer）
- [x] 集成 useInput 监听 Esc 键（折叠全部）
- [x] 流式思考内容实时追加

### 4. 集成与测试
- [x] 将 ThinkingBlock 集成到 ContentArea
- [x] 工具调用过程展示测试
- [x] TypeScript 编译通过

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 等待 feat-tui-ink-layout 完成 |
| 2026-04-28 | Implementation complete | types + ThinkingBlock + useAgentSession + ContentArea + App |
