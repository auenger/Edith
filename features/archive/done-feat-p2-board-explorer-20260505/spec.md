# Feature: feat-p2-board-explorer Services + Artifacts 浏览器

## Basic Information
- **ID**: feat-p2-board-explorer
- **Name**: Services + Artifacts 浏览器
- **Priority**: 65
- **Size**: M
- **Dependencies**: [feat-p2-board-scaffold]
- **Parent**: feat-phase2
- **Children**: []
- **Created**: 2026-04-29

## Description
提供两个核心浏览页面：Services 服务列表页和 Artifacts 产出物浏览器。Services 页展示所有已扫描服务的信息卡片、筛选搜索、知识覆盖详情和 Layer 补全操作。Artifacts 页提供文件树 + Markdown 预览 + Token 计数。

### 来源
- EDITH-PRODUCT-DESIGN.md §3.3 Services 页面设计
- EDITH-PRODUCT-DESIGN.md §3.3 Artifacts 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 Services / Artifacts 承接关系

## User Value Points
1. **服务知识详情** — 浏览每个服务的技术栈、API 端点数、数据模型、知识覆盖状态
2. **产出物浏览预览** — 文件树导航 + Markdown 实时预览，查看任意知识产物
3. **Layer 补全操作** — 一键补全缺失的知识层（如某服务只有 Layer 0/1，缺少 Layer 2）

## Context Analysis
### Reference Code
- feat-p2-board-scaffold 的 `board/server/routes/` — API 端点：GET /api/services（列表+筛选）、GET /api/services/:name（详情）、GET /api/services/:name/layers（三层状态）、GET /api/artifacts/tree（文件树）、GET /api/artifacts/:path（内容）
- feat-p2-board-scaffold 的 `board/server/services/data-reader.ts` — 统一数据读取，Services 页面消费服务列表和知识覆盖状态
- feat-p2-board-scaffold 的 `board/server/services/artifact-parser.ts` — 产物解析器（routing-table / quick-ref / distillates / graph.json），Artifacts 页面消费文件树和 Markdown 内容
- `agent/src/tools/scan.ts` (2690 行) — scan 产出物结构（workspace/{service}/docs/、quick-ref.md、distillates/），Explorer 需理解此目录结构以正确渲染文件树
- `agent/src/tools/distill.ts` (1365 行) — 蒸馏产物元数据（片段名、Token 计数、scannedAt 时间戳），Token 计数组件消费此数据
- `agent/src/tools/index.ts` (667 行) — `ServiceInfo` 类型（name、stack、endpoints、models、workflows），Services 页面卡片数据结构直接对齐

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Services / Artifacts 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 承接关系

### Related Features
- feat-p2-board-scaffold (前置) — API 和数据层，提供 Services / Artifacts 全部 API 端点
- feat-p2-multimodal-ingestion (关联) — 多模态产物预览（延迟实现），图像语义描述和 OCR 产物需在 Artifacts 页面展示
- feat-tool-scan (已完成 2026-04-27) — scan 产出物目录结构是 Services 页面和 Artifacts 文件树的基础数据源
- feat-unlimited-storage (已完成 2026-04-28) — 存储与消费分离，Explorer 纯只读浏览，不提供编辑/删除操作

## Technical Solution

### Services 页面
```
┌──────────────────────────────────────────────────┐
│  EDITH Board > Services              [+ 添加服务] │
├──────────────────────────────────────────────────┤
│  筛选: [全部 ▼]  [技术栈 ▼]  [状态 ▼]  🔍 搜索   │
│                                                  │
│  ● user-service                          ✅ 完整  │
│    用户中心 | Spring Boot + PostgreSQL | @zhangsan│
│    23 endpoints | 8 models | 5 workflows        │
│    上次更新: 2h ago | L0 ✓ L1 ✓ L2 ✓   [详情 →] │
│  ──────────────────────────────────────────────── │
│  ● inventory-service                     ⚠️ 部分  │
│    库存管理 | Go + MongoDB | @wangwu             │
│    15 endpoints | 4 models | —                   │
│    上次更新: 3d ago | L0 ✓ L1 ✓ L2 ✗ [补全 L2]  │
└──────────────────────────────────────────────────┘
```

### Artifacts 页面
```
┌──────────────────────────────────────────────────┐
│  EDITH Board > Artifacts                         │
├──────────────────────────────────────────────────┤
│  ┌─ 文件树 ─────┐  ┌─ 预览 ──────────────────┐   │
│  │ company-edith│  │ order-service/quick-ref  │   │
│  ├── skills/    │  │ ## Verify               │   │
│  │  ├── main/   │  │ ```bash                 │   │
│  │  ├── order/  │  │ ./gradlew test          │   │
│  │  └── user/   │  │ ```                     │   │
│  ├── distill/   │  │ ## Key Constraints      │   │
│  │  ├── order/  │  │ 1. 订单号全局唯一        │   │
│  │  └── user/   │  │ 2. 创建后 30 分可取消    │   │
│  └── modules/   │  │                         │   │
│  └──────────────┘  └─────────────────────────┘   │
│  [Markdown] [Raw] [Token Count]  Token: 420/2000 │
└──────────────────────────────────────────────────┘
```

### API 消费
- `GET /api/services` — 服务列表（含筛选参数）
- `GET /api/services/:name` — 服务详情
- `GET /api/services/:name/layers` — 三层产物状态
- `GET /api/artifacts/tree` — 文件树
- `GET /api/artifacts/:path` — 产出物内容

### Scope
**IN**: Services 列表页（卡片+筛选+搜索+详情）+ Artifacts 文件树+预览+Token 计数 + Layer 补全操作入口
**OUT**: 多模态产物预览（依赖 multimodal-ingestion 完成后补充）、服务编辑/删除、文件上传

## Acceptance Criteria (Gherkin)
### User Story
作为开发者，我希望在浏览器中浏览服务列表和知识产出物，以便快速了解各服务的知识状态和具体内容。

### Scenarios
```gherkin
Scenario: 浏览服务列表
  Given 知识库中有 5 个已注册服务
  When 用户访问 Services 页面
  Then 显示 5 个服务卡片
  And 每个卡片包含：名称、描述、技术栈、Owner、端点数、三层产物状态

Scenario: 筛选和搜索服务
  Given 服务列表页面已加载
  When 用户在搜索框输入 "user"
  Then 只显示包含 "user" 的服务
  When 用户选择状态筛选 "⚠️ 部分"
  Then 只显示知识覆盖不完整的服务

Scenario: 浏览产出物文件树
  Given 用户访问 Artifacts 页面
  Then 左侧显示知识仓库的文件树结构
  When 用户点击 "distillates/order-service/01-overview.md"
  Then 右侧预览区显示该文件的 Markdown 渲染结果
  And 底部显示 Token 计数（实际 / 预算）

Scenario: Layer 补全操作
  Given 某服务只有 Layer 0 和 Layer 1，缺少 Layer 2
  When 用户点击 [补全 L2] 按钮
  Then 显示确认对话框
  And 确认后触发 Agent 执行 edith_distill 补全该服务的 Layer 2

Scenario: 空服务列表
  Given 知识库中没有已注册服务
  When 用户访问 Services 页面
  Then 显示空状态提示 "暂无服务，请先运行 edith_scan"
  And 隐藏筛选和搜索组件

Scenario: 产出物文件不存在
  Given 用户在文件树中选中一个文件
  When 该文件已被外部删除
  Then 预览区显示 "文件不存在，可能已被外部修改" 提示
  And 文件树标记该节点为失效状态
```

### General Checklist
- [x] Services 列表页（卡片式布局）
- [x] 服务筛选（全部/技术栈/状态）和搜索
- [x] 服务详情卡片（技术栈、端点数、模型数、Owner、三层状态）
- [x] Artifacts 文件树导航
- [x] Markdown 实时预览（Monaco Editor 或 markdown-it）
- [x] Token 计数显示（实际 / 预算）
- [ ] 多模态产物预览（图像语义描述）— deferred, depends on feat-p2-multimodal-ingestion
- [x] Layer 补全操作入口

## Merge Record
- **Completed**: 2026-05-05T15:45:00+08:00
- **Merged Branch**: feature/p2-board-explorer
- **Merge Commit**: 2ea2549
- **Archive Tag**: feat-p2-board-explorer-20260505
- **Conflicts**: none
- **Verification**: passed (6/6 scenarios via code analysis)
- **Files Changed**: 8 files, 1717 lines added
- **Commits**: 1 feature commit + 1 merge commit
