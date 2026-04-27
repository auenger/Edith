# Checklist: feat-agent-scaffold

## Completion Checklist

### 项目结构
- [x] `agent/` 目录存在且包含 package.json / tsconfig.json / jarvis.yaml
- [x] `agent/src/` 包含 index.ts / extension.ts / config.ts
- [x] TypeScript strict 模式编译无错误

### pi SDK 集成
- [x] `@mariozechner/pi-coding-agent` 可通过 npm install 安装
- [x] `createAgentSession` 函数可用且签名正确
- [x] Extension 骨架被 pi SDK 成功加载（通过 DefaultResourceLoader）
- [x] pi SDK API 签名已记录（registerTool / registerCommand / on）

### 配置解析
- [x] jarvis.yaml 正确解析为 JarvisConfig TypeScript 对象
- [x] 配置文件缺失时显示友好错误（非 crash）
- [x] YAML 语法错误时显示含行号的错误信息

### 启动验证
- [x] `npm install` 成功（退出码 0）
- [ ] `npm start` 成功启动 Agent（退出码 0）— 需要 LLM API credentials
- [x] 终端显示欢迎信息（代码已实现，banner 已验证）
- [ ] Agent 进入交互式等待状态 — 需要 LLM API credentials

### 错误处理
- [x] 无 jarvis.yaml 时友好退出（非 uncaught exception）
- [x] 无效 YAML 时友好退出（含行号信息）
- [x] pi SDK 加载失败时明确报错

### 代码质量
- [x] TypeScript strict 模式，无 any 类型
- [x] 无 TODO/FIXME
- [x] 无多余依赖

### JARVIS Discipline
- [x] pi SDK 不 fork，仅作为 npm 依赖
- [x] 不暴露 Skill 名称给用户
- [x] 不编造不存在的代码事实

## Verification Record

| Date | Status | Results | Evidence |
|------|--------|---------|----------|
| 2026-04-27 | PASS (conditional) | 16/16 tasks, 6/6 Gherkin (code analysis), TypeScript clean, npm install OK | evidence/verification-report.md |

### Notes
- `npm start` live test requires LLM API credentials (Anthropic or configured provider). Code structure verified correct via TypeScript compilation and code analysis.
- Key finding: pi SDK uses `createAgentSession` (not `createAgent`) and extensions are loaded via `DefaultResourceLoader({ extensionFactories: [...] })`, not via direct session options.
