# [Company / Product] EDITH

[Company / Product] knowledge routing and synthesis layer for agents.

This repository helps agents:
- find the right module or source first,
- route into the right repo or system,
- understand recurring issues and decisions,
- and write back durable learnings after real work.

## What this repository is for

State in 2-4 sentences:
- what this EDITH covers,
- who uses it,
- what the current rollout scope is,
- and what business loop it is helping unlock first.

## Use the right entrypoint

- business-domain question → `modules/<module>/overview.md`
- source-specific question → `sources/<source>/README.md`
- cross-domain question → `cross-cutting/*.md`
- reusable helper or manual → `tools/*`
- maintain the EDITH itself → root `MAINTENANCE.md`

## Repository shape

```text
<company>-edith/
├── README.md
├── MAINTENANCE.md
├── modules/
├── sources/
├── cross-cutting/
├── tools/
├── skills/
└── _raw/ or _exports/
```

## Current rollout scope

- included modules: `<list>`
- included sources: `<list>`
- included workflows: `<list>`
- explicitly out of scope: `<list>`

## How to work with this EDITH

### START
Read the most relevant stable entrypoint first.

### WORK
Do the work in the real repo, source system, or workflow surface.

### END
Write back durable knowledge to the correct file instead of leaving the learning trapped in chat history.
