# Checklist: feat-system-prompt

## Completion Checklist

### Prompt 内容完整性
- [ ] System Prompt 包含角色定义段落
- [ ] System Prompt 包含核心职责清单（4 项）
- [ ] 触发映射表覆盖 scan / distill / query / route 四个工具
- [ ] 触发映射表包含中英文关键词
- [ ] 引用格式模板已定义
- [ ] 行为约束规则已定义（不暴露内部名称等）
- [ ] 模糊意图澄清话术已定义
- [ ] 多意图顺序执行规则已定义
- [ ] 工具不可用降级话术已定义（至少 3 种场景）
- [ ] 混合语言处理规则已定义
- [ ] 上下文管理策略已定义（压缩阈值、保留优先级）

### Scenario 验证
- [ ] Scenario 1: 关键词触发准确（扫描意图）
- [ ] Scenario 2: 知识来源标注格式正确
- [ ] Scenario 3: 无内部名称泄露
- [ ] Scenario 4: 模糊意图触发澄清话术
- [ ] Scenario 5: 多意图顺序执行 + 进度报告
- [ ] Scenario 6: 知识库为空时降级且不编造
- [ ] Scenario 7: 中英混合输入正确触发
- [ ] Scenario 8: 长对话上下文压缩后关键信息保留

### Tuning 验证
- [ ] 误触发案例已收集并修复
- [ ] 漏触发案例已收集并修复
- [ ] 全部 8 个 Scenario 回归测试通过

### JARVIS Discipline
- [ ] System Prompt 不暴露 Skill 名称给用户
- [ ] System Prompt 约束 Agent 不编造代码中不存在的事实
- [ ] 引用格式指向真实文件路径，不编造路径
- [ ] 回复使用自然语言，不暴露框架 API 细节
