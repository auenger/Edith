# Tasks: feat-e2e-pilot

## Task Breakdown

### Phase A: 环境准备

- [ ] T.A.1 确认所有依赖 Feature（feat-tool-scan/distill/query/route）已完成
- [ ] T.A.2 从 jarvis.yaml repos 列表中选择一个真实项目作为试点目标
- [ ] T.A.3 配置 jarvis.yaml：确认 LLM provider、workspace 路径、repos 路径均正确
- [ ] T.A.4 准备验证用例：5 个查询问题 + 3 个路由需求（基于试点项目的真实代码）

### Phase B: 扫描验证 (Scenario 1, 4)

- [ ] T.B.1 执行 `jarvis scan <project>` — 正常路径
- [ ] T.B.2 验证扫描产出：技术栈识别是否正确
- [ ] T.B.3 验证扫描产出：API 端点列表是否完整（与代码对照）
- [ ] T.B.4 验证扫描产出：数据模型是否完整
- [ ] T.B.5 验证扫描产出：业务流程是否识别
- [ ] T.B.6 构造异常场景：在只读目录或损坏文件上执行 scan，验证错误处理（Scenario 4）

### Phase C: 蒸馏验证 (Scenario 1, 5)

- [ ] T.C.1 执行 `jarvis distill <project>` — 正常路径
- [ ] T.C.2 验证 Layer 0: routing-table.md token 数 < 500
- [ ] T.C.3 验证 Layer 1: quick-ref.md 内容约为原文 ~5%
- [ ] T.C.4 验证 Layer 2: distillates/*.md 语义拆分合理性
- [ ] T.C.5 若 routing-table.md 超 500 tokens，记录到已知问题（Scenario 5）

### Phase D: 查询验证 (Scenario 6, 7)

- [ ] T.D.1 执行查询 #1: "XX服务的技术栈是什么"
- [ ] T.D.2 执行查询 #2: "XX服务的 API 端点有哪些"
- [ ] T.D.3 执行查询 #3: "XX服务的数据模型是什么"
- [ ] T.D.4 执行查询 #4: "XX服务的核心业务流程是什么"
- [ ] T.D.5 执行查询 #5: 自由选择一个有价值的问题
- [ ] T.D.6 验证每个查询结果：与实际代码一致性
- [ ] T.D.7 验证每个查询结果：来源标注指向真实 distillate 文件
- [ ] T.D.8 统计查询准确率（目标 >= 80%）

### Phase E: 路由验证 (Scenario 8)

- [ ] T.E.1 执行路由 #1: 需求指向试点项目自身的功能变更
- [ ] T.E.2 执行路由 #2: 需求涉及跨服务协作
- [ ] T.E.3 执行路由 #3: 需求模糊，需要推断
- [ ] T.E.4 验证每个路由决策：与预期路由是否一致
- [ ] T.E.5 统计路由准确率（目标 >= 80%）

### Phase F: 零适配消费验证 (Scenario 3)

- [ ] T.F.1 选择另一个 AI Agent（如 Claude、GPT 等，无 JARVIS 插件）
- [ ] T.F.2 将 routing-table.md 提供给该 Agent
- [ ] T.F.3 验证该 Agent 能理解路由信息并做出正确判断
- [ ] T.F.4 验证不需要任何 JARVIS 特定运行时

### Phase G: 报告与声明 (Scenario 2)

- [ ] T.G.1 汇总覆盖率指标：扫描覆盖率、API 端点、数据模型、蒸馏片段数
- [ ] T.G.2 汇总质量评估：routing-table token 数、quick-ref 压缩比、distillates 完整性
- [ ] T.G.3 汇总查询准确性：每个查询结果 + 是否正确
- [ ] T.G.4 汇总路由准确性：每个路由结果 + 是否正确
- [ ] T.G.5 汇总已知问题：每个问题记录描述、严重程度、归属 Feature
- [ ] T.G.6 生成 pilot-report.md（使用 Technical Solution 中的模板结构）
- [ ] T.G.7 根据 pilot-ready 清单判定状态（READY / NOT-READY）
- [ ] T.G.8 写 pilot-ready 声明

## Progress Log
| Date       | Progress          | Notes                                                              |
|------------|-------------------|--------------------------------------------------------------------|
| 2026-04-27 | Spec enriched     | 增加 OUT scope、5 个新 Scenario（含 3 个错误场景）、详细验证流程和报告模板 |
