# Tasks: feat-tui-ink-layout

## Task Breakdown

### 1. 依赖安装与构建配置
- [x] 安装 ink, react, ink-text-input, ink-spinner 等依赖
- [x] 更新 tsconfig.json 支持 JSX (jsx: "react-jsx")
- [x] 确认构建系统兼容 .tsx 文件

### 2. 基础组件开发
- [x] 创建 `src/tui/App.tsx` — 根组件，三区域布局
- [x] 创建 `src/tui/BannerArea.tsx` — 顶部 Logo 区域（复用现有 banner 逻辑）
- [x] 创建 `src/tui/ContentArea.tsx` — 中间可滚动内容区域
- [x] 创建 `src/tui/InputArea.tsx` — 底部输入框

### 3. 消息系统
- [x] 创建 `src/tui/MessageList.tsx` — 消息列表组件
- [x] 创建 `src/tui/types.ts` — 消息类型定义（user/assistant/system）
- [x] 实现消息状态管理（useReducer）

### 4. pi SDK 事件桥接
- [x] 重构 `agent-startup.ts` — 用 ink render 替换 readline REPL
- [x] 创建 `src/tui/useAgentSession.ts` — 将 pi SDK 事件转换为 React state
- [x] 实现流式文本追加到消息列表

### 5. 集成测试
- [x] 启动验证：npm start 显示正确布局（smoke test 通过，进程启动无崩溃）
- [x] TypeScript 编译验证：零错误
- [x] 退出验证：exit/quit 命令已实现（useApp().exit）
- [ ] 终端兼容性：macOS Terminal / iTerm2 / VS Code Terminal（需人工验证）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 等待开发 |
| 2026-04-28 | 全部实现完成 | ink 5.2.1 + React 18，4 任务全部完成，终端兼容性需人工验证 |
