# Feature: feat-excavate-md-mining MD 文件分类分级挖掘

## Basic Information
- **ID**: feat-excavate-md-mining
- **Name**: MD 文件分类分级挖掘（项目既有知识深度提取）
- **Priority**: 92
- **Size**: S
- **Dependencies**: [feat-excavate-smart-depth]
- **Parent**: feat-deep-excavation
- **Children**: []
- **Created**: 2026-04-30

## Description

当前 scan skill 在 Step 2 "检查现有文档" 中只是简单扫描 MD 文件，不深入分析内容。本特性将 MD 文件从"可选补充信息"提升为"一等知识源"，按分类分级策略深入挖掘。

### 文档分类分级规则

| 级别 | 文档类型 | 处理策略 | 示例 |
|------|---------|---------|------|
| **P0 必读** | README.md, CHANGELOG.md, CONTRIBUTING.md | 全量读取，提取所有事实 | README.md, CHANGELOG.md |
| **P1 高优** | docs/ 目录下的架构/API/设计文档 | 按相关性评分，高分全量读 | docs/architecture.md, docs/api.md |
| **P2 标准** | 其他目录下的 MD 文件 | 建索引 + 提取标题和首段 | guides/, examples/ 下的 MD |
| **P3 可选** | node_modules/ 等第三方目录中的 MD | 跳过（除非用户指定） | 第三方库的 README |

### 相关性评分维度

- 路径深度：根目录 > docs/ > src/ > 其他
- 文件名关键词：architecture, api, design, guide, readme
- 内容信号：标题包含关键术语（API, 接口, 架构, 模型）
- 修改时间：近期修改的文档优先级更高

## User Value Points

1. 充分利用项目中已有的知识（README、CHANGELOG、设计文档），避免重复挖掘
2. 文档与代码交叉验证，发现不一致和过期信息

## Context Analysis

### Reference Code
- `edith-skills/document-project/SKILL.md` — Step 2 "检查现有文档" 当前实现
- `agent/src/tools/scan.ts` — scan 工具中文档处理的代码

### Related Documents
- `SKILL.md` 黄金路径 — Phase 2 INVENTORY 中的文档盘点

### Related Features
- `feat-deep-excavation`（父特性）
- `feat-excavate-smart-depth`（前置特性 — 深度控制影响 MD 分析深度）

## Technical Solution
<!-- To be filled during implementation -->

核心改动点：
1. **MD 发现器**：递归扫描项目所有 MD 文件，排除第三方目录
2. **分类分级引擎**：根据路径/文件名/内容信号自动分级
3. **内容提取器**：按级别执行不同深度的内容提取
4. **交叉验证器**：将 MD 提取的知识与代码分析结果对比，标注不一致
5. **SKILL.md 更新**：重写 Step 2 为深度文档挖掘

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，当我扫描一个项目时，Agent 自动发现所有有价值的 MD 文档，按重要性分级深入分析，提取既有知识与代码分析结果交叉验证。

### Scenarios (Given/When/Then)

#### Scenario 1: README 全量提取
```gherkin
Given 项目根目录有 README.md 包含项目介绍、安装说明、API 概述
When scan 执行 MD 挖掘阶段
Then README.md 被全量读取
And 提取所有事实性信息（技术栈、依赖、命令、约束）
And 与代码分析结果交叉验证
And 不一致处标注 [文档-代码不一致]
```

#### Scenario 2: docs/ 目录按相关性评分
```gherkin
Given docs/ 目录下有 architecture.md, api-guide.md, team-notes.md, meeting-2024.md
When scan 执行 MD 分级处理
Then architecture.md 和 api-guide.md 被评为 P1 高优
And team-notes.md 和 meeting-2024.md 被评为 P2 标准
And P1 文档被全量分析，P2 文档只建索引
```

#### Scenario 3: 文档-代码交叉验证
```gherkin
Given README.md 声明项目使用 PostgreSQL
And 代码中实际使用 MySQL
When scan 完成 MD + 代码分析
Then 生成报告中标注 "README.md 声明 PostgreSQL，代码实际使用 MySQL [文档-代码不一致]"
```

### General Checklist
- [ ] P0 文档全部被全量分析
- [ ] P1 文档相关性评分准确
- [ ] 交叉验证能发现真实不一致
- [ ] 不遗漏重要 MD 文件
- [ ] 第三方目录（node_modules/）被正确排除
