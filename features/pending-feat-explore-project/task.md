# Tasks: feat-explore-project

## Task Breakdown

### 1. 项目结构分析模块
- [ ] 创建 `agent/src/tools/explore.ts`
- [ ] 实现目录树生成（递归读取 + .gitignore 过滤 + 深度限制）
- [ ] 实现技术栈检测（识别 package.json / requirements.txt / go.mod 等）
- [ ] 实现关键文件识别（README、配置、入口文件）
- [ ] 实现路径参数解析（默认取 workspace.path）
- [ ] 实现文件名 glob 搜索（`--glob "*.ts"` 模式匹配）
- [ ] 实现内容 grep 搜索（`--grep "keyword"` 关键字搜索，返回文件+行号）

### 2. Explore Panel 渲染
- [ ] 创建 `agent/src/theme/explore-panel.ts`
- [ ] 实现项目摘要卡片渲染
- [ ] 实现目录树可视化（Unicode box-drawing characters）
- [ ] 实现关键文件列表渲染
- [ ] 实现搜索结果列表渲染（文件路径 + 行号 + 匹配高亮）

### 3. 命令注册与集成
- [ ] 在 `agent/src/extension.ts` 注册 `/explore` 命令
- [ ] 支持可选路径参数
- [ ] 错误处理（路径不存在、权限不足）

### 4. 集成测试
- [ ] 测试当前项目 `/explore`（agent/ 目录）
- [ ] 测试指定路径 `/explore /path/to/project`
- [ ] 测试不存在的路径
- [ ] 测试含 .gitignore 的项目
- [ ] 测试 `/explore --grep "EdithConfig"` 搜索功能
- [ ] 测试 `/explore --glob "*.ts"` glob 匹配

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 需与 edith_scan 区分定位 |
