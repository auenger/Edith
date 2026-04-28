---
name: company-edith-routing-table
description: Layer 0 routing table. Always loaded. Maps services to one-line descriptions and key constraints.
layer: 0
token_budget: 500
---

# Service Routing Table

## Services

| Service | Role | Stack | Owner | Key Constraints |
|---------|------|-------|-------|-----------------|
| LiteMes | PCB轻量级MES系统 — 制造执行主数据管理 | Quarkus 3.21 + Vue 3.5 + MySQL | TBD | JWT认证, 逻辑删除, 统一R<T>响应, 编码不可变 |

## Module Routing (LiteMes Internal)

| Domain | Resources (REST) | Frontend Routes | Key Constraint |
|--------|-----------------|-----------------|----------------|
| 组织架构 | Company, Factory, Department, DepartmentUser, Shift, ShiftSchedule | /companies, /factories, /departments, /shift-schedule | Company→Factory→Department 三级级联 |
| 设备管理 | EquipmentType, EquipmentModel, EquipmentLedger | /equipment-types, /equipment-models, /equipment-ledger | Type→Model→Ledger 级联 |
| 物料管理 | Material, MaterialCategory, MaterialVersion, InspectionExemption | /material-categories, /materials, /inspection-exemptions | Category为树结构 |
| 供应链 | Customer, Supplier | /customers, /suppliers | — |
| 生产基础 | WorkCenter, Uom, UomConversion, Process | /work-centers, /processes, /uoms, /uom-conversions | — |
| 数据权限 | DataPermissionGroup, UserDataPermission | /data-permission-groups, /user-data-permissions | 细粒度到Factory/WorkCenter/Process |
| 系统 | Auth, AuditLog, Dropdown | /login | JWT Bearer Token |

## Quick-Ref Paths

| Service | Quick-Ref (Layer 1) | Full Distillates (Layer 2) |
|---------|---------------------|----------------------------|
| LiteMes | LiteMes/quick-ref.md | LiteMes/distillates/ |

## Loading Rules

- Layer 0 (this file): always loaded — identify which services and modules a task touches
- Layer 1 (quick-ref): load when task enters a specific module (verify commands, key constraints)
- Layer 2 (distillate fragments): load specific fragment when implementing a detail (API contracts, data models, business logic)
