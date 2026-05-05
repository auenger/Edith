# Feature: feat-p3-governance-engine 知识治理引擎

## Basic Information
- **ID**: feat-p3-governance-engine
- **Name**: 知识治理引擎（Agent 侧）
- **Priority**: 85
- **Size**: M
- **Dependencies**: [feat-p3-obsidian-vault]
- **Parent**: feat-phase3
- **Children**: []
- **Created**: 2026-05-05

## Description
在 Obsidian Vault 基础设施之上构建知识治理引擎。每个知识片段拥有明确的生命周期状态（scaffold → reviewed → mature），支持人工审阅工作流、矛盾检测、知识健康度评分。治理数据通过 API 暴露给 Board 消费，形成 Agent → 治理 → Board 生态闭环。

### 来源
- EDITH-KNOWLEDGE-ARCHITECTURE.md §人类审阅与知识治理
- SKILL.md 黄金路径 CONFIRM (Stage 6) + GROW BY WRITEBACK (Stage 8)

## User Value Points
1. **知识生命周期可见** — 每个蒸馏片段有 scaffold / reviewed / mature / stale 四级状态，通过 `edith governance status` 一览全局
2. **人工审阅工作流** — 新蒸馏产物标记为 scaffold，人类在 Obsidian 中审阅后升级为 reviewed，经真实回写达到 mature
3. **矛盾自动检测** — 代码变更触发重新蒸馏时，自动检测新蒸馏内容与人工编辑的重叠区域，标记冲突等待裁决
4. **知识健康度评估** — 基于 freshness / confidence / completeness / humanReviewed 四维评分，量化知识库质量
5. **Board 数据就绪** — 治理数据通过结构化 API 暴露，Board 可直接消费展示（为 feat-p3-board-ecosystem 提供数据基础）

## Context Analysis
### Reference Code
- `agent/src/tools/frontmatter.ts` — **已完成**的 Frontmatter 注入/解析。治理状态字段需在此基础上扩展 lifecycle / governance / quality 块
- `agent/src/tools/edit-detector.ts` — **已完成**的人工编辑检测（content hash + human_edited 标记）。矛盾检测复用此基础
- `agent/src/tools/obsidian.ts` — **已完成**的 Vault 操作入口（generate / refresh / status）。治理命令需扩展此模块
- `agent/src/tools/vault-structure.ts` — **已完成**的目录结构生成。治理状态文件可放在 Vault 的 .edith/ 目录下
- `agent/src/tools/distill.ts` — 蒸馏管道。需在输出阶段注入 lifecycle: scaffold 状态
- `agent/src/tools/graphify.ts` — GraphifyConfidence (EXTRACTED/INFERRED/AMBIGUOUS) 是健康度 confidence 维度的数据源
- `agent/src/config.ts` — 新增 GovernanceConfig 接口

### Related Documents
- EDITH-KNOWLEDGE-ARCHITECTURE.md §人类审阅与知识治理 — HITL 原则
- SKILL.md — CONFIRM + GROW BY WRITEBACK 阶段定义

### Related Features
- feat-p3-obsidian-vault (已完成) — Vault 基础设施，本 feature 直接扩展其 frontmatter.ts 和 edit-detector.ts
- feat-p3-board-ecosystem (兄弟) — 消费本 feature 的治理数据 API，形成生态闭环
- feat-p2-graphify-index (已完成) — GraphifyConfidence 是健康度评分的输入
- feat-workflow-orchestrator (阻塞) — 编排引擎应集成知识治理状态机

## Technical Solution

### 知识生命周期状态机
```text
                    edith distill
                         │
                         ▼
                    ┌──────────┐
         ┌─────────│ scaffold │←── 新产物自动标记
         │         └─────┬────┘
         │               │ human review (在 Obsidian 中编辑)
         │               ▼
         │         ┌──────────┐
         │         │ reviewed │←── 人工确认通过
         │         └─────┬────┘
         │               │ real-world writeback (GROW)
         │               ▼
         │         ┌──────────┐
         │    ┌───▶│  mature  │─── 真实工程实践验证
         │    │    └──────────┘
         │    │         │
         │    │    source_hash 不匹配
         │    │         │
         │    │         ▼
         │    │    ┌──────────┐
         │    └────│  stale   │─── 需要重新蒸馏
         │         └─────┬────┘
         │               │ edith distill --refresh
         │               ▼
         │         ┌──────────┐
         └─────────│ scaffold │ (重新蒸馏)
                   └──────────┘
```

### Frontmatter 状态字段扩展
在 frontmatter.ts 已有字段（edith_id, layer, token_budget, token_actual, last_distilled, human_edited, confidence, related）基础上增加：

```yaml
---
# === 已有字段 (frontmatter.ts) ===
edith_id: user-service/01-api-contracts
layer: 2
token_budget: 4000
token_actual: 2847
last_distilled: 2026-05-05T10:30:00+08:00
edith_version: 0.1.0
human_edited: false
confidence: EXTRACTED
related:
  - "[[user-service/quick-ref]]"

# === 新增治理字段 ===
lifecycle:
  status: reviewed          # scaffold | reviewed | mature | stale
  created_at: 2026-05-05T10:30:00+08:00
  reviewed_at: 2026-05-05T14:00:00+08:00
  reviewed_by: human
  matured_at: null
  stale_at: null
  stale_reason: null        # code_changed | manual | dependency_shift
governance:
  conflict_detected: false
  last_hash: sha256:abc123...
  source_files:
    - src/services/user.ts
  source_hash: sha256:def456...
quality:
  completeness: 0.85
  freshness: 0.95
---
```

### 矛盾检测（复用 edit-detector.ts）
```text
edith distill --refresh 时:
  1. edit-detector.ts 计算 content hash（已有）
  2. 对比新旧蒸馏内容的 diff
  3. 如果 diff 区域与 human_edited: true 的文件重叠:
     → 标记 governance.conflict_detected: true
     → 生成冲突报告（新内容 vs 人工修改）
     → 不自动覆盖，等待人工裁决
  4. 人工裁决选项:
     - 接受新蒸馏（覆盖人工修改）→ status 回到 scaffold
     - 保留人工修改（放弃新蒸馏）→ status 保持 reviewed
     - 合并 → status 回到 scaffold（需重新审阅）
```

### 知识健康度评分
```typescript
interface KnowledgeHealth {
  overall: number;           // 0-100 综合分
  breakdown: {
    freshness: number;       // 基于 last_distilled 与当前时间差
    confidence: number;      // 基于 Graphify confidence (EXTRACTED=100, INFERRED=70, AMBIGUOUS=40)
    completeness: number;    // 基于三层覆盖率 (routing-table + quick-ref + distillates)
    humanReviewed: number;   // scaffold=30, reviewed=70, mature=100
  };
  lifecycle: {
    scaffold: number;
    reviewed: number;
    mature: number;
    stale: number;
  };
}
```

### 配置扩展 (edith.yaml)
```yaml
governance:
  enabled: true
  auto_confirm_scaffold: false    # 不自动确认 scaffold 产物
  stale_threshold: 168h           # 7 天无刷新标记为 stale
  conflict_policy: preserve_human # preserve_human | overwrite | notify
  quality_scoring: true           # 启用知识健康度评分
```

### 治理数据 API（为 Board 消费准备）
```typescript
// 治理数据写入 .edith/governance/ 目录（Board DataReader 可扫描）
//
// .edith/governance/
// ├── health.json          ← 全局健康度评分
// ├── lifecycle.json       ← 生命周期分布统计
// └── conflicts.json       ← 活跃冲突列表
//
// Board 通过 DataReader 读取这些 JSON 文件，无需额外 API
```

### Scope
**IN**: 生命周期状态机 + frontmatter 字段扩展 + 矛盾检测 + 健康度评分 + 治理 JSON 数据文件 + edith governance CLI 命令 + edith.yaml 配置
**OUT**: Board 前端实现（属 feat-p3-board-ecosystem）、多人协作审批流、邮件/Slack 通知

## Acceptance Criteria (Gherkin)
### User Story
作为知识管理者，我希望追踪每个知识片段的成熟度，审阅新产物，在知识过时时收到提醒，并通过 Board 可视化全局健康度。

### Scenarios
```gherkin
Scenario: 新蒸馏产物自动标记为 scaffold
  Given 用户执行 edith distill 生成新的蒸馏片段
  When 蒸馏完成
  Then 产物 frontmatter 中 lifecycle.status 为 scaffold
  And lifecycle.created_at 记录当前时间
  And .edith/governance/health.json 更新全局健康度

Scenario: 人工审阅确认
  Given 存在一个 status: scaffold 的蒸馏片段
  When 用户在 Obsidian 中审阅并修改内容
  And 执行 edith governance review --confirm user-service/01-api-contracts
  Then lifecycle.status 变为 reviewed
  And human_edited 变为 true
  And .edith/governance/health.json 更新

Scenario: 代码变更导致知识过时
  Given 存在一个 status: reviewed 的蒸馏片段
  And 该片段引用的源文件发生变更
  When edith distill --refresh 检测到 source_hash 不匹配
  Then lifecycle.status 变为 stale
  And stale_reason 为 code_changed
  And .edith/governance/health.json 反映 stale 增加

Scenario: 矛盾检测与裁决
  Given 一个 reviewed 片段中有人工修改 (human_edited: true)
  When 代码变更触发重新蒸馏
  And 新蒸馏内容与人工修改区域重叠
  Then conflict_detected 标记为 true
  And .edith/governance/conflicts.json 记录冲突详情
  And 人工裁决后 conflict_detected 清除

Scenario: 知识健康度评分计算
  Given 知识库中有 5 个服务的三层产物
  When 用户执行 edith governance status
  Then 输出全局健康度评分 (overall: 78/100)
  And 显示四维评分 breakdown
  And 显示生命周期分布 (scaffold: 3, reviewed: 12, mature: 8, stale: 2)
  And .edith/governance/health.json 同步更新

Scenario: 全局知识状态概览
  Given 知识库中有多个不同状态的片段
  When 用户执行 edith governance status
  Then 列出所有 stale 片段及其过时原因
  And 列出所有活跃冲突
  And 列出所有待审阅 scaffold 产物

Scenario: 治理数据供 Board 消费
  Given 治理引擎已运行
  When .edith/governance/ 目录下的 JSON 文件生成
  Then health.json 包含 { overall, breakdown, lifecycle, last_updated }
  And lifecycle.json 包含 { services: [{ name, status, count }], updated_at }
  And conflicts.json 包含 { conflicts: [{ file, type, new_content, human_content }] }
  And Board DataReader 可直接读取这些文件
```

### General Checklist
- [x] 知识生命周期状态机实现 (scaffold / reviewed / mature / stale)
- [x] frontmatter.ts 扩展 lifecycle / governance / quality 字段
- [x] 矛盾检测引擎（复用 edit-detector.ts）
- [x] 健康度评分模型（四维）
- [x] 治理 JSON 数据文件生成（.edith/governance/）
- [x] edith governance CLI 命令（status / review / refresh）
- [x] edith.yaml 新增 governance 配置块
- [x] 向后兼容：禁用 governance 时默认行为不变

## Merge Record
- **Completed**: 2026-05-06
- **Branch**: feature/p3-governance-engine
- **Merge Commit**: 179b1ae
- **Archive Tag**: feat-p3-governance-engine-20260506
- **Conflicts**: none
- **Verification**: PASSED (7/7 Gherkin scenarios, TypeScript clean)
- **Stats**: 9 files changed, 2824 insertions, 1 commit
