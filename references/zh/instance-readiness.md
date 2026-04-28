# 实例就绪度

使用这份清单判断一个生成出来的 EDITH 只是 scaffold、试点，还是一个真正可用的 instance。

## Level 0 — Scaffold

当满足以下条件时，scaffold 已存在：
- 根结构存在，
- maintenance guidance 存在，
- 并且有一些 templates 或 inventories。

scaffold **还不能算可运行**。

## Level 1 — Pilot

当满足以下条件时，试点 已存在：
- 一条真实业务闭环已被定义，
- 该闭环涉及的关键 sources、repos 和 workflows 已被盘点，
- 至少部分 source / repo / workflow skills 已有草稿，
- 并且另一个 agent 或 owner 能在此基础上继续，而不必从零开始。

试点 证明的是方向，而不是完整性。

## Level 2 — Operational instance

当满足以下条件时，operational instance 已存在：
- modules 中是实质知识，而不是占位符，
- source 路由 真实且可用，
- repo 内事实 被正确链接，
- workflow 闭环 已明确，
- 并且 START → WORK → END 回写 在实践中真实发生。

在这一层级，EDITH 已经能降低日常工作中的重新发现成本与交接成本。

## Level 3 — Mature instance

当满足以下条件时，mature instance 已存在：
- 历史知识足够深且有结构，
- 重复性故障已被提炼为模式，
- decisions 与 rejected ideas 都带着 rationale 被记录下来，
- cross-cutting knowledge 在被积极维护，
- ownership 稳定，
- 系统能够因真实使用而持续改进。

在这一层级，EDITH 不再只是一个仓库，而是组织思考与工作的组成部分。

## 就绪度检查

在把一个 instance 称为“operational”或“mature”之前，确认：
- [ ] 业务 modules 里有真实的 overview / issue / decision 内容
- [ ] sources 有真实 routing docs
- [ ] 必要时存在 cross-cutting knowledge
- [ ] 存在 公司专属 EDITH skill entry
- [ ] 主闭环所需的 repo skills 和 workflow skills 已存在
- [ ] 回写 发生在真实工作之后，而不只是在 setup 期间
- [ ] 另一位 owner 或 agent 无需重新发现基础信息即可继续
