# feat-explore-project Tasks

## Task 1: Create explore.ts tool implementation
- [x] 实现 edith_explore 工具核心逻辑
- 复用 scan.ts 中的 detectTechStack、SKIP_DIRECTORIES、CODE_EXTENSIONS
- 新增 buildExploreTree（带关键文件标记）、countFilesByExt、detectKeyFiles 函数
- 定义 ExploreParams、ExploreResult、ExploreError 类型
- 不持久化，直接返回结构化结果

## Task 2: Register edith_explore in extension.ts
- [x] 在 extension.ts 中注册 edith_explore 工具
- TypeBox 参数 schema（target 必填）
- 添加到 tools 数组、FRIENDLY_ACTION 映射
- 注册 `/explore` 命令

## Task 3: Update system-prompt.ts trigger mapping
- [x] 在中英文触发映射表中添加 explore 意图
- 第一层关键词：浏览、概览、explore、overview
- 第二层上下文推断：新项目 + "看看"/"了解一下"
