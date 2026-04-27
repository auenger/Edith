---
type: jarvis-quick-ref
layer: 1
target_service: "<service-name>"
sources:
  - "<相对路径/到/源文件1.md>"
  - "<相对路径/到/源文件2.md>"
created: "<日期>"
token_budget: 2000
---

# <服务名> 速查卡

## 验证命令

- 构建: `<精确构建命令>`
- 测试: `<精确测试命令>`
- 运行: `<精确运行命令>`
- Lint: `<精确 lint 命令>`

## 关键约束

- <约束 1 — 违反会怎样>
- <约束 2>
- <约束 3>
- <约束 4>
- <约束 5>

## 易错点

- <症状> — <根因>
- <症状> — <根因>
- <症状> — <根因>
- <症状> — <根因>
- <症状> — <根因>

## 接口清单

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | /api/v1/<resource> | <一句话描述> |
| POST | /api/v1/<resource> | <一句话描述> |
| PUT | /api/v1/<resource>/:id | <一句话描述> |
| DELETE | /api/v1/<resource>/:id | <一句话描述> |

## 数据模型

- <ModelA>: <用途>. 关键字段: <field1>, <field2>, <field3>
- <ModelB>: <用途>. 关键字段: <field1>, <field2>
- <ModelC>: <用途>. 关键字段: <field1>, <field2>

## 深入查询

- 接口契约: `distillates/<service>/02-api-contracts.md`
- 数据模型: `distillates/<service>/03-data-models.md`
- 业务逻辑: `distillates/<service>/04-business-logic.md`
- 架构概览: `distillates/<service>/01-overview.md`

## 说明

- 本卡覆盖日常开发 ~80% 的场景
- 需要详细 Schema、设计决策、被拒方案时，加载对应的深入查询片段
- 本文件必须控制在 2000 token 以内
- 重新生成: `distillator --quick-ref --jarvis-mode=repo-skill <源文档>`
