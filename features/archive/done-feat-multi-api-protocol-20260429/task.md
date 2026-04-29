# Tasks: feat-multi-api-protocol

## Task Breakdown

### 1. config.ts — api_type 显式配置支持
- [ ] 修改 `LlmProfile.api_type` 类型定义，支持 `"openai-completions" | "anthropic" | "openai-responses"` 等
- [ ] 更新 `applyDefaults()` 中 api_type 默认逻辑
- [ ] 更新 `validateConfig()` 校验 api_type 合法值
- [ ] 更新 `PROVIDER_MODEL_HINTS` 添加 minimax / zhipu

### 2. useAgentSession.ts — Provider 注册适配
- [ ] 确认 registerProvider() 传入用户指定的 api_type
- [ ] 验证 pi SDK 对 anthropic api_type 的支持
- [ ] 确保 Provider 切换时正确重建 Session

### 3. context-monitor.ts — 新 Model 映射
- [ ] 添加 MiniMax 模型 context_window 映射
- [ ] 添加智谱 GLM 模型 context_window 映射

### 4. edith.yaml — 预设模板
- [ ] 添加 MiniMax Provider 注释模板
- [ ] 添加智谱 GLM Provider 注释模板
- [ ] 确保模板中 api_type 字段清晰标注

### 5. 集成验证
- [ ] 测试 MiniMax + Anthropic 协议 Provider 正常工作
- [ ] 测试智谱 GLM + Anthropic 协议 Provider 正常工作
- [ ] 测试 /model 切换在不同协议间正常工作
- [ ] 测试 Tool Calling 在 Anthropic 协议下正常工作

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 需求分析完成，等待开发 |
