# Checklist: feat-tool-distill

## Completion Checklist

### Source Loading
- [x] Scan 产出目录检测正确（workspace/{service}/docs/）
- [x] 源文档格式校验（合法 Markdown）
- [x] 目录不存在返回 SOURCE_NOT_FOUND
- [x] 文件损坏返回 CORRUPTED_SOURCE

### Token Budget Control
- [x] TokenBudget 接口定义完整
- [x] edith.yaml 默认配置读取正确
- [x] 调用时参数可覆盖默认值
- [x] token 计数函数中英文混合准确
- [x] Layer 0 硬上限 500 token 强制执行

### Layer 0 Quality
- [x] 服务名、角色、技术栈、Owner、关键约束提取完整
- [x] routing-table.md 模板格式正确
- [x] 全局合并后 <=500 token
- [x] 多服务条目冲突处理正确

### Layer 1 Quality
- [x] 验证命令、关键约束、易错点优先保留
- [x] API 端点列表可截断（保留重要端点）
- [x] 截断时 truncated=true + warning 说明
- [x] 最终 token 数 <= quick_ref budget

### Layer 2 Quality
- [x] 语义拆分策略正确（接口/模型/逻辑/配置）
- [x] 文件命名编号有序（01-, 02-, ...）
- [x] 单文件 <= distillate_per_file budget
- [x] 部分源缺失时跳过而非报错

### Distillation Principles
- [x] 无损压缩：Layer 2 不丢失语义信息
- [x] 索引不倾倒：Layer 0/1 是索引摘要，非原文复制
- [x] 产出物自说明：每层文件头部包含消费规则
- [x] 截断策略有优先级（约束 > 命令 > 端点）

### Error & Warning Handling
- [x] error 级别：SOURCE_NOT_FOUND, CORRUPTED_SOURCE 阻断执行
- [x] warning 级别：BUDGET_EXCEEDED, PARTIAL_GENERATION, MERGE_CONFLICT 降级继续
- [x] 所有 warning 写入 DistillResult.warnings 数组
- [x] 用户可从结果了解哪些内容被截断/跳过

### EDITH Discipline
- [x] 输出为纯 Markdown（无专有格式）
- [x] Skills 不暴露给用户
- [x] 只提取代码中存在的事实（不编造）
- [x] 产物语言跟随源文档（不做自动翻译）

### Testing
- [x] Scenario 1-7 全部覆盖
- [x] 截断策略有独立测试用例
- [x] 部分生成失败有独立测试
- [x] 全局合并冲突有独立测试

### Documentation
- [x] spec.md 包含完整 token budget 配置说明
- [x] task.md Progress Log 已更新

## Verification Record

| Timestamp | Status | Summary |
|-----------|--------|---------|
| 2026-04-27T22:45:00+08:00 | PASSED | 41/41 tasks completed, 7/7 Gherkin scenarios verified by code analysis, TypeScript compiles cleanly, all 5 error codes implemented |

**Evidence**: `features/active-feat-tool-distill/evidence/verification-report.md`
