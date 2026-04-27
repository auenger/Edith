---
name: <workflow-skill-name>
description: Help agents execute the <workflow-name> workflow for <company/product>. Use when work spans multiple sources, repos, roles, or artifacts and requires a repeatable closed loop with clear stages, evidence, and writeback.
---

# <Workflow Skill Title>

## Purpose

State:
- what loop this workflow covers,
- why it matters,
- and what business outcome it is meant to unlock.

## Trigger and Preconditions

- **Trigger**: `<start condition>`
- **Preconditions**: `<required context>`
- **In-scope repos**: `<repos>`
- **In-scope sources**: `<sources>`

## Workflow Stages

1. **Start** — `<what happens first>`
2. **Work** — `<main execution>`
3. **Verify** — `<evidence or checks>`
4. **Writeback** — `<how JARVIS and/or source systems are updated>`

## Handoffs

| Stage | Main owner / role | Artifact | Next handoff |
|---|---|---|---|
| `<stage>` | `<owner>` | `<artifact>` | `<next>` |

## Routing Rules

Use this workflow skill when:
- `<trigger>`
- `<trigger>`

Do not use it for:
- `<out of scope>`
- `<out of scope>`

## Verification

- [ ] the start condition is explicit
- [ ] handoffs and artifacts are explicit
- [ ] evidence of success is explicit
- [ ] writeback closes the loop rather than ending at delivery
