---
name: <workflow-skill-name>
description: 帮助 agents 为 <company/product> 执行 <workflow-name> workflow。当工作横跨多个 sources、repos、roles 或 产物，并需要一条具有明确阶段、证据和 回写 的可重复闭环时使用。
---

# <Workflow Skill Title>

## Purpose

说明：
- 这个 workflow 覆盖哪条闭环，
- 它为什么重要，
- 它旨在解锁什么业务结果。

## Trigger 与 Preconditions

- **Trigger**: `<start condition>`
- **Preconditions**: `<required context>`
- **In-scope repos**: `<repos>`
- **In-scope sources**: `<sources>`

## Workflow Stages

1. **Start** — `<what happens first>`
2. **Work** — `<main execution>`
3. **Verify** — `<证据 or checks>`
4. **Writeback** — `<how JARVIS and/or source systems are updated>`

## Handoffs

| Stage | Main owner / role | Artifact | Next handoff |
|---|---|---|---|
| `<stage>` | `<owner>` | `<artifact>` | `<next>` |

## Routing Rules

在以下情况使用这个 workflow skill：
- `<trigger>`
- `<trigger>`

不要把它用于：
- `<out of scope>`
- `<out of scope>`

## Verification

- [ ] start condition 已明确
- [ ] 交接点 与 产物 已明确
- [ ] success 证据 已明确
- [ ] 回写 真正闭合了闭环，而不是在交付处停止
