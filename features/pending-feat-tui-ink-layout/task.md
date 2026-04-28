# Tasks: feat-tui-ink-layout

## Task Breakdown

### 1. 依赖安装与构建配置
- [ ] 安装 ink, react, ink-text-input, ink-spinner 等依赖
- [ ] 更新 tsconfig.json 支持 JSX (jsx: "react-jsx")
- [ ] 确认构建系统兼容 .tsx 文件

### 2. 基础组件开发
- [ ] 创建 `src/tui/App.tsx` — 根组件，三区域布局
- [ ] 创建 `src/tui/BannerArea.tsx` — 顶部 Logo 区域（复用现有 banner 逻辑）
- [ ] 创建 `src/tui/ContentArea.tsx` — 中间可滚动内容区域
- [ ] 创建 `src/tui/InputArea.tsx` — 底部输入框

### 3. 消息系统
- [ ] 创建 `src/tui/MessageList.tsx` — 消息列表组件
- [ ] 创建 `src/tui/types.ts` — 消息类型定义（user/assistant/system）
- [ ] 实现消息状态管理（useReducer 或 useState）

### 4. pi SDK 事件桥接
- [ ] 重构 `agent-startup.ts` — 用 ink render 替换 readline REPL
- [ ] 创建 `src/tui/useAgentSession.ts` — 将 pi SDK 事件转换为 React state
- [ ] 实现流式文本追加到消息列表

### 5. 集成测试
- [ ] 启动验证：npm start 显示正确布局
- [ ] 交互验证：输入消息 → 收到流式回复
- [ ] 退出验证：exit/quit 命令正常退出
- [ ] 终端兼容性：macOS Terminal / iTerm2 / VS Code Terminal

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 等待开发 |
