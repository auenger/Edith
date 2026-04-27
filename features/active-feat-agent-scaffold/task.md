# Tasks: feat-agent-scaffold

## Task Breakdown

### 1. 项目初始化
- [ ] 创建 `agent/` 目录 — 基础目录结构
- [ ] 创建 `package.json` — name: "jarvis-agent", dependencies 含 `@mariozechner/pi-coding-agent`, scripts 含 `"start": "ts-node src/index.ts"` — Scenario 6
- [ ] 创建 `tsconfig.json` — strict: true, target: ES2022, module: NodeNext, outDir: ./dist — Scenario 1
- [ ] 执行 `npm install` 验证依赖安装成功 — Scenario 6

### 2. pi SDK 可用性验证
- [ ] 确认 `@mariozechner/pi-coding-agent` 包可安装且无版本冲突 — Scenario 3, 6
- [ ] 确认 `createAgent` 函数存在且签名匹配 `JARVIS-PRODUCT-DESIGN.md` § 2.3 的伪代码
- [ ] 确认 `ExtensionAPI` 接口包含 `registerTool` / `registerCommand` / `on` 方法 — 为 feat-extension-core 铺路
- [ ] 记录 pi SDK API 签名到 task.md Progress Log，供后续 feature 参考

### 3. 配置解析
- [ ] 创建 `src/config.ts` — 定义 `JarvisConfig` 接口（llm / workspace / repos）— Scenario 2
- [ ] 实现 `loadConfig(configPath: string): JarvisConfig` 函数 — 使用 js-yaml 解析 — Scenario 2
- [ ] 实现 `validateConfigExists(configPath: string)` — 文件不存在时抛出友好错误 — Scenario 4
- [ ] 处理 YAML 解析异常 — 捕获并格式化错误信息（含行号）— Scenario 5

### 4. Extension 骨架
- [ ] 创建 `src/extension.ts` — 导出默认函数，接受 `pi: ExtensionAPI` 参数 — Scenario 3
- [ ] 函数体内仅打印 "JARVIS Extension loaded" 日志，不注册任何工具 — Scenario 3
- [ ] 确认 pi SDK 能正确加载 Extension（无报错）— Scenario 3

### 5. 入口文件
- [ ] 创建 `src/index.ts` — 导入 config + extension，调用 `createAgent({ extensions: [...] })` — Scenario 1, 3
- [ ] 启动流程：加载配置 → 创建 Agent → 显示欢迎信息 — Scenario 1
- [ ] 错误处理：配置缺失或格式错误时的友好退出 — Scenario 4, 5

### 6. 示例配置与文档
- [ ] 创建 `agent/jarvis.yaml` — 最小可运行配置（llm + workspace + 空 repos）— Scenario 2
- [ ] 创建 `agent/README.md` — 安装步骤、配置说明、运行命令 — Scenario 1
- [ ] 验证完整流程：`cd agent && npm install && npm start` 成功启动 — Scenario 1, 6

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Value points: 2, Scenarios: 6, Tasks: 16, Archive refs: 0 |
