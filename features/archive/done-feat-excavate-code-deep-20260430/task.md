# Tasks: feat-excavate-code-deep

## Task Breakdown

### 1. 代码阅读策略增强
- [x] 根据智能深度控制决定代码读取范围
- [x] 实现源文件分批读取（避免上下文溢出）
- [x] 支持 TypeScript/Go/Python/Java 四种语言

### 2. 签名提取器
- [x] 提取 public 函数/方法签名
- [x] 提取 interface/type/struct/class 定义
- [x] 提取参数类型和返回类型
- [x] 按模块/文件聚合输出

### 3. 依赖图构建器
- [x] 分析 import/export 关系
- [x] 构建文件级依赖图
- [x] 识别核心节点（被最多文件依赖的）
- [x] 检测循环依赖

### 4. 模式识别器
- [x] 识别错误处理模式（try/catch, error types）
- [x] 识别设计模式（factory, strategy, observer 等）
- [x] 识别配置消费模式
- [x] 识别副作用（API 调用, DB 查询, 文件 I/O）

### 5. SKILL.md 更新
- [x] 重写 document-project SKILL.md Step 3 为深度代码分析
- [x] 更新 Step 4 源码树分析包含依赖图

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-30 | Feature created | 子特性 3/3，依赖 feat-excavate-md-mining |
| 2026-04-30 | Implementation complete | commit 99de3a3 |
