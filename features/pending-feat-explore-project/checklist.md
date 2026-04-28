# Checklist: feat-explore-project

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested
- [ ] `/explore` 对当前 workspace 和指定路径均正常工作

### Code Quality
- [ ] 代码风格遵循 EDITH 现有 tools/ 模式
- [ ] 复用 scan.ts 中的技术栈检测逻辑（不重复实现）
- [ ] .gitignore 过滤使用成熟库（如 ignore 或 globby）

### Testing
- [ ] 手动测试：`/explore`（默认 workspace）
- [ ] 手动测试：`/explore /tmp/nonexistent`
- [ ] 手动测试：`/explore /path/to/large/project`（验证深度限制）

### Documentation
- [ ] spec.md technical solution filled
- [ ] task.md progress log updated
