# [Company / Product] JARVIS

面向 agents 的 [Company / Product] 知识路由与综合层。

这个仓库帮助 agents：
- 先找到正确的 module 或 source，
- 路由到正确的 repo 或 system，
- 理解重复出现的问题与决策，
- 并在真实工作后写回可持续复用的学习。

## 这个仓库的用途

用 2-4 句话说明：
- 这个 JARVIS 覆盖什么，
- 谁在使用它，
- 当前 rollout 范围 是什么，
- 它正帮助优先解锁哪条业务闭环。

## 使用正确的入口

- business-domain question → `modules/<module>/overview.md`
- source-specific question → `sources/<source>/README.md`
- cross-domain question → `cross-cutting/*.md`
- reusable helper or manual → `tools/*`
- 维护 JARVIS 本身 → 根目录 `MAINTENANCE.md`

## 仓库结构

```text
<company>-jarvis/
├── README.md
├── MAINTENANCE.md
├── modules/
├── sources/
├── cross-cutting/
├── tools/
├── skills/
└── _raw/ or _exports/
```

## 当前 rollout 范围

- included modules: `<list>`
- included sources: `<list>`
- included workflows: `<list>`
- explicitly out of scope: `<list>`

## 如何使用这个 JARVIS

### START
先阅读最相关的稳定入口。

### WORK
在真实的 repo、source system 或 workflow surface 中开展工作。

### END
把可持续复用的知识写回正确文件，而不是让学习结果被困在聊天记录里。
