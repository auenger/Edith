# Source Skills

Source skills 帮助 agents 访问并解释公司的数字资产。

## 什么情况下创建 source skill

当某个 source：
- 被反复查询，
- 在结构上很重要，
- 没有 guidance 就容易让人困惑，
- 或者是解锁高价值 workflow 所必需时，

就应该创建或提议 source skill。

典型 sources 包括：
- docs 和 wiki systems
- issue trackers
- 会议记录 / minutes
- customer feedback systems
- analytics 或 BI tools
- support systems
- incident records
- release notes 或 changelogs

## source skill 应该做什么

一个强的 source skill 应该告诉 agent：
- 为什么这个 source 很重要，
- 如何访问它，
- 如何高效搜索它，
- 如何解释它的结构或 taxonomy，
- 它最适合处理哪些任务，
- 如果这个 source 参与 EDITH loop，应写回到哪里。

## source skill 不应该做什么

它不应该：
- 大段复制 source 内容，
- 如果自己只是 router，却假装是 权威来源，
- 或在没有明确标记 公司专属 的情况下硬编码公司细节。

## 最小可用结构

对于每个重要 source，尽量记录：
- source name
- source type
- owner
- access path
- auth 或 tool expectations
- search / navigation strategy
- routing rules
- update triggers
- constraints 或 caveats

## 质量标准

当一个新 agent 读完它后，能立刻知道：
- 这个 source 是否相关，
- 如何快速抵达正确材料，
- 以及如何避免浪费时间或误读 source，

那么这个 source skill 就是有用的。
