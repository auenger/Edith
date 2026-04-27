# Checklist: feat-tool-scan

## Completion Checklist

### Parameter & Routing
- [ ] `ScanParams` 接口定义完整（target, mode）
- [ ] target 支持服务名和绝对路径两种形式
- [ ] jarvis.yaml repos 映射查找正确实现
- [ ] 参数校验：缺失、无效 mode 有明确错误

### Skill Integration
- [ ] document-project Skill 调用接口正确封装
- [ ] mode 参数（full / quick）传递到 Skill
- [ ] 超时控制生效（可配置 timeout）
- [ ] 不支持的技术栈有降级输出

### Result Persistence
- [ ] workspace/{service}/docs/ 目录结构正确
- [ ] overview.md / api-endpoints.md / data-models.md 文件生成
- [ ] ScanResult 返回结构包含所有必需字段
- [ ] 覆盖已有文件时更新 scannedAt 时间戳

### Error Handling (6 error codes)
- [ ] TARGET_NOT_FOUND — 服务名不在 repos 映射中
- [ ] PATH_NOT_FOUND — 磁盘路径不存在
- [ ] EMPTY_PROJECT — 目录存在但无代码文件
- [ ] UNSUPPORTED_TECH_STACK — 无法识别的栈 + 降级
- [ ] SCAN_TIMEOUT — 超过超时配置
- [ ] PERMISSION_DENIED — 无读取权限
- [ ] 所有错误包含 actionable suggestion

### Code Quality
- [ ] 无 TODO/FIXME 残留
- [ ] 遵循 TypeScript 命名规范
- [ ] 无不必要的抽象层

### JARVIS Discipline
- [ ] 输出为纯 Markdown（无专有格式）
- [ ] Skills 不暴露给用户（用户只看到对话结果）
- [ ] 只提取代码中存在的事实（不编造）
- [ ] 扫描摘要是索引而非全文倾倒

### Testing
- [ ] Scenario 1-8 全部覆盖
- [ ] 错误路径有独立测试
- [ ] Skill 调用有 mock 隔离
- [ ] 端到端测试：Agent → jarvis_scan → 结果

### Documentation
- [ ] spec.md Technical Solution 包含完整参数契约
- [ ] task.md Progress Log 已更新
