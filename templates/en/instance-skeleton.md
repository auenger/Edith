# Instance Skeleton Example

```text
<company>-edith/
├── README.md
├── MAINTENANCE.md
├── modules/
│   ├── <module-a>/
│   │   ├── overview.md
│   │   ├── known-issues.md
│   │   ├── decisions.md
│   │   ├── rejected-features.md
│   │   └── test-coverage.md
│   └── <module-b>/
│       └── ...
├── sources/
│   ├── <source-a>/
│   │   └── README.md
│   └── <source-b>/
│       └── README.md
├── cross-cutting/
│   ├── module-interactions.md
│   └── version-changelog.md
├── tools/
│   ├── README.md
│   └── <scripts or manuals>
├── skills/
│   ├── <company-edith>/
│   │   ├── SKILL.md              # Entry Skill (workflow)
│   │   └── routing-table.md      # Layer 0 (<500 tokens, always loaded)
│   ├── <repo-a>/
│   │   ├── SKILL.md              # Full Repo Skill (Layer 2 reference)
│   │   └── quick-ref.md          # Layer 1 quick-ref card (<2000 tokens)
│   └── <repo-b>/
│       ├── SKILL.md
│       └── quick-ref.md
├── distillates/
│   ├── <repo-a>/                 # Layer 2 fragments
│   │   ├── _index.md
│   │   ├── 01-overview.md
│   │   ├── 02-api-contracts.md
│   │   ├── 03-data-models.md
│   │   └── 04-business-logic.md
│   └── <repo-b>/
│       ├── _index.md
│       └── ...
└── _raw/ or _exports/
    ├── README.md
    └── <optional snapshots>
```

## Notes

- This is a topology example, not a claim that every folder must exist on day one.
- Start with the smallest useful subset for the first real loop.
- Add historical depth through continued writeback rather than generating fake maturity.
