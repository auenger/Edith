# DoNetMes 架构概述

## 四层架构
```
┌─────────────────────────────────────────────────────────┐
│  Web.Entry (入口层)                                      │
│  - Program.cs 启动配置                                   │
│  - HomeController 默认路由                               │
│  - Dockerfile 容器化部署                                 │
├─────────────────────────────────────────────────────────┤
│  Web.Core (Web核心层)                                    │
│  - Component 应用组件注册                                │
│  - Handlers JWT处理器                                   │
│  - Startup 启动配置                                      │
├─────────────────────────────────────────────────────────┤
│  Application (应用层)                                    │
│  - Service 业务服务实现                                  │
│  - Entity 业务实体                                       │
│  - SeedData 种子数据                                     │
│  - Configuration 配置文件                                │
├─────────────────────────────────────────────────────────┤
│  Core (核心层)                                           │
│  - Service 框架服务 (36个)                               │
│  - Entity 框架实体 (59个)                                │
│  - Enum 枚举定义 (50个)                                  │
│  - Extension 扩展方法                                    │
│  - Cache/EventBus/Job/Logging 基础设施                   │
└─────────────────────────────────────────────────────────┘
```

## 项目依赖关系
```
Web.Entry → Web.Core → Application → Core
    ↓           ↓           ↓          ↓
  启动入口    组件注册    业务实现    框架基础
```

## 依赖注入生命周期
| 接口 | 生命周期 | 使用场景 |
|------|----------|----------|
| ITransient | 瞬时 | Service 层默认 |
| ISingleton | 单例 | 全局缓存、配置 |
| IScoped | 作用域 | 请求级共享 |

## Service 注册模式
```csharp
// 1. 自动注册（推荐）
public class SysUserService : IDynamicApiController, ITransient { }

// 2. 手动注册
services.AddService<SysUserService>(ServiceLifetime.Transient);
```

## ORM 配置 (SqlSugar)
- 多租户支持: `ITenantIdFilter` 自动过滤
- 数据权限: `IOrgIdFilter` 自动过滤
- 软删除: `IDeletedFilter` 自动过滤
- 审计字段: 自动填充 `CreateTime`, `UpdateTime`, `CreateUserId`

## 缓存策略
```
CacheConst.KeyXxx → 缓存键前缀
├── KeyTenant          # 租户列表
├── KeyMenu            # 菜单树
├── KeyRole            # 角色列表
├── KeyOrg             # 机构树
├── KeyUser            # 用户信息
└── KeyPasswordErrorTimes  # 密码错误次数
```

## 事件总线
```csharp
// 发布事件
await _eventPublisher.PublishAsync(UserEventTypeEnum.Add, user);

// 订阅事件
public class AppEventSubscriber : IEventSubscriber
{
    [EventSubscribe(UserEventTypeEnum.Add)]
    public async Task HandleUserAdd(EventHandlerExecutingContext context)
    {
        var user = context.Source.Payload as SysUser;
        // 处理逻辑
    }
}
```

## 插件机制
```
Plugins/
├── Admin.NET.Plugin.Ai           # AI插件
├── Admin.NET.Plugin.DataApproval # 数据审批
├── Admin.NET.Plugin.DingTalk     # 钉钉集成
├── Admin.NET.Plugin.GoView       # 可视化
├── Admin.NET.Plugin.K3Cloud      # 金蝶集成
├── Admin.NET.Plugin.PaddleOCR    # OCR识别
├── Admin.NET.Plugin.ReZero       # API管理
└── Admin.NET.Plugin.WorkWeixin   # 企业微信
```

## 代码生成策略
| 策略 | 说明 |
|------|------|
| SingleTable | 单表CRUD |
| MasterSlaveTables | 主子表 |
| TableRelationship | 表关系 |
| TreeSingleTable | 树形单表 |
| TreeMasterSlaveTables | 树形主子表 |

---
*来源: Admin.NET.Core 架构分析*
