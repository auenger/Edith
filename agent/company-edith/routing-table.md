---
name: company-edith-routing-table
description: Layer 0 routing table. Always loaded. Maps services to one-line descriptions and key constraints.
layer: 0
---

# Service Routing Table

## Services

| Service | Role | Stack | Owner | Key Constraints |
|---------|------|-------|-------|-----------------|
| DoNetMes | 通用权限管理开发框架，适用于企业级后台管理系统、MES、ERP 等场景 | .NET 8/10 + Furion + SqlSugar + Vue3 + Element Plus | TBD | 四层架构严格分离；必须使用实体基类；动态 API 服务模式；雪花 ID 主键；软删除默认启用；多租户数据隔离 |
| LiteMes | PCB 轻量级制造执行系统，面向 PCB 工厂的生产管理 | | TBD | |

## Quick-Ref Paths

| Service | Quick-Ref (Layer 1) | Full Distillates (Layer 2) |
|---------|---------------------|----------------------------|
| DoNetMes | DoNetMes/quick-ref.md | DoNetMes/distillates/ |
| LiteMes | LiteMes/quick-ref.md | LiteMes/distillates/ |

## Loading Rules

- Layer 0 (this file): always loaded -- identify which services a task touches
- Layer 1 (quick-ref): load when task enters a specific service
- Layer 2 (distillate fragments): load specific fragment when implementing a detail
