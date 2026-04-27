# Feature: feat-tui-branding TUI 主题定制

## Basic Information

* **ID**: feat-tui-branding

* **Name**: TUI 主题定制（JARVIS 品牌化）

* **Priority**: 80

* **Size**: S

* **Dependencies**: [feat-agent-scaffold]

* **Parent**: feat-agent-mvp

* **Children**: []

* **Created**: 2026-04-27

## Description

JARVIS 品牌化终端界面：钢铁侠风格 Arc Reactor LOGO（带 ANSI 渐变色）、ASCII art banner、状态栏（workspace 路径 + 服务数 + artifact 数）、JARVIS> 提示符。基于 pi SDK 的 TUI 框架定制主题。

## OUT Scope（本 feature 不做）

* **编辑器定制** — 不涉及 TUI 编辑器的快捷键、语法高亮或自动补全定制

* **键盘快捷键** — 除 JARVIS> 提示符输入外，不添加自定义快捷键绑定

* **主题动态切换** — 运行时切换主题不支持（需重启 Agent）

* **音频/动画效果** — 不实现启动音效或持续动画（仅静态 ASCII art）

* **LOGO 渲染引擎通用化** — 不抽象为通用 ASCII art 渲染库，仅服务于 JARVIS Arc Reactor LOGO

* **非终端输出** — 不支持 Web、Electron 等 GUI 渲染（仅终端 ANSI 输出）

* **国际化 LOGO** — LOGO 文字固定为 "JARVIS" + "AI Knowledge Infrastructure"，不做多语言

* **状态栏实时刷新** — 状态栏在启动时显示，不实现文件监听实时更新（后续 feature）

## User Value Points

1. **品牌化体验** — 用户启动 JARVIS 时看到专业的品牌界面，增强信任感

2. **钢铁侠科技感** — Arc Reactor 风格的渐变色 LOGO，呈现 JARVIS 的 AI 管家身份，与钢铁侠电影中的 JARVIS 形成共鸣

3. **状态感知** — 底部状态栏实时显示知识库概览

4. **终端兼容性** — 自动检测终端能力，在不支持真彩色的终端优雅降级

## Context Analysis

### Reference Code

* `JARVIS-PRODUCT-DESIGN.md` § 2.5 TUI 品牌化（完整 ASCII 布局图）

* pi SDK TUI 框架主题 API（`@mariozechner/pi-coding-agent` 主题定制接口）

### Related Documents

* `JARVIS-PRODUCT-DESIGN.md` § 2.1 架构（TUI 层在整体架构中的位置）

* `JARVIS-PRODUCT-DESIGN.md` § 2.6 配置模型（jarvis.yaml 中可配置的主题选项）

### Related Features

* `feat-agent-scaffold`（前置依赖）— 提供 pi SDK 基础环境和项目结构，TUI 主题在此基础上定制

* `feat-config-management`（并行）— jarvis.yaml 中可能包含主题配置项（如 LOGO 样式偏好）

### ANSI 渐变色技术参考

* **24-bit True Color**: `\033[38;2;R;G;Bm` 前景色 / `\033[48;2;R;G;Bm` 背景色

* **终端能力检测**: `process.env.TERM === 'xterm-256color'` 或 `process.env.COLORTERM === 'truecolor'`

* **渐变色生成**: 从起始色到终止色按字符位置插值 RGB 分量

* **Arc Reactor 配色**: 核心 `#00d4ff`（冰蓝）→ 边缘 `#004466`（深蓝），文字 `#ffffff`（白色高光）

* **降级方案**: true-color → 256-color（`\033[38;5;Nm`）→ 16-color（基础蓝）→ 无颜色

## Technical Solution

### 1. Arc Reactor LOGO 设计

钢铁侠风格的核心视觉：以同心圆弧 reactor 为灵感的 ASCII art，配合渐变色效果。

```text
LOGO 设计要素：
- 外环：同心圆弧线条，模拟 arc reactor 外壳
- 内核：发光核心（高亮字符），模拟反应堆核心能量
- 文字：JARVIS 字体融入圆环中心或正下方
- 渐变：从中心向外的 cyan → blue 渐变，模拟反应堆光晕
```

示例布局（实际实现可能调整）：

```text
              ·  ✦  ·
          ·  ░░░████░░░  ·
       ·  ░░████████████░░  ·
     ·  ░░████  JARVIS ████░░  ·
    ·  ░░████  ◉ CORE ◉ ████░░  ·
     ·  ░░████████████░░  ·
       ·  ░░░████░░░  ·
          ·  ✦  ·

       AI Knowledge Infrastructure
```

### 2. ANSI 渐变色实现

```text
渐变算法：
1. 检测终端颜色支持级别（true-color / 256-color / 16-color / none）
2. 定义渐变色带：从 #00d4ff（冰蓝）→ #0066aa（中蓝）→ #003355（深蓝）
3. 按 LOGO ASCII art 的行位置插值颜色
4. 中心字符使用高亮白 #ffffff 或亮青 #00ffff 模拟发光
5. 每个字符包裹对应的 ANSI escape sequence

色带分配（示例）：
  外环（最外层）: #003355 深蓝
  中环          : #0066aa 中蓝
  内环          : #00d4ff 冰蓝
  核心（发光点） : #00ffff 亮青 / #ffffff 白色高光
  文字 JARVIS  : #00d4ff→#ffffff 渐变
```

### 3. 终端能力降级策略

```typescript
// 降级优先级
type ColorSupport = 'true-color' | '256-color' | '16-color' | 'none';

function detectColorSupport(): ColorSupport {
  if (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit')
    return 'true-color';
  if (process.env.TERM?.includes('256color'))
    return '256-color';
  if (process.env.TERM)
    return '16-color';
  return 'none';
}

// true-color:  \033[38;2;R;G;Bm
// 256-color:   映射到最近 216 色 (16 + 36*r + 6*g + b)
// 16-color:    仅使用基础蓝色 \033[34m / 亮青 \033[36m
// none:        纯 ASCII art，无颜色
```

### 4. 其他 TUI 元素

* **Banner**: Arc Reactor LOGO + "AI Knowledge Infrastructure" 副标题（渐变色文字）

* **提示符**: `JARVIS>` 使用 cyan 高亮，`>` 闪烁模拟光标等待效果

* **状态栏**: `./company-jarvis │ 3 services │ 12 artifacts` 使用暗色调分隔

### 5. 配置扩展（jarvis.yaml）

```yaml
# 可选的主题配置（不配置则使用默认钢铁侠风格）
theme:
  style: "arc-reactor"        # arc-reactor（默认）| minimal | classic
  color_scheme: "iron-man"    # iron-man（冰蓝）| warm | monochrome
  show_reactor: true           # 启动时显示 Arc Reactor 动画
```

## Acceptance Criteria (Gherkin)

### Scenario 1: 启动显示 Arc Reactor LOGO（true-color 终端）

```gherkin
Given 终端支持 24-bit true color
When Agent 启动
Then 显示 Arc Reactor 风格的 JARVIS LOGO
And LOGO 使用 cyan→blue 渐变色（从中心向外辐射）
And 核心发光点使用亮青色高亮
And LOGO 下方显示 "AI Knowledge Infrastructure" 副标题
And 副标题文字带有渐变色效果
```

### Scenario 2: 启动显示品牌界面（降级终端）

```gherkin
Given 终端仅支持 16-color
When Agent 启动
Then 显示 Arc Reactor 风格的 JARVIS LOGO（无渐变，使用基础蓝色）
And LOGO 结构完整可识别
And 不输出乱码或无效 escape sequence
```

### Scenario 3: 无颜色终端

```gherkin
Given 终端不支持颜色
When Agent 启动
Then 显示纯 ASCII art 版本的 JARVIS LOGO
And LOGO 通过字符密度表达层次感（外环 ░ 中环 ▒ 内核 █）
And 无 ANSI escape sequence 输出
```

### Scenario 4: 提示符品牌化

```gherkin
When Agent 进入交互模式
Then 提示符显示为 "JARVIS>" （cyan 高亮）
And ">" 符号后有闪烁光标效果
```

### Scenario 5: 状态栏显示知识库概览

```gherkin
Given 知识库中有 3 个服务、12 个 artifact
And workspace 路径为 ./company-jarvis
Then 底部状态栏显示 "./company-jarvis │ 3 services │ 12 artifacts"
And 状态栏使用暗色调与主内容区分
```

### Scenario 6: LOGO 渐变色正确性验证

```gherkin
Given 终端支持 true-color
When 显示 LOGO 时
Then 核心字符使用 #00ffff 或 #ffffff
Then 中环字符使用 #00d4ff 级别的冰蓝色
Then 外环字符使用 #003355 级别的深蓝色
And 渐变过渡平滑，无突变色块
```

### Scenario 7: LOGO 在超窄终端不崩溃（edge case）

```gherkin
Given 终端宽度仅有 40 列
When Agent 启动
Then LOGO 不换行错乱
And 降级显示简化版 banner（纯文字 "JARVIS" 即可）
And 不崩溃
```

### Scenario 8: 非标准 TERM 环境变量（edge case）

```gherkin
Given TERM 环境变量为非标准值 "dumb"
When Agent 启动
Then 检测为无颜色终端
And 显示纯 ASCII art 版本 LOGO
And 不输出任何 ANSI escape sequence
```

## Merge Record

* **Completed**: 2026-04-27T23:50:00+08:00

* **Merged Branch**: feature/tui-branding

* **Merge Commit**: 83e9789

* **Feature Commit**: 93b86d8

* **Archive Tag**: feat-tui-branding-20260427

* **Conflicts**: none

* **Verification**: passed (38/38 tests, 8/8 Gherkin scenarios)

* **Stats**: 14 files changed, 1486 insertions, 54 deletions, 1 commit

⠀