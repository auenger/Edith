---
name: <repo-skill-name>
description: 帮助 agents 在 <company/product> 的 <repo-name> repository 中开展工作。当任务变成 repo-specific，需要本地 权威来源 guidance、runtime 入口点、validation flows 或 repo-specific working rules 时使用。
---

# <Repo Skill Title>

## Purpose

说明：
- 这个 repo 是做什么的，
- 它在更大业务或架构中的角色，
- 哪些类型的任务应该路由到这里。

## Repo Context

- **Repo**: `<repo>`
- **Owners**: `<owners>`
- **Default branch**: `<branch>`
- **Primary paths**: `<paths>`

## Working Rules

只包含最高信号的 repo-local guidance：
- 从哪里开始阅读
- build / run / test / lint 入口点
- runtime 或 verification 入口点
- 本地 anti-patterns
- 本地 回写 locations

## Boundaries

这个 repo skill 应负责：
- `<repo 内事实>`
- `<repo 内事实>`

这个 repo skill 应回交给 JARVIS 处理：
- company-wide routing
- cross-repo workflow coordination
- organization-level rollout 与 ownership

## Task Routing

在以下情况使用此 skill：
- `<trigger>`
- `<trigger>`

在以下情况升级或 hand off：
- `<handoff condition>`
- `<handoff condition>`

## Verification

- [ ] 新 agent 进入 repo 后能知道如何验证工作
- [ ] repo 内事实 已明确
- [ ] cross-repo concerns 没有在这里被不必要地重复
- [ ] 下一份该读的文件或 skill 很明显
