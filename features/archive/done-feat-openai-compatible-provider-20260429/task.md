# Tasks: feat-openai-compatible-provider

## Task Breakdown

### 1. config.ts — 多 Profile 配置模型
- [x] 新增 `LlmProfile` 接口（provider, model, api_key, base_url, api_type, context_window）
- [x] 扩展 `LlmConfig` 支持 `active` + `profiles` 字段
- [x] `loadConfig()` 添加旧格式→新格式自动转换逻辑
- [x] 新增 `getActiveProfile(config): LlmProfile` 辅助函数
- [x] 新增 `listProfiles(config): string[]` 辅助函数
- [x] `PROVIDER_MODEL_HINTS` 新增 xiaomi / moonshot 条目
- [x] `applyDefaults()` 处理 profiles 中各 profile 的默认值

### 2. useAgentSession.ts — Provider 注册 + 运行时切换
- [x] 遍历所有 profiles，为有 base_url + api_key 的调用 registerProvider()
- [x] 用 active profile 的 provider/model 创建 session
- [x] 实现 `switchProfile(profileName)` 方法
- [x] 切换时：销毁旧 session → 新 session → 新 system prompt
- [x] 暴露 switchProfile 给 App 层

### 3. App.tsx + StatusBarMetrics.tsx — TUI 显示当前 model
- [x] 状态栏左侧新增 "Model: xxx" 指标
- [x] 内置 provider 白色，自定义 provider 青色
- [x] 切换 model 后状态栏即时刷新

### 4. extension.ts — /model 斜杠命令
- [x] `/model` 无参数 → 列出所有 profiles + 当前 active 标记
- [x] `/model <name>` → 调用 switchProfile 切换
- [x] 错误处理：profile 不存在、切换失败

### 5. edith.yaml — 更新默认配置模板
- [x] 更新为 profiles 格式（含注释说明）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 规格升级为 M（多 Profile + TUI + 运行时切换） |
| 2026-04-29 | Implementation complete | All 5 tasks done, 6/6 Gherkin scenarios passed |
