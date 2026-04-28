# Checklist: feat-subagent-support

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested
- [ ] `/delegate` 命令可正常启动子代理

### Code Quality
- [ ] 子进程管理使用 proper cleanup（kill on timeout/error）
- [ ] 并发控制使用信号量或队列模式
- [ ] Agent 定义文件使用 YAML frontmatter 格式（与 pi SDK 示例一致）

### Testing
- [ ] 手动测试：`/delegate 分析这个项目的结构`
- [ ] 手动测试：超时场景（设置 5s 超时，执行长任务）
- [ ] 手动测试：主 session 在子代理执行期间可正常对话
- [ ] 手动测试：子代理失败不影响主 session

### Documentation
- [ ] spec.md technical solution filled
- [ ] task.md progress log updated
- [ ] Agent 定义文件编写规范记录
