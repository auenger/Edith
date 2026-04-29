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
- 依赖 feat-p2-board-scaffold 提供的 API 层

### Related Documents
- EDITH-PRODUCT-DESIGN.md §3.3 Services / Artifacts 页面设计
- EDITH-INTEGRATION-DESIGN.md §五 承接关系

### Related Features
- feat-p2-board-scaffold (前置) — API 和数据层
- feat-p2-multimodal-ingestion (关联) — 多模态产物预览

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
```

### General Checklist
- [ ] Services 列表页（卡片式布局）
- [ ] 服务筛选（全部/技术栈/状态）和搜索
- [ ] 服务详情卡片（技术栈、端点数、模型数、Owner、三层状态）
- [ ] Artifacts 文件树导航
- [ ] Markdown 实时预览（Monaco Editor 或 markdown-it）
- [ ] Token 计数显示（实际 / 预算）
- [ ] 多模态产物预览（图像语义描述）
- [ ] Layer 补全操作入口
