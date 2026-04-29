# Feature: feat-skill-align-distill Distill 无损压缩引擎

## Basic Information
- **ID**: feat-skill-align-distill
- **Name**: Distill 无损压缩引擎（对齐 distillator SKILL.md）
- **Priority**: 88
- **Size**: M
- **Dependencies**: [feat-skill-align-scan]
- **Parent**: feat-skill-alignment
- **Children**: []
- **Created**: 2026-04-29

## Description

将 agent/src/tools/distill.ts 从基础过滤升级为无损压缩引擎，对齐 edith-skills/distillator/SKILL.md 的完整设计。当前实现仅做简单的过渡句/自引用过滤，缺失核心压缩、冲突检测、跨文档分析和验证能力。

## User Value Points

1. **无损压缩**：3:1+ 压缩比，保留所有事实信息
2. **冲突检测与标注**：多源文档间的冲突自动发现和标注
3. **跨文档分析**：提取文档间关系、依赖和模式
4. **往返验证**：压缩准确性自动验证
5. **自动分组**：按命名约定自动分组相关文档

## Context Analysis

### Current State (distill.ts)
- Layer 0/1/2 三层生成框架已有
- 压缩仅移除过渡句和自引用（isTransitional/isSelfReferential）
- 无冲突检测、无跨文档分析、无验证

### Target State (distillator SKILL.md)
- 3 阶段处理管线：Analysis → Compression → Output
- 5 步压缩：提取 → 去重 → 过滤 → 主题分组 → 语言压缩
- 源文档冲突解决
- 跨文档关系提取
- 往返验证（可选）
- 自动文档分组

### Reference Code
- agent/src/tools/distill.ts — 当前实现（~1095 行）
- edith-skills/distillator/SKILL.md — 完整设计
- edith-skills/distillator/resources/compression-rules.md
- edith-skills/distillator/resources/splitting-strategy.md
- edith-skills/distillator/resources/quick-ref-rules.md

## Technical Solution

### Phase 1: 压缩规则引擎
1. 引入 edith-skills/distillator/resources/ 中的规则
2. 实现多步压缩管线：
   - `extract()` — 提取所有离散信息点
   - `deduplicate()` — 合并重叠事实，保留最丰富上下文
   - `filterByConsumer()` — 按下游消费者过滤无关内容
   - `groupByTheme()` — 按自然主题分组
   - `compressLanguage()` — 语言级压缩（去除冗余表述）

### Phase 2: 冲突检测
1. 新增 `detectConflicts()` — 跨文档冲突发现
   - 同一实体在不同文档中的描述差异
   - API 端点定义冲突
   - 数据模型字段冲突
2. 冲突标注格式：`⚠️ CONFLICT: {description}` in output

### Phase 3: 跨文档分析
1. 新增 `analyzeCrossDocument()` — 关系提取
   - 文档间引用关系
   - 共享实体/概念
   - 依赖链路
2. 输出 cross-references section

### Phase 4: 往返验证
1. 新增 `validateRoundTrip()` — 可选验证步骤
   - 压缩产物 → 提取事实列表
   - 原始文档 → 提取事实列表
   - 对比覆盖率 ≥ 95%
2. 输出验证报告

### Phase 5: 自动分组
1. 新增 `groupDocuments()` — 按命名约定分组
   - brief + discovery notes 配对
   - 同模块文档聚类
   - 相关主题文档合并

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望 distill 工具能生成高质量无损压缩的知识产物，保留所有事实信息。

### Scenarios (Given/When/Then)

#### Scenario 1: 无损压缩
```gherkin
Given 一个服务的扫描结果含 overview.md + api-endpoints.md + data-models.md
When 用户执行 edith_distill {target: "user-service"}
Then 蒸馏产物保留所有 API 端点、数据模型字段、业务约束
  And 压缩比 ≥ 3:1
  And 无 [未确认] 标记的内容
```

#### Scenario 2: 冲突检测
```gherkin
Given 两个源文档对同一 API 端点描述不同
When 用户执行 edith_distill
Then 蒸馏产物中标注 "⚠️ CONFLICT: {差异描述}"
  And 在 warnings 中列出所有冲突
```

#### Scenario 3: 往返验证
```gherkin
Given 已蒸馏的服务
When 用户请求验证
Then 验证报告显示事实覆盖率 ≥ 95%
  And 列出所有遗漏的信息点
```

### General Checklist
- [ ] 压缩规则引擎实现
- [ ] 冲突检测实现
- [ ] 跨文档分析实现
- [ ] 往返验证实现（可选 flag）
- [ ] 自动分组实现
- [ ] 向后兼容现有 distill 输出格式
