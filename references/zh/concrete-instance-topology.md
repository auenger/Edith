# 具体实例拓扑

一个成熟的 公司专属 JARVIS instance，通常不止需要一个根 README 和一个 maintenance 文件。

## 推荐拓扑

```text
<company>-jarvis/
├── README.md
├── MAINTENANCE.md
├── modules/
│   └── <module>/
│       ├── overview.md
│       ├── known-issues.md
│       ├── decisions.md
│       ├── rejected-features.md
│       └── test-coverage.md
├── sources/
│   └── <source>/
│       └── README.md
├── cross-cutting/
│   ├── module-interactions.md
│   └── version-changelog.md
├── tools/
│   └── <tooling-docs-or-scripts>
├── skills/
│   └── <company-jarvis>/
│       └── SKILL.md
└── _raw/ or _exports/
    └── <optional snapshots or exports>
```

## 为什么每个区域都存在

### `modules/`
用于承载业务领域或可持续存在的能力区域。

每个 module 都应该帮助 agent 回答：
- 这个区域是做什么的，
- 常见问题通常出在哪里，
- 为什么会被设计成现在这样，
- 哪些方向已经被否定过。

### `sources/`
用于 source 路由，而不是业务能力建模。

一个 source 目录应该告诉 agent：
- 这个 source 是什么，
- 如何访问它，
- 什么时候该使用它，
- 不要把它和什么混淆。

### `cross-cutting/`
用于存放横跨多个 modules 的知识。

典型的 cross-cutting 主题包括：
- 版本变更，
- module interactions，
- 架构级模式，
- 系统级约束。

### `tools/`
当 JARVIS instance 需要复用脚本或操作手册时使用。

这里只保留高信号工具。
不要把这里变成一个通用杂物桶。

### `skills/`
用于承载 JARVIS 入口 skill，以及在需要时承载其他帮助 agents 路由进入知识库的 公司专属 skills。

### `_raw/` or `_exports/`
可选。只有在为了可追溯性或离线使用，必须保留原始快照或导出物时才使用。
不要把它和主 JARVIS 知识层混为一谈。

## 拓扑原则

一个成熟的 JARVIS instance 通常是以下能力的组合：
- 中央路由，
- 可持续的业务记忆，
- source 路由，
- cross-cutting synthesis，
- 以及 skill 入口点。

如果其中某一层缺失，instance 可能仍然有用，但还不能算完全成熟。
