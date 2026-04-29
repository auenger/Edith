本分片覆盖 [Overview]。来自服务: LiteMes。

---
type: edith-distillate
target_service: "LiteMes"
sources:
  - "LiteMes/docs/overview.md"
  - "LiteMes/project-context.md"
  - "LiteMes/src/main/java/com/litemes/"
created: "2026-04-29T03:00:00.000Z"
enriched: "2026-04-29T03:00:00.000Z"
---
# LiteMes — Overview

## Summary


LiteMes (PCB Lightweight MES System) is a manufacturing execution system designed for PCB (Printed Circuit Board) factories. It provides master data management, production tracking, equipment management, and supply chain capabilities through a modern web application.

**Current Phase**: 基础数据模块 24 个 Feature 全部完成（后端 + 前端）。下一步进入生产执行模块开发。

## Tech Stack


### Backend


* **Framework**: Quarkus 3.21.4 (reactive Java microservice)

* **Language**: Java 17

* **Build**: Maven

* **ORM**: MyBatis-Plus 2.4.2 (Quarkiverse)

* **Database**: MySQL 8.x

* **Cache**: Redis

* **Auth**: SmallRye JWT (JWT bearer token)

* **Config**: YAML-based (quarkus-config-yaml)

* **API Docs**: OpenAPI + Swagger UI at /q/swagger-ui

* **Validation**: Hibernate Validator (fail-fast mode)

* **WebSocket**: Quarkus WebSocket (跨节点状态推送)

* **Reactive Client**: Vert.x MQTT Client (工业网关通信)

* **Scheduler**: Quarkus Scheduler (cron 定时任务)

* **Events**: CDI Events (领域事件解耦)

* **Native**: GraalVM Native Image 支持（启动 <100ms）

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

* **web/** — JAX-RS REST resources (25 Resource) + DTOs + GlobalExceptionMapper

* **application/service/** — CDI application services (25 Service, business orchestration + @Transactional)

* **domain/** — 34 Entities, Repository interfaces (domain), Enums, BusinessException

* **infrastructure/** — RepositoryImpl (MyBatis-Plus mappers), security (JWT + CurrentUser), WebSocket, config

Entity inheritance: `BaseEntity` (id, createdBy, createdAt, updatedBy, updatedAt) → `SoftDeleteEntity` (adds `deleted` logical delete via `@TableLogic`)

### Code Patterns

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 实体 | PascalCase | `MaterialMaster`, `EquipmentLedger` |
| REST Resource | `{Entity}Resource` | `MaterialResource` |
| 应用服务 | `{Entity}Service` | `MaterialService` |
| 仓储接口 | `{Entity}Repository` | `MaterialRepository` |
| 仓储实现 | `{Entity}RepositoryImpl` | `MaterialRepositoryImpl` |
| MyBatis Mapper | `{Entity}Mapper` | `MaterialMapper` |
| DTO 四件套 | `{Entity}Dto/CreateDto/UpdateDto/QueryDto` | `MaterialCreateDto` |
| DB 表名 | snake_case | `material_master` |

### Unified API Response


All endpoints wrap responses in `R<T>`: `{ code: 200, message: "success", data: T, timestamp }`

Error response: `{ code: "COMPANY_CODE_DUPLICATE", message: "公司编码已存在" }`
## Deployment

* **JVM Mode**: `./mvnw quarkus:dev` (dev) / `java -jar target/quarkus-app/quarkus-run.jar` (prod)
* **GraalVM Native Image**: 编译为 Native 可执行文件，启动 <100ms，内存极低
* **多节点部署**: JWT 无状态认证 + Redis Pub/Sub 跨节点信号同步

## Redis Infrastructure

| 用途 | 技术 | 说明 |
|------|------|------|
| 分布式锁 | Lettuce | 批次过站等并发操作保护 |
| 跨节点信号 | Pub/Sub | 状态变更通知 |
| 缓存 | Redis | 会话/权限缓存 |

## Non-functional Requirements

* **响应时间**: 基础数据查询 ≤200ms (P99, 单体服务)
* **批量操作**: 支持 Excel 导入导出，单次上限 5000 行
* **并发安全**: Redis 分布式锁保护，不支持内存锁
* **数据完整性**: 被引用数据禁止物理删除（@TableLogic 软删除）

## Data Volume Strategy (规划)

* **读写分离**: 报表查询与实时过站分开
* **按月分表**: ProcessLog 等大表按时间分区
* **冷热分离**: 历史数据归档，保持在线表轻量

## Hardware Communication Architecture (规划)

```
PLC / 机台设备
     │ (Modbus TCP / MQTT)
     ▼
Quarkus Scheduled Job (定时轮询) 
     │ CDI Domain Events
     ▼
Domain Event Observers (业务处理)
```

* 通信层与业务层严格分离
* MQTT 基于 Vert.x MQTT Client 异步通信

## Testing

* **框架**: JUnit 5 + REST Assured + @QuarkusTest
* **单元测试**: 重点测试领域规则（编码唯一性、引用完整性、状态流转）
* **集成测试**: 仓储实现、全局拦截器、并发锁、API 端到端
* **E2E**: 18 Playwright spec 覆盖全部基础数据模块

## Completed Features (24)

| 模块 | Features |
|------|----------|
| 企业架构 (8) | Company, Factory, Department, DepartmentUser, ShiftSchedule, WorkCenter, Process, CascadingSelector |
| 物料主数据 (4) | Uom+UomConversion, MaterialCategory, MaterialInfo+MaterialVersion, InspectionExemption |
| 设备主数据 (3) | EquipmentType, EquipmentModel, EquipmentLedger |
| 供应链 (2) | Customer+CustomerMaterial, Supplier+SupplierMaterial |
| 数据权限 (2) | DataPermissionGroup, UserDataPermission |
| 基础设施 (5) | ProjectScaffold, FrontendUILib, FrontendLayout, CascadingSelector, AuthFrontend |