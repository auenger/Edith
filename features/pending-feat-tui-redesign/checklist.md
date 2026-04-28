# Checklist: feat-tui-redesign

## Completion Checklist

> 父级索引 feature：所有子特性通过验收后，本 feature 自动完成。

### Sub-feature Acceptance
- [ ] feat-tui-ink-layout 通过验收（全屏布局 + ink 渲染 + 输入交互）
- [ ] feat-tui-thinking 通过验收（折叠展开 + 快捷键 + 流式更新）
- [ ] feat-tui-streaming 通过验收（Markdown 渲染 + 代码高亮 + 工具进度）
- [ ] feat-tui-context-monitor 通过验收（状态栏指标 + 分级预警 + compact 提示）

### Integration
- [ ] 4 个子特性全部合并后，新 TUI 端到端正常工作
- [ ] 现有工具（edith_scan / edith_distill / edith_route / edith_query）在新 TUI 下正常调用
- [ ] /context 命令（feat-context-command）在新 TUI 下正常工作
- [ ] 终端兼容性：macOS Terminal / iTerm2 / VS Code Terminal

### Cleanup
- [ ] readline REPL 相关废弃代码已移除
- [ ] project-context.md 已更新反映新架构
