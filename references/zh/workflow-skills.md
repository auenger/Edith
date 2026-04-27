# Workflow Skills

Workflow skills 帮助 agents 完成横跨 sources、repos、teams 或 roles 的真实交付闭环。

## 什么情况下创建 workflow skill

当任务：
- 触及多个 repos，
- 横跨角色边界，
- 需要 交接点 或分阶段 产物，
- 或者反复遵循同一条闭环时，

就应该创建或提议 workflow skill。

典型例子：
- PRD → SPEC → implementation → QA → docs
- bug intake → triage → fix → regression → release note
- incident → diagnosis → patch → postmortem → hardening

## workflow skill 应该定义什么

workflow skill 应把这些内容明确下来：
- trigger 或 start condition
- preconditions
- main stages
- required 产物
- 每个阶段应使用哪些 sources 与 repos
- 推进到下一步所需的 证据
- 结束时的 回写 expectations
- 已知的 stop conditions 或 escalation paths

## 保持高杠杆

workflow skill 应该负责编排，不应该变成 repo-local instructions 的复制品。

repo-specific execution 要引用 repo skills。
source-specific retrieval 要引用 source skills。
让 workflow skill 聚焦在闭环本身。

## 有用的输出模式

当另一个 owner 或 agent 能一眼看明白：
- 这条闭环是什么，
- 它为什么存在，
- 各步骤按什么顺序发生，
- 交接点 发生在哪里，
- 什么算成功，

那么这个 workflow skill 就是强的。
