# feat-explore-project: 项目探索命令

## Feature Description

`/explore` 命令：快速浏览项目结构、技术栈、关键文件。轻量级概览，区别于 edith_scan 的深度扫描。

### 核心差异（vs edith_scan）

| 维度 | /explore | edith_scan |
|------|----------|------------|
| 目的 | 快速概览 | 深度扫描 + 文档生成 |
| 持久化 | 无（直接返回结果） | 生成 overview.md 等文件 |
| 耗时 | 秒级 | 分钟级 |
| 输出 | 目录树 + 技术栈 + 关键文件 | 端点/模型/流程统计 + 文档 |

### 功能清单

1. **目录结构概览**：生成缩进式目录树（最大深度 4，跳过 node_modules/.git 等）
2. **技术栈检测**：复用 scan.ts 的 detectTechStack 逻辑
3. **关键文件识别**：自动标记 entry points、config files、test dirs、CI/CD files
4. **文件统计**：按扩展名分组统计代码文件数量
5. **项目元信息**：从 package.json / README.md 提取 name、description、version

## Context Analysis

### 参考代码
- `agent/src/tools/scan.ts` — detectTechStack、buildSourceTree、SKIP_DIRECTORIES、CODE_EXTENSIONS 均可复用
- `agent/src/extension.ts` — 工具注册模式（TypeBox schemas + pi.registerTool）
- `agent/src/system-prompt.ts` — 触发映射表需更新
- `agent/src/config.ts` — RepoConfig 类型、loadConfig、resolveTarget

### 关键约束
- 复用 scan.ts 中的常量和工具函数，不重复实现
- 不生成任何文件，结果直接作为 tool response 返回
- 保持与现有工具相同的错误处理模式（Outcome 类型）

## Acceptance Criteria

- [ ] `edith_explore` 工具注册成功，参数 target 必填
- [ ] 输入项目路径或 repos 映射名，返回结构化概览
- [ ] 目录树正确跳过 node_modules、.git、dist、build 等
- [ ] 技术栈检测结果与 edith_scan 一致
- [ ] 关键文件自动标记（entry、config、test、CI/CD）
- [ ] 文件统计按扩展名分组
- [ ] 错误场景（路径不存在、空项目）有友好提示
- [ ] System Prompt 触发映射表更新，包含 explore 意图
- [ ] `/explore` 命令注册在 extension.ts 中
