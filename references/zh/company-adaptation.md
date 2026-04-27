# 公司适配

每一份生成出来的产物都必须区分可复用方法与公司特定事实。

## 哪些内容必须始终适配

### 1. 业务语言
用公司的真实表述替换通用名词：
- 产品名称
- 团队名称
- 业务领域
- 用户类型
- 模块名称
- 发布术语

### 2. Ownership
识别以下对象的真实 owners：
- 关键数字资产
- repos
- workflows
- 维护与治理职责

不要让 ownership 仅停留在暗示层面。

### 3. 系统访问
把占位符替换成真实的：
- URLs
- CLI access paths
- auth methods
- permissions boundaries
- environments
- operational constraints

### 4. Source of truth
澄清以下事项的 truth 实际存放在哪里：
- 产品决策
- bug 历史
- backlog 与 roadmap
- repo-specific 操作指引
- runbooks 与 incident records

### 5. Workflow boundaries
按照公司的真实交付流程进行适配：
- 哪些 teams 会参与
- 会触及哪些 repos
- 会产出哪些 产物
- 什么证据才算 done
- 回写 应该发生在哪里

### 6. 合规与敏感性
标记所有需要特殊处理的内容：
- customer data
- regulated systems
- security-sensitive repositories
- restricted documents
- approval-only workflows

## 用来强制适配的问题

明确发问：
- 哪些 sources 应该优先纳入，为什么？
- 哪些 repos 才是真正的 execution surfaces？
- 哪条 workflow 应该先被证明？
- 哪些内容必须保持 repo-local？
- 哪些内容可以在中心位置做摘要？
- 每一层由谁负责维护？
- 哪些内容无法推断，必须由人类提供？

## 占位符策略

生成出来的占位符应当：
- 一眼可见，
- 尽量精简，
- 易于替换。

绝不要让占位符看起来像已验证的公司事实。

## 良好适配的结果

良好的适配结果会让下一位 owner 或 agent 很容易分辨：
- 哪些是方法，
- 哪些是公司事实，
- 哪些仍未知，
- 下一步该做什么。
