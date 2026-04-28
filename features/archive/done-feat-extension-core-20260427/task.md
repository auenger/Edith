# Tasks: feat-extension-core

## Task Breakdown

### 1. Preparation — API 调研
- [x] 阅读 pi SDK Extension API 文档，确认 `registerTool` / `registerCommand` / `on` 的完整签名 — Scenario 1, 2, 3
- [x] 确认 pi SDK session 管理 API（forkSession、clearHistory 等）— Scenario 4, 5, 6
- [x] 阅读 `EDITH-PRODUCT-DESIGN.md` § 2.3 Extension 核心设计伪代码
- [x] 阅读 `edith-skills/INTEGRATION.md` 了解 Skill 加载协议

### 2. Tool Registration — 工具注册（Scenario 1, 2, 7）
- [x] 定义 edith_scan 工具的 TypeBox 参数 schema（name, path, options） — Scenario 1
- [x] 定义 edith_distill 工具的 TypeBox 参数 schema（source, options） — Scenario 1
- [x] 定义 edith_route 工具的 TypeBox 参数 schema（requirement） — Scenario 1
- [x] 定义 edith_query 工具的 TypeBox 参数 schema（question, context） — Scenario 1
- [x] 实现四个 stub handler（返回 "Not implemented yet"） — Scenario 1
- [x] 调用 `pi.registerTool()` 注册四个工具，包裹 try/catch — Scenario 1, 7
- [x] 工具注册失败时记录错误、标记不可用、不中断启动 — Scenario 7

### 3. loadSkill() Hidden Loader（Scenario 3）
- [x] 实现 `loadSkill(skillName: string)` 函数框架
- [x] 实现路由映射：scan → document-project / distill → distillator / route → requirement-router / query → (待定)
- [x] 验证 Skill 目录存在性，不存在时返回友好错误
- [x] 确保函数内部名称不暴露给用户（用户只看到 "正在执行知识扫描..." 等友好提示）

### 4. Event Hooks — 事件钩子（Scenario 10）
- [x] 注册 `pi.on("tool_execution_start")` 事件钩子 — Scenario 10
- [x] 过滤 edith_* 工具调用事件
- [x] 记录审计日志：工具名、时间戳、参数摘要
- [x] 确保日志中不包含 Skill 内部名称（document-project 等）

### 5. Command Registration — edith-init & edith-status（Scenario 11, 12）
- [x] 注册 `edith-init` 命令，handler 为 stub（显示 "not implemented yet"） — Scenario 11
- [x] 注册 `edith-status` 命令，handler 返回当前状态概览 — Scenario 12
  - 已注册工具数量及状态（available/unavailable）
  - workspace 路径
  - 配置加载状态

### 6. /new — 新会话命令（Scenario 4, 9）
- [x] 注册 `/new` 命令到 pi SDK — Scenario 4
- [x] 实现确认提示 "This will discard current context. Continue? [y/N]" — Scenario 9
- [x] 确认后调用 `ctx.newSession()` 创建空白新 session — Scenario 4
- [x] 保留旧 session 文件引用（不删除） — Scenario 4
- [x] 确认取消时取消操作，继续当前对话 — Scenario 9

### 7. /clear — 清除上下文命令（Scenario 5, 9）
- [x] 注册 `/clear` 命令到 pi SDK — Scenario 5
- [x] 实现确认提示（同 /new） — Scenario 9
- [x] 确认后创建新空 session 替代当前 session（等效于清空 history） — Scenario 5
- [x] 保留 system prompt 不清除 — Scenario 5
- [x] 显示 "Context cleared" 确认提示 — Scenario 5

### 8. /compact — 压缩上下文命令（Scenario 6）
- [x] 注册 `/compact` 命令到 pi SDK — Scenario 6
- [x] Phase 1 实现：调用 pi SDK 内置 `ctx.compact()` 触发压缩
- [x] 配置 customInstructions（保留最近 3 轮原始对话） — Scenario 6
- [x] 显示压缩结果（tokensBefore → tokensAfter） — Scenario 6
- [x] 处理压缩失败的边界情况（onError callback）

### 9. Error Handling — 错误处理（Scenario 7, 8）
- [x] 实现未知命令友好提示，列出可用命令 — Scenario 8
- [x] 工具注册异常时 graceful degradation — Scenario 7
- [x] session 操作失败时的错误提示（newSession 不可用等）

### 10. Verification — 验收验证
- [ ] Scenario 1: 四个工具注册后通过 `edith-status` 确认可发现
- [ ] Scenario 2: 输入 "扫描 xxx" 验证 edith_scan 被触发
- [ ] Scenario 3: loadSkill 不暴露内部名称
- [ ] Scenario 4: /new 创建新 session
- [ ] Scenario 5: /clear 清空 history
- [ ] Scenario 6: /compact 压缩后历史减少
- [ ] Scenario 7: 模拟注册失败，验证 graceful degradation
- [ ] Scenario 8: 输入 /unknown-command 验证友好提示
- [ ] Scenario 9: /new 和 /clear 的确认/取消流程
- [ ] Scenario 10: 工具调用后检查审计日志
- [ ] Scenario 11: edith-init 返回 stub 提示
- [ ] Scenario 12: edith-status 显示完整状态

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Added OUT scope, 6 error/sad-path scenarios (7-12), mapped all tasks to scenarios |
| 2026-04-27 | Tasks 1-9 implemented | Extension core routing layer code complete. All tools, commands, event hooks implemented in extension.ts |
