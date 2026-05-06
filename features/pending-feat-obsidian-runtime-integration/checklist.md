# Checklist: feat-obsidian-runtime-integration

## Completion Checklist

### Development
- [ ] extension.ts 中 edith_obsidian 工具注册完成
- [ ] edith.yaml obsidian 配置段添加完成
- [ ] system-prompt.ts Obsidian 能力描述添加完成
- [ ] TypeScript 编译无错误

### Code Quality
- [ ] 注册模式与现有工具（edith_scan 等）保持一致
- [ ] 无硬编码路径，使用 config 中的配置

### Testing
- [ ] npm run build 通过
- [ ] 已有测试通过

### Documentation
- [ ] spec.md technical solution 已填写
