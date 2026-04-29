# Feature: feat-skill-align-scan Scan 深度代码考古

## Basic Information
- **ID**: feat-skill-align-scan
- **Name**: Scan 深度代码考古（对齐 document-project SKILL.md）
- **Priority**: 92
- **Size**: L
- **Dependencies**: []
- **Parent**: feat-skill-alignment
- **Children**: []
- **Created**: 2026-04-29

## Description

将 agent/src/tools/scan.ts 从"文件计数器"升级为真正的代码考古器，对齐 edith-skills/document-project/SKILL.md 的完整设计。当前实现仅做目录遍历和文件计数，缺失所有深度分析能力。

## User Value Points

1. **项目智能分类**：自动识别 12 种项目类型 + 5 种架构模式
2. **API 契约提取**：从路由/控制器文件提取 HTTP method/path/request-response/auth
3. **数据模型分析**：提取数据库 schema、ORM 配置、实体关系
4. **业务逻辑发现**：推断核心业务流程和外部依赖
5. **模块 Deep Dive**：文件级分析 + 依赖映射 + 数据流追踪
6. **丰富文档输出**：10+ 结构化文档文件 + 带注解源码树 + 开发指南

## Context Analysis

### Current State (scan.ts)
- 仅遍历目录计数 endpoints/models/flows 文件数量
- 输出 3 个硬编码的 .md 文件（overview/api-endpoints/data-models）
- 无项目类型检测、无架构识别、无 API 详情、无模型分析

### Target State (document-project SKILL.md)
- 5 阶段处理管线：项目分类 → 技术栈分析 → 条件扫描 → 源码分析 → 文档生成
- 12 种项目类型检测
- 5 种架构模式识别
- 4 个输出模板（index/api-contracts/data-models/deep-dive）
- 10+ 输出文件
- .scan-state.json 增量扫描恢复

### Reference Code
- agent/src/tools/scan.ts — 当前实现（~837 行）
- edith-skills/document-project/SKILL.md — 完整设计规范
- edith-skills/document-project/templates/ — 4 个输出模板

## Technical Solution

### Phase 1: 项目智能分类（scan.ts 扩展）
1. 新增 `classifyProject()` — 12 种项目类型检测
   - 检测指标：依赖文件 + 目录结构 + 框架特征
   - 输出：ProjectType + ArchitecturePattern
2. 新增 `detectArchitecture()` — 5 种架构模式
   - monolith: 单一入口 + 无服务边界
   - monorepo: workspaces/lerna/nx 指标
   - microservice: 多服务 + API 网关 + 服务发现
   - multi-part: 多模块但有共享层
   - event-driven: 消息队列 + 事件处理

### Phase 2: API 契约提取
1. 新增 `extractApiContracts()` — 从路由/控制器提取
   - Spring Boot: @RequestMapping/@GetMapping/@PostMapping 注解解析
   - Express: router.get/post/put/delete 调用解析
   - FastAPI: @router.get/post 装饰器解析
   - Gin: r.GET/POST/PUT/DELETE 注册解析
   - 通用：HTTP method + path + request body + response type + auth

### Phase 3: 数据模型分析
1. 新增 `analyzeDataModels()` — 从模型文件提取
   - JPA/TypeORM/Prisma/SQLAlchemy entity 解析
   - 字段名 + 类型 + 约束 + 关系
   - Entity Relationship 摘要

### Phase 4: 业务逻辑发现
1. 新增 `discoverBusinessLogic()` — 从服务层推断
   - 方法名模式提取（createXxx/updateXxx/deleteXxx）
   - 外部调用识别（HTTP client/消息队列/缓存）
   - 核心业务流程摘要

### Phase 5: 输出升级
1. 引入 edith-skills/document-project/templates/ 的 4 个模板
2. 输出 10+ 文件：
   - index.md（主索引 + AI 使用指南）
   - project-overview.md（含项目类型 + 架构模式）
   - tech-stack.md
   - source-tree.md（带用途注解）
   - api-contracts.md（完整 API 详情）
   - data-models.md（完整模型 + 关系）
   - business-logic.md
   - development-guide.md
   - .scan-state.json（增量扫描状态）

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望 scan 工具能深入分析代码，生成结构化的项目知识文档。

### Scenarios (Given/When/Then)

#### Scenario 1: Spring Boot 项目扫描
```gherkin
Given 一个 Spring Boot 项目，含 UserController、User entity、UserService
When 用户执行 edith_scan {target: "user-service"}
Then 输出包含：
  - project-overview.md 标注项目类型为 "backend"
  - api-contracts.md 列出 GET /users, POST /users, GET /users/{id} 等端点
  - data-models.md 列出 User entity 含字段名、类型、约束
  - business-logic.md 描述用户注册/登录流程
  - source-tree.md 每个目录有用途注解
```

#### Scenario 2: Node.js/Express 项目扫描
```gherkin
Given 一个 Express.js 项目
When 用户执行 edith_scan {target: "api-gateway"}
Then api-contracts.md 包含 router.get/post 等定义的端点
  And tech-stack.md 列出 Express + 中间件 + 数据库驱动
```

#### Scenario 3: 不支持的技术栈降级
```gherkin
Given 一个 Rust/Actix 项目
When 用户执行 edith_scan {target: "rust-service"}
Then 输出降级模式文件结构信息
  And 包含 scan-warning.md 说明支持范围
```

#### Scenario 4: 增量扫描
```gherkin
Given 一个已扫描过的服务（含 .scan-state.json）
When 用户再次执行 edith_scan {target: "same-service"}
Then 扫描基于上次状态增量进行
  And 输出文件更新而非覆盖
```

### General Checklist
- [ ] 所有项目类型检测通过测试
- [ ] 至少 3 种框架的 API 提取可用
- [ ] Entity 关系提取准确
- [ ] 输出文件格式符合模板
- [ ] 向后兼容现有 scan 结果（可被 distill 消费）
