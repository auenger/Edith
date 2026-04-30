---
type: edith-distillate
target_service: "DoNetMes"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes — 项目概览

## 项目定位

Admin.NET 是一个**通用权限管理开发框架**，基于 .NET 8/10 + Furion + SqlSugar 构建，采用插件式模块化开发。适用于企业级后台管理系统、MES 系统、ERP 系统等场景。

**核心特性：**
- 通用权限管理（用户、角色、菜单、机构、租户）
- 插件式架构（审批流、钉钉、企微、GoView 报表等）
- 多租户数据隔离
- 代码生成器一键生成前后端代码
- 支持国产化（国密算法、国产数据库、国产操作系统）

## 技术栈

### 后端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | .NET | 8.0 / 10.0 | 跨平台、高性能 |
| 基础框架 | Furion | 4.9.8.49 | 通用权限、快速开发框架 |
| ORM | SqlSugar | 5.1.4.214 | 高性能 ORM，支持多种数据库 |
| 数据库 | Sqlite（默认） | — | 支持 MySQL、PostgreSQL、SQL Server、Oracle |
| 缓存 | Redis | — | NewLife.Redis 分布式缓存 |
| 认证 | JWT + 签名认证 | — | 双认证机制，支持 Token 自动刷新 |
| 任务调度 | Sundial | — | 分布式作业调度系统 |
| 实时通信 | SignalR | — | 消息推送 |
| 日志 | log4net | 3.3.1 | 结构化日志 |
| 限流 | AspNetCoreRateLimit | 5.0.0 | API 访问限流 |
| 国密 | SM2/SM3/SM4 | — | 密码加密、数据完整性保护 |

### 前端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | 3.5.32 | 组合式 API |
| UI 组件 | Element Plus | 2.13.7 | 企业级 Vue 3 组件库 |
| 构建工具 | Vite | 8.0.9 | HMR 极快 |
| 状态管理 | Pinia | 3.0.4 | Vue 3 官方推荐 |
| 语言 | TypeScript | — | 类型安全 |
| HTTP | Axios | — | API 请求封装 |

## 架构设计

### 解决方案结构

```
Admin.NET/
├── Admin.NET.Web.Entry/         # Web 入口（Program.cs、Controllers、静态文件）
├── Admin.NET.Web.Core/          # Web 层（Startup.cs、JWT 处理器、中间件）
├── Admin.NET.Application/       # 应用服务层（业务逻辑层、DTO、事件处理）
├── Admin.NET.Core/              # 核心框架（实体定义、ORM 配置、工具类）
├── Admin.NET.Test/              # 单元测试
└── Plugins/                     # 插件模块
```

### 四层职责

| 层级 | 职责 | 调用规则 |
|------|------|----------|
| **Web.Entry** | 应用入口、控制器、静态文件 | 只调用 Web.Core |
| **Web.Core** | 中间件、认证处理器、CORS、SignalR | 只调用 Application |
| **Application** | 业务服务、DTO、事件处理器 | 只调用 Core |
| **Core** | 实体定义、SqlSugar 配置、缓存、工具类 | 基础层，不调用上层 |

### 插件机制

```
Plugins/
├── Admin.NET.Plugin.ApprovalFlow/   # 审批流
├── Admin.NET.Plugin.DingTalk/       # 钉钉集成
├── Admin.NET.Plugin.GoView/         # GoView 报表
├── Admin.NET.Plugin.K3Cloud/        # 金蝶云
├── Admin.NET.Plugin.ReZero/         # ReZero 工作流
├── Admin.NET.Plugin.WorkWeixin/     # 企业微信
├── Admin.NET.Plugin.Ai/             # AI 集成
├── Admin.NET.Plugin.PaddleOCR/      # OCR 识别
└── Admin.NET.Plugin.DataApproval/   # 数据审批
```

通过 `App.GetAssemblies()` 动态加载，运行时从 `plugins/` 目录加载。

## 核心领域模型

```
用户 (SysUser)
 ├── 用户角色 (SysUserRole)
 │    └── 角色 (SysRole)
 │         └── 角色菜单 (SysRoleMenu)
 │              └── 菜单 (SysMenu)
 ├── 用户机构 (SysOrg)
 │    └── 机构树形结构
 └── 租户 (SysTenant)
      └── 租户配置 (SysTenantConfig)
```

## 内置功能模块

| 模块 | 说明 |
|------|------|
| 用户管理 | 用户 CRUD、角色绑定、机构绑定 |
| 角色管理 | 菜单权限、数据权限 |
| 菜单管理 | 目录/菜单/按钮，支持动态路由 |
| 机构管理 | 树形组织架构 |
| 租户管理 | 多租户隔离 |
| 字典管理 | 键值对配置 |
| 日志管理 | 操作/访问/异常/差异日志 |
| 定时任务 | Sundial 作业调度 |
| 文件管理 | 本地/OSS 存储 |
| 代码生成 | 一键生成 CRUD |
| 接口文档 | Scalar API（Swagger 替代） |

## Docker 部署

```yaml
services:
  nginx:
    image: nginx:1.20.2
    ports: ["9100:80"]
  mysql:
    image: mysql:5.7
    ports: ["9101:3306"]
  redis:
    image: redis:latest
    ports: ["6379:6379"]
  adminNet:
    image: mcr.microsoft.com/dotnet/aspnet:9.0
    ports: ["9102:5050"]
```

## 近期更新

| 日期 | 变更 | 说明 |
|------|------|------|
| 2026-04-25 | v2 分支 | 升级 .NET 8/10 双版本支持 |
| 2026-04-22 | 升级 Furion | v4.9.8.49 |
| 2026-04-22 | 升级 Element Plus | v2.13.7 |
