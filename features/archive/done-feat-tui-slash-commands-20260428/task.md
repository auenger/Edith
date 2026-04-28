# Tasks: feat-tui-slash-commands

## Task Breakdown

### 1. 命令注册表
- [x] 新建 `agent/src/tui/command-registry.ts`
- [x] 定义 SlashCommand 接口（name, description, type, aliases）
- [x] 注册全部 8 个命令（context, status, new, clear, compact, explore, delegate, init）

### 2. Message 类型扩展
- [x] `types.ts` 添加 `"system"` 消息类型（已有）
- [x] `messageReducer` 添加 `ADD_SYSTEM_MESSAGE` action（已有）
- [x] `ContentArea.tsx` 添加 system 消息渲染样式（已有，dimColor）

### 3. 命令补全组件
- [x] 新建 `agent/src/tui/CommandPalette.tsx`
- [x] 模糊过滤逻辑（前缀匹配 + alias 匹配）
- [x] 键盘导航（↑↓ 选择、Tab 补全、Enter 确认、Esc 关闭）
- [x] 渲染列表（选中高亮、Arc Reactor 配色）
- [x] 空结果提示

### 4. InputArea 重构
- [x] 新增 `onCommand` 回调 prop
- [x] 检测 "/" 前缀，显示 CommandPalette
- [x] "/" 输入时显示全部命令，继续输入过滤
- [x] 选中/回车时触发 onCommand 而非 onSubmit

### 5. App.tsx 命令路由
- [x] 实现 `handleCommand` 命令分发（local / session / agent）
- [x] `handleLocalCommand`: context → 读 shared-stats → dispatch SYSTEM_MESSAGE
- [x] `handleSessionCommand`: new/clear/compact → sendSlashCommand → dispatch 结果
- [x] agent 命令: 走 sendUserMessage（保持现有行为）
- [x] handleSubmit 增加斜杠命令检测，路由到 handleCommand

### 6. 验证与清理
- [x] 验证所有 8 个命令正常工作
- [x] 验证 local/session 命令不触发 isProcessing
- [x] 验证命令补全交互流畅
- [x] 验证输出渲染在消息区域（不在 Banner 上方）
- [x] 验证 Token 计数不受 local 命令影响

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | All tasks completed | TypeScript compiles clean |
