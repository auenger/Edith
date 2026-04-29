# Tasks: feat-model-hot-switch

## Task Breakdown

### 1. config.ts 通用写回能力
- [x] 实现 `patchConfig(configPath, patch)` — YAML 行级 patch（保留注释）
- [x] 实现 `saveActiveProfile(configPath, profileName)` — 更新 llm.active
- [x] 实现 `addRepo(configPath, repo)` — 追加 repo 条目（去重）
- [x] 导出 `findConfigFile()` 以便其他模块获取 config 路径

### 2. 自定义模型注册修复（useAgentSession.ts）
- [x] 修改 `initialize()` 中 registerProvider 调用，添加 models 数组
- [x] 修改 `switchProfile()` 中 registerProvider 调用，添加 models 数组
- [x] 在 `initialize()` 中记录 configPath 到 ref（configPathRef）

### 3. switchProfile 持久化
- [x] 在 `switchProfile()` 成功后调用 `saveActiveProfile()`

### 4. scan 自动注册 Repo（scan.ts）
- [x] 在 `executeScan()` 成功后检查目标是否在 repos 列表
- [x] 不在则调用 `addRepo()` 自动追加（含 name、path、stack）
- [x] 去重：相同 name 或 path 不重复添加

### 5. LiteMes 配置补齐
- [x] 在 edith.yaml repos 中添加 LiteMes 条目

### 6. 验证
- [ ] 启动 Agent → xiaomi 不报 Model not found
- [ ] /model deepseek → 切换成功 → edith.yaml llm.active 更新
- [ ] 重启 → 保持 deepseek
- [ ] /model → 列出 profiles
- [ ] 扫描新目录 → repos 自动追加

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 根因分析完成，VP 扩展为 Config 热更新机制 |
| 2026-04-29 | Implementation done | Tasks 1-5 完成，验证待手动执行 |
