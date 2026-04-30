---
type: edith-distillate
target_service: "DoNetMes"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes — 业务逻辑

## 认证授权流程

### 登录流程

```
1. 用户提交 账号/密码 → /api/sysAuth/login
2. 验证账号存在性 + 密码（SM2/SM3/SM4 国密）
3. 检查用户状态、租户状态
4. 生成 JWT Token（包含 UserId、TenantId、OrgId 等 Claims）
5. 返回 AccessToken + RefreshToken
```

### JWT 处理器 (JwtHandler)

```csharp
public class JwtHandler : AppAuthorizeHandler
{
    public override async Task HandleAsync(...)
    {
        // 1. 检查 Token 黑名单（缓存中）
        // 2. 自动刷新过期 Token
        // 3. 验证路由权限
    }

    public override async Task<bool> PipelineAsync(...)
    {
        // SuperAdmin 跳过权限检查
        // 验证按钮级别权限
        return true;
    }
}
```

### 权限体系

| 权限级别 | 实现方式 |
|----------|----------|
| **菜单权限** | SysMenu + SysRoleMenu 控制菜单可见性 |
| **按钮权限** | SysMenu 的 Permission 字段，前端通过 `v-auth` 指令控制 |
| **API 权限** | SysRoleApi 黑名单机制，控制接口访问 |
| **数据权限** | SysRole.DataScope 控制数据范围（全部/本部门/本人等） |
| **表/列权限** | SysRoleTable + SysRoleColumn 细粒度控制 |

### 数据范围枚举

```csharp
public enum DataScopeEnum
{
    All = 1,           // 全部数据
    OrgWithChild = 2,  // 本部门及以下
    OrgOnly = 3,       // 本部门
    SelfOnly = 4,      // 仅本人
    Custom = 5         // 自定义
}
```

## 多租户机制

### 租户隔离策略

```
请求 → JwtHandler 提取 TenantId
  → SqlSugar 全局过滤器自动注入 WHERE TenantId = @tenantId
  → 所有查询自动隔离
```

### 实现要点

1. **实体基类**：业务实体继承 `EntityBaseTenant`
2. **自动过滤**：SqlSugar `QueryFilter` 自动注入租户条件
3. **手动切换**：`ITenant` 接口可手动切换租户上下文

```csharp
// 自动过滤（默认）
var users = await _rep.GetListAsync();  // 自动过滤当前租户

// 手动切换租户
using (tenantService.Change(tenantId))
{
    var allUsers = await _rep.GetListAsync();  // 查询指定租户
}
```

## 服务开发模式

### BaseService 模式

```csharp
public class SysUserService : BaseService<SysUser>, IDynamicApiController
{
    // 构造函数注入仓储
    private readonly SqlSugarRepository<SysUser> _rep;

    // 自动获得的方法：
    // - GetDetail(id)     获取详情
    // - GetList()         获取列表
    // - Add(input)        新增
    // - Update(input)     更新
    // - Delete(id)        删除（软删除）
    // - Page(input)       分页查询

    // 自定义业务方法
    public async Task<List<string>> GetOwnBtnPermList()
    {
        // 业务逻辑
    }
}
```

### 代码生成器

通过代码生成器可一键生成以下内容：
- 实体类（Entity）
- 服务类（Service）
- DTO（Input/Output）
- 前端页面（Vue）
- 前端 API 调用

## 事件总线

### 事件发布/订阅

```csharp
// 发布事件
await EventBus.PublishAsync(new UserCreatedEvent { UserId = user.Id });

// 订阅事件
public class UserCreatedEventSubscriber : IEventSubscriber<UserCreatedEvent>
{
    public async Task HandleAsync(UserCreatedEvent @event)
    {
        // 处理事件
    }
}
```

## 任务调度

### Sundial 作业调度

```csharp
// 定义作业
public class CleanSysLogJob : IJob
{
    public async Task ExecuteAsync(JobExecutingContext context)
    {
        // 清理过期日志
    }
}

// 注册作业
services.AddSchedule(options =>
{
    options.AddJob<CleanSysLogJob>(Triggers.PeriodOrOnce("0 0 2 * * ?"));  // 每天凌晨2点
});
```

## SignalR 实时通信

### 在线用户推送

```csharp
public class OnlineUserHub : Hub<IOnlineUserHub>
{
    // 用户上线
    public override async Task OnConnectedAsync()
    {
        await Clients.All.UserOnline(userId);
    }

    // 消息推送
    public async Task SendMessage(string userId, string message)
    {
        await Clients.User(userId).ReceiveMessage(message);
    }
}
```

## 文件管理

### 存储策略

| 策略 | 说明 |
|------|------|
| 本地存储 | 文件保存在服务器本地磁盘 |
| 阿里云 OSS | 文件保存到阿里云对象存储 |
| 腾讯 COS | 文件保存到腾讯云对象存储 |
| MinIO | 文件保存到 MinIO 对象存储 |

## 日志审计

### 日志类型

| 类型 | 实体 | 说明 |
|------|------|------|
| 操作日志 | SysLogOp | 记录所有增删改操作 |
| 访问日志 | SysLogVis | 记录页面/接口访问 |
| 异常日志 | SysLogEx | 记录系统异常 |
| 差异日志 | SysLogDiff | 记录数据变更前后的差异 |

### 日志配置

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    },
    "LogTo": {
      "Database": true,
      "ElasticSearch": false
    }
  }
}
```

## 已有能力清单（禁止重复开发）

| 能力 | 现有实现 | 说明 |
|------|---------|------|
| 角色与权限管理 | `SysRoleService` | 角色 CRUD、菜单授权、数据范围配置 |
| 数据范围控制 | `SysRole.DataScope` + `SysRoleOrgService` | 按角色配置数据可见范围 |
| 表/列级数据权限 | `SysRoleTableService` | 角色关联表和列的细粒度权限控制 |
| 用户-角色绑定 | `SysUserRoleService` | 用户与角色的多对多关系管理 |
| 菜单与按钮权限 | `SysMenuService` + `SysRoleMenuService` | 菜单树、按钮级权限标识 |
| API 路由权限 | `SysRoleApiService` + `JwtHandler` | 角色 API 黑名单、路由级鉴权 |
| 认证与令牌管理 | `SysAuthService` + `JwtHandler` | JWT 登录、Token 刷新/黑名单 |
| 数据行级过滤 | SqlSugar `QueryFilter` | 自动注入租户/机构数据隔离条件 |
| 多租户隔离 | `EntityBaseTenant` + 全局过滤器 | 自动按 `TenantId` 过滤 |
| 软删除 | `EntityBaseDel` + 全局过滤器 | 自动 `IsDelete` 过滤 |
