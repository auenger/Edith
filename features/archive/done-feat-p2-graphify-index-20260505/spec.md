# Feature: feat-p2-graphify-index Graphify 认知图谱索引

## Basic Information
- **ID**: feat-p2-graphify-index
- **Name**: Graphify 认知图谱索引
- **Priority**: 80
- **Size**: M
- **Dependencies**: []
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
集成 Graphify 作为 EDITH Layer 2 的索引引擎。通过 tree-sitter AST 提取 13+ 语言的语义关系，生成 graph.json 全局拓扑，替代全量文件扫描。Graphify 产出直接驱动 routing-table 自动生成、distillates 片段骨架拆分、以及 Board Knowledge Map 可视化。

### 来源
- EDITH-INTEGRATION-DESIGN.md 决策 2：集成 Graphify — 认知图谱索引引擎

## User Value Points
1. **自动服务依赖发现** — 从代码 AST 自动提取服务间调用关系，替代人工维护 routing-table
2. **定向扫描提效** — Graphify 标记高价值区域，edith_scan 只看标记区域而非全量扫描
3. **置信度分级** — 让知识消费者知道哪些是源码硬逻辑、哪些是语义推断

## Context Analysis
### Reference Code
- `agent/src/tools/scan.ts` (2690 行) — edith_scan 主实现。Graphify 索引扫描作为 `executeScan()` 的前置步骤，定向扫描替代全量文件扫描。`classifyProject()` / `extractApiContracts()` 可复用于 graph.json 生成
- `agent/src/tools/distill.ts` (1365 行) — 蒸馏管道。graph.json 产出驱动 routing-table 自动生成和 distillates 片段骨架拆分。`detectConflicts()` / `validateRoundTrip()` 可用于 graph.json 一致性校验
- `agent/src/config.ts` (1088 行) — 新增 `GraphifyConfig` 接口，遵循 `ContextBudget` 嵌套模式。`IngestionConfig.graphify` 字段与 multimodal-ingestion 共享
- `agent/src/tools/index.ts` (667 行) — `ServiceInfo` / `CrossServiceRelation` 类型定义，graph.json 节点/边结构应对齐这些类型，确保 Board Knowledge Map 可直接消费
- `agent/src/extension.ts` (822 行) — 工具注册中心，需注册 `edith_graphify` 工具，遵循 `edith_index` 的注册模式
- `agent/src/query.ts` (1052 行) — 三层渐进加载逻辑，graph.json 作为 Layer 0 索引层可加速查询

### Related Documents
- EDITH-INTEGRATION-DESIGN.md §决策2、§三、§六 Phase 1.5
- EDITH-PRODUCT-DESIGN.md §4.1 产出物格式

### Related Features
- feat-p2-multimodal-ingestion (同层级) — 可并行开发，共享 `IngestionConfig` 配置命名空间
- feat-p2-knowledge-map (下游) — 消费 graph.json 数据源，`GraphData` 接口定义为本 feature 的产出契约
- feat-tool-scan (已完成 2026-04-27) — scan.ts 是 Graphify 集成的主要修改目标，`ScanResult` / `ScanParams` 类型需扩展 graphify 相关字段
- feat-skill-align-scan (已完成 2026-04-29) — Scan Skill 对齐后的代码考古逻辑，Graphify 索引可定向调用这些能力
- feat-skill-align-distill (已完成 2026-04-29) — Distill 五步压缩管线，graph.json 驱动的片段骨架拆分需对齐 distill 输入格式

## Technical Solution

### 集成架构
```
当前流程: edith_scan（全量文件扫描）→ edith_distill → 三层产物

增强流程: Graphify（索引扫描 → graph.json）
            → edith_scan（定向扫描，只看 Graphify 标记的高价值区域）
            → edith_distill → 三层产物
```

### Graphify 产出与 EDITH 三层映射
| Graphify 产出 | 映射到 EDITH | 作用 |
|---|---|---|
| graph.json 全局拓扑 | Layer 0 routing-table.md | 自动生成服务间依赖关系 |
| 实体提取 + 社区聚类 | Layer 1 quick-ref.md | 自动识别核心概念节点 |
| AST 调用图 + 依赖树 | Layer 2 distillates/*.md | 按调用链拆分蒸馏片段 |
| GRAPH_REPORT.md | Board Knowledge Map 数据源 | 直接驱动 D3.js 可视化 |
| 置信度分级 | 三层产物标注 | 区分源码硬逻辑与语义推断 |

### Token 效率
```
第一层：查询 graph.json（全局拓扑）     — 毫秒级，零 Token
第二层：查询 routing-table / quick-ref  — < 2500 Token
第三层：查询 distillates 特定片段       — < 4000 Token / 片段
全量扫描：仅在以上三层均无法解答时触发
```

### 配置扩展
```yaml
ingestion:
  graphify:
    enabled: true
    languages: [typescript, python, go, java, markdown]
    obsidian_integration: false
    cache_dir: .edith/graphify-cache
    rescan_interval: 24h
```

### Scope
**IN**: Graphify 集成 + graph.json 生成 + routing-table 自动生成 + 增量更新 + 置信度分级 + edith_scan 对接
**OUT**: Board 可视化渲染（knowledge-map 负责）、人工编辑 graph.json、多模态文件索引

### graph.json 核心结构
```typescript
interface GraphData {
  nodes: Array<{
    id: string;           // 服务/实体名
    type: "service" | "concept";
    knowledgeCompleteness: number;  // 0-1
    endpoints?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;        // 调用描述
    confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
    weight: number;       // 调用频率
  }>;
  metadata: {
    generatedAt: string;
    languages: string[];
    nodeCount: number;
    edgeCount: number;
  };
}

// 置信度分级定义（权威来源，下游 feature 引用此定义）
// EXTRACTED — 源码 AST 直接提取，高置信度
// INFERRED  — 语义推断，中置信度（如根据命名规范推断依赖）
// AMBIGUOUS — 存在歧义，需人工确认（如循环依赖、同名不同服务）
```

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望系统能自动发现服务间的依赖关系，而不需要我手动维护路由表。

### Scenarios
```gherkin
Scenario: Graphify 索引扫描生成 graph.json
  Given 用户有一个包含 3 个微服务的代码仓库
  And edith.yaml 中 ingestion.graphify.enabled 为 true
  When 用户执行 edith scan 扫描
  Then Graphify 先执行索引扫描，生成 graph.json
  And graph.json 包含服务间调用关系和实体依赖
  And edith_scan 基于索引定向扫描高价值区域

Scenario: graph.json 驱动 routing-table 自动生成
  Given Graphify 已生成 graph.json
  When edith_distill 执行蒸馏
  Then routing-table.md 中的服务依赖关系从 graph.json 自动提取
  And 不需要人工维护服务间关系

Scenario: 增量更新机制
  Given Graphify 索引已存在
  When 某个服务代码发生变更
  Then Graphify 执行局部重扫（只重扫变更文件）
  And 更新 graph.json 中对应的部分
  And 触发相关 distillates 片段的重蒸

Scenario: 配置中禁用 Graphify
  Given edith.yaml 中 ingestion.graphify.enabled 为 false
  When 用户扫描项目
  Then 使用传统全量文件扫描方式（不依赖 Graphify）

Scenario: 空代码仓库索引
  Given 用户有一个空的项目仓库（0 个源文件）
  And Graphify 已启用
  When 用户执行 edith scan
  Then graph.json 包含空 nodes 和 edges 数组
  And edith_scan 回退到全量扫描但无文件可处理
  And 不报错，正常返回空结果

Scenario: graph.json 损坏时的降级
  Given .edith/graphify-cache/graph.json 存在但内容损坏（非合法 JSON）
  When 用户执行 edith scan
  Then 忽略损坏的 graph.json，执行全量索引重扫
  And 打印 warning 日志 "graph.json corrupted, regenerating..."
```

### General Checklist
- [ ] Graphify 注册为 EDITH 全局工具
- [ ] graph.json → routing-table.md 自动生成逻辑
- [ ] AST 调用图 → distillates 片段骨架拆分
- [ ] 置信度分级标注（EXTRACTED / INFERRED / AMBIGUOUS）
- [ ] 增量更新机制（文件变更检测 → 局部重扫）
- [ ] config.ts 新增 GraphifyConfig 接口
- [ ] 向后兼容：禁用 Graphify 时回退到全量扫描

## Merge Record
- **Completed**: 2026-05-05T11:15:00+08:00
- **Merged Branch**: feature/p2-graphify-index
- **Merge Commit**: 0fe35a0
- **Feature Commit**: a47d604
- **Archive Tag**: feat-p2-graphify-index-20260505
- **Conflicts**: None
- **Verification**: PASSED (6/6 Gherkin scenarios, 0 TypeScript errors)
- **Evidence**: evidence/verification-report.md
- **Stats**: started 2026-05-05T11:00:00, duration ~15min, 1 commit, 6 files changed, 1258 insertions
