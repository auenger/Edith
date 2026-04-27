# Checklist: feat-extension-core

## Tool Registration（工具注册）
- [x] jarvis_scan 工具注册到 pi SDK（name + description + TypeBox schema + stub handler）
- [x] jarvis_distill 工具注册到 pi SDK
- [x] jarvis_route 工具注册到 pi SDK
- [x] jarvis_query 工具注册到 pi SDK
- [x] 每个工具注册包裹 try/catch，失败不中断 Agent 启动
- [x] 未成功注册的工具在 jarvis-status 中标记为 unavailable

## loadSkill() 隐藏加载
- [x] loadSkill() 函数实现，路由映射 scan→document-project / distill→distillator / route→requirement-router
- [x] Skill 目录不存在时返回友好错误（不暴露内部名称）
- [x] 用户可见的提示信息不含 Skill 内部名称

## Event Hooks（事件钩子）
- [x] `pi.on("tool_execution_start")` 事件钩子已注册
- [x] 仅过滤 jarvis_* 工具调用
- [x] 审计日志包含：工具名、时间戳、参数摘要
- [x] 日志不包含 Skill 内部名称（document-project 等）

## Commands — jarvis-init & jarvis-status
- [x] jarvis-init 命令注册，返回 stub 提示
- [x] jarvis-status 命令注册，显示工具状态 + workspace + 配置状态

## Commands — /new（新会话）
- [x] /new 命令注册到 pi SDK
- [x] 破坏性操作前显示确认提示 [y/N]
- [x] 确认后调用 ctx.newSession() 或等效 API
- [x] 旧 session 文件保留
- [x] 取消确认时继续当前对话

## Commands — /clear（清除上下文）
- [x] /clear 命令注册到 pi SDK
- [x] 破坏性操作前显示确认提示 [y/N]
- [x] 确认后清空 message history（通过创建新空 session）
- [x] 保留 system prompt
- [x] 显示 "Context cleared" 提示

## Commands — /compact（压缩上下文）
- [x] /compact 命令注册到 pi SDK
- [x] Phase 1: 调用 ctx.compact() 触发 pi SDK 内置压缩
- [x] 用摘要替换历史消息，保留最近 3 轮
- [x] 显示压缩统计（tokensBefore → tokensAfter）
- [x] 空历史或过短历史的边界情况处理（onError callback）

## Error Handling（错误处理）
- [x] 未知命令显示友好提示 + 可用命令列表
- [x] 工具注册失败 graceful degradation（不崩溃）
- [x] session 操作失败有明确错误提示

## Code Quality
- [x] 无 TODO/FIXME 残留（stub handler 用明确的 placeholder 标记除外）
- [x] 遵循项目命名约定（工具名 snake_case，文件名 kebab-case）
- [x] 不引入不必要的抽象层

## JARVIS Discipline
- [x] Skills 不暴露给用户（用户只感知对话接口）
- [x] 审计日志不暴露 Skill 内部名称
- [x] 不编造代码中不存在的事实
- [x] 索引不倾倒（路由/摘要模式，不复制原文）

## Documentation
- [x] spec.md Technical Solution section 已填写
- [x] task.md Progress Log 已更新
- [x] 所有 12 个 Gherkin scenario 可验证（结构验证通过，运行时验证待 e2e-pilot）

## Verification Record
| Date | Status | Summary |
|------|--------|---------|
| 2026-04-27 | PASS | All 12 Gherkin scenarios structurally verified. TypeScript compiles cleanly. 38/38 implementation tasks complete. Runtime verification deferred to feat-e2e-pilot. Evidence: features/active-feat-extension-core/evidence/verification-report.md |
