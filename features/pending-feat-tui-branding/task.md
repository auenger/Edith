# Tasks: feat-tui-branding

## Task Breakdown

### 1. Preparation
- [ ] 阅读 pi SDK TUI 主题 API 文档，确认自定义 banner 的接口方式
- [ ] 研究 pi SDK `@mariozechner/pi-coding-agent` 的主题扩展点（hook / config / plugin）
- [ ] 确认 pi SDK TUI 输出是否支持 ANSI escape sequence 直通

### 2. Arc Reactor LOGO 设计
- [ ] 设计 Arc Reactor 风格的 ASCII art LOGO（同心圆弧 + JARVIS 文字 + 发光核心） — Scenario 1, 3
- [ ] 定义 3 层色带：外环 #003355、中环 #00d4ff、核心 #00ffff/#ffffff — Scenario 6
- [ ] 为 LOGO 的每个字符分配渐变色值，生成 LOGO 色值映射表
- [ ] 创建纯字符密度版本（░▒█）用于无颜色终端降级 — Scenario 3

### 3. ANSI 渐变色引擎
- [ ] 实现终端颜色能力检测函数 `detectColorSupport()` — Scenario 1, 2, 3
  - true-color: `COLORTERM=truecolor|24bit`
  - 256-color: `TERM` 包含 `256color`
  - 16-color: `TERM` 存在但无以上特征
  - none: 无 TERM 环境变量
- [ ] 实现颜色渲染函数，按支持级别输出对应 ANSI sequence — Scenario 1, 2, 3
  - `renderTrueColor(text, rgb)` → `\033[38;2;R;G;Bm`
  - `render256Color(text, nearestColor)` → `\033[38;5;Nm`
  - `render16Color(text, colorName)` → `\033[34m` / `\033[36m`
  - `renderNoColor(text)` → 纯文本
- [ ] 实现渐变色插值函数 `interpolateColor(start, end, steps)` — Scenario 6
- [ ] 组合 LOGO 色值映射 + 渲染函数，生成带颜色的完整 LOGO 字符串

### 4. TUI 主题集成
- [ ] 注册自定义 banner：启动时输出 Arc Reactor LOGO + "AI Knowledge Infrastructure" — Scenario 1
- [ ] 自定义提示符为 `JARVIS>`（cyan 高亮）— Scenario 4
- [ ] 实现底部状态栏：workspace 路径 │ 服务数 │ artifact 数 — Scenario 5
- [ ] 状态栏数据源对接：读取 jarvis.yaml workspace 配置 + 扫描 knowledge 目录统计

### 5. 降级与兼容性
- [ ] 在 true-color 终端（iTerm2, Windows Terminal, Kitty）测试渐变效果 — Scenario 1, 6
- [ ] 在 256-color 终端测试颜色映射 — Scenario 2
- [ ] 在 16-color 终端测试基础蓝色 — Scenario 2
- [ ] 在管道/无 TTY 环境测试纯文本输出 — Scenario 3
- [ ] 验证无乱码：所有 escape sequence 正确闭合（`\033[0m`）

### 6. 配置支持（可选）
- [ ] 在 jarvis.yaml 中添加 theme 配置段（style / color_scheme / show_reactor）
- [ ] 读取 theme 配置，支持切换 LOGO 风格（arc-reactor / minimal / classic）

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Value points: 4, Scenarios: 6, Tasks: 20+, Archive refs: 0 |
| 2026-04-27 | Spec enriched (minor) | Added OUT scope, added 2 edge-case scenarios (7, 8). task.md and checklist.md already high quality — no changes needed |
