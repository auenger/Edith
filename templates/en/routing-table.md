---
name: <company-edith-routing-table>
description: Layer 0 routing table. Always loaded. Maps services to one-line descriptions and key constraints. Must stay under 500 tokens.
layer: 0
token_budget: 500
---

# <Company> Service Routing Table

## Services

| Service | Role | Stack | Owner | Key Constraints |
|---------|------|-------|-------|-----------------|
| `<service-a>` | <one-line role> | <tech stack> | <owner> | <1-2 critical constraints> |
| `<service-b>` | <one-line role> | <tech stack> | <owner> | <1-2 critical constraints> |
| `<service-c>` | <one-line role> | <tech stack> | <owner> | <1-2 critical constraints> |

## Quick-Ref Paths

| Service | Quick-Ref (Layer 1) | Full Skill (Layer 2) |
|---------|---------------------|----------------------|
| `<service-a>` | `skills/<service-a>/quick-ref.md` | `skills/<service-a>/SKILL.md` |
| `<service-b>` | `skills/<service-b>/quick-ref.md` | `skills/<service-b>/SKILL.md` |
| `<service-c>` | `skills/<service-c>/quick-ref.md` | `skills/<service-c>/SKILL.md` |

## Loading Rules

- Layer 0 (this file): always loaded — identify which services a task touches
- Layer 1 (quick-ref): load when task enters a specific service
- Layer 2 (distillate fragments): load specific fragment when implementing a detail

## Scaling

If this table exceeds 500 tokens, split by domain:

```
routing-table.md          ← meta-routing (domain → sub-table)
routing-table-<domain>.md ← per-domain service tables
```

Keep the meta-routing table under 500 tokens. Load sub-tables on demand.
