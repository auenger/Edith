---
name: <source-skill-name>
description: 帮助 agents 为 <company/product> 访问并解释 <source-name>。当任务需要把这个 source 作为 JARVIS workflow 的一部分来检索、搜索、路由或写回时使用。
---

# <Source Skill Title>

## Purpose

说明：
- 这个 source 是什么，
- 它为什么重要，
- 哪些任务应该路由到这里。

## Access

- **Owner**: `<owner>`
- **Access path**: `<url/cli/path>`
- **Auth / tooling**: `<tooling>`
- **Constraints**: `<constraints>`

## 如何使用这个 source

- 首选的搜索或导航模式
- 关键 taxonomy / labels / structure
- 什么内容在这里容易找到
- 什么内容在这里容易被误读

## 路由规则

在以下情况使用这个 source：
- `<trigger>`
- `<trigger>`

不要把这个 source 当成以下内容的唯一 权威来源：
- `<boundary>`
- `<boundary>`

## 回写规则

如果工作需要写回这里，请说明：
- 写回什么，
- 由谁写回，
- 在什么触发条件下写回。

## Verification

- [ ] 新 agent 能快速找到正确材料
- [ ] skill 说明了如何访问这个 source
- [ ] 路由边界已明确
- [ ] 回写预期已明确，或明确说明故意留空
