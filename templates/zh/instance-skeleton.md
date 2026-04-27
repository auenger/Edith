# 实例骨架示例

```text
<company>-jarvis/
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
│   ├── <company-jarvis>/
│   │   ├── SKILL.md              # 入口技能（工作流）
│   │   └── routing-table.md      # Layer 0 路由表（<500 token，常驻）
│   ├── <repo-a>/
│   │   ├── SKILL.md              # 完整 Repo Skill（Layer 2 参考）
│   │   └── quick-ref.md          # Layer 1 速查卡（<2000 token）
│   └── <repo-b>/
│       ├── SKILL.md
│       └── quick-ref.md
├── distillates/
│   ├── <repo-a>/                 # Layer 2 蒸馏片段
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

- 这只是一个拓扑示例，不意味着第一天每个文件夹都必须存在。
- 从第一条真实闭环所需的最小有用子集开始。
- 通过持续 回写 积累历史深度，而不是伪造成熟度。
