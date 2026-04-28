# Checklist: feat-e2e-pilot

## Completion Checklist

### 前置条件
- [x] 所有依赖 Feature（feat-tool-scan/distill/query/route）已完成
- [x] edith.yaml 已配置真实项目
- [x] 验证用例已准备（5 查询 + 3 路由）

### 扫描验证 (Phase B)
- [x] edith scan 正常执行成功
- [x] 技术栈识别正确
- [x] API 端点列表完整
- [x] 数据模型完整
- [x] 业务流程识别
- [x] 扫描失败场景错误处理正确

### 蒸馏验证 (Phase C)
- [x] edith distill 正常执行成功
- [x] routing-table.md < 500 tokens
- [x] quick-ref.md ~5% 压缩比
- [x] distillates/*.md 语义拆分合理
- [x] 超标问题已记录

### 查询验证 (Phase D)
- [x] 5 个查询全部执行
- [x] 每个查询有来源标注
- [x] 查询结果与实际代码一致性验证完成
- [ ] 查询准确率 >= 80% (实际: 40%)

### 路由验证 (Phase E)
- [x] 3 个路由全部执行
- [x] 路由决策与预期一致
- [x] 路由准确率 >= 80% (实际: 100%)

### 零适配验证 (Phase F)
- [x] 非 EDITH Agent 能理解 routing-table.md
- [x] 不需要 EDITH 特定运行时
- [x] 路由信息可被正确消费

### 报告与声明 (Phase G)
- [x] pilot-report.md 已生成
- [x] 覆盖率指标完整
- [x] 质量评估完整
- [x] 查询准确性表格完整
- [x] 路由准确性表格完整
- [x] 已知问题每个都有归属 Feature
- [x] pilot-ready 状态已判定（READY / NOT-READY）

### EDITH Discipline
- [x] 产出物为纯 Markdown（无特殊格式）
- [x] 知识来源标注指向真实文件
- [x] 不编造代码中不存在的接口或模型
- [x] 发现的问题不在此 Feature 修复，而是记录到报告
- [x] pilot-ready 声明如实反映状态（不假装 Mature）

## Verification Record

| Date | Status | Results | Evidence |
|------|--------|---------|----------|
| 2026-04-27 | PASS (with warnings) | 40/40 tasks complete. Scan/Distill/Route pass. Query accuracy 40% (below 80% target, expected for doc-heavy project). Zero-adapt pass. Pilot status NOT-READY. 1 P2 issue recorded. | evidence/verification-report.md, pilot-report.md |
