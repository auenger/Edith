# Checklist: feat-e2e-pilot

## Completion Checklist

### 前置条件
- [ ] 所有依赖 Feature（feat-tool-scan/distill/query/route）已完成
- [ ] jarvis.yaml 已配置真实项目
- [ ] 验证用例已准备（5 查询 + 3 路由）

### 扫描验证 (Phase B)
- [ ] jarvis scan 正常执行成功
- [ ] 技术栈识别正确
- [ ] API 端点列表完整
- [ ] 数据模型完整
- [ ] 业务流程识别
- [ ] 扫描失败场景错误处理正确

### 蒸馏验证 (Phase C)
- [ ] jarvis distill 正常执行成功
- [ ] routing-table.md < 500 tokens
- [ ] quick-ref.md ~5% 压缩比
- [ ] distillates/*.md 语义拆分合理
- [ ] 超标问题已记录

### 查询验证 (Phase D)
- [ ] 5 个查询全部执行
- [ ] 每个查询有来源标注
- [ ] 查询结果与实际代码一致性验证完成
- [ ] 查询准确率 >= 80%

### 路由验证 (Phase E)
- [ ] 3 个路由全部执行
- [ ] 路由决策与预期一致
- [ ] 路由准确率 >= 80%

### 零适配验证 (Phase F)
- [ ] 非 JARVIS Agent 能理解 routing-table.md
- [ ] 不需要 JARVIS 特定运行时
- [ ] 路由信息可被正确消费

### 报告与声明 (Phase G)
- [ ] pilot-report.md 已生成
- [ ] 覆盖率指标完整
- [ ] 质量评估完整
- [ ] 查询准确性表格完整
- [ ] 路由准确性表格完整
- [ ] 已知问题每个都有归属 Feature
- [ ] pilot-ready 状态已判定（READY / NOT-READY）

### JARVIS Discipline
- [ ] 产出物为纯 Markdown（无特殊格式）
- [ ] 知识来源标注指向真实文件
- [ ] 不编造代码中不存在的接口或模型
- [ ] 发现的问题不在此 Feature 修复，而是记录到报告
- [ ] pilot-ready 声明如实反映状态（不假装 Mature）
