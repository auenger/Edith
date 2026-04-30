---
type: edith-quick-ref
layer: 1
target_service: "DoNetMes"
sources:
  - "DoNetMes/project-context.md"
  - "DoNetMes/CLAUDE.md"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes Quick-Ref

> Admin.NET 通用权限管理开发框架 — 基于 .NET 8/10 + Furion + SqlSugar

## Verify

```bash
# 后端
cd Admin.NET
dotnet build                              # 构建解决方案
dotnet run --project Admin.NET.Web.Entry   # 运行应用程序
dotnet test                               # 运行所有测试

# 前端
cd Web
pnpm install                              # 安装依赖
pnpm run dev                              # 开发服务器（端口 5005）
pnpm run build                            # 生产构建

# Docker
docker-compose -f docker/docker-compose.yml up -d
```

## Key Constraints

| 约束 | 说明 |
|------|------|
| **四层架构** | Web.Entry → Web.Core → Application → Core，严格分离不可跨层调用 |
| **实体基类** | 必须使用 EntityBase/EntityBaseDel/EntityBaseTenant 等基类 |
| **动态 API** | 服务继承 `BaseService<TEntity>` + `IDynamicApiController` |
| **仓储模式** | 所有数据操作必须通过 `SqlSugarRepository<TEntity>` |
| **雪花 ID** | 所有实体使用雪花 ID（Yitter.IdGenerator） |
| **软删除** | 默认启用，通过 `IsDelete` 字段过滤 |
| **多租户** | 通过 `TenantId` 字段自动过滤 |

## Pitfalls

| 易错点 | 正确做法 |
|--------|----------|
| 禁止跳过仓储直接操作数据库 | 使用 `SqlSugarRepository` |
| 禁止硬编码权限判断 | 使用 `[Authorize]` 特性或菜单权限配置 |
| 禁止修改系统表实体 | 系统实体在 Core 层，修改需谨慎 |
| 新需求要复用现有能力 | 角色/权限/租户等能力已内置，禁止重复开发 |

## API Endpoints

| 模块 | 路由 | 说明 |
|------|------|------|
| 认证 | `/api/sysAuth/login`、`/api/sysAuth/refreshToken` | JWT 登录、Token 刷新 |
| 用户 | `/api/sysUser/*` | 用户 CRUD |
| 菜单 | `/api/sysMenu/*` | 菜单管理 |
| 角色 | `/api/sysRole/*` | 角色管理 |
| 机构 | `/api/sysOrg/*` | 机构管理 |
| 租户 | `/api/sysTenant/*` | 租户管理 |
| 代码生成 | `/api/sysCodeGen/*` | 代码生成器 |
| 文件 | `/api/sysFile/*` | 文件管理 |
| 定时任务 | `/api/sysJob/*` | 任务调度 |

## Data Models

### 核心实体

| 实体 | 说明 |
|------|------|
| `SysUser` | 系统用户 |
| `SysRole` | 角色 |
| `SysMenu` | 菜单（目录/菜单/按钮） |
| `SysOrg` | 机构（树形结构） |
| `SysPos` | 职位 |
| `SysTenant` | 租户 |

### 实体基类

| 基类 | 字段 |
|------|------|
| `EntityBaseId` | Id（雪花 ID） |
| `EntityBase` | + CreateTime, CreateUserId, CreateUserName, UpdateTime, UpdateUserId, UpdateUserName |
| `EntityBaseDel` | + IsDelete, DeleteTime（软删除） |
| `EntityBaseTenant` | + TenantId（多租户） |

## Key Configs

| 文件 | 说明 |
|------|------|
| `Configuration/App.json` | 应用设置、CORS、密码策略、JWT |
| `Configuration/Database.json` | 数据库连接配置 |
| `Configuration/Cache.json` | Redis/缓存配置 |
| `Configuration/JWT.json` | Token 过期设置 |

## Default Accounts

| 账号 | 密码 | 说明 |
|------|------|------|
| superAdmin | Admin.NET++010101 | 默认超级管理员 |

## Deep Dive

- Overview: `DoNetMes/distillates/01-overview.md`
- API contracts: `DoNetMes/distillates/02-api-contracts.md`
- Data models: `DoNetMes/distillates/03-data-models.md`
- Business logic: `DoNetMes/distillates/04-business-logic.md`
- Development guide: `DoNetMes/distillates/05-development-guide.md`
