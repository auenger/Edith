# Feature: feat-p3-board-ecosystem Board 知识生态集成

## Basic Information
- **ID**: feat-p3-board-ecosystem
- **Name**: Board 知识生态集成（治理可视化 + 飞轮闭环）
- **Priority**: 80
- **Size**: M
- **Dependencies**: [feat-p3-governance-engine, feat-board-redesign]
- **Parent**: feat-phase3
- **Children**: []
- **Created**: 2026-05-05

## Description
将 Board 从"知识浏览器"升级为"知识生态中枢"。消费治理引擎的健康度、生命周期、冲突数据，通过 Bento Grid 面板可视化知识飞轮状态，让人类通过 Board 驱动决策 → Agent → 更好的知识闭环。

### 来源
- feat-phase3 生态飞轮设计
- feat-board-redesign Bento Grid 重构（shadcn/ui + 设计系统）

## User Value Points
1. **治理健康度面板** — Dashboard 新增知识健康度 Bento 卡片，一眼看到全局质量分数、stale 告警、待审阅数量
2. **生命周期分布可视化** — 按服务展示 scaffold / reviewed / mature / stale 分布，快速定位知识盲区
3. **Vault 浏览 + 治理状态** — Explorer 新增 Vault 视图，每个文件带治理状态标签（颜色编码），直接看到哪些产物需要关注
4. **冲突实时告警** — WebSocket 推送治理事件，冲突发生时 Board 实时弹出告警，驱动人类及时裁决
5. **生态飞轮闭环** — Board 展示 → 人类决策 → Agent 执行 → Board 更新，可视化整个知识进化过程

## Context Analysis
### Reference Code
- `board/server/services/data-reader.ts` — **已有**的只读数据网关。需扩展扫描 .edith/governance/ 目录
- `board/server/services/artifact-parser.ts` — **已有**的 Markdown 解析器。需扩展解析治理 frontmatter
- `board/src/components/dashboard/` — **将被 redesign 重构**。治理面板需按新 Bento Grid 设计系统实现
- `board/src/components/` — Explorer / Knowledge Map 组件。需扩展治理状态标签
- `board/server/types/index.ts` — Board 类型定义。需扩展 GovernanceStatus 类型
- `board/src/lib/api.ts` — 类型化 API 客户端。需新增治理 API 端点
- `agent/src/tools/obsidian.ts` — Agent 侧 Vault 操作入口。治理状态变更触发 Board 刷新

### Related Documents
- feat-phase3 spec.md — 生态飞轮总体设计
- feat-board-redesign spec.md — Bento Grid + shadcn/ui 设计系统

### Related Features
- feat-p3-governance-engine (前置) — 提供 .edith/governance/ JSON 数据文件，本 feature 消费
- feat-board-redesign (前置) — Board 页面重构完成后，治理面板才能按新设计系统实现
- feat-p3-obsidian-vault (已完成) — Vault 目录结构是 Explorer Vault 视图的数据源
- feat-p2-board-scaffold (已完成) — Board 数据层基础（DataReader + FileWatcher + WebSocket）

## Technical Solution

### Board API 扩展

#### 新增路由
```typescript
// board/server/routes/governance.ts
GET /api/governance/health
  → 读取 .edith/governance/health.json
  → Response: { overall: number, breakdown: {...}, lifecycle: {...}, last_updated: string }

GET /api/governance/lifecycle
  → 读取 .edith/governance/lifecycle.json
  → Response: { services: [{ name, status_counts: {...} }], updated_at: string }

GET /api/governance/conflicts
  → 读取 .edith/governance/conflicts.json
  → Response: { conflicts: [{ file, type, summary }], count: number }

GET /api/vault/tree
  → 扫描 Vault 目录结构（复用 buildFileTree 模式）
  → 每个文件附带 frontmatter 中的 lifecycle.status
  → Response: { tree: FileNode[], governance: Map<path, status> }
```

#### DataReader 扩展
```typescript
// data-reader.ts 新增缓存字段
interface DataCache {
  // 已有
  services: ServiceInfo[];
  routingTableEntries: RoutingEntry[];
  graphData: GraphData | null;

  // 新增
  governanceHealth: GovernanceHealth | null;
  governanceLifecycle: GovernanceLifecycle | null;
  governanceConflicts: GovernanceConflict[];
  vaultTree: VaultFileNode | null;
}
```

#### WebSocket 事件扩展
```typescript
// 治理状态变更事件
WS event: "governance:update"
  → { type: "lifecycle_change" | "conflict_detected" | "conflict_resolved" | "health_change",
      data: { file?: string, status?: string, health?: GovernanceHealth } }

// FileWatcher 扩展
watchPaths.push('.edith/governance/*.json')  // 监听治理数据文件变更
```

### Dashboard 治理面板（Bento Grid）

```text
┌─────────────────────────────────────────────────────┐
│ Dashboard                                            │
├──────────┬──────────┬──────────┬────────────────────┤
│ Health   │ Stale    │ Pending  │ Conflicts          │
│ Score    │ Count    │ Review   │ Active             │
│ 78/100   │ 2 items  │ 3 items  │ 1 item             │
│ 🟢 Good  │ 🟡 Warn  │ 🔵 Info  │ 🔴 Alert           │
├──────────┴──────────┴──────────┴────────────────────┤
│ Lifecycle Distribution                               │
│ ┌─────┐ ┌──────────┐ ┌───────┐ ┌──────┐            │
│ │ S:3 │ │ R:12     │ │ M:8  │ │ D:2  │            │
│ │scaff│ │ reviewed │ │mature│ │stale │            │
│ └─────┘ └──────────┘ └───────┘ └──────┘            │
├──────────────────────────────────────────────────────┤
│ Stale Items (需要关注)                                │
│ • user-service/01-api-contracts — code_changed       │
│ • order-service/02-payment — code_changed            │
├──────────────────────────────────────────────────────┤
│ Recent Governance Events                             │
│ • 14:30 user-service/01-api → scaffold (重新蒸馏)    │
│ • 13:15 order-service/quick-ref → conflict_detected  │
│ • 11:00 payment-service/* → reviewed (人工确认)      │
└──────────────────────────────────────────────────────┘
```

### Explorer Vault 视图

```text
┌──────────────────────────────────────────┐
│ Explorer  [Services] [Artifacts] [Vault] │ ← 新增 Vault Tab
├──────────────┬───────────────────────────┤
│ 00-routing/  │ routing-table.md          │
│ 01-services/ │ ─────────────────────     │
│  ├ user-svc/ │ # API Contracts           │
│  │ └ quick-r│                           │
│  ├ order-svc│ Status: reviewed ✓        │ ← 治理状态标签
│  │ └ quick-r│ Last distilled: 2h ago    │
│ 02-distill/ │ Freshness: 0.95           │
│  ├ user-svc/│ Confidence: EXTRACTED     │
│  │ ├ 01-api │                           │
│  │ ├ 02-data│ Related: [[order-svc/...]]│
│ 03-decisions│                           │
│ graphify-out│                           │
└──────────────┴───────────────────────────┘
```

### 类型定义

```typescript
// board/server/types/governance.ts
interface GovernanceHealth {
  overall: number;
  breakdown: {
    freshness: number;
    confidence: number;
    completeness: number;
    humanReviewed: number;
  };
  lifecycle: {
    scaffold: number;
    reviewed: number;
    mature: number;
    stale: number;
  };
  last_updated: string;
}

interface GovernanceConflict {
  file: string;
  type: "content_overlap";
  summary: string;
  new_content_excerpt: string;
  human_content_excerpt: string;
  detected_at: string;
}

interface VaultFileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  governance_status?: "scaffold" | "reviewed" | "mature" | "stale" | "none";
  children?: VaultFileNode[];
}
```

### Scope
**IN**: Board 治理 API (4 端点) + Dashboard 治理面板 (Bento Grid) + Explorer Vault 视图 + 治理状态标签 + WebSocket 治理事件 + DataReader 扩展
**OUT**: Agent 侧治理逻辑（属 feat-p3-governance-engine）、Obsidian 编辑功能、多人协作 UI

## Acceptance Criteria (Gherkin)
### User Story
作为知识管理者，我希望通过 Board 可视化知识库的健康状态，快速发现过时和冲突的知识片段，并通过 Board 驱动审阅决策。

### Scenarios
```gherkin
Scenario: Dashboard 展示知识健康度
  Given 治理引擎已运行，.edith/governance/health.json 存在
  When 用户打开 Board Dashboard
  Then 健康度面板显示 overall score (0-100)
  And 四维评分 breakdown 可见
  And 生命周期分布柱状图可见

Scenario: Stale 告警展示
  Given 有 2 个 stale 知识片段
  When 用户打开 Board Dashboard
  Then Stale Count 卡片显示 "2"
  And 下方列出具体 stale 文件和原因
  And WebSocket 实时更新 stale 数量

Scenario: Explorer Vault 视图
  Given Vault 目录已生成
  When 用户在 Explorer 中切换到 Vault Tab
  Then 显示 00-routing / 01-services / 02-distillates / 03-decisions 目录树
  And 每个文件有治理状态标签（颜色编码）
  And 点击文件可预览内容 + 治理元数据

Scenario: 冲突实时告警
  Given Board 已连接 WebSocket
  When Agent 检测到知识冲突
  And .edith/governance/conflicts.json 更新
  Then Board 实时弹出冲突告警
  And 告警显示冲突文件和摘要
  And 点击告警可跳转到 Explorer 中对应文件

Scenario: 生态飞轮可视化
  Given 知识库有完整的生命周期数据
  When 用户查看 Dashboard 治理面板
  Then 可看到从 scaffold → reviewed → mature 的流转统计
  And stale 片段有明确的"需要重新蒸馏"操作提示
  And 整体呈现"知识在进化"的生态感

Scenario: 治理数据 API 可用
  Given 治理引擎已写入 .edith/governance/ 数据
  When Board 调用 GET /api/governance/health
  Then 返回 { overall, breakdown, lifecycle, last_updated }
  And 调用 GET /api/governance/conflicts 返回冲突列表
  And 调用 GET /api/vault/tree 返回带治理状态的 Vault 目录树
```

### General Checklist
- [x] Board 治理 API (4 GET 端点)
- [x] DataReader 扩展（governance 缓存 + vault 树）
- [x] Dashboard 治理面板（Bento Grid 组件）
- [x] Explorer Vault Tab（目录树 + 治理状态标签）
- [x] WebSocket 治理事件推送
- [x] 治理状态颜色编码系统
- [x] 向后兼容：无 governance 数据时不报错，面板显示"暂无数据"

## Merge Record
- **Completed**: 2026-05-06
- **Merged Branch**: feature/p3-board-ecosystem
- **Merge Commit**: 318bb1a
- **Archive Tag**: feat-p3-board-ecosystem-20260506
- **Conflicts**: none
- **Verification**: passed (28/28 tasks, 6/6 Gherkin scenarios, 0 TS errors)
- **Stats**: 16 files changed, 1881 insertions, 9 new files
