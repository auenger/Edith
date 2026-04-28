---
name: <company-edith-routing-table>
description: Layer 0 路由表。常驻上下文，映射服务到一句话描述和关键约束。必须控制在 500 token 以内。
layer: 0
token_budget: 500
---

# <Company> 服务路由表

## 服务清单

| 服务 | 角色 | 技术栈 | 负责人 | 关键约束 |
|------|------|--------|--------|----------|
| `<service-a>` | <一句话定位> | <技术栈> | <owner> | <1-2 条关键约束> |
| `<service-b>` | <一句话定位> | <技术栈> | <owner> | <1-2 条关键约束> |
| `<service-c>` | <一句话定位> | <技术栈> | <owner> | <1-2 条关键约束> |

## 速查路径

| 服务 | 速查卡（Layer 1） | 完整技能（Layer 2） |
|------|-------------------|---------------------|
| `<service-a>` | `skills/<service-a>/quick-ref.md` | `skills/<service-a>/SKILL.md` |
| `<service-b>` | `skills/<service-b>/quick-ref.md` | `skills/<service-b>/SKILL.md` |
| `<service-c>` | `skills/<service-c>/quick-ref.md` | `skills/<service-c>/SKILL.md` |

## 加载规则

- Layer 0（本文件）：常驻加载 — 识别任务涉及哪些服务
- Layer 1（速查卡）：任务进入某个服务时加载
- Layer 2（蒸馏片段）：实现具体细节时按片段加载

## 扩展

如果本表超过 500 token，按业务域拆分：

```
routing-table.md          ← 元路由（域 → 子表）
routing-table-<domain>.md ← 每域服务表
```

元路由表保持在 500 token 以内，子表按需加载。
