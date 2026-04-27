# Checklist: feat-tui-branding

## Completion Checklist

### Development
- [ ] Arc Reactor ASCII art LOGO 已设计（同心圆弧 + JARVIS 文字 + 发光核心）
- [ ] ANSI 渐变色引擎实现（true-color / 256-color / 16-color / none 四级降级）
- [ ] 终端颜色能力检测函数完成
- [ ] 自定义 banner 注册到 pi SDK TUI
- [ ] JARVIS> 提示符品牌化
- [ ] 底部状态栏实现
- [ ] Code self-tested

### LOGO 视觉效果
- [ ] Arc Reactor 风格同心圆弧可见且居中
- [ ] 渐变色从核心 cyan → 外环 deep blue 平滑过渡
- [ ] 核心发光点使用亮青/白色高亮
- [ ] 无颜色终端通过字符密度（░▒█）表达层次
- [ ] LOGO 在标准 80 列终端不换行

### Terminal Compatibility
- [ ] true-color 终端（iTerm2, Windows Terminal, Kitty）渐变正确
- [ ] 256-color 终端颜色映射正确
- [ ] 16-color 终端基础蓝色可显示
- [ ] 管道/无 TTY 环境纯文本输出
- [ ] 无残留 ANSI escape sequence（所有 `\033[m` 正确闭合）

### Code Quality
- [ ] Follows project naming conventions (snake_case for tools, kebab-case for files)
- [ ] No unnecessary abstractions added
- [ ] Code is clean and readable
- [ ] No TODO/FIXME left in code

### Testing
- [ ] All 8 Gherkin scenarios verified (including edge-case scenarios 7, 8)
- [ ] Edge case: 超窄终端（< 60 列）LOGO 不崩溃 — Scenario 7
- [ ] Edge case: 非标准 TERM 值不崩溃 — Scenario 8

### Documentation
- [ ] spec.md Technical Solution section filled
- [ ] task.md Progress Log updated

### JARVIS Discipline
- [ ] Skills not exposed to user
- [ ] No code facts fabricated
- [ ] LOGO 实现不依赖外部资源（纯终端输出，无需图片文件）
