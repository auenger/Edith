# Checklist: feat-extension-core

## Tool Registration（工具注册）
- [ ] jarvis_scan 工具注册到 pi SDK（name + description + TypeBox schema + stub handler）
- [ ] jarvis_distill 工具注册到 pi SDK
- [ ] jarvis_route 工具注册到 pi SDK
- [ ] jarvis_query 工具注册到 pi SDK
- [ ] 每个工具注册包裹 try/catch，失败不中断 Agent 启动
- [ ] 未成功注册的工具在 jarvis-status 中标记为 unavailable

## loadSkill() 隐藏加载
- [ ] loadSkill() 函数实现，路由映射 scan→document-project / distill→distillator / route→requirement-router
- [ ] Skill 目录不存在时返回友好错误（不暴露内部名称）
- [ ] 用户可见的提示信息不含 Skill 内部名称

## Event Hooks（事件钩子）
- [ ] `pi.on("tool_call")` 事件钩子已注册
- [ ] 仅过滤 jarvis_* 工具调用
- [ ] 审计日志包含：工具名、时间戳、参数摘要
- [ ] 日志不包含 Skill 内部名称（document-project 等）

## Commands — jarvis-init & jarvis-status
- [ ] jarvis-init 命令注册，返回 stub 提示
- [ ] jarvis-status 命令注册，显示工具状态 + workspace + 配置状态

## Commands — /new（新会话）
- [ ] /new 命令注册到 pi SDK
- [ ] 破坏性操作前显示确认提示 [y/N]
- [ ] 确认后调用 pi.forkSession() 或等效 API
- [ ] 旧 session 文件保留
- [ ] 取消确认时继续当前对话

## Commands — /clear（清除上下文）
- [ ] /clear 命令注册到 pi SDK
- [ ] 破坏性操作前显示确认提示 [y/N]
- [ ] 确认后清空 message history
- [ ] 保留 system prompt
- [ ] 显示 "Context cleared" 提示

## Commands — /compact（压缩上下文）
- [ ] /compact 命令注册到 pi SDK
- [ ] Phase 1: 调用 LLM 生成对话摘要
- [ ] 用摘要替换历史消息，保留最近 N 轮
- [ ] 显示压缩统计 "Compacted: X → summary + N turns"
- [ ] 空历史或过短历史的边界情况处理

## Error Handling（错误处理）
- [ ] 未知命令显示友好提示 + 可用命令列表
- [ ] 工具注册失败 graceful degradation（不崩溃）
- [ ] session 操作失败有明确错误提示

## Code Quality
- [ ] 无 TODO/FIXME 残留（stub handler 用明确的 placeholder 标记除外）
- [ ] 遵循项目命名约定（工具名 snake_case，文件名 kebab-case）
- [ ] 不引入不必要的抽象层

## JARVIS Discipline
- [ ] Skills 不暴露给用户（用户只感知对话接口）
- [ ] 审计日志不暴露 Skill 内部名称
- [ ] 不编造代码中不存在的事实
- [ ] 索引不倾倒（路由/摘要模式，不复制原文）

## Documentation
- [ ] spec.md Technical Solution section 已填写
- [ ] task.md Progress Log 已更新
- [ ] 所有 12 个 Gherkin scenario 可验证
