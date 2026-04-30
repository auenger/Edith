# Feature: feat-cross-platform-support 跨平台兼容性支持

## Basic Information
- **ID**: feat-cross-platform-support
- **Name**: 跨平台兼容性支持（Windows / macOS / Linux）
- **Priority**: 88
- **Size**: M
- **Dependencies**: []
- **Parent**: null
- **Children**: []
- **Created**: 2026-04-30

## Description

EDITH Agent 在 Windows 环境下运行时，出现大量 `bash`、`ls`、`read`、`cat` 等 Unix 命令报错，导致工具调用失败。需要从 SDK 层、Agent 工具层、System Prompt 层三个层面确保 Windows/macOS/Linux 全平台可用。

### 问题根因分析

| 层级 | 问题 | 影响 |
|------|------|------|
| pi SDK | SDK 内置工具可能调用 `bash -c "..."` 执行命令 | Windows 无 bash，所有 shell 命令失败 |
| subagent.ts | `spawn("pi", args)` 直接调用 pi CLI | Windows PATH 可能不含 pi，或路径解析不同 |
| query.ts / route.ts | 路径拼接用硬编码 `/`（如 `distillates/${service}`） | Node.js 虽然容错，但不规范 |
| System Prompt | 未告知 LLM 当前平台，LLM 生成 Unix 命令 | Agent 尝试执行 `ls`、`grep` 等失败 |
| Shell 脚本 | post-install.ts 有 shebang，skill 脚本假设 bash | Windows 不识别 shebang |

## User Value Points

### VP1: 工具层跨平台 — Agent 所有内置工具在 Windows 上正常运行
edith_scan / edith_distill / edith_query / edith_route / edith_explore / subagent 在 Windows 上无报错执行。

### VP2: 平台感知 — LLM 知道当前平台，生成平台适配的命令
System Prompt 注入平台信息，LLM 不再生成 `ls` 等 Unix-only 命令；或 Agent 自动拦截并转换为等价 PowerShell/cmd 命令。

## Context Analysis

### Reference Code
- `agent/src/tools/subagent.ts:153` — `spawn("pi", args)` 直接调用
- `agent/src/tools/query.ts:173,688,697` — 硬编码 `/` 路径分隔符
- `agent/src/tools/route.ts:611,613,615,679` — 硬编码 `/` 路径分隔符
- `agent/src/system-prompt.ts` — 未注入平台信息
- `agent/src/tools/scan.ts` — 已用 `path.join()`，兼容性较好
- `agent/src/tools/explore.ts` — 已用 `path.join()`，兼容性较好
- `agent/src/tools/index.ts` — 已用 `path.join()`，兼容性较好

### Related Documents
- CLAUDE.md — Agent 架构分层
- project-context.md — 技术栈和目录结构

### Related Features
- 无直接依赖，独立 feature

## Technical Solution

### 方案：三层修复

#### 1. Agent 工具层修复

**1a. subagent.ts — 跨平台 spawn**
```typescript
// 检测平台，Windows 上用 .cmd 后缀或 shell 适配
import { platform } from "node:process";

function getPlatformCommand(cmd: string): string {
  // Windows 上 npm install 的 bin 会有 .cmd 后缀
  return platform === "win32" ? `${cmd}.cmd` : cmd;
}

const child = spawn(getPlatformCommand("pi"), args, {
  // Windows 上需要 shell: true 来正确解析 .cmd
  ...(platform === "win32" ? { shell: true } : {}),
});
```

**1b. 路径拼接修复**
将 `query.ts` 和 `route.ts` 中所有 `` `distillates/${service}` `` 替换为 `join("distillates", service)`。

#### 2. System Prompt 平台注入

在 `system-prompt.ts` 中注入平台信息：
```typescript
const platformInfo = [
  `Platform: ${process.platform}`,
  `Shell: ${process.platform === "win32" ? "PowerShell/cmd" : "bash/zsh"}`,
  `Path separator: "${path.sep}"`,
  process.platform === "win32"
    ? "IMPORTANT: Use PowerShell or cmd commands only. Do NOT use bash/unix commands like ls, cat, grep, find, rm, mkdir -p. Use dir, type, findstr, del, mkdir instead."
    : "",
].filter(Boolean).join("\n");
```

#### 3. pi SDK 兼容层

检查 pi SDK 的 tool calling 机制，确认：
- SDK 的 `executeCommand` 是否支持配置 shell
- 是否需要在 edith.yaml 中增加 `shell` 配置项
- SDK 在 Windows 上 spawn 子进程的行为

如果 SDK 本身不支持 Windows，需要在 agent 层增加适配：
- 在 `extension.ts` 中拦截 shell 命令调用
- 提供 Unix→Windows 命令映射表
- 或者在 Windows 上通过 WSL 检测自动使用 WSL

### 文件修改清单

| 文件 | 修改类型 | 描述 |
|------|---------|------|
| `agent/src/tools/subagent.ts` | 修改 | 跨平台 spawn 适配 |
| `agent/src/tools/query.ts` | 修改 | 硬编码 `/` → `path.join()` |
| `agent/src/tools/route.ts` | 修改 | 硬编码 `/` → `path.join()` |
| `agent/src/system-prompt.ts` | 修改 | 注入平台信息 |
| `agent/src/config.ts` | 可能修改 | 增加 shell 配置项 |
| `agent/edith.yaml` | 可能修改 | 增加 shell/platform 配置 |

## Acceptance Criteria (Gherkin)

### User Story
作为一个 Windows 用户，我希望在 Windows 环境下运行 EDITH Agent 时，所有工具调用正常执行，不会因为 Unix 命令不可用而报错。

### Scenarios (Given/When/Then)

#### Scenario 1: edith_scan 在 Windows 上正常运行
```gherkin
Given 用户在 Windows 环境下启动 EDITH Agent
And edith.yaml 配置了有效的 workspace 和 repos
When 用户执行 edith_scan 扫描一个项目
Then 扫描完成并生成知识产物
And 没有 "bash"、"ls"、"cat" 相关的错误信息
```

#### Scenario 2: subagent 在 Windows 上正常启动
```gherkin
Given 用户在 Windows 环境下运行 EDITH Agent
When Agent 需要启动 subagent 子代理
Then subagent 成功启动并通过 .cmd 或 shell 适配找到 pi 命令
And 子代理正常执行并返回结果
```

#### Scenario 3: 路径操作跨平台兼容
```gherkin
Given 任意平台（Windows/macOS/Linux）
When Agent 读取或写入 distillates 目录下的知识产物
Then 路径拼接正确，使用 path.join() 而非硬编码分隔符
And 文件读写操作无路径相关错误
```

#### Scenario 4: LLM 生成平台适配的命令
```gherkin
Given 用户在 Windows 环境下与 Agent 对话
When LLM 需要执行文件系统操作
Then LLM 生成的命令适配当前平台（PowerShell/cmd 而非 bash）
And 不出现 "command not found" 或 "bash 不是内部命令" 的错误
```

### General Checklist
- [ ] 所有文件路径操作使用 `path.join()` 或 `path.resolve()`
- [ ] `spawn` / `exec` 调用包含平台适配逻辑
- [ ] System Prompt 包含当前平台信息
- [ ] Windows 上测试通过（或明确列出 WSL 前置要求）
- [ ] 不影响 macOS/Linux 上现有行为

## Merge Record
- **Completed**: 2026-04-30T15:15:00+08:00
- **Merged Branch**: feature/cross-platform-support
- **Merge Commit**: d8bbbe2
- **Archive Tag**: feat-cross-platform-support-20260430
- **Conflicts**: none
- **Files Changed**: 4 (query.ts, route.ts, subagent.ts, system-prompt.ts)
- **Commits**: 2
