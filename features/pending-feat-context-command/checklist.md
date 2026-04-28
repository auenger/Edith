# Checklist: feat-context-command

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested
- [ ] `/context` 在空 session 和活跃 session 下均正常工作

### Code Quality
- [ ] 代码风格遵循 EDITH 现有模式（theme/ 目录结构）
- [ ] 无硬编码数字，使用 edith.yaml 配置的 token_budget
- [ ] 错误处理覆盖 API 返回 null 的场景

### Testing
- [ ] 手动测试：空 session → `/context`
- [ ] 手动测试：多轮对话后 → `/context`
- [ ] 手动测试：compact 后 → `/context`（验证 token 减少）

### Documentation
- [ ] spec.md technical solution filled
- [ ] task.md progress log updated
