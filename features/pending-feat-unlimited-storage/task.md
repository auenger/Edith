# Tasks: feat-unlimited-storage

## Task Breakdown

### 1. 配置模型重构 (config.ts)
- [ ] 定义新的 ContextBudget 类型替代 TokenBudget
- [ ] 添加旧 token_budget → 新 context_budget 的自动映射
- [ ] 更新默认值和校验逻辑
- [ ] 更新 initConfigWizard 输出新格式

### 2. 蒸馏工具去截断 (distill.ts)
- [ ] 移除 Layer 0 routing-table 的 token 硬限制
- [ ] 移除 Layer 1 quick-ref 的 API 端点删除逻辑
- [ ] 移除 Layer 2 distillate_fragment 的硬切截断
- [ ] 移除角色描述 80 字符截断
- [ ] 移除约束列表 top 5 限制
- [ ] 保留文件级语义拆分逻辑

### 3. 查询引擎智能加载 (query.ts)
- [ ] 实现 fragment 相关性评分算法
- [ ] 实现 context_budget 控制的动态加载
- [ ] 未加载 fragment 以标题列表呈现
- [ ] 移除旧的 2000 token 硬切逻辑

### 4. 路由工具动态选择 (route.ts)
- [ ] 移除固定 2-3 fragment 数量限制
- [ ] 实现按相关性和 context_budget 的动态选择
- [ ] 更新 fragment 选择策略

### 5. Python 脚本调整 (analyze_sources.py)
- [ ] 移除 SINGLE_COMPRESSOR_MAX_TOKENS 限制
- [ ] 移除 SINGLE_DISTILLATE_MAX_TOKENS 限制
- [ ] 保留语义拆分，移除内容截断

### 6. 集成验证
- [ ] 使用 LiteMes 知识库验证：蒸馏不再截断
- [ ] 使用 LiteMes 知识库验证：查询智能加载
- [ ] 验证旧 edith.yaml 配置兼容

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-28 | Feature created | 待开发 |
