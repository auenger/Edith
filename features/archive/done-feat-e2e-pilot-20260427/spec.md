# Feature: feat-e2e-pilot 端到端试点验证

## Basic Information
- **ID**: feat-e2e-pilot
- **Name**: 端到端试点验证（真实项目扫描→蒸馏→查询→路由）
- **Priority**: 85
- **Size**: L
- **Dependencies**: [feat-tool-scan, feat-tool-distill, feat-tool-query, feat-tool-route]
- **Parent**: feat-agent-mvp
- **Children**: []
- **Created**: 2026-04-27

## Description

使用真实项目进行 EDITH Agent MVP 的端到端验证：完整走通 扫描→蒸馏→三层加载查询→需求路由 流程。输出 pilot-ready 声明和试点报告。

## OUT Scope

本功能 **不包含** 以下内容：
- 修复验证过程中发现的具体 Bug（发现的问题记录到 pilot-report.md，创建 issue 交给对应 Feature 修复）
- 性能优化（如有性能问题，记录到报告，单独排期）
- 多项目并行验证（仅选一个真实项目做深度验证）
- CI/CD 集成（E2E 测试自动化后续再做）
- Board / Artifacts 产品验证（仅验证 Agent + 产出物）

## User Value Points

1. **真实项目验证** — 用实际代码库验证 EDITH 全流程，不是 demo
2. **Pilot-ready 声明** — 验证通过后声明试点就绪，团队可以开始试用
3. **试点报告** — 记录验证过程中发现的问题和改进方向，为后续迭代提供依据
4. **零适配消费验证** — 确认其他 Agent 可以零成本消费产出物

## Context Analysis

### Reference Code
- `SKILL.md` § 8 阶段中的 CONFIRM 和 PILOT-READY 阶段

### Related Documents
- `EDITH-PRODUCT-DESIGN.md` § 7 开发路线图 Phase 1 Week 3
- `references/en/instance-readiness.md` — 实例就绪标准
- `references/en/example-pilot-shape.md` — 试点形态示例

## Technical Solution

### 验证流程

```text
Phase A: 环境准备
  1. 从 edith.yaml 中选择一个真实项目作为试点目标
  2. 确认 edith.yaml 配置正确（LLM provider、workspace、repos）
  3. 确认所有依赖 Feature 的工具已实现且可用

Phase B: 扫描验证 (edith_scan)
  4. 执行 edith_scan <project>
  5. 验证产出：技术栈识别、API 端点列表、数据模型、业务流程

Phase C: 蒸馏验证 (edith_distill)
  6. 执行 edith_distill <project>
  7. 验证三层产物：
     - Layer 0: routing-table.md < 500 tokens
     - Layer 1: quick-ref.md ~5% 原文量
     - Layer 2: distillates/*.md 语义拆分

Phase D: 查询验证 (edith_query)
  8. 执行知识查询（至少 5 个代表性问题）
  9. 验证三层加载策略 + 来源引用

Phase E: 路由验证 (edith_route)
  10. 执行需求路由（至少 3 个代表性需求）
  11. 验证路由决策准确性

Phase F: 零适配验证
  12. 用另一个 Agent（非 EDITH）读取 routing-table.md
  13. 验证该 Agent 能获得路由能力

Phase G: 报告与声明
  14. 生成 pilot-report.md
  15. 写 pilot-ready 声明
```

### pilot-report.md 结构

```markdown
# EDITH Pilot Report

## 基本信息
- 试点项目: {project-name}
- 试点日期: {date}
- EDITH 版本: {version}

## 覆盖率指标
| 维度         | 指标                    | 结果  |
|-------------|------------------------|-------|
| 扫描覆盖率    | 识别的模块 / 总模块      | x/y   |
| API 端点     | 识别的端点 / 总端点      | x/y   |
| 数据模型     | 识别的模型 / 总模型      | x/y   |
| 蒸馏完整性    | 蒸馏片段数              | n     |

## 质量评估
- routing-table.md token 数量: {count}
- quick-ref.md 压缩比: {ratio}%
- distillates 语义完整性: {assessment}

## 查询准确性
| 查询问题                    | 期望答案         | 实际答案        | 是否正确 |
|---------------------------|-----------------|----------------|---------|
| ...                        | ...             | ...            | Y/N     |

## 路由准确性
| 测试需求                    | 期望路由          | 实际路由        | 是否正确 |
|---------------------------|-----------------|----------------|---------|
| ...                        | ...             | ...            | Y/N     |

## 零适配消费验证
- 消费 Agent: {agent-name}
- 结果: {pass/fail}
- 说明: {details}

## 已知问题
| # | 问题描述 | 严重程度 | 归属 Feature |
|---|---------|---------|-------------|
| 1 | ...     | P1/P2/P3| feat-xxx    |

## Pilot-Ready 声明
- [ ] 基本流程全部走通
- [ ] 产出物格式正确
- [ ] 查询准确率 >= 80%
- [ ] 无 P1 级问题
- [ ] 零适配消费验证通过

Status: READY / NOT-READY
```

## Acceptance Criteria (Gherkin)

**Scenario 1: 完整 E2E 流程 — 正常路径**
```gherkin
Given EDITH Agent 已部署且所有依赖工具（scan/distill/query/route）已实现
And edith.yaml 已配置一个真实项目
When 依次执行 edith scan → edith distill → edith query → edith route
Then 每一步都有产出且格式正确
And 产出的 Markdown 文件可被其他 Agent 直接消费（纯 Markdown，无特殊格式）
```

**Scenario 2: 试点报告生成**
```gherkin
Given E2E 验证已完成（scan/distill/query/route 全部执行过）
When 触发报告生成
Then 生成 pilot-report.md
And 包含：扫描覆盖率、蒸馏质量评估、查询准确性、路由准确性、已知问题
And 包含 pilot-ready 状态声明（READY 或 NOT-READY）
And 已知问题中每个问题都有归属 Feature 标记
```

**Scenario 3: 产出物零适配消费验证**
```gherkin
Given 三层知识产物已生成（routing-table.md、quick-ref.md、distillates/）
When 另一个 AI Agent（非 EDITH，无 EDITH 专用插件）读取 routing-table.md
Then 该 Agent 能根据 routing-table.md 中的消费规则正确判断加载策略
And 该 Agent 能理解 routing-table.md 中的服务路由信息
And 不需要安装任何 EDITH 特定的运行时或库
```

**Scenario 4: 扫描中途失败 — 错误处理与恢复**
```gherkin
Given EDITH Agent 已启动且 edith.yaml 配置正确
When 执行 edith scan 时目标项目代码有语法错误或权限不足
Then Agent 报告具体的失败原因（"扫描失败：{具体原因}"）
And 建议用户修复后重试
And 不生成不完整的扫描产物
And pilot-report.md 记录此次失败事件
```

**Scenario 5: 蒸馏产出质量不达标**
```gherkin
Given edith scan 已成功完成
When 执行 edith distill 后发现 routing-table.md 超过 500 tokens
Then pilot-report.md 中记录 "routing-table.md 超出 token 预算"
And 标记此为已知问题，归属 feat-tool-distill
And 不阻止后续验证步骤（query/route 可继续使用已有产物）
```

**Scenario 6: 查询返回错误结果**
```gherkin
Given 三层知识产物已生成
When 用户执行知识查询 "XX服务的支付接口有哪些"
And edith_query 返回的结果与实际代码不一致（如遗漏接口、编造接口）
Then pilot-report.md 中记录此查询准确性问题
And 标记为已知问题，归属 feat-tool-query 或 feat-tool-distill
And 查询准确率低于 80% 时，pilot-ready 状态为 NOT-READY
```

**Scenario 7: 多轮查询验证**
```gherkin
Given 三层知识产物已生成
When 执行至少 5 个不同类型的知识查询
Then 每个查询都有来源标注（指向具体 distillate 文件）
And 至少 80% 的查询结果与实际代码一致
And pilot-report.md 中记录每个查询的准确性结果
```

**Scenario 8: 路由决策准确性验证**
```gherkin
Given 三层知识产物已生成
When 执行至少 3 个不同类型的需求路由分析
Then 路由决策与预期一致（需求被路由到正确的服务/团队）
And pilot-report.md 中记录每个路由的准确性结果
And 路由准确率低于 80% 时，pilot-ready 状态为 NOT-READY
```
