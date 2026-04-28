# Feature: feat-workflow-orchestrator

## Basic Information

- **ID**: feat-workflow-orchestrator
- **Name**: Workflow Orchestrator（SKILL.md 8阶段流程编排引擎）
- **Priority**: 85
- **Size**: L
- **Dependencies**: []
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-28

## Description

实现 SKILL.md 定义的 8 阶段流程编排层，使 EDITH Agent 能够从手动调用单个工具升级为按阶段自动推进的完整工作流。

当前状态：4 个工具（edith_scan / edith_distill / edith_route / edith_query）已完成 ~90%，但缺乏流程编排。用户只能在 REPL 中手动逐个调用工具，无法按 CLARIFY → INVENTORY → CLASSIFY → SCAFFOLD → BOOTSTRAP SKILLS → CONFIRM → PILOT-READY → GROW BY WRITEBACK 自动推进。

## User Value Points

1. **阶段状态机** — 8 阶段的有序推进、回退、跳过逻辑，明确当前所处阶段
2. **状态持久化** — 阶段进度和产出物持久化到文件系统，支持中断后恢复
3. **阶段间数据流** — 上游阶段产出自动作为下游阶段输入，无需人工搬运
4. **人工确认门控** — CONFIRM 等阶段暂停等待人工确认，确认后才推进
5. **阶段感知工具调度** — 根据当前阶段自动选择并调用对应工具
6. **Stop Condition 检查** — 每阶段执行前检查前置条件，不满足则阻止推进并给出原因

## Context Analysis

### Reference Code

- `agent/src/extension.ts` — 当前 Extension 路由层（工具注册 + 消息路由）
- `agent/src/agent-startup.ts` — Agent 启动入口（REPL 循环）
- `agent/src/tools/` — 4 个工具的现有实现
- `agent/src/system-prompt.ts` — System Prompt 构建
- `edith-skills/INTEGRATION.md` — Skill 与 Agent 融合方案

### Related Documents

- `SKILL.md` — 8 阶段黄金路径定义（每个阶段的 goal / output / stop condition）
- `EDITH-PRODUCT-DESIGN.md` — 产品设计文档

### Related Features

- 已完成：feat-tool-scan, feat-tool-distill, feat-tool-query, feat-tool-route（工具层）
- 已完成：feat-extension-core（路由层）
- 已完成：feat-system-prompt（System Prompt）
- 可能关联：feat-subagent-support（子代理支持，用于并行阶段执行）

## Technical Solution

<!-- 设计待定，blocked 状态下进一步思考后再补充 -->

### 初步架构方向

```text
新增 agent/src/workflow/ 目录：

workflow/
├── engine.ts              ← 状态机引擎（阶段推进、回退、跳过）
├── phases.ts              ← 8 个阶段的定义（goal / output / stop condition）
├── state.ts               ← 状态持久化（读写 .edith/workflow-state.json）
├── dispatcher.ts          ← 阶段→工具调度映射
├── gate.ts                ← 人工确认门控
└── types.ts               ← 类型定义
```

### 状态文件设计

```yaml
# .edith/workflow-state.json
{
  "current_phase": "INVENTORY",
  "phases": {
    "CLARIFY": { "status": "completed", "artifacts": ["templates/en/edith-build-brief.md"] },
    "INVENTORY": { "status": "in_progress", "started_at": "..." }
  },
  "context": { "pilot_scope": "...", "first_loop": "..." }
}
```

## Acceptance Criteria (Gherkin)

### Scenario 1: 阶段自动推进

```gherkin
Given 用户已完成 CLARIFY 阶段并确认 build brief
When 用户输入 "开始盘点"
Then 系统自动进入 INVENTORY 阶段
And 调用 edith_scan 扫描相关代码库
And 显示扫描进度和结果
```

### Scenario 2: 中断恢复

```gherkin
Given INVENTORY 阶段进行中 Agent 意外退出
When 用户重新启动 Agent
Then 系统读取 workflow-state.json 恢复状态
And 提示 "上次停在 INVENTORY 阶段，是否继续？"
```

### Scenario 3: Stop Condition 阻止推进

```gherkin
Given CLARIFY 阶段尚未确认第一个闭环
When 系统尝试进入 INVENTORY
Then stop condition 检查失败
And 提示 "请先确认第一个有价值的闭环（first valuable loop）"
```

### Scenario 4: 人工确认门控

```gherkin
Given 所有前置阶段已完成
When 进入 CONFIRM 阶段
Then 系统暂停并展示确认清单
And 等待用户逐项确认或拒绝
And 全部确认后才推进到 PILOT-READY
```

### Scenario 5: 阶段感知工具调度

```gherkin
Given 当前处于 INVENTORY 阶段
When 用户说 "扫描项目代码"
Then 系统识别当前阶段并调用 edith_scan
And 将扫描结果存入阶段产出物
And 自动检查该阶段是否可以完成
```

### General Checklist

- [ ] 8 个阶段全部定义，含 goal / output / stop condition
- [ ] 状态机支持 forward / backward / skip
- [ ] 状态持久化到文件系统，支持恢复
- [ ] 阶段间数据自动传递
- [ ] 人工确认节点可暂停流程
- [ ] Stop condition 不满足时给出明确原因
- [ ] 与现有 REPL 集成，不破坏现有工具手动调用
- [ ] 不影响 pi SDK 的正常使用
