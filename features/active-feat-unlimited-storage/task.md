# Tasks: feat-unlimited-storage

## Task Breakdown

### 1. 配置模型重构 (config.ts)
- [x] 定义新的 ContextBudget 类型替代 TokenBudget
- [x] 添加旧 token_budget → 新 context_budget 的自动映射
- [x] 更新默认值和校验逻辑
- [x] 更新 initConfigWizard 输出新格式

### 2. 蒸馏工具去截断 (distill.ts)
- [x] 移除 Layer 0 routing-table 的 token 硬限制
- [x] 移除 Layer 1 quick-ref 的 API 端点删除逻辑
- [x] 移除 Layer 2 distillate_fragment 的硬切截断
- [x] 移除角色描述 80 字符截断
- [x] 移除约束列表 top 5 限制
- [x] 保留文件级语义拆分逻辑

### 3. 查询引擎智能加载 (query.ts)
- [x] 实现 fragment 相关性评分算法
- [x] 实现 context_budget 控制的动态加载
- [x] 未加载 fragment 以标题列表呈现
- [x] 移除旧的 2000 token 硬切逻辑

### 4. 路由工具动态选择 (route.ts)
- [x] 移除固定 2-3 fragment 数量限制
- [x] 实现按相关性和 context_budget 的动态选择
- [x] 更新 fragment 选择策略

### 5. Python 脚本调整 (analyze_sources.py)
- [x] 移除 SINGLE_COMPRESSOR_MAX_TOKENS 限制
- [x] 移除 SINGLE_DISTILLATE_MAX_TOKENS 限制
- [x] 保留语义拆分，移除内容截断

### 6. 集成验证
- [x] TypeScript 编译通过 (0 errors)
- [x] 无截断标记残留 (grep verified)
- [x] 旧 token_budget → context_budget 向后兼容映射
- [ ] 使用真实 LiteMes 知识库端到端验证（需手动）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 待开发 |
| 2026-04-28 | All tasks implemented | 6/6 tasks done, tsc clean |
