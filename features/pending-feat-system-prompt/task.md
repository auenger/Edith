# Tasks: feat-system-prompt

## Task Breakdown

### Phase 1: Foundation (Scenario 1, 2, 3 — 核心行为)

- [ ] T1.1 撰写 System Prompt 角色定义段落（你是 JARVIS...）
- [ ] T1.2 撰写核心职责清单（知识提取/管理/查询/路由）
- [ ] T1.3 构建触发映射表：关键词 → jarvis_scan / jarvis_distill / jarvis_query / jarvis_route
- [ ] T1.4 撰写行为约束规则（不暴露内部名称、自然语言回应）
- [ ] T1.5 撰写引用格式模板 `(来源: {path}, 片段: {section})`
- [ ] T1.6 测试 Scenario 1：输入 "分析一下订单服务的代码"，验证 jarvis_scan 被触发且工具名不暴露
- [ ] T1.7 测试 Scenario 2：准备模拟查询结果，验证来源标注格式正确
- [ ] T1.8 测试 Scenario 3：多轮对话验证无内部名称泄露

### Phase 2: Boundary Handling (Scenario 4, 5, 6 — 边界情况)

- [ ] T2.1 撰写模糊意图澄清话术模板（2-3 个候选意图选项）
- [ ] T2.2 撰写多意图识别规则（顺序执行 + 进度报告）
- [ ] T2.3 撰写工具不可用降级话术（知识库为空、服务未扫描、配置缺失）
- [ ] T2.4 测试 Scenario 4：输入 "帮我看看 user-service"，验证澄清话术触发
- [ ] T2.5 测试 Scenario 5：输入 "扫描 order-service 并蒸馏"，验证顺序执行和进度报告
- [ ] T2.6 测试 Scenario 6：知识库为空时查询，验证降级话术且不编造信息

### Phase 3: Advanced Cases (Scenario 7, 8 — 复杂输入)

- [ ] T3.1 定义混合语言触发规则（中英混合关键词识别）
- [ ] T3.2 定义上下文管理策略（>10 轮对话压缩规则、优先保留信息类型）
- [ ] T3.3 测试 Scenario 7：中英混合输入，验证触发准确性
- [ ] T3.8 测试 Scenario 8：构造 10+ 轮对话，验证上下文压缩后关键信息保留

### Phase 4: Tuning

- [ ] T4.1 收集全部测试结果，记录误触发和漏触发案例
- [ ] T4.2 根据测试结果调整触发映射表关键词权重
- [ ] T4.3 根据测试结果调整澄清话术的候选意图排序
- [ ] T4.4 最终回归测试：全部 8 个 Scenario 重新验证

## Progress Log
| Date       | Progress          | Notes                            |
|------------|-------------------|----------------------------------|
| 2026-04-27 | Spec enriched     | 增加 OUT scope、5 个新 Scenario、Given 前置条件修复、详细技术方案 |
