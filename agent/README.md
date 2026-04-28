# EDITH Agent

EDITH Agent 是 EDITH 知识基础设施的终端 Agent，基于 [pi SDK](https://github.com/badlogic/pi-mono) 构建。

## 快速开始

### 安装依赖

```bash
cd agent
npm install
```

### 配置

复制示例配置并根据需要修改：

```bash
cp edith.yaml edith.yaml.local
# 编辑 edith.yaml.local 设置你的 LLM provider 和 workspace
```

最小配置示例（`edith.yaml`）：

```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-6

workspace:
  root: ./company-edith
  language: zh

repos: []
```

### 启动

```bash
npm start
```

Agent 启动后会显示 EDITH 欢迎横幅并进入交互式会话。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `EDITH_CONFIG` | edith.yaml 配置文件路径 | `./edith.yaml` |

## 项目结构

```
agent/
├── package.json        # TypeScript + pi SDK 依赖
├── tsconfig.json       # TypeScript 配置 (strict: true)
├── edith.yaml         # 最小可运行配置
├── src/
│   ├── index.ts        # 入口：启动 pi Agent + 加载 Extension
│   ├── extension.ts    # Extension 骨架（空工具注册）
│   └── config.ts       # edith.yaml 解析（YAML → TypeScript 接口）
└── README.md           # 本文件
```

## 配置说明

### llm 段

| 字段 | 必填 | 说明 |
|------|------|------|
| `provider` | 是 | LLM 提供商（如 `anthropic`、`openai`） |
| `model` | 是 | 模型名称（如 `claude-sonnet-4-6`） |
| `apiKey` | 否 | API Key（建议使用环境变量） |
| `baseUrl` | 否 | 自定义 API 端点 |

### workspace 段

| 字段 | 必填 | 说明 |
|------|------|------|
| `root` | 是 | 知识仓库根目录路径 |
| `language` | 否 | 输出语言（`zh` / `en`），默认 `zh` |

### repos 段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 仓库名称 |
| `path` | 是 | 本地路径 |
| `description` | 否 | 仓库描述 |
| `languages` | 否 | 主要编程语言列表 |

## 开发

```bash
# 类型检查
npm run typecheck

# 构建
npm run build
```

## 要求

- Node.js >= 20.0.0
- npm >= 9.0.0
