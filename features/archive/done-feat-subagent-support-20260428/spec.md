# Feature: feat-subagent-support SubAgent 子代理支持

## Basic Information
- **ID**: feat-subagent-support
- **Name**: SubAgent 子代理支持
- **Priority**: 55
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-28

## Description

调研并实现 EDITH Agent 的 SubAgent（子代理）能力，使主 Agent 能将复杂任务委派给独立的子代理执行。主要用于：
- 大型文档生成（蒸馏输出时委派给专用 Agent）
- 并行探索多个仓库
- 上下文隔离（子代理不污染主 session 上下文）

### 核心诉求
- 生成文档或执行长任务时，避免主 session 上下文被撑爆
- 支持并行处理（如同时扫描多个服务）
- 子代理结果可回传主 session

## User Value Points

### VP1: 任务委派与上下文隔离
主 Agent 将耗时或高 token 消耗的任务委派给子代理，主 session 上下文保持清洁。

### VP2: 并行处理能力
支持同时启动多个子代理处理独立任务（如同时蒸馏多个服务），提升整体效率。

## Context Analysis

### Reference Code
- `agent/src/extension.ts` — 命令注册和事件钩子
- `agent/src/agent-startup.ts` — Session 创建和管理
- `agent/src/tools/distill.ts` — 蒸馏工具（潜在子代理使用场景）

### pi SDK SubAgent 调研结论

**pi SDK 没有内置 SubAgent 类**，但提供了完整的示例实现模式：

#### 实现模式：子进程隔离
```
Main Agent (主进程)
  → spawn("pi", ["run", "--agent", "scout", "--json"])
  → 子进程独立运行，独立上下文窗口
  → 结果通过 stdout JSON 回传
```

#### 三种执行模式
1. **Single**: 单个子代理执行一个任务
2. **Parallel**: 多个子代理并行执行独立任务
3. **Chain**: 多个子代理串行执行，前一个的输出作为下一个的输入

#### Agent 定义格式（Markdown + YAML Frontmatter）
```markdown
---
name: distill-agent
description: 文档蒸馏专用代理
tools: read, write, grep, find
model: claude-haiku-4-5
---
你是一个文档蒸馏专家...
```

#### 关键约束
- 每个子代理是独立子进程，有自己的上下文窗口
- 通过 `--json` 模式捕获结构化输出
- 子代理定义存储为 `.md` 文件
- 需要 `pi` CLI 可用（已作为依赖安装）

### Related Features
- `feat-tool-distill`（已完成）— 蒸馏工具，最直接的子代理应用场景
- `feat-tool-scan`（已完成）— 扫描工具，可并行化

## Technical Solution

### 实现方案

#### Phase 1: 基础设施（本 Feature 范围）

##### 1. Agent 定义文件
在 `agent/src/agents/` 目录下创建子代理定义：

```
agent/src/agents/
├── distill-agent.md    — 文档蒸馏专用
├── explore-agent.md    — 项目探索专用
└── base-agent.md       — 基础模板
```

##### 2. SubAgent 管理器
创建 `agent/src/tools/subagent.ts`：

```typescript
interface SubAgentConfig {
  name: string;
  task: string;
  model?: string;
  timeout?: number;
}

interface SubAgentResult {
  success: boolean;
  output: string;
  error?: string;
  tokens?: { input: number; output: number };
  duration: number;
}

class SubAgentManager {
  // 单个子代理执行
  async execute(config: SubAgentConfig): Promise<SubAgentResult>;

  // 并行执行多个子代理
  async parallel(tasks: SubAgentConfig[]): Promise<SubAgentResult[]>;

  // 串行链式执行
  async chain(tasks: SubAgentConfig[]): Promise<SubAgentResult[]>;
}
```

##### 3. 命令注册

```typescript
pi.registerCommand("delegate", {
  description: "委派任务给子代理执行",
  handler: async (args: string, ctx) => {
    const result = await subAgentManager.execute({
      name: "auto",  // 根据任务类型自动选择
      task: args
    });
    // 渲染结果
  }
});
```

#### Phase 2: 集成到现有工具（后续 Feature）
- edith_distill 使用子代理执行蒸馏
- edith_scan 使用并行子代理扫描多个仓库

### 文件变更
1. `agent/src/tools/subagent.ts`（新建）— SubAgent 管理器
2. `agent/src/agents/`（新建目录）— 子代理定义文件
3. `agent/src/extension.ts` — 注册 `/delegate` 命令
4. `agent/src/theme/subagent-panel.ts`（新建）— 渲染

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望系统能将高 token 消耗的任务委派给子代理，避免主 session 上下文被占用。

### Scenarios

#### Scenario 1: 单任务委派
```gherkin
Given 用户在对话中请求生成一个服务的蒸馏文档
When 系统检测到该任务适合子代理执行
Then 系统启动子代理执行蒸馏任务
And 主 session 可继续接受用户输入
And 子代理完成后结果回传主 session
```

#### Scenario 2: 手动委派
```gherkin
Given 用户希望将特定任务交给子代理
When 用户输入 /delegate 分析 /path/to/service 的接口契约
Then 系统启动子代理执行任务
And 显示子代理执行状态（等待中/执行中/完成）
And 完成后显示结果摘要
```

#### Scenario 3: 子代理执行失败
```gherkin
Given 子代理执行过程中发生错误
When 子代理返回错误状态
Then 主 session 显示友好的错误信息
And 不影响主 session 的后续操作
```

#### Scenario 4: 并行委派多个任务
```gherkin
Given 用户需要同时分析两个独立服务
When 用户输入 /delegate --parallel "分析服务A的接口" "分析服务B的数据模型"
Then 系统同时启动两个子代理并行执行
And 两个子代理互不干扰，各自独立运行
And 主 session 实时显示两个子代理的执行状态
And 两个子代理全部完成后汇总结果
```

### General Checklist
- [x] 子代理超时控制（默认 120s）
- [x] 子代理数量限制（同时最多 3 个）
- [ ] 子代理结果缓存（相同任务不重复执行）
- [x] 使用 EDITH 主题渲染状态信息

## Merge Record
- **Completed**: 2026-04-28T23:15:00+08:00
- **Branch**: feature/subagent-support
- **Merge commit**: HEAD
- **Archive tag**: feat-subagent-support-20260428
- **Conflicts**: none
- **Verification**: passed (4/4 scenarios)
- **Stats**: 1 commit, 6 files changed, 613 insertions
