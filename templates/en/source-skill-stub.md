---
name: <source-skill-name>
description: Help agents access and interpret <source-name> for <company/product>. Use when the task requires retrieving, searching, routing through, or writing back to this source as part of the JARVIS workflow.
---

# <Source Skill Title>

## Purpose

Explain:
- what this source is,
- why it matters,
- and what kinds of tasks should route here.

## Access

- **Owner**: `<owner>`
- **Access path**: `<url/cli/path>`
- **Auth / tooling**: `<tooling>`
- **Constraints**: `<constraints>`

## How to Use This Source

- preferred search or navigation pattern
- key taxonomy / labels / structure
- what is easy to find here
- what is easy to misread here

## Routing Rules

Use this source when:
- `<trigger>`
- `<trigger>`

Do not use this source as the only source of truth for:
- `<boundary>`
- `<boundary>`

## Writeback Rules

If work should write back here, explain:
- what gets written back,
- by whom,
- and under what trigger.

## Verification

- [ ] a new agent can find the right material quickly
- [ ] the skill states how to access the source
- [ ] routing boundaries are explicit
- [ ] writeback expectations are explicit or intentionally absent
