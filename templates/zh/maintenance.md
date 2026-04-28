# [Company / Product] EDITH 维护指南

> EDITH 是 [Company / Product] 的路由、索引与综合层。
> 它不是原始内容镜像，而是帮助 agents 理解公司、进入正确 repos 与工作面，并保留其学习结果的运行基座。

---

## 1. 使命与范围

### Mission

用 2-4 句话说明：
- 为什么这个 EDITH 存在，
- 它服务谁，
- 第一条高价值闭环是什么，
- 它应解锁什么样的组织能力。

### 当前 rollout 的范围

- **Current phase**: `<phase>`
- **Primary loop**: `<workflow or problem area>`
- **Included sources**: `<list>`
- **Included repos**: `<list>`
- **Included workflows**: `<list>`
- **Explicitly out of scope for now**: `<list>`

---

## 2. 数据来源与访问路径

| Source | Type | Owner | Access Path | Auth / Tooling | Notes |
|---|---|---|---|---|---|
| `<source>` | `<docs/wiki/issues/repo/meetings/...>` | `<team/person>` | `<url/cli/path>` | `<tool/token/login>` | `<constraints>` |

让这张表保持务实。它应该帮助未来的 agent 或 owner 知道权威来源在哪里，以及如何到达那里。

---

## 3. Skill Layers

### Source skills

列出帮助 agents 读取公司数字资产的 skills。

| Skill | Target source | Owner | Status | Notes |
|---|---|---|---|---|
| `<skill>` | `<source>` | `<owner>` | `<planned/in-progress/ready>` | `<notes>` |

### Repo skills

列出帮助 agents 在特定 repos 内工作的 skills。

| Skill | Repo | Owner | Status | Notes |
|---|---|---|---|---|
| `<skill>` | `<repo>` | `<owner>` | `<planned/in-progress/ready>` | `<notes>` |

### Workflow skills

列出帮助 agents 完成跨 repo 或跨角色闭环的 skills。

| Skill | Workflow | Owner | Status | Notes |
|---|---|---|---|---|
| `<skill>` | `<workflow>` | `<owner>` | `<planned/in-progress/ready>` | `<notes>` |

---

## 4. 写入契约

### 全局规则

1. **索引，不要倾倒。** 做摘要并负责路由；除非有强理由，否则不要复制原始 source 材料。
2. **模式优先于日志。** 记录重复出现的经验、约束和路由线索，而不是原始时间线历史。
3. **每条事实只有一个归属。** 如果知识属于 repo 内的权威来源，就路由回 repo，不要集中写在这里。
4. **明确标记占位符。** 把可复用方法与公司事实分开。
5. **先读再写。** 追加或改写文件之前，先匹配现有结构。

### 文件职责

| File | Should contain | Should not contain |
|---|---|---|
| `known-issues.md` | 重复故障模式、可能根因、修复线索 | 原始 ticket 倾倒 |
| `decisions.md` | 持久设计决策、取舍、原因 | 偶发 bugfix 备注 |
| `rejected-features.md` | 被拒绝的想法、原因、决策上下文 | 仍在讨论中的活跃提案 |
| `overview.md` | 角色、边界、关键路径、心智模型 | 完整实现细节 |
| source skill docs | 如何到达并解释某个 source | source 内容镜像 |
| repo skill docs | repo-local execution guidance | 应属于 EDITH 的 company-wide policy |
| workflow skill docs | 交接点、产物、证据、回写 | 更适合保留在 repo 中的 repo-local 低层细节 |

---

## 5. 更新触发器

| Event | Update expected |
|---|---|
| 一个重复 bug 被诊断或修复 | 更新 `known-issues.md` 或相关 source/repo skill |
| 做出持久的产品或工程决策 | 更新 `decisions.md` |
| 某个提案被明确拒绝 | 更新 `rejected-features.md` |
| workflow 发生实质变化 | 更新 workflow inventory 或 workflow skill |
| 某个 repo 的操作指引发生变化 | 更新 repo-local skill，并刷新 EDITH 路由 |
| 某个新 data source 变得有战略重要性 | 新增或修订 source skill |
| rollout ownership 发生变化 | 更新 ownership map 与 rollout plan |

---

## 6. Ownership 与 Handoff

| Area | Primary owner | Supporting owner(s) | Notes |
|---|---|---|---|
| source layer | `<owner>` | `<owners>` | |
| repo layer | `<owner>` | `<owners>` | |
| workflow layer | `<owner>` | `<owners>` | |
| maintenance / governance | `<owner>` | `<owners>` | |

一个健康的 EDITH 应当能让另一位 owner 在无需完全重新发现的情况下继续推进。

---

## 7. 闭环：START → WORK → END

### START
- 先阅读相关的 EDITH 路由与历史
- 为当前任务识别最佳 source skills、repo skills 和 workflow skills
- 检查是否已经存在类似故障、决策或被拒绝路径

### WORK
- 在正确的 source、repo 或 workflow context 中执行
- 当工作变成 repo-specific 时，遵循 repo-local instructions
- 记住当前 rollout 范围，不要随意扩大边界

### END
- 写回可持续复用的学习
- 更新正确的层，而不是把笔记随手丢进随机文件
- 记录这项工作是否应该改变 source skill、repo skill、workflow skill 或 governance artifact

---

## 8. Rollout 状态

- **Current maturity**: `<试点 / early rollout / scaled / maintained>`
- **Next highest-leverage additions**:
  1. `<item>`
  2. `<item>`
  3. `<item>`
- **Known gaps**: `<list>`
- **Last review date**: `<date>`
- **Next review trigger**: `<event/date>`
