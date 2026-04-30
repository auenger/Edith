# Checklist: feat-cross-platform-support

## Completion Checklist

### Development
- [ ] All tasks completed
- [ ] Code self-tested

### Code Quality
- [ ] 路径操作全部使用 `path.join()` / `path.resolve()`
- [ ] spawn/exec 调用包含平台适配
- [ ] 不引入新的平台特定代码

### Testing
- [ ] macOS 上功能无回归
- [ ] Windows 路径拼接正确（或文档说明 WSL 要求）

### Documentation
- [ ] spec.md technical solution filled
- [ ] 如需 WSL，在 README 中说明
