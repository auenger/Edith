# Feature: feat-extension-core jarvis.ts Extension 核心路由层

## Basic Information
- **ID**: feat-extension-core
- **Name**: jarvis.ts Extension 核心路由层
- **Priority**: 95
- **Size**: M
- **Dependencies**: [feat-agent-scaffold]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

实现 JARVIS Agent 的 Extension 核心路由层：消息拦截 + Skill 自动加载 + 工具注册 + 事件钩子。注册四个核心工具（jarvis_scan / jarvis_distill / jarvis_route / jarvis_query），每个工具通过隐藏式加载对应 Skill 来实现。

## OUT Scope（本 feature 不做）

- **Skill 内部实现** — jarvis_scan/distill/route/query 的实际业务逻辑由后续 feature（feat-tool-*）填充，本 feature 仅提供 stub handler（返回 "Not implemented yet"）
- **loadSkill() 的 Skill 代码执行** — 仅实现加载路由框架，不实现 Skill 代码的实际解析和运行
- **Agent Loop 深度集成** — /compact 的 Phase 2（conversation summarization API 对接）不属于本 feature
- **用户认证 / 权限管理** — 不涉及多用户或权限控制
- **工具参数 schema 的业务验证** — 仅定义 TypeBox schema 结构，不做业务规则校验
- **Session 持久化 / 恢复** — /new 保留旧 session 文件的策略由后续 feature 实现
- **编辑器快捷键** — 不涉及 TUI 编辑器定制（属于 feat-tui-branding 范畴）

## User Value Points

1. **统一工具注册** — 四个 jarvis_* 工具全部注册到 pi SDK，Agent 可通过自然语言触发
2. **Skill 隐藏加载** — 用户不感知 document-project / distillator / requirement-router 的存在
3. **事件钩子** — 工具调用事件可被记录，用于知识生产审计
4. **上下文管理** — /new /clear /compact 命令让用户控制对话上下文，防止历史膨胀

## Context Analysis

### Reference Code
- `JARVIS-PRODUCT-DESIGN.md` § 2.3 Extension 核心设计（含完整伪代码）

### Related Documents
- `jarvis-skills/INTEGRATION.md` — Skill 与 JARVIS 融合方案
- `jarvis-skills/document-project/SKILL.md`
- `jarvis-skills/distillator/SKILL.md`
- `jarvis-skills/requirement-router/SKILL.md`

### Related Features
- feat-agent-scaffold（前置）
- feat-tool-scan / feat-tool-distill / feat-tool-query / feat-tool-route（后续填充实现）

## Technical Solution

Extension 入口 `src/extension.ts`：
- `pi.registerTool()` 注册四个工具（handler 先用 stub/placeholder）
- `pi.registerCommand()` 注册以下命令：
  - `jarvis-init` — 初始化 JARVIS 实例
  - `jarvis-status` — 查看当前状态
  - `/new` — 新会话（TUI 层：fork 为空白 session，重启 Agent 进程）
  - `/clear` — 清除上下文（TUI 层：删除当前 session 文件并重新加载）
  - `/compact` — 压缩上下文（Phase 1: TUI 提示 + 计划摘要；Phase 2: 深入 Agent Loop 做 conversation summarization）
- `pi.on("tool_call")` 注册事件钩子，记录 jarvis_* 工具调用
- `loadSkill()` 隐藏加载函数，内部路由到对应 Skill 目录

### Extension API 使用方式

```typescript
export default function (pi: ExtensionAPI) {
  pi.registerTool({ name, description, parameters, handler });
  pi.registerCommand("cmd-name", { description, handler });
  pi.on("tool_call", async (event, ctx) => { ... });
}
```

### 上下文管理命令实现策略（混合方案）

**Phase 1 — TUI 层可用（本 feature）：**
- `/new` → 调用 `pi.forkSession()` 创建空白新 session，或重启 Agent 进程
- `/clear` → 清空当前 session 的 message history 文件，重载为空上下文
- `/compact` → 拦截命令，将当前对话摘要作为 system message 写入，然后截断历史消息

**Phase 2 — Agent Loop 深度集成（后续 feature）：**
- `/compact` → 接入 pi SDK 的 conversation summarization API（如可用），真正的增量压缩
- 支持压缩策略配置（token 阈值、保留最近 N 轮等）

## Acceptance Criteria (Gherkin)

### User Story
作为 JARVIS Agent，我需要在 Extension 层注册所有 jarvis_* 工具，以便用户通过自然语言对话触发知识生产和查询。

### Scenarios

**Scenario 1: 四个工具注册成功**
```gherkin
Given Agent 已启动
Then jarvis_scan 工具已注册且可被发现
And jarvis_distill 工具已注册且可被发现
And jarvis_route 工具已注册且可被发现
And jarvis_query 工具已注册且可被发现
```

**Scenario 2: 自然语言触发工具**
```gherkin
Given Agent 正在运行
When 用户输入 "扫描 user-service"
Then jarvis_scan 工具被触发（System Prompt 路由）
```

**Scenario 3: Skill 隐藏加载**
```gherkin
Given jarvis_scan 工具被触发
When loadSkill("document-project") 被调用
Then Skill 被加载并执行
And 用户看不到 "document-project" 这个名称（只看到友好提示）
```

### Scenario 4: /new 开启新会话
```gherkin
Given Agent 正在运行且有对话历史
When 用户输入 "/new"
Then 创建一个新的空白 session
And 上下文被清空，开始全新对话
And 旧 session 文件保留（可恢复）
```

### Scenario 5: /clear 清除上下文
```gherkin
Given Agent 正在运行且有对话历史
When 用户输入 "/clear"
Then 当前 session 的 message history 被清空
And Agent 恢复到初始状态（仅保留 system prompt）
And 显示确认提示 "Context cleared"
```

### Scenario 6: /compact 压缩上下文
```gherkin
Given Agent 正在运行且对话历史较长
When 用户输入 "/compact"
Then Agent 将当前对话生成摘要
And 用摘要替换历史消息（保留最近 N 轮原始对话）
And 显示压缩结果 "Compacted: X messages → summary + N recent turns"
```

### Scenario 7: 工具注册失败处理（sad-path）
```gherkin
Given pi SDK Extension API 可用
When pi.registerTool() 因参数无效抛出异常
Then 扩展捕获异常并记录错误日志
And Agent 启动不中断（graceful degradation）
And 未注册的工具标记为不可用
And jarvis-status 命令显示该工具为 "unavailable"
```

### Scenario 8: 未知命令处理（sad-path）
```gherkin
Given Agent 正在运行
When 用户输入 "/unknown-command"
Then 显示友好提示 "Unknown command: /unknown-command"
And 列出可用的 JARVIS 命令（/new, /clear, /compact）
And 不中断当前对话
```

### Scenario 9: 破坏性命令确认提示
```gherkin
Given Agent 正在运行且有对话历史
When 用户输入 "/new" 或 "/clear"
Then 显示确认提示 "This will discard current context. Continue? [y/N]"
When 用户输入 "n"
Then 命令取消，当前对话继续
When 用户输入 "y"
Then 执行对应操作（新会话或清除上下文）
```

### Scenario 10: 事件钩子记录审计日志
```gherkin
Given jarvis_scan 工具已注册
And 事件钩子已注册
When jarvis_scan 工具被调用
Then 事件钩子记录调用信息（工具名、时间戳、参数摘要）
And 日志不暴露 Skill 内部名称
```

### Scenario 11: jarvis-init 命令 stub
```gherkin
Given Agent 正在运行
When 用户输入 "jarvis-init"
Then 显示 "JARVIS initialization wizard (not implemented yet)"
And 返回成功状态（不中断 Agent）
```

### Scenario 12: jarvis-status 命令
```gherkin
Given Agent 正在运行且配置已加载
When 用户输入 "jarvis-status"
Then 显示当前 JARVIS 状态概览
And 包含已注册工具数量和状态
And 包含 workspace 路径
And 包含配置加载状态
```

### General Checklist
- [ ] 四个工具全部注册到 pi SDK
- [ ] 每个工具有完整的参数 schema（TypeBox）
- [ ] loadSkill() 实现隐藏式 Skill 加载
- [ ] 事件钩子记录 jarvis_* 工具调用日志
- [ ] jarvis-init / jarvis-status 命令注册
- [ ] /new 命令实现（TUI 层 fork 空白 session）
- [ ] /clear 命令实现（TUI 层清空 message history）
- [ ] /compact 命令实现（Phase 1: TUI 层摘要 + 截断）
- [ ] 上下文管理命令有确认提示（防止误操作）
- [ ] 工具注册失败不中断 Agent 启动（graceful degradation）
- [ ] 未知命令给出友好提示
- [ ] 审计日志不暴露 Skill 内部名称
