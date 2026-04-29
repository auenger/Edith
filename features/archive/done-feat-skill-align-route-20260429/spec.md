# Feature: feat-skill-align-route Route 精准路由增强

## Basic Information
- **ID**: feat-skill-align-route
- **Name**: Route 精准路由增强（对齐 requirement-router SKILL.md）
- **Priority**: 82
- **Size**: S
- **Dependencies**: [feat-skill-align-distill]
- **Parent**: feat-skill-alignment
- **Children**: []
- **Created**: 2026-04-29

## Description

对 agent/src/tools/route.ts 做小幅度增强，对齐 edith-skills/requirement-router/SKILL.md 的完整设计。当前实现已覆盖核心路由逻辑，差距较小，主要缺失 multi-service 独立策略、复杂度分析和紧急事件特殊处理。

## User Value Points

1. **Multi-Service 独立路由策略**：多服务场景有专门的路由决策
2. **复杂度分析**：从关键词评分升级为多维信号分析
3. **紧急事件特殊路由**：关键故障场景优先加载策略
4. **透明决策推理**：输出完整决策依据

## Context Analysis

### Current State (route.ts)
- 3 种路由策略：direct / quick-ref / deep-dive
- 关键词评分的变更类型分类
- 基础置信度计算
- 服务名匹配（含中文支持）

### Target State (requirement-router SKILL.md)
- 4 种路由策略：direct / quick-ref / **multi-service** / deep-dive
- 多维信号分析（实体数量 + 协调需求 + 兼容性影响）
- 紧急事件优先路由
- 新项目检测
- YAML 结构化输出（已有 RouteResult 结构）

### Gap Assessment
**差距级别：MINOR** — 核心逻辑已有，需增强而非重写。

### Reference Code
- agent/src/tools/route.ts — 当前实现（~903 行）
- edith-skills/requirement-router/SKILL.md — 完整设计

## Technical Solution

### Enhancement 1: Multi-Service 独立路由策略
1. 新增 `RouteDecision = "multi-service"` 类型
2. 多服务 + 非跨服务场景 → multi-service（加载多个 quick-ref）
3. 多服务 + schema_change → deep-dive
4. 更新 `routeDecision()` 决策表

### Enhancement 2: 复杂度分析
1. 新增 `analyzeComplexity()` 函数
   - 实体数量评估（从需求文本提取实体名词）
   - 跨服务协调需求评估
   - 兼容性影响评估（breaking change 检测）
2. 复杂度影响路由策略权重

### Enhancement 3: 紧急事件路由
1. 新增紧急事件检测和特殊处理
   - 识别 P0/P1 级别关键词
   - 优先加载完整上下文（quick-ref + 相关 distillates）
   - 降低置信度阈值（更保守路由）

### Enhancement 4: 新项目检测
1. 新增 `isNewProject()` 检测
   - 无匹配服务 + 新建/初始化关键词 → direct
   - 明确标注为新项目场景

### Enhancement 5: 透明决策推理
1. 增强 RouteResult.reason 输出
   - 信号提取摘要
   - 每个信号的权重
   - 决策依据链

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，我希望 route 工具能精准分析需求复杂度，给出最优的上下文加载策略。

### Scenarios (Given/When/Then)

#### Scenario 1: Multi-Service 路由
```gherkin
Given 路由表中有 user-service 和 order-service
When 用户需求涉及 "用户下单后同步更新库存"
Then 路由决策为 "multi-service"
  And filesToLoad 包含 user-service/quick-ref.md 和 order-service/quick-ref.md
```

#### Scenario 2: 紧急事件路由
```gherkin
Given 路由表中有 payment-service
When 用户需求为 "线上支付故障，500 报错，紧急回滚"
Then 路由决策优先加载完整上下文（quick-ref + 相关 distillates）
  And confidence 包含紧急事件标记
```

#### Scenario 3: 复杂度分析
```gherkin
Given 一个涉及 schema 变更的需求
When 用户执行 edith_route
Then 输出包含复杂度分析（实体数量、协调需求、兼容性影响）
  And 路由策略受复杂度影响
```

### General Checklist
- [ ] multi-service 路由策略实现
- [ ] 复杂度分析实现
- [ ] 紧急事件路由实现
- [ ] 新项目检测实现
- [ ] 决策推理输出增强
- [ ] 现有路由逻辑向后兼容
