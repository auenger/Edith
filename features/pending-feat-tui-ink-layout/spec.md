# Feature: feat-tui-ink-layout TUI 布局框架（ink）

## Basic Information
- **ID**: feat-tui-ink-layout
- **Name**: TUI 布局框架（ink）
- **Priority**: 70
- **Size**: M
- **Dependencies**: []
- **Parent**: feat-tui-redesign
- **Children**: []
- **Created**: 2026-04-28

## Description
使用 ink (React for CLI) 替换当前的 readline REPL，构建全屏 TUI 布局框架。包含三个核心区域：顶部 Logo 区域、中间可滚动内容区域、底部输入框。这是整个 TUI 重设计的基础，后续子特性在此基础上叠加。

## User Value Points
1. **全屏布局体验** — 从线性输出升级为结构化布局，输入框固定在底部，内容区域独立滚动

## Context Analysis
### Reference Code
- `agent/src/agent-startup.ts` — 当前 REPL，需重写为 ink render
- `agent/src/theme/banner.ts` — 现有 Banner，需转换为 ink 组件
- `agent/src/theme/color-engine.ts` — 颜色引擎，ink 有内置 chalk 支持
- `agent/package.json` — 需新增 ink 及相关依赖

### Related Documents
- ink 官方文档: https://github.com/vadimdemedes/ink
- ink-text-input: 输入框组件
- ink-spinner: 加载指示器

### Related Features
- feat-tui-branding (已完成) — 现有主题色和品牌设计，需适配 ink

## Technical Solution
### 依赖变更
```json
{
  "ink": "^5.0.0",
  "ink-text-input": "^6.0.0",
  "ink-spinner": "^5.0.0",
  "react": "^18.0.0"
}
```

### 组件架构
```
<App>
  <BannerArea />       — 顶部 Logo + 状态栏
  <ContentArea>        — 中间可滚动内容
    <MessageList />    — 消息历史列表
    <StatusIndicator />— 当前状态
  </ContentArea>
  <InputArea>          — 底部输入区域
    <TextInput />      — 文本输入框
  </InputArea>
</App>
```

### 关键实现点
1. **ink render 替换 readline** — 使用 `render(<App />)` 启动 TUI
2. **消息状态管理** — React state 管理消息列表和流式内容
3. **pi SDK 事件桥接** — 将 pi SDK 事件流转换为 React state 更新
4. **终端大小适配** — ink 自动处理，但需测试极端情况

## Acceptance Criteria (Gherkin)
### Scenarios (Given/When/Then)
```gherkin
Scenario: 启动显示全屏布局
  Given EDITH Agent 已安装 ink 依赖
  When 用户运行 npm start
  Then 显示全屏 TUI 界面
  And 顶部显示 EDITH Arc Reactor Banner
  And 底部显示带光标的输入框
  And 中间显示就绪状态信息

Scenario: 输入消息并流式显示回复
  Given TUI 界面已显示
  When 用户在输入框输入 "你好" 并按回车
  Then 输入框清空
  And 中间区域显示 "你: 你好"
  And AI 回复以流式方式追加显示

Scenario: 终端窗口大小变化
  Given TUI 界面已显示
  When 用户调整终端窗口大小
  Then 布局自适应调整
  And 内容不截断不溢出
```

### UI/Interaction Checkpoints
- Banner 居中显示，窄终端自动切换 minimal 模式
- 输入框固定底部，光标闪烁，支持多行输入
- 内容区域自动滚动到底部，支持向上滚动查看历史
- 退出命令 (exit/quit) 正常工作
