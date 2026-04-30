# Tasks: feat-excavate-md-mining

## Task Breakdown

### 1. MD 发现器
- [x] 递归扫描项目所有 .md 文件
- [x] 排除第三方目录（node_modules/, vendor/, .git/）
- [x] 生成 MD 文件清单（路径 + 大小 + 修改时间）

### 2. 分类分级引擎
- [x] 实现 P0/P1/P2/P3 分级规则
- [x] 实现相关性评分算法（路径深度 + 文件名 + 内容信号）
- [x] 支持用户自定义分级规则

### 3. 内容提取器
- [x] P0 全量读取 + 事实提取
- [x] P1 相关性评分 + 选择性全量读
- [x] P2 索引 + 标题/首段提取
- [x] P3 跳过

### 4. 交叉验证器
- [x] 将 MD 提取的事实与代码分析结果对比
- [x] 标注不一致（[文档-代码不一致]）
- [x] 标注仅文档中有但代码中无对应的信息

### 5. SKILL.md 更新
- [x] 重写 document-project SKILL.md Step 2
- [x] 添加分类分级规则文档

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-30 | Feature created | 子特性 2/3，依赖 feat-excavate-smart-depth |
| 2026-04-30 | Implementation complete | commit f2b2e0b |
