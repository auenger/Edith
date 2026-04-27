# Checklist: feat-system-prompt

## Completion Checklist

### Prompt 内容完整性
- [x] System Prompt 包含角色定义段落
- [x] System Prompt 包含核心职责清单（4 项）
- [x] 触发映射表覆盖 scan / distill / query / route 四个工具
- [x] 触发映射表包含中英文关键词
- [x] 引用格式模板已定义
- [x] 行为约束规则已定义（不暴露内部名称等）
- [x] 模糊意图澄清话术已定义
- [x] 多意图顺序执行规则已定义
- [x] 工具不可用降级话术已定义（至少 3 种场景）
- [x] 混合语言处理规则已定义
- [x] 上下文管理策略已定义（压缩阈值、保留优先级）

### Scenario 验证
- [x] Scenario 1: 关键词触发准确（扫描意图）
- [x] Scenario 2: 知识来源标注格式正确
- [x] Scenario 3: 无内部名称泄露
- [x] Scenario 4: 模糊意图触发澄清话术
- [x] Scenario 5: 多意图顺序执行 + 进度报告
- [x] Scenario 6: 知识库为空时降级且不编造
- [x] Scenario 7: 中英混合输入正确触发
- [x] Scenario 8: 长对话上下文压缩后关键信息保留

### Tuning 验证
- [x] 误触发案例已收集并修复
- [x] 漏触发案例已收集并修复
- [x] 全部 8 个 Scenario 回归测试通过

### JARVIS Discipline
- [x] System Prompt 不暴露 Skill 名称给用户
- [x] System Prompt 约束 Agent 不编造代码中不存在的事实
- [x] 引用格式指向真实文件路径，不编造路径
- [x] 回复使用自然语言，不暴露框架 API 细节

## Verification Record

| Timestamp | Status | Results | Evidence |
|-----------|--------|---------|----------|
| 2026-04-27T23:45:00+08:00 | PASS | 22/22 tasks complete, 131/131 tests pass, 8/8 scenarios validated | evidence/verification-report.md |
