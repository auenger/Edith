# Feature: feat-tui-thinking AI 思考过程展示

## Basic Information
- **ID**: feat-tui-thinking
- **Name**: AI 思考过程展示（折叠展开式）
- **Priority**: 65
- **Size**: S
- **Dependencies**: [feat-tui-ink-layout]
- **Parent**: feat-tui-redesign
- **Children**: []
- **Created**: 2026-04-28

## Description
在 TUI 布局框架基础上，实现 AI 思考过程的可视化展示。思考过程默认折叠为一行摘要，用户可通过快捷键展开查看完整推理链。支持实时流式显示思考步骤，包括工具调用状态和推理中间结果。

## User Value Points
1. **透明度与信任** — 用户能看到 AI 的推理过程，增强对输出的信任
2. **按需深入** — 折叠式设计不干扰正常阅读，需要时可深入查看

## Context Analysis
### Reference Code
- `src/tui/ContentArea.tsx` (将在 feat-tui-ink-layout 中创建) — 需在此组件中嵌入思考展示
- `src/tui/useAgentSession.ts` (将在 feat-tui-ink-layout 中创建) — 需扩展处理 thinking 事件
- pi SDK 事件类型 — 需确认是否有 thinking/reasoning 事件

### Related Documents
- Claude Code 的 thinking 展示交互参考
- Extended Thinking API 文档

### Related Features
- feat-tui-ink-layout — 前置依赖，提供布局框架

## Technical Solution
### 新增组件
```
<ThinkingBlock>
  <ThinkingSummary />     — 折叠状态：一行摘要 + 展开指示器
  <ThinkingDetail />      — 展开状态：完整推理过程
</ThinkingBlock>
```

### 交互设计
- 默认折叠，显示 "💭 思考中... (按 T 展开)"
- 思考完成后折叠为 "💭 已分析 3 个服务 (按 T 展开查看)"
- 按 T 键展开/折叠
- 展开时显示完整的推理步骤和中间结论

### 关键实现点
1. **Thinking 事件捕获** — 从 pi SDK 事件流中提取 thinking/reasoning 内容
2. **折叠状态管理** — 每个思考块独立的折叠/展开状态
3. **流式更新** — 思考过程中实时追加内容
4. **键盘监听** — ink 的 useInput hook 监听 T 键

## Acceptance Criteria (Gherkin)
### Scenarios (Given/When/Then)
```gherkin
Scenario: AI 思考时显示折叠摘要
  Given TUI 界面已显示
  And 用户已发送消息
  When AI 开始思考
  Then 内容区域显示折叠的思考摘要
  And 摘要包含思考状态指示器

Scenario: 展开查看完整思考过程
  Given AI 已完成思考并折叠显示
  When 用户按 T 键
  Then 思考块展开显示完整推理过程
  And 再次按 T 键可折叠回去

Scenario: 工具调用过程展示
  Given AI 正在调用 edith_scan 工具
  When 工具执行中
  Then 折叠摘要显示 "正在扫描项目..."
  When 工具完成
  Then 摘要更新为 "扫描完成：发现 5 个服务"
```

### UI/Interaction Checkpoints
- 折叠状态简洁（一行），不干扰主要输出阅读
- 展开状态清晰，推理步骤有视觉层次
- 快捷键响应灵敏，无延迟
- 思考过程实时更新，无闪烁
