# Repo Skills

Repo skills 帮助 agents 在特定 repositories 内开展工作。

## 核心原则

Repo-local truth 通常应当和 repo 放在一起。

JARVIS 可以为 repo skills 建索引、做摘要并路由过去，但默认不应该把所有 repo-local operating detail 都吸收到中心层。

## 什么情况下需要 repo skill

当 agents 在以下方面反复需要帮助时，就应创建或提议 repo skill：
- project structure
- build / test / lint commands
- runtime 入口点
- verification flow
- environment assumptions
- repo-specific conventions
- common bugfix patterns
- safe 回写 locations

## JARVIS 中央层应该保留什么

JARVIS 通常应保留：
- 有哪些 repos 的地图，
- 每个 repo 在业务中的角色，
- 应该使用哪个 repo skill，
- repos 如何在更大的 workflows 中相互连接，
- 以及哪些 company-wide constraints 会塑造 repo 工作。

## 什么应该保持 repo-local

Repo-local skills 通常应负责：
- 权威来源 code paths
- build / run / test guidance
- runtime 与 testability 入口点
- repo-specific constraints 与 anti-patterns
- 详细的本地 workflows

## Handoff 规则

如果一个任务已经变成 repo-specific，就路由到 repo skill。

不要继续把越来越细的 repo instructions 堆进中心 JARVIS 文档中；那类 guidance 应该属于 repo 内部。

## 质量标准

一个强的 repo skill 应该让 agent 进入 repo 后，能快速回答：
- 我现在在哪里？
- 这个 repo 是做什么的？
- 我该如何在这里验证变更？
- 哪些本地规则重要？
- 接下来应该读什么？
