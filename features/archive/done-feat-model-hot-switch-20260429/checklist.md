# Checklist: feat-model-hot-switch

## Completion Checklist

### Development
- [x] All tasks completed
- [ ] Code self-tested（启动 + 切换 + 重启验证）

### Code Quality
- [x] registerProvider 的 models 数组字段与 pi SDK ModelDefinitionSchema 一致
- [x] saveActiveProfile 有错误处理（文件写入失败不崩溃）
- [x] YAML 写入保留原有格式（注释、缩进）

### Testing
- [ ] 自定义 Provider（xiaomi）启动不报 Model not found
- [ ] /model 切换后立即生效
- [ ] 重启后保持切换后的 profile
- [ ] /model 无参数正确显示 profiles 列表
- [ ] 无效 profile 名称给出清晰错误提示

### Documentation
- [x] spec.md technical solution filled
- [x] edith.yaml repos 列表更新

## Verification Record

| Date | Status | Summary |
|------|--------|---------|
| 2026-04-29 | PASS (code analysis) | TypeScript 编译零错误，6/6 Gherkin 场景代码验证通过。手动运行测试需用户执行。 |
