---
name: <repo-skill-name>
description: Help agents operate in the <repo-name> repository for <company/product>. Use when a task becomes repo-specific and requires local source-of-truth guidance, runtime entrypoints, validation flows, or repo-specific working rules.
---

# <Repo Skill Title>

## Purpose

State:
- what this repo is for,
- what role it plays in the wider business or architecture,
- and what kinds of tasks should route here.

## Repo Context

- **Repo**: `<repo>`
- **Owners**: `<owners>`
- **Default branch**: `<branch>`
- **Primary paths**: `<paths>`

## Working Rules

Include only the highest-signal repo-local guidance:
- where to start reading
- build / run / test / lint entrypoints
- runtime or verification entrypoints
- local anti-patterns
- local writeback locations

## Boundaries

This repo skill should own:
- `<repo-local truth>`
- `<repo-local truth>`

This repo skill should defer back to EDITH for:
- company-wide routing
- cross-repo workflow coordination
- organization-level rollout and ownership

## Task Routing

Use this skill when:
- `<trigger>`
- `<trigger>`

Escalate or hand off when:
- `<handoff condition>`
- `<handoff condition>`

## Verification

- [ ] a new agent can enter the repo and know how to validate work
- [ ] repo-local truth is explicit
- [ ] cross-repo concerns are not unnecessarily duplicated here
- [ ] the next file or skill to read is obvious
