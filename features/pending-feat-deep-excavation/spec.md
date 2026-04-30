# Feature: feat-deep-excavation 挖掘与蒸馏深度增强

## Basic Information
- **ID**: feat-deep-excavation
- **Name**: 挖掘与蒸馏深度增强
- **Priority**: 92
- **Size**: L
- **Dependencies**: []
- **Parent**: null
- **Children**: [feat-excavate-smart-depth, feat-excavate-md-mining, feat-excavate-code-deep]
- **Created**: 2026-04-30

## Description

EDITH Agent 的核心能力是「挖掘和蒸馏」，但当前 scan 和 distill 两个内置 skill 默认挖掘深度不够：
- scan 只做表面扫描（目录结构 + 配置文件），不深入代码细节
- 不自动分析目标项目中的 MD 文件（README、docs/、CHANGELOG 等既有知识被忽略）
- 蒸馏基于浅层扫描结果，输入质量低导致输出也浅

本特性将 scan 的默认行为从"扫一扫就结束"提升为"智能深度挖掘"，根据项目规模和类型自动选择合适的深度，对 MD 文件分类分级处理，并对代码做函数级深度分析。

## User Value Points

1. **智能深度控制** — 根据项目规模和类型自动选择扫描深度（小项目全量、大项目分模块深度），无需用户手动选择 Quick/Deep/Exhaustive
2. **MD 文件分类分级挖掘** — 按文档类型自动分级处理：README/CHANGELOG 必读，docs/ 目录按相关性评分深入，其他 MD 可选分析。充分利用项目中已有的知识
3. **代码细节深度分析** — 从目录级提升到函数级：分析接口签名、类型定义、导入导出关系、调用链、错误处理模式，提取更深层的架构知识

## Context Analysis

### Reference Code
- `edith-skills/document-project/SKILL.md` — 当前 scan skill 的 7 阶段流程和 3 级深度定义
- `edith-skills/distillator/SKILL.md` — 当前 distill skill 的压缩引擎
- `agent/src/tools/scan.ts` — edith_scan 工具实现
- `agent/src/tools/distill.ts` — edith_distill 工具实现

### Related Documents
- `SKILL.md` 黄金路径 — Phase 2 INVENTORY 阶段需要深层挖掘
- `SCALABILITY-ANALYSIS.md` — 微服务规模下的瓶颈分析

### Related Features
- `feat-skill-align-scan`（已完成）— 对齐了 scan 的 SKILL.md 规范，但深度仍不够
- `feat-skill-align-distill`（已完成）— 对齐了 distill 的 SKILL.md 规范
- `feat-p2-multimodal-ingestion`（pending）— Phase 2 多模态摄入，与本特性互补

## Technical Solution
<!-- To be filled during implementation -->

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，当我扫描一个老项目时，我希望 Agent 自动选择合适的深度，分析所有有价值的 MD 文档，并深入代码细节提取架构知识，而不是只做表面扫描。

### Scenarios (Given/When/Then)

#### Scenario 1: 小项目自动全量深度扫描
```gherkin
Given 一个小于 100 个源文件的项目
When 用户执行 edith_scan
Then 自动选择 Exhaustive 深度
And 全量读取所有源文件和 MD 文件
And 生成函数级的详细文档
```

#### Scenario 2: 大项目自动分模块深度扫描
```gherkin
Given 一个超过 500 个源文件的大型项目
When 用户执行 edith_scan
Then 自动识别模块边界
And 按模块分批进行 Deep 级别扫描
And 合并生成全局架构文档 + 各模块详细文档
```

#### Scenario 3: MD 文件必读级自动处理
```gherkin
Given 项目根目录有 README.md 和 CHANGELOG.md
And docs/ 目录下有 10+ 个 MD 文件
When scan 执行时
Then README.md 和 CHANGELOG.md 被全量读取和分析
And docs/ 中的文件按相关性评分排序
And 高分文件被深入分析，低分文件只建索引
```

#### Scenario 4: 代码深度分析提取接口契约
```gherkin
Given 项目中有 TypeScript/Go/Python 代码文件
When scan 进入代码深度分析阶段
Then 提取所有 public 接口签名
And 分析类型定义和依赖关系
And 追踪函数调用链
And 生成接口契约文档
```

### General Checklist
- [ ] 智能深度选择逻辑正确处理项目规模边界
- [ ] MD 文件分类分级规则覆盖常见文档类型
- [ ] 代码深度分析不遗漏关键接口
- [ ] 与现有 distill 流程无缝衔接
- [ ] 扫描性能可接受（大项目不超过 5 分钟）
