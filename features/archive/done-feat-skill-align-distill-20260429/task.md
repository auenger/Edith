# Tasks: feat-skill-align-distill

## Task Breakdown

### 1. 压缩规则引擎
- [x] 引入 compression-rules.md 规则
- [x] 实现 extract() 信息点提取
- [x] 实现 deduplicate() 事实去重
- [x] 实现 filterByConsumer() 消费者过滤
- [x] 实现 groupByTheme() 主题分组
- [x] 实现 compressLanguage() 语言压缩

### 2. 冲突检测
- [x] 实现 detectConflicts() 跨文档冲突发现
- [x] 实体描述差异检测
- [x] API 端点冲突检测
- [x] 冲突标注格式

### 3. 跨文档分析
- [x] 实现 analyzeCrossDocument()
- [x] 文档间引用关系提取
- [x] 共享实体识别
- [x] cross-references section 生成

### 4. 往返验证
- [x] 实现 validateRoundTrip() 可选验证
- [x] 事实列表提取器
- [x] 覆盖率计算
- [x] 验证报告生成

### 5. 自动分组
- [x] 实现 groupDocuments() 命名约定分组
- [x] brief + discovery notes 配对
- [x] 同模块聚类

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature 创建 | 差距分析完成 |
| 2026-04-29 | 全部实现完成 | TypeScript strict 编译 0 errors |
