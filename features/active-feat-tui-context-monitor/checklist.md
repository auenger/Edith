# Checklist: feat-tui-context-monitor

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested with real pi SDK session

### Code Quality
- [ ] Code style follows project conventions
- [ ] Token 数字格式化一致（K/M 简写）
- [ ] 颜色分级逻辑清晰可配置

### Testing
- [ ] 不同 context window 大小下显示正确（200K / 1M / 128K）
- [ ] context window 从 session API 动态获取，不硬编码
- [ ] edith.yaml context_window 覆盖优先级正确
- [ ] 预警阈值触发准确（70%/85%/95%）
- [ ] 预警不中断对话流程
- [ ] 缓存命中率计算准确（边界值：0%、100%）
- [ ] 空 session 优雅处理

### Documentation
- [ ] spec.md technical solution filled
- [ ] edith.yaml 新配置项有说明注释

### Integration
- [ ] 不与 feat-tui-streaming 流式输出冲突
- [ ] 不与 feat-context-command `/context` 命令功能重叠
- [ ] ink 组件可正常卸载/重新渲染
