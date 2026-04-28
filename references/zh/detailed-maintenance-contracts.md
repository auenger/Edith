# 详细维护契约

当通用的 write contracts 过于抽象，而你又需要针对 company EDITH instance 的逐文件指导时，请使用本文件。

## `overview.md`

### Purpose
为业务 module 提供稳定入口。

### Should contain
- 这个 module 做什么
- 它不做什么
- 权威来源 在哪里
- 哪些 code / docs / issue / test 位置重要
- 常见的下一跳调查路径

### Should not contain
- bugfix logs
- 复制来的源文档
- 大段实现叙事
- 应该放到别处的 rejected-feature 理由

## `known-issues.md`

### Purpose
捕获重复出现的故障模式，而不是按时间顺序罗列 ticket 历史。

### Should contain
- 触发或症状模式
- 可能的根因
- 影响提示
- 调查入口
- 必要时的代表性参考

### Should not contain
- 日志式逐日记录
- ticket 正文倾倒
- 完整评论串
- 大段复制 diff

## `decisions.md`

### Purpose
记录持久的产品或工程选择，以及为什么这样选。

### Should contain
- 决策摘要
- 上下文
- 取舍或边界
- 原因
- 持续性的影响

### Should not contain
- 短暂的实现细节
- 原始 MR 历史
- 从未变成真实决策的探索笔记

## `rejected-features.md`

### Purpose
保留某些方向为什么被拒绝。

### Should contain
- 提案摘要
- 拒绝理由
- 拒绝背后的边界或原则
- 如果适用，给出有用的替代建议

### Should not contain
- 没有解释的模糊“won’t do”标签
- 完整 issue 讨论串复制

## `test-coverage.md`

### Purpose
说明哪些行为类型已被保护，以及哪些重要空白仍然存在。

### Should contain
- 重要的已覆盖行为
- 有意义的缺口
- 已被保护的边界条件

### Should not contain
- 测试运行日志
- 复制测试代码
- 机械式逐 MR 测试日记

## `sources/<source>/README.md`

### Purpose
为某个 source 提供稳定路由文档。

### Should contain
- 这个 source 是什么
- 如何访问它
- 什么时候使用它
- 如何搜索或导航它
- 重要 caveats

### Should not contain
- source 内容的完整镜像

## `cross-cutting/module-interactions.md`

### Purpose
展示 modules 之间如何相互影响。

### Should contain
- 依赖模式
- 共享的边界规则
- 可能的 blast radius 线索

### Should not contain
- 已由 module 文档拥有的重复细节

## `cross-cutting/version-changelog.md`

### Purpose
把 agents 引导到版本层面的变更理解。

### Should contain
- release 或 version 索引条目
- 指向更深 权威来源 的路由链接或引用
- 在有用时给出简明摘要

### Should not contain
- 如果已有更好 source，却仍复制臃肿的 release notes

## `skills/<company-edith>/SKILL.md`

### Purpose
作为进入 EDITH instance 的主 agent 入口。

### Should contain
- 应该先看哪里
- 如何在 modules、sources、cross-cutting docs 和 tools 之间做选择
- 什么时候向外路由到 repo 内事实
- 如何处理 回写

### Should not contain
- 完整维护手册
- 来自每个 module 或 source 的重复内容
