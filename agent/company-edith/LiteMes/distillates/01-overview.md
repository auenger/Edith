本分片覆盖 [Overview]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
sources:
  - "LiteMes/docs/overview.md"
created: "2026-04-28T01:25:43.758Z"
---

# LiteMes — Overview

# LiteMes - Project Overview



## Summary


LiteMes (PCB Lightweight MES System) is a manufacturing execution system designed for PCB (Printed Circuit Board) factories. It provides master data management, production tracking, equipment management, and supply chain capabilities through a modern web application.

## Tech Stack


### Backend


* **Framework**: Quarkus 3.21.4 (reactive Java microservice)

* **Language**: Java 17

* **ORM**: MyBatis-Plus 2.4.2

* **Database**: MySQL 8.x

* **Cache**: Redis

* **Auth**: SmallRye JWT (JWT bearer token)

* **Config**: YAML-based (quarkus-config-yaml)

* **API Docs**: OpenAPI + Swagger UI at /q/swagger-ui

* **Validation**: Hibernate Validator (fail-fast mode)

### Frontend


* **Framework**: Vue 3.5 (Composition API + `<script setup>`)

* **Language**: TypeScript 6.0

* **Build**: Vite 8

* **UI Library**: Element Plus 2.13

* **CSS**: TailwindCSS 4.2

* **State**: Pinia 3.0

* **Router**: Vue Router 4.6

* **HTTP**: Axios (JWT interceptor, 401 auto-redirect)

* **E2E Testing**: Playwright 1.59

### Architecture Pattern


Backend follows **DDD-layered architecture**:

* **web/** — JAX-RS REST resources (Resource) + DTOs + exception handling

* **application/service/** — CDI application services (business orchestration + @Transactional)

* **domain/** — Entities, Repositories, Enums, BusinessException

* **infrastructure/** — MyBatis-Plus mappers, security (JWT), WebSocket, config

Entity inheritance: `BaseEntity` (id, createdBy, createdAt, updatedBy, updatedAt) → `SoftDeleteEntity` (adds `deleted` logical delete via `@TableLogic`)

### Unified API Response


All endpoints wrap responses in `R<T>`: `{ code: 200, message: "success", data: T, timestamp }`

## Service Modules (25 Resources)


| Domain       | Resources                                                          | Count |
| ------------ | ------------------------------------------------------------------ | ----- |
| Organization | Company, Factory, Department, DepartmentUser, Shift, ShiftSchedule | 6     |
| Equipment    | EquipmentType, EquipmentModel, EquipmentLedger                     | 3     |
| Material     | Material, MaterialCategory, MaterialVersion, InspectionExemption   | 4     |
| Supply Chain | Customer, Supplier                                                 | 2     |
| Production   | WorkCenter, Uom, UomConversion, Process                            | 4     |
| Permission   | DataPermissionGroup, UserDataPermission                            | 2     |
| System       | Auth, AuditLog, Dropdown, Example                                  | 4     |

## Frontend Routes (20 pages)


| Module       | Routes                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Auth         | /login                                                                        |
| Dashboard    | / (Home), /about                                                              |
| Organization | /companies, /factories, /departments, /departments/:id/users, /shift-schedule |
| Production   | /work-centers, /processes, /uoms, /uom-conversions                            |
| Material     | /material-categories, /materials, /inspection-exemptions                      |
| Equipment    | /equipment-types, /equipment-models, /equipment-ledger                        |
| Supply Chain | /customers, /suppliers                                                        |
| Permission   | /data-permission-groups, /user-data-permissions                               |

## Design Documents


5 functional design documents in `docx/`:

* 企业管理_功能设计_V1.0

* 供应链主数据_功能设计_V1.0

* 数据权限_功能设计_V1.0

* 物料主数据_功能设计_V1.0

* 设备主数据_功能设计_V1.0

## E2E Test Coverage


18 Playwright spec files covering: auth, org (company/department/factory/shift-schedule), equipment (ledger/model/type), material (category/material/inspection-exemption), supply-chain (customer/supplier), production (uom/uom-conversion/work-center), permission (group/user-permission).

## Configuration


* **Server**: port 8080

* **CORS**: localhost:3000, localhost:5173

* **DB**: mysql://localhost:3306/litemes

* **Redis**: redis://localhost:6379

* **JWT Issuer**: <https://litemes.com>

* **Logical Delete**: deleted field (1=deleted, 0=active)

⠀