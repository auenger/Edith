# Feature: feat-tui-redesign TUI 交互重设计

## Basic Information
- **ID**: feat-tui-redesign
- **Name**: TUI 交互重设计（类 Claude Code / Gemini CLI）
- **Priority**: 70
- **Size**: L
- **Dependencies**: []
- **Parent**: null
- **Children**: [feat-tui-ink-layout, feat-tui-thinking, feat-tui-streaming, feat-tui-context-monitor]
- **Created**: 2026-04-28

## Description
将 EDITH Agent 的终端交互从简单的 readline REPL 升级为全屏 TUI 交互界面，参考 Claude Code 和 Gemini CLI 的交互范式：底部输入框、顶部 Logo 区域、中间内容区域展示 AI 思考过程和最终输出。使用 ink (React for CLI) 框架实现组件化 UI。

## User Value Points
1. **全屏布局体验** — 从线性终端输出升级为结构化全屏布局，输入框在底部、Logo 在顶部、内容在中间，提供更专业的交互体验
2. **思考过程可视化** — AI 的推理/思考过程以折叠式展示，用户可按需展开查看完整推理链，增强透明度和信任感
3. **流式输出增强** — Markdown 渲染、代码高亮、进度指示器等富文本输出，提升信息可读性

## Context Analysis
### Reference Code
- `agent/src/agent-startup.ts` — 当前 REPL 循环，需替换为 ink 渲染
- `agent/src/theme/` — 现有主题系统（color-engine, banner），需适配 ink 组件
- `agent/src/system-prompt.ts` — System Prompt，保持不变
- `agent/src/extension.ts` — Extension 路由层，保持不变

### Related Documents
- Claude Code CLI 交互范式参考
- Gemini CLI 交互范式参考

### Related Features
- feat-tui-branding (已完成) — 现有品牌化组件可作为 ink 组件的参考

## Technical Solution
### 架构决策
- **TUI 框架**: ink (React for CLI) — 组件化开发、社区活跃、Claude Code 同款
- **思考展示**: 折叠展开式 — 默认折叠为一行摘要，按键展开查看完整过程
- **拆分策略**: 4 个子特性依次交付

### 子特性依赖链
```
feat-tui-ink-layout (基础布局)
  ├── feat-tui-thinking (思考过程展示)
  ├── feat-tui-streaming (流式输出增强)
  └── feat-tui-context-monitor (上下文监控与预警)
                     ↑ 也依赖 feat-context-command
```

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH Agent 用户，我希望终端交互界面像 Claude Code 一样专业流畅，这样我能更清晰地看到 AI 的思考过程和输出结果。

### Scenarios (Given/When/Then)
```gherkin
Scenario: 启动 Agent 看到全屏 TUI 界面
  Given EDITH Agent 已安装并配置
  When 用户运行 npm start
  Then 应显示全屏 TUI 界面
  And 顶部显示 EDITH Logo
  And 底部显示输入框
  And 中间区域为空白内容区

Scenario: 输入消息并收到回复
  Given Agent TUI 界面已显示
  When 用户在输入框中输入消息并按回车
  Then 中间区域应显示用户消息
  And AI 回复应以流式方式显示在中间区域

Scenario: 查看 AI 思考过程
  Given AI 正在处理请求
  When AI 产生思考过程
  Then 应显示折叠的思考摘要
  When 用户按快捷键展开
  Then 应显示完整思考过程
```

### General Checklist
- [ ] 所有子特性通过验证
- [ ] 现有功能（scan/distill/route/query）在新 TUI 下正常工作
- [ ] 终端兼容性测试（macOS Terminal, iTerm2, VS Code Terminal）
