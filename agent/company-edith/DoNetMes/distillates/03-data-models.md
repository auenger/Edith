---
type: edith-distillate
target_service: "DoNetMes"
created: "2026-04-29T09:15:00.000Z"
---

# DoNetMes — 数据模型

## 实体基类体系

### EntityBaseId — 基础 ID 实体

```csharp
public abstract class EntityBaseId
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; }  // 雪花 ID
}
```

### EntityBase — 审计字段实体

```csharp
[SugarIndex("index_{table}_CT", nameof(CreateTime))]
public abstract class EntityBase : EntityBaseId
{
    public DateTime CreateTime { get; set; }
    public long? CreateUserId { get; set; }
    public string? CreateUserName { get; set; }
    public DateTime? UpdateTime { get; set; }
    public long? UpdateUserId { get; set; }
    public string? UpdateUserName { get; set; }
}
```

### EntityBaseDel — 软删除实体

```csharp
[SugarIndex("index_{table}_D", nameof(IsDelete))]
public abstract class EntityBaseDel : EntityBase
{
    public bool IsDelete { get; set; } = false;
    public DateTime? DeleteTime { get; set; }
}
```

### EntityBaseOrg — 机构数据范围实体

```csharp
public abstract class EntityBaseOrg : EntityBase
{
    public long? OrgId { get; set; }  // 所属机构
}
```

### EntityBaseTenant — 多租户实体

```csharp
public abstract class EntityBaseTenant : EntityBase, ITenantIdFilter
{
    public long? TenantId { get; set; }  // 租户 ID
}
```

### 继承关系图

```
EntityBaseId (Id)
    └── EntityBase (+ CreateTime, UpdateTime, CreateUserId...)
            ├── EntityBaseDel (+ IsDelete, DeleteTime)
            ├── EntityBaseOrg (+ OrgId)
            └── EntityBaseTenant (+ TenantId)
```

## 核心系统实体

### 用户与权限

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysUser | SysUser | 系统用户 | EntityBaseTenant |
| SysRole | SysRole | 角色 | EntityBaseTenant |
| SysUserRole | SysUserRole | 用户-角色关联 | EntityBase |
| SysMenu | SysMenu | 菜单（目录/菜单/按钮） | EntityBase |
| SysRoleMenu | SysRoleMenu | 角色-菜单关联 | EntityBase |
| SysOrg | SysOrg | 机构（树形） | EntityBaseTenant |
| SysUserExtOrg | SysUserExtOrg | 用户兼职机构 | EntityBase |
| SysPos | SysPos | 职位 | EntityBaseTenant |
| SysUserPos | SysUserPos | 用户-职位关联 | EntityBase |

### 数据权限

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysRoleOrg | SysRoleOrg | 角色-机构数据范围 | EntityBase |
| SysRoleDataScope | SysRoleDataScope | 角色数据范围配置 | EntityBase |
| SysRoleApi | SysRoleApi | 角色 API 黑名单 | EntityBase |
| SysRoleTable | SysRoleTable | 角色表级权限 | EntityBase |
| SysRoleColumn | SysRoleColumn | 角色列级权限 | EntityBase |

### 租户管理

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysTenant | SysTenant | 租户 | EntityBase |
| SysTenantConfig | SysTenantConfig | 租户配置 | EntityBase |

### 日志审计

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysLogOp | SysLogOp | 操作日志 | EntityBase |
| SysLogVis | SysLogVis | 访问日志 | EntityBase |
| SysLogEx | SysLogEx | 异常日志 | EntityBase |
| SysLogDiff | SysLogDiff | 差异日志 | EntityBase |

### 任务调度

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysSchedule | SysSchedule | 定时任务 | EntityBase |
| SysJobCluster | SysJobCluster | 任务集群 | EntityBase |
| SysJobDetail | SysJobDetail | 任务详情 | EntityBase |
| SysJobTrigger | SysJobTrigger | 任务触发器 | EntityBase |
| SysJobTriggerRecord | SysJobTriggerRecord | 任务执行记录 | EntityBase |

### 系统配置

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysConfig | SysConfig | 系统配置 | EntityBase |
| SysDictType | SysDictType | 字典类型 | EntityBase |
| SysDictData | SysDictData | 字典数据 | EntityBase |
| SysSerial | SysSerial | 流水号 | EntityBase |
| SysCodeGen | SysCodeGen | 代码生成配置 | EntityBase |
| SysCodeGenColumn | SysCodeGenColumn | 代码生成列配置 | EntityBase |

### 文件与消息

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysFile | SysFile | 文件管理 | EntityBase |
| SysFileContent | SysFileContent | 文件内容 | EntityBase |
| SysNotice | SysNotice | 公告 | EntityBase |
| SysNoticeUser | SysNoticeUser | 公告用户 | EntityBase |

### 第三方集成

| 实体 | 表名 | 说明 | 基类 |
|------|------|------|------|
| SysOpenAccess | SysOpenAccess | 开放接口授权 | EntityBase |
| SysAlipayAuthInfo | SysAlipayAuthInfo | 支付宝授权 | EntityBase |
| SysAlipayTransaction | SysAlipayTransaction | 支付宝交易 | EntityBase |
| SysWechatUser | SysWechatUser | 微信用户 | EntityBase |
| SysWechatPay | SysWechatPay | 微信支付 | EntityBase |
| SysWechatRefund | SysWechatRefund | 微信退款 | EntityBase |
| SysUserRegWay | SysUserRegWay | 用户注册方式 | EntityBase |

## 核心领域关系

### 用户-角色-菜单 权限链

```
SysUser
  ├── SysUserRole (多对多)
  │     └── SysRole
  │           ├── SysRoleMenu (多对多)
  │           │     └── SysMenu (目录/菜单/按钮)
  │           ├── SysRoleOrg (数据范围)
  │           │     └── SysOrg
  │           ├── SysRoleApi (API 黑名单)
  │           └── SysRoleTable/SysRoleColumn (表/列权限)
  └── SysUserExtOrg (兼职机构)
        └── SysOrg
```

### 多租户隔离

```
SysTenant (租户)
  └── SysUser (TenantId 过滤)
       └── 业务表 (TenantId 自动过滤)
```

### 机构树形结构

```
SysOrg (根机构)
  └── SysOrg (子机构)
       └── SysOrg (孙机构)
            └── ...
```

## ORM 配置

### SqlSugar 特性

```csharp
[SugarTable("SysUser")]  // 表名映射
[SugarIndex("index_user_account", nameof(Account), OrderByType.Desc)]
public class SysUser : EntityBaseTenant
{
    [SugarColumn(ColumnDescription = "账号", Length = 64)]
    public string Account { get; set; }

    [SugarColumn(ColumnDescription = "密码", Length = 128)]
    public string Password { get; set; }

    [SugarColumn(ColumnDescription = "昵称", Length = 64)]
    public string? NickName { get; set; }
}
```

### 全局过滤器

| 过滤器 | 作用 |
|--------|------|
| 软删除过滤 | 自动过滤 `IsDelete = true` 的记录（SuperAdmin 除外） |
| 租户过滤 | 自动按 `TenantId` 过滤当前租户数据 |
| 机构过滤 | 按角色数据范围过滤机构数据 |

### 仓储使用示例

```csharp
// 注入仓储
private readonly SqlSugarRepository<SysUser> _rep;

// 查询
var user = await _rep.GetByIdAsync(id);
var users = await _rep.GetListAsync(u => u.TenantId == tenantId);

// 分页
var page = await _rep.GetPageListAsync(input, p => p.Account.Contains(keyword));

// 新增
await _rep.InsertAsync(user);

// 更新
await _rep.UpdateAsync(user);

// 删除（软删除）
await _rep.DeleteByIdAsync(id);
```
