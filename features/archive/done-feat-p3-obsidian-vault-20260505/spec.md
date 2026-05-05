# Feature: feat-p3-obsidian-vault Obsidian Vault 双向映射

## Basic Information
- **ID**: feat-p3-obsidian-vault
- **Name**: Obsidian Vault 双向映射
- **Priority**: 90
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-05-05

## Description
将 EDITH 三层知识产物自动映射为 Obsidian Vault 目录结构，实现"零适配"双向集成。用户可直接在 Obsidian 中浏览 routing-table、quick-ref、distillates，并通过 Graph View 和 Wikilinks 可视化知识关系。

### 来源
- EDITH-KNOWLEDGE-ARCHITECTURE.md §认知持久化层：Obsidian 与 EDITH 的双向赋能

## User Value Points
1. **Vault 结构自动映射** — EDITH 三层产物（routing-table / quick-ref / distillates）自动组织为 Obsidian Vault 目录结构，无需手动整理
2. **Wikilinks 双向链接** — 产物间自动生成 `[[wikilink]]` 交叉引用，Obsidian Graph View 直接可视化知识拓扑
3. **人类编辑保留** — 用户在 Obsidian 中直接编辑 Markdown 后，EDITH 刷新时检测并保留人工修改，不覆盖人类决策
4. **决策记录目录** — `decisions/` 目录支持人类记录架构决策，通过双向链接融入知识体系

## Context Analysis
### Reference Code
- `agent/src/tools/distill.ts` — 蒸馏管道，产出三层 Markdown。Vault 映射发生在蒸馏输出阶段
- `agent/src/tools/scan.ts` — 扫描产出项目文档，Vault 结构需与扫描结果对齐
- `agent/src/config.ts` — edith.yaml 配置，需新增 `obsidian` 配置块
- `agent/src/tools/index.ts` — `edith_index` 便携式索引，Vault 结构应与索引兼容

### Related Documents
- EDITH-KNOWLEDGE-ARCHITECTURE.md §认知持久化层 — Vault 结构定义 + 人类审阅原则
- EDITH-KNOWLEDGE-ARCHITECTURE.md §Vault 结构与 EDITH 产物的映射 — 目录结构规范

### Related Features
- feat-p2-multimodal-ingestion (已完成) — 多模态摄入产物也需映射到 Vault
- feat-p2-graphify-index (已完成) — graph.json 和 GRAPH_REPORT.md 映射到 graphify-out/
- feat-p2-board-explorer (已完成) — Board 的文件浏览器消费相同目录结构

## Technical Solution

### Vault 目录结构
```text
Obsidian Vault/
├── 00-routing/                    ← Layer 0
│   └── routing-table.md           (常驻，全局路由)
├── 01-services/                   ← Layer 1
│   ├── user-service/
│   │   └── quick-ref.md           (速查卡)
│   └── order-service/
│       └── quick-ref.md
├── 02-distillates/                ← Layer 2
│   ├── user-service/
│   │   ├── 01-api-contracts.md
│   │   ├── 02-data-models.md
│   │   └── 03-auth-logic.md
│   └── order-service/
│       ├── 01-order-lifecycle.md
│       └── 02-payment-integration.md
├── 03-decisions/                  ← 人工决策记录
│   └── 2026-04/
│       └── why-we-chose-snowflake-id.md
├── graphify-out/                  ← Graphify 索引
│   ├── graph.json
│   └── GRAPH_REPORT.md
└── .obsidian/                     ← Obsidian 配置（自动生成）
    ├── app.json
    └── appearance.json
```

### 配置扩展 (edith.yaml)
```yaml
obsidian:
  enabled: true
  vault_path: ./obsidian-vault       # Vault 根目录
  wikilinks: true                     # 自动生成 [[wikilink]] 交叉引用
  graph_view: true                    # 生成 .obsidian 配置以支持 Graph View
  frontmatter: true                   # 产物添加 YAML frontmatter（状态、Token 预算）
  human_edit_detection: true          # 检测人工修改并保留
```

### Wikilinks 生成策略
```text
routing-table.md → 引用各服务 quick-ref: [[user-service/quick-ref]]
quick-ref.md → 引用相关 distillates: [[01-api-contracts]], [[02-data-models]]
distillates → 引用关联服务: [[../order-service/quick-ref]]
decisions → 引用受影响的产物: [[01-api-contracts]], [[user-service/quick-ref]]
```

### 人工编辑检测机制
```text
edith distill --refresh 时:
  1. 计算每个文件的 content hash (SHA-256)
  2. 对比上次蒸馏输出的 hash
  3. hash 不匹配 → 检查 frontmatter 中 human_edited 标记
     - human_edited: true → 保留人工版本，追加变更到下一行
     - human_edited: false → 正常覆盖（内容被外部工具修改但非人工）
  4. 在 distillate frontmatter 中记录:
     edith_version, last_distilled, token_budget, human_edited
```

### Frontmatter 格式
```yaml
---
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
  - "[[order-service/01-order-lifecycle]]"
---
```

### Scope
**IN**: Vault 目录结构生成 + Wikilinks 交叉引用 + .obsidian 配置 + frontmatter 元数据 + 人工编辑检测 + decisions/ 目录 + edith.yaml 配置
**OUT**: Obsidian 插件开发、实时同步（WebSocket）、移动端适配、Obsidian Publish 集成

## Acceptance Criteria (Gherkin)
### User Story
作为 EDITH 用户，我希望在 Obsidian 中直接浏览和编辑知识产物，并通过 Graph View 可视化知识关系。

### Scenarios
```gherkin
Scenario: 首次生成 Vault 结构
  Given 用户已完成 edith scan + edith distill
  And edith.yaml 中 obsidian.enabled 为 true
  When 用户执行 edith distill --vault
  Then 在 vault_path 下生成 00-routing/ 01-services/ 02-distillates/ 目录
  And routing-table.md 放入 00-routing/
  And 每个 quick-ref.md 放入 01-services/{service-name}/
  And 每个 distillate 放入 02-distillates/{service-name}/
  And 生成 .obsidian/app.json 配置

Scenario: Wikilinks 交叉引用生成
  Given EDITH 三层产物已生成
  When Vault 结构映射完成
  Then routing-table.md 中每个服务名生成 [[{service}/quick-ref]] 链接
  And quick-ref.md 中引用相关 distillate 片段 [[01-xxx]]
  And 在 Obsidian Graph View 中可看到服务间依赖关系

Scenario: 人工编辑保留
  Given 用户在 Obsidian 中编辑了 user-service/quick-ref.md
  And 文件 frontmatter 中 human_edited 变为 true
  When 用户执行 edith distill --refresh
  Then 人工修改的 quick-ref.md 被保留不覆盖
  And 控制台输出 "Preserved human edit: 01-services/user-service/quick-ref.md"
  And 其他非人工编辑的产物正常更新

Scenario: 配置中禁用 Obsidian
  Given edith.yaml 中 obsidian.enabled 为 false
  When 用户执行 edith distill
  Then 产物直接输出到默认知识仓库路径（不生成 Vault 结构）
  And 不生成 .obsidian/ 目录

Scenario: 决策记录目录
  Given Vault 结构已生成
  When 用户在 03-decisions/2026-05/ 下创建 why-we-chose-x.md
  And 文件中包含 [[user-service/quick-ref]] 链接
  Then Obsidian Graph View 中显示决策与服务的关联

Scenario: 增量更新 Vault
  Given Vault 结构已存在
  When user-service 代码发生变更，distill 刷新了相关片段
  Then 只更新 02-distillates/user-service/ 下受影响的文件
  And 00-routing/routing-table.md 如有服务变更则更新
  And 其他服务目录不受影响
```

### General Checklist
- [ ] Vault 目录结构生成器（00-routing / 01-services / 02-distillates / 03-decisions / graphify-out）
- [ ] Wikilinks 自动生成引擎
- [ ] .obsidian/ 配置生成（app.json + appearance.json）
- [ ] Frontmatter 元数据注入
- [ ] 人工编辑检测（content hash + human_edited 标记）
- [ ] edith.yaml 新增 obsidian 配置块
- [ ] edith distill --vault 命令支持
- [x] 向后兼容：禁用 obsidian 时输出到原始路径

## Merge Record
- **Completed**: 2026-05-05T23:30:00+08:00
- **Merged branch**: feature/p3-obsidian-vault
- **Merge commit**: fd789d9
- **Archive tag**: feat-p3-obsidian-vault-20260505
- **Conflicts**: none
- **Verification**: 6/6 Gherkin scenarios passed
- **Stats**: 2 commits, 6 files changed, 2102 insertions
