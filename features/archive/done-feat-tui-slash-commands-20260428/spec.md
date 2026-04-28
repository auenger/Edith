# Feature: feat-tui-slash-commands TUI 斜杠命令系统

## Basic Information
- **ID**: feat-tui-slash-commands
- **Name**: "TUI 斜杠命令系统（本地拦截 + 命令补全 + Ink 渲染）"
- **Priority**: 75
- **Size**: M
- **Dependencies**: []
- **Parent**: feat-tui-interaction-optimize
- **Children**: []
- **Created**: 2026-04-29

## Description
重构 TUI 斜杠命令处理架构：

1. **所有 `/` 命令本地拦截** — 当前所有斜杠命令都走 `sendUserMessage` → `session.prompt()`，导致输入卡住、计数错误、渲染位置不对。应在 TUI 层统一拦截。
2. **命令自动补全** — 输入 `/` 时弹出命令列表，模糊过滤，方向键选择，Tab/Enter 确认，类似 IDE 快捷输入。
3. **输出通过 Ink 渲染** — 命令输出不再用 `console.log`，而是通过 Ink 组件渲染在消息区域。

## 命令清单与分类

| 命令 | 说明 | 类型 | 是否需要 SDK |
|------|------|------|-------------|
| `/context` | 上下文统计面板 | local | 否（读 shared-stats） |
| `/status` | 知识库状态总览 | local | 否（读 shared-stats + config） |
| `/new` | 新建会话 | session | 是（session.reset） |
| `/clear` | 清除上下文 | session | 是（session.clear） |
| `/compact` | 压缩上下文 | session | 是（session.compact） |
| `/explore` | 项目探索 | agent | 是（SubAgent 执行） |
| `/delegate` | 任务委派 | agent | 是（SubAgent 执行） |
| `/init` | 工作区初始化 | agent | 是（扫描 + 蒸馏） |

### 类型说明
- **local**: 纯本地操作，即时返回，不调用 SDK
- **session**: 需要 SDK session 方法，但不需要 LLM 推理
- **agent**: 需要完整的 agent 处理链（可能包含 LLM 调用）

## Root Cause
```
当前流程（有问题）:
  用户输入 "/xxx" → InputArea.onSubmit → handleSubmit → sendUserMessage(text)
    → dispatch(ADD_USER_MESSAGE)         ← 错误：计数 +1
    → dispatch(START_ASSISTANT_MESSAGE)   ← 错误：创建空 assistant
    → setIsProcessing(true)              ← 错误：输入框禁用
    → session.prompt(text)               ← SDK 拦截命令，但 TUI 状态已错

期望流程:
  用户输入 "/xxx" → handleSubmit 检测斜杠前缀
    → local 命令: 直接读取数据 → dispatch SYSTEM_MESSAGE → 即时渲染
    → session 命令: 调用 SDK 方法 → dispatch SYSTEM_MESSAGE → 渲染结果
    → agent 命令: 设置 isProcessing=true → session.prompt() → 正常流
```

## User Value Points
1. **即时响应** — local/session 命令立即执行，不卡输入，不显示 "Processing..."
2. **命令发现** — 输入 `/` 即可看到所有可用命令及说明，降低记忆负担
3. **快速选择** — 模糊过滤 + 键盘选择，减少打字量

## Context Analysis
### Reference Code
- `agent/src/tui/InputArea.tsx` — 输入处理，所有输入直接走 onSubmit，无命令感知
- `agent/src/tui/useAgentSession.ts:234-250` — sendUserMessage 不区分命令
- `agent/src/tui/App.tsx:68-77` — handleSubmit 仅拦截 exit/quit
- `agent/src/tui/types.ts` — Message 类型定义（需扩展 system 类型）
- `agent/src/tui/ContentArea.tsx` — 消息渲染（需支持 system 消息）
- `agent/src/extension.ts:427-734` — 所有命令注册（8 个命令）
- `agent/src/theme/context-panel.ts` — renderContextPanel 纯字符串函数
- `agent/src/shared-stats.ts` — 跨层数据共享

### Related Features
- feat-tui-interaction-optimize (pending, parent)
- feat-tui-context-fix (completed)
- feat-tui-layout (completed)

## Technical Solution

### 1. 命令注册表（CommandRegistry）

新建 `agent/src/tui/command-registry.ts`：

```typescript
export interface SlashCommand {
  name: string;          // e.g. "context"
  description: string;   // e.g. "显示上下文统计信息"
  type: "local" | "session" | "agent";
  aliases?: string[];    // e.g. ["ctx"]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "context", description: "显示上下文统计信息", type: "local", aliases: ["ctx"] },
  { name: "status", description: "知识库状态总览", type: "local" },
  { name: "new", description: "新建会话（清除所有上下文）", type: "session" },
  { name: "clear", description: "清除上下文（保留 system prompt）", type: "session" },
  { name: "compact", description: "压缩上下文（摘要历史）", type: "session" },
  { name: "explore", description: "快速浏览项目结构", type: "agent" },
  { name: "delegate", description: "委派任务给子代理", type: "agent" },
  { name: "init", description: "初始化 EDITH 工作区", type: "agent" },
];
```

### 2. 命令补全组件（CommandPalette）

新建 `agent/src/tui/CommandPalette.tsx`：

```tsx
// 当输入以 "/" 开头时，在输入框上方显示匹配命令列表
// 支持：
// - 模糊过滤（输入 "/con" 匹配 "context"）
// - 方向键上下选择
// - Tab 补全、Enter 确认
// - Esc 关闭
// - 高亮当前选中项
```

核心逻辑：
- 从 `SLASH_COMMANDS` 过滤匹配项
- 用 `useInput` 捕获方向键/Tab/Esc
- 选中后回调 `onSelect(command)`
- 渲染为一列带颜色的选项，选中项高亮

### 3. InputArea 重构

```tsx
// InputArea.tsx 增加：
// - 检测输入是否以 "/" 开头
// - 显示 CommandPalette
// - 新增 onCommand 回调（区别于 onSubmit）
interface InputAreaProps {
  onSubmit: (value: string) => void;       // 普通消息
  onCommand: (command: string) => void;    // 斜杠命令
  isProcessing: boolean;
}
```

### 4. App.tsx 命令路由

```typescript
const handleCommand = useCallback(async (command: string) => {
  const cmd = command.slice(1); // 去掉 "/"
  const def = SLASH_COMMANDS.find(c => c.name === cmd || c.aliases?.includes(cmd));

  if (!def) {
    dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: `未知命令: /${cmd}` });
    return;
  }

  switch (def.type) {
    case "local":
      handleLocalCommand(cmd);
      break;
    case "session":
      await handleSessionCommand(cmd);
      break;
    case "agent":
      await sendUserMessage(command); // agent 命令仍走 session.prompt()
      break;
  }
}, [...]);
```

### 5. Message 类型扩展

在 `types.ts` 中：
- 添加 `"system"` message type
- 添加 `ADD_SYSTEM_MESSAGE` action
- ContentArea 中 system 消息用特殊样式渲染（带边框、图标）

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望斜杠命令即时响应、有补全提示，不在消息列表中产生垃圾条目。

### Scenarios (Given/When/Then)

#### Scenario 1: 命令补全弹出
- Given Agent 已启动
- When 用户在输入框输入 `/`
- Then 输入框上方显示所有可用命令列表（名称 + 描述）
- And 每个命令有视觉高亮区分

#### Scenario 2: 命令模糊过滤
- Given 命令列表已显示
- When 用户继续输入 `/con`
- Then 列表过滤为只显示匹配的命令（如 "context"）
- And 无匹配时显示 "无匹配命令"

#### Scenario 3: 键盘选择命令
- Given 命令列表已显示且有多项
- When 用户按 ↓ 键
- Then 高亮移到下一项
- When 用户按 Tab 或 Enter
- Then 输入框填充选中命令名称 + " "
- And 命令列表关闭

#### Scenario 4: /context 即时响应
- Given Agent 已完成至少一轮对话
- When 用户输入 `/context` 并提交
- Then Context 面板立即显示在消息区域（< 100ms）
- And 无 "Processing…" 指示器
- And 输入框立即可用
- And userMessages 计数不变

#### Scenario 5: /new 新建会话
- Given Agent 已完成多轮对话
- When 用户输入 `/new` 并提交
- Then 上下文被清除
- And 显示 "新会话已创建" 提示
- And 输入框立即可用

#### Scenario 6: /explore 走 agent 流
- Given Agent 已启动
- When 用户输入 `/explore` 并提交
- Then isProcessing = true，显示 "Processing…" 和思考指示器
- And 结果正常渲染

#### Scenario 7: 未知命令
- When 用户输入 `/unknown`
- Then 显示 "未知命令: /unknown" 错误提示
- And 输入框立即可用

### UI/Interaction Checkpoints
- 命令列表样式：Arc Reactor 配色（cyan 高亮选中项）
- 命令列表位置：输入框正上方，不遮挡已有消息
- 补全动画：列表出现/消失平滑
- 适配窄终端（< 50 列）

### General Checklist
- [x] 所有 8 个命令通过新系统处理
- [x] local/session 命令不触发 isProcessing
- [x] agent 命令正常走 LLM 流
- [x] 不影响 pi SDK extension 注册（保持兼容）
- [x] 无 console.log 绕过 Ink 渲染

## Merge Record
- **Completed**: 2026-04-29T00:15:00+08:00
- **Merged Branch**: feature/tui-slash-commands
- **Merge Commit**: 8129d57
- **Archive Tag**: feat-tui-slash-commands-20260428
- **Conflicts**: None
- **Verification**: All 7 Gherkin scenarios passed (code analysis)
- **Stats**: 5 files changed, 304 insertions, 14 deletions
