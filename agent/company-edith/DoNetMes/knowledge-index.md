# DoNetMes 知识索引

## 概览
DoNetMes 是基于 Admin.NET 框架的通用权限管理开发框架，适用于企业级后台管理系统、MES、ERP 等场景。

## 技术栈
- .NET 8/10 + Furion + SqlSugar
- Vue3 + Element Plus
- MySQL/SqlServer/PostgreSQL/Oracle/Sqlite

## 知识层级

### Layer 1 - Quick Reference
- [quick-ref.md](./quick-ref.md) - 速查卡（技术栈、核心约束、权限模型、服务清单）

### Layer 2 - Distillates

#### 架构与模型
- [01-architecture.md](./distillates/admin-main/01-architecture.md) - 四层架构、依赖注入、ORM配置、插件机制
- [02-entity-model.md](./distillates/admin-main/02-entity-model.md) - 实体基类体系、核心实体清单、实体过滤器

#### 权限体系
- [03-auth-permission.md](./distillates/admin-main/03-auth-permission.md) - 认证流程、RBAC模型、数据权限、LDAP集成

#### 服务层
- [04-core-services.md](./distillates/admin-main/04-core-services.md) - 36个核心服务详解、服务依赖关系、使用模式

#### API契约
- [05-api-contracts.md](./distillates/admin-main/05-api-contracts.md) - API路由规范、认证/用户/角色/机构接口、通用响应格式

#### 配置字典
- [06-config-dictionary.md](./distillates/admin-main/06-config-dictionary.md) - 枚举定义、配置文件说明、缓存键常量

## 快速导航

| 我想要... | 去看 |
|-----------|------|
| 了解技术栈和核心约束 | quick-ref.md |
| 理解实体基类怎么选 | 02-entity-model.md |
| 实现登录认证 | 03-auth-permission.md |
| 配置角色权限 | 03-auth-permission.md |
| 调用用户/角色API | 05-api-contracts.md |
| 了解服务怎么注入 | 04-core-services.md |
| 查找配置项含义 | 06-config-dictionary.md |

---
*生成时间: 2026-05-02*
