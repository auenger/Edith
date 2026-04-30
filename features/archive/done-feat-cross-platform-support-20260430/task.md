# Tasks: feat-cross-platform-support

## Task Breakdown

### 1. 路径拼接修复
- [ ] `query.ts` — 将 `distillates/${service}` 替换为 `join("distillates", service)`
- [ ] `route.ts` — 将 `distillates/${service}/${frag}` 替换为 `join("distillates", service, frag)`
- [ ] 全局搜索确认无遗漏的硬编码 `/` 路径

### 2. subagent 跨平台适配
- [ ] 检测 `process.platform`，Windows 上用 `pi.cmd` 或 `shell: true`
- [ ] 添加错误处理：pi 命令不存在时给出友好提示
- [ ] 测试 Windows 上 subagent 启动流程

### 3. System Prompt 平台注入
- [ ] 在 `system-prompt.ts` 中注入 `process.platform` 信息
- [ ] Windows 平台时添加命令适配指引（不要用 ls/cat/grep 等）
- [ ] 注入 `path.sep` 信息

### 4. pi SDK 兼容性调查
- [ ] 查看 pi SDK 源码，确认其 tool calling 是否依赖 bash
- [ ] 确认 SDK 的 `AgentSession` 在 Windows 上的行为
- [ ] 如需要，在 `edith.yaml` 增加 shell 配置项

### 5. 集成验证
- [ ] macOS 回归测试 — 确保不影响现有功能
- [ ] Windows 测试（或文档说明 WSL 要求）
- [ ] 更新 edith.yaml 配置文档

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-30 | Feature created | 初始分析完成，确认 3 层修复方案 |
