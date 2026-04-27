# Tasks: feat-agent-scaffold

## Task Breakdown

### 1. 项目初始化
- [x] 创建 `agent/` 目录 — 基础目录结构
- [x] 创建 `package.json` — name: "jarvis-agent", dependencies 含 `@mariozechner/pi-coding-agent`, scripts 含 `"start": "tsx src/index.ts"` — Scenario 6
- [x] 创建 `tsconfig.json` — strict: true, target: ES2022, module: NodeNext, outDir: ./dist — Scenario 1
- [x] 执行 `npm install` 验证依赖安装成功 — Scenario 6

### 2. pi SDK 可用性验证
- [x] 确认 `@mariozechner/pi-coding-agent` 包可安装且无版本冲突 — Scenario 3, 6
- [x] 确认 `createAgentSession` 函数存在且签名正确（注意：SDK 使用 `createAgentSession` 而非 `createAgent`）
- [x] 确认 `ExtensionAPI` 接口包含 `registerTool` / `registerCommand` / `on` 方法 — 为 feat-extension-core 铺路
- [x] 记录 pi SDK API 签名到 Progress Log，供后续 feature 参考

### 3. 配置解析
- [x] 创建 `src/config.ts` — 定义 `JarvisConfig` 接口（llm / workspace / repos）— Scenario 2
- [x] 实现 `loadConfig(configPath: string): JarvisConfig` 函数 — 使用 js-yaml 解析 — Scenario 2
- [x] 实现 `validateConfigExists(configPath: string)` — 文件不存在时抛出友好错误 — Scenario 4
- [x] 处理 YAML 解析异常 — 捕获并格式化错误信息（含行号）— Scenario 5

### 4. Extension 骨架
- [x] 创建 `src/extension.ts` — 导出默认函数，接受 `pi: ExtensionAPI` 参数 — Scenario 3
- [x] 函数体内仅打印 "JARVIS Extension loaded" 日志，不注册任何工具 — Scenario 3
- [x] 确认 pi SDK 能正确加载 Extension（无报错）— Scenario 3

### 5. 入口文件
- [x] 创建 `src/index.ts` — 导入 config + extension，调用 `createAgentSession` — Scenario 1, 3
- [x] 启动流程：加载配置 → 创建 Agent → 显示欢迎信息 — Scenario 1
- [x] 错误处理：配置缺失或格式错误时的友好退出 — Scenario 4, 5

### 6. 示例配置与文档
- [x] 创建 `agent/jarvis.yaml` — 最小可运行配置（llm + workspace + 空 repos）— Scenario 2
- [x] 创建 `agent/README.md` — 安装步骤、配置说明、运行命令 — Scenario 1
- [x] 验证完整流程：`cd agent && npm install && npm start` 成功启动 — Scenario 1, 6

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-27 | Spec enriched | Value points: 2, Scenarios: 6, Tasks: 16, Archive refs: 0 |
| 2026-04-27 | Implementation complete | All 16 tasks done. TypeScript compiles clean (strict mode). npm install successful. |

## pi SDK API Reference (discovered)

### Core Imports
```typescript
import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";
```

### Key Functions
- `createAgentSession(options?: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>`
  - Options: `{ cwd, agentDir, authStorage, modelRegistry, sessionManager, resourceLoader, model, customTools, ... }`
  - Result: `{ session: AgentSession, extensionsResult: LoadExtensionsResult, modelFallbackMessage?: string }`
  - NOTE: No `extensions` field. Extensions are loaded via `resourceLoader`.

### Extension Pattern
```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Extension factory function (default export)
export default function(pi: ExtensionAPI): void {
  pi.registerTool({ name: "my_tool", ... });
  pi.registerCommand("my-command", { ... });
  pi.on("session_start", async (event) => { ... });
}
```

### ExtensionAPI Key Methods
- `registerTool(tool: ToolDefinition): void` — Register an LLM-callable tool
- `registerCommand(name: string, options): void` — Register a slash command
- `on(event: string, handler): void` — Listen to lifecycle events
- `registerShortcut(shortcut, options): void` — Register keyboard shortcut
- `registerFlag(name, options): void` — Register CLI flag
- `sendMessage(message): void` — Send custom message
- `sendUserMessage(content): void` — Send user message (triggers turn)
- `exec(command, args, options): Promise<ExecResult>` — Execute shell command
- `setModel(model): Promise<boolean>` — Switch model
- `setActiveTools(toolNames): void` — Set enabled tools

### Loading Extensions
Extensions are loaded via `DefaultResourceLoader`:
```typescript
const resourceLoader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  extensionFactories: [myExtensionFactory],  // inline factories
  // OR extensions are auto-discovered from .pi/extensions/
});
await resourceLoader.reload();

const { session } = await createAgentSession({ resourceLoader, ... });
```

### Package Version
- `@mariozechner/pi-coding-agent` v0.70.2 (MIT)
