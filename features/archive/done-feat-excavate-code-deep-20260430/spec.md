# Feature: feat-excavate-code-deep 代码细节深度分析

## Basic Information
- **ID**: feat-excavate-code-deep
- **Name**: 代码细节深度分析（函数级知识提取）
- **Priority**: 92
- **Size**: S
- **Dependencies**: [feat-excavate-md-mining]
- **Parent**: feat-deep-excavation
- **Children**: []
- **Created**: 2026-04-30

## Description

当前 scan skill 的"全局扫描"模式只扫描到目录结构和配置文件级别，对代码文件只做条件扫描（有 routes/ 扫路由等），不深入分析代码细节。本特性将代码分析从"目录级"提升到"函数级"。

### 增强分析维度

| 分析维度 | 当前能力 | 增强后 |
|---------|---------|-------|
| 接口签名 | 只提取路由定义 | 提取所有 public 函数/方法签名（参数+返回值） |
| 类型定义 | 只读 ORM Schema | 读所有 interface/type/struct/class 定义 |
| 导入关系 | 不分析 | 追踪 import/export，构建依赖图 |
| 调用链 | 从方法名推断 | 实际追踪函数调用，识别关键路径 |
| 错误处理 | 不分析 | 提取 try/catch 模式、错误类型、错误边界 |
| 配置读取 | 读配置文件 | 分析代码中如何消费配置，识别关键配置项 |
| 副作用 | 不分析 | 识别 API 调用、DB 查询、文件 I/O、消息队列 |
| 设计模式 | 不分析 | 从代码结构识别常用模式（工厂/策略/观察者等） |

### 多语言支持

- **TypeScript/JavaScript**: 解析 interface, type, class, export, 函数签名
- **Go**: 解析 func, interface, struct, type, 方法签名
- **Python**: 解析 class, def, type hints, decorators
- **Java**: 解析 class, interface, method signatures, annotations

## User Value Points

1. 从代码中提取更深层的架构知识（不只是目录结构）
2. 函数级接口契约为 distill 提供更高质量的输入

## Context Analysis

### Reference Code
- `edith-skills/document-project/SKILL.md` — Step 3 条件扫描 + 模式二 模块深入
- `agent/src/tools/scan.ts` — scan 工具的代码分析逻辑

### Related Documents
- `SKILL.md` 黄金路径 — Phase 2 INVENTORY + Phase 2c 蒸馏

### Related Features
- `feat-deep-excavation`（父特性）
- `feat-excavate-md-mining`（前置特性 — MD 挖掘结果作为代码分析的补充知识）
- `feat-p2-graphify-index`（pending — Phase 2 的 AST 级索引，本特性是 SKILL 级的中间方案）

## Technical Solution
<!-- To be filled during implementation -->

核心改动点：
1. **代码阅读策略**：从"读关键目录"变为"读所有源文件（受深度策略控制）"
2. **签名提取器**：按语言提取函数/方法签名、类型定义、接口契约
3. **依赖图构建器**：分析 import/export，构建文件级依赖图
4. **模式识别器**：从代码结构识别设计模式和架构模式
5. **增强版 Step 3**：重写条件扫描为"全量代码分析 + 条件聚合"
6. **SKILL.md 更新**：增强 scan 的 Step 3 和 Step 4

## Acceptance Criteria (Gherkin)

### User Story
作为 EDITH 用户，当我扫描一个项目时，代码分析深入到函数级，提取所有接口契约、类型定义和调用关系，而不是只看目录结构。

### Scenarios (Given/When/Then)

#### Scenario 1: 接口签名提取
```gherkin
Given 一个 TypeScript 项目中有 20 个 export function
When scan 执行代码深度分析
Then 提取所有 20 个函数的签名（参数名+类型+返回类型）
And 按模块分组输出到 api-contracts.md
```

#### Scenario 2: 依赖图构建
```gherkin
Given 项目中 src/index.ts 导入了 router.ts 和 config.ts
And router.ts 导入了 controller.ts
When scan 执行依赖分析
Then 生成依赖图显示 index → router → controller 的关系
And 识别 controller.ts 为核心依赖节点
```

#### Scenario 3: 错误处理模式提取
```gherkin
Given 项目中使用统一的 AppError 类和 try/catch 模式
When scan 执行模式分析
Then 识别 AppError 为全局错误类型
And 提取错误处理模式（throw/catch/propagate）
And 在架构文档中记录错误处理策略
```

### General Checklist
- [ ] 多语言签名提取正确
- [ ] 依赖图准确反映实际导入关系
- [ ] 模式识别不误报
- [ ] 大文件分批处理不超时
- [ ] 与 MD 挖掘结果合并无冲突
