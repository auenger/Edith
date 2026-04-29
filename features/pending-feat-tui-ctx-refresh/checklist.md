# Checklist: feat-tui-ctx-refresh

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested (npm run build 无错误)

### Code Quality
- [ ] 不影响 Anthropic provider 精确 CTX
- [ ] Fallback 路径有合理默认值
- [ ] 类型安全（TypeScript strict）

### Testing
- [ ] npm run build 编译通过
- [ ] 手动测试：多轮对话后 CTX 值变化
- [ ] 手动测试：自定义 provider 的估算值显示
- [ ] 手动测试：Tool 调用后 token 计数包含工具消耗

### Documentation
- [ ] spec.md technical solution filled
