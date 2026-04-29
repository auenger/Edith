# Tasks: feat-skill-align-scan

## Task Breakdown

### 1. 项目智能分类
- [x] 实现 `classifyProject()` — 12 种项目类型检测
- [x] 实现 `detectArchitecture()` — 5 种架构模式识别
- [x] 更新 ScanResult 类型定义

### 2. API 契约提取
- [x] 实现 Spring Boot 注解解析器（@RequestMapping 等）
- [x] 实现 Express/koa 路由解析器
- [x] 实现 FastAPI 装饰器解析器
- [x] 实现 Gin 路由解析器
- [x] 统一 API 端点数据结构

### 3. 数据模型分析
- [x] 实现 JPA/Hibernate entity 解析
- [x] 实现 TypeORM entity 解析
- [x] 实现 Prisma schema 解析
- [x] 实现 SQLAlchemy model 解析
- [x] Entity Relationship 摘要生成

### 4. 业务逻辑发现
- [x] 服务层方法名模式提取
- [x] 外部调用识别（HTTP client/MQ/cache）
- [x] 核心业务流程摘要生成

### 5. 输出升级
- [x] 引入 4 个输出模板
- [x] 生成 10+ 结构化文档
- [x] 生成带注解的 source-tree.md
- [x] 生成 development-guide.md
- [x] 实现 .scan-state.json 增量扫描

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature 创建 | 差距分析完成 |
| 2026-04-29 | 全部实现完成 | TypeScript 编译通过，零错误 |
