本分片覆盖 [Overview]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
created: "2026-04-29T07:58:48.830Z"
---

# LiteMes — Overview

- **Request/Response**: JSON (`application/json`)
- **Response wrapper**: `R<T>` — `{ code, message, data, timestamp }`
- **Pagination**: `PagedResult<T>` — `{ records, total, current, size }`
- Organization: 组织架构 — 班制班次管理
- Production: 生产基础 — 工作中心
- Production: 生产基础 — 工序管理
- Production: 生产基础 — 计量单位
- Production: 生产基础 — 单位换算
- Material: 物料管理 — 物料分类 (tree structure)
- Material: 物料管理 — 物料信息
- Material: 物料管理 — 物料版本
- Material: 物料管理 — 免检清单
- Equipment: 设备管理 — 设备类型
- Equipment: 设备管理 — 设备型号
- Equipment: 设备管理 — 设备台账
- Supply Chain: 供应链 — 客户管理
- Supply Chain: 供应链 — 供应商管理
- Each Resource has 4 standard DTO types:
- `R<T>` — unified response wrapper
- `PagedResult<T>` — paginated result (records, total, current, size)
- `DropdownItem` — dropdown option (id, name)
- `UserInfoDto` — current user info
- `PageDto` — pagination params (page, size)
- LiteMes (PCB Lightweight MES System) is a manufacturing execution system designed for PCB (Printed Circuit Board) factories. It provides master data management, production tracking, equipment management, and supply chain capabilities through a modern web application.
- **Language**: Java 17
- **Database**: MySQL 8.x
- **Cache**: Redis
- **Auth**: SmallRye JWT (JWT bearer token)
- **Config**: YAML-based (quarkus-config-yaml)
- **Validation**: Hibernate Validator (fail-fast mode)
- **Language**: TypeScript 6.0
- **Build**: Vite 8
- **UI Library**: Element Plus 2.13
- **CSS**: TailwindCSS 4.2
- **State**: Pinia 3.0
- **E2E Testing**: Playwright 1.59
- Backend follows **DDD-layered architecture**:
- **web/** — JAX-RS REST resources (Resource) + DTOs + exception handling
- **infrastructure/** — MyBatis-Plus mappers, security (JWT), WebSocket, config
- Domain: Resources, Count
- Organization: Company, Factory, Department, DepartmentUser, Shift, ShiftSchedule, 6
- Material: Material, MaterialCategory, MaterialVersion, InspectionExemption, 4
- Supply Chain: Customer, Supplier, 2
- Permission: DataPermissionGroup, UserDataPermission, 2
- System: Auth, AuditLog, Dropdown, Example, 4
- Auth: /login
- Dashboard: / (Home), /about
- Organization: /companies, /factories, /departments, /departments/:id/users, /shift-schedule
- Material: /material-categories, /materials, /inspection-exemptions
- Supply Chain: /customers, /suppliers
- Permission: /data-permission-groups, /user-data-permissions
- 5 functional design documents in `docx/`:
- 企业管理_功能设计_V1.0
- **Server**: port 8080
- **CORS**: localhost:3000, localhost:5173
- **DB**: mysql://localhost:3306/litemes
- **Redis**: redis://localhost:6379