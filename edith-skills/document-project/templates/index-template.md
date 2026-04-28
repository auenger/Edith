# {project_name} — 文档索引

**类型：** {repository_type}（{parts_count} 部分）
**主要语言：** {primary_language}
**架构：** {architecture_type}
**更新日期：** {date}

## 项目概览

{project_description}

## 快速参考

| 项 | 值 |
|---|---|
| 技术栈 | {tech_stack_summary} |
| 入口文件 | {entry_point} |
| 架构模式 | {architecture_pattern} |
| 数据库 | {database} |
| 部署方式 | {deployment_platform} |

## 生成的文档

### 核心文档

- [项目概览](./project-overview.md) — 执行摘要和高层架构
- [源码树分析](./source-tree.md) — 带注释的目录结构
- [架构文档](./architecture.md) — 详细技术架构
- [技术栈](./tech-stack.md) — 完整技术栈和依赖

### 条件文档（根据项目类型生成）

- [API 契约](./api-contracts.md) — API 端点和 Schema
- [数据模型](./data-models.md) — 数据库 Schema 和实体关系
- [业务逻辑](./business-logic.md) — 核心业务流程和规则
- [开发指南](./development-guide.md) — 本地搭建和开发流程
- [集成架构](./integration-architecture.md) — 模块间集成方式

### 模块深入文档

{deep_dive_links}

## 给 AI Agent 的使用指南

| 场景 | 参考文档 |
|------|---------|
| 新增 UI 功能 | architecture.md, component-inventory.md |
| 新增 API/后端功能 | architecture.md, api-contracts.md, data-models.md |
| 全栈功能 | 所有架构文档 + integration-architecture.md |
| 部署变更 | development-guide.md |
| 理解某个模块 | deep-dive-{module}.md |

---

_由 edith-document-project 生成_
