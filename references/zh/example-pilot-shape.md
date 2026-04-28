# 示例 Pilot 形状

只把它当作一种形状，不要把它当成字面上的公司蓝图。

## Pilot 目标

证明 agents 能以更少的重新发现成本和更少的等待时间，帮助完成一条重复发生的跨 repo 闭环。

## 示例范围

### 纳入的 sources
- 产品文档
- issue tracker
- release notes

### 纳入的 repos
- frontend repo
- backend repo
- docs repo
- test 或 automation repo

### 纳入的 workflow
- bug intake → triage → fix → regression → release note

## 示例输出

- `edith-build-brief.md`
- `source-inventory.md`
- `repo-inventory.md`
- `workflow-inventory.md`
- `skill-backlog.md`
- `ownership-map.md`
- `rollout-plan.md`
- 1 个 source skill 骨架
- 2 个 repo skill 骨架
- 1 个 workflow skill 骨架

## 这个 试点 应该证明什么

- agents 能更快找到正确的历史上下文
- agents 能更可靠地路由到正确的 repos
- agents 能遵循一条真实闭环，而不是停在一个局部答案上
- humans 能继续推进 EDITH rollout，而不是把它当成一次性产物

## 这个 试点 不需要证明什么

- 全公司覆盖
- 每个 source 都已接入
- 每个 repo skill 都已完成
- 完美治理

第一个 试点 应该证明方向，而不是穷尽性。
