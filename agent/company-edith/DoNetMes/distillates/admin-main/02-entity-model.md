# DoNetMes 实体模型

## 实体基类层次
```
EntityBaseId (雪花ID主键)
├── Id: long [主键, 雪花算法]
│
└── EntityBase (审计 + 软删除)
    ├── CreateTime: DateTime
    ├── UpdateTime: DateTime?
    ├── CreateUserId: long?
    ├── CreateUserName: string?
    ├── UpdateUserId: long?
    ├── UpdateUserName: string?
    ├── IsDelete: bool [软删除]
    ├── DeleteTime: DateTime?
    │
    ├── EntityBaseData (+ 数据权限)
    │   ├── CreateOrgId: long? [机构过滤]
    │   ├── CreateOrgName: string?
    │   │
    │   └── EntityBaseUpdateData
    │       ├── UpdateOrgId: long?
    │       └── UpdateOrgName: string?
    │
    ├── EntityTenant (+ 租户隔离)
    │   └── TenantId: long? [租户过滤]
    │
    └── EntityTenantBaseData (+ 租户 + 数据权限)
        ├── TenantId: long?
        └── CreateOrgId: long?
```

## 核心实体清单

### 权限体系
| 实体 | 表名 | 继承基类 | 关键字段 |
|------|------|----------|----------|
| SysUser | sys_user | EntityTenantBaseData | Account, Password, RealName, Phone, Email, OrgId, PosId, AccountType, Status |
| SysRole | sys_role | EntityTenant | Name, Code, DataScope, OrderNo, Status |
| SysMenu | sys_menu | EntityBase | Pid, Title, Path, Name, Component, Icon, Type, Permission, IsAffix, IsKeepAlive |
| SysOrg | sys_org | EntityTenant | Pid, Name, Code, Tel, Leader, Email, Status |
| SysPos | sys_pos | EntityTenant | Name, Code, OrderNo |
| SysTenant | sys_entity | EntityBase | UserId, OrgId, Host, ExpirationTime, UserCount, TenantType, DbType, Connection |

### 关联表
| 实体 | 表名 | 用途 |
|------|------|------|
| SysUserRole | sys_user_role | 用户-角色关联 |
| SysRoleMenu | sys_role_menu | 角色-菜单关联 |
| SysRoleOrg | sys_role_org | 角色-机构关联 |
| SysUserExtOrg | sys_user_ext_org | 用户兼职机构 |
| SysRoleDataPerm | sys_role_data_perm | 角色数据权限 |
| SysRoleTable | sys_role_table | 角色表权限 |
| SysRoleApi | sys_role_api | 角色API权限 |
| SysUserMenu | sys_user_menu | 用户菜单权限 |

### 系统管理
| 实体 | 用途 |
|------|------|
| SysConfig | 系统配置项 |
| SysDictType / SysDictData | 字典类型/数据 |
| SysNotice / SysNoticeUser | 通知公告 |
| SysFile / SysFileContent | 文件管理 |
| SysSerial | 序列号生成 |

### 日志体系
| 实体 | 用途 |
|------|------|
| SysLogOp | 操作日志 |
| SysLogEx | 异常日志 |
| SysLogHttp | HTTP请求日志 |
| SysLogVis | 访问日志 |
| SysLogDiff | 数据变更日志 |
| SysLogEvent | 事件日志 |
| SysLogMsg | 消息日志 |

### 定时任务
| 实体 | 用途 |
|------|------|
| SysJobDetail | 任务详情 |
| SysJobTrigger | 任务触发器 |
| SysJobTriggerRecord | 触发记录 |
| SysJobCluster | 集群配置 |

## SysUser 实体详解
```csharp
public class SysUser : EntityBaseData
{
    [SugarColumn(Length = 64)]
    public string Account { get; set; }          // 账号
    
    [SugarColumn(Length = 128)]
    public string Password { get; set; }         // 密码(加密)
    
    [SugarColumn(Length = 32)]
    public string RealName { get; set; }         // 姓名
    
    [SugarColumn(Length = 16)]
    public string Phone { get; set; }            // 手机
    
    [SugarColumn(Length = 64)]
    public string Email { get; set; }            // 邮箱
    
    public long? OrgId { get; set; }             // 主机构ID
    public long? PosId { get; set; }             // 职位ID
    
    public AccountTypeEnum AccountType { get; set; }  // 账号类型
    public GenderEnum Gender { get; set; }            // 性别
    public StatusEnum Status { get; set; }            // 状态
    
    [SugarColumn(Length = 512)]
    public string Avatar { get; set; }           // 头像
    
    [SugarColumn(Length = 512)]
    public string Signature { get; set; }        // 签名
    
    public DateTime? LastLoginTime { get; set; } // 最后登录时间
    
    [SugarColumn(Length = 64)]
    public string LastLoginIp { get; set; }      // 最后登录IP
    
    [SugarColumn(Length = 64)]
    public string NickName { get; set; }         // 昵称
    
    public int? LoginCount { get; set; }         // 登录次数
    
    // 导航属性
    [Navigate(NavigateType.OneToOne, nameof(OrgId))]
    public virtual SysOrg SysOrg { get; set; }
}
```

## SysMenu 实体详解
```csharp
public class SysMenu : EntityBase
{
    public long Pid { get; set; }                // 父菜单ID
    
    [SugarColumn(Length = 64)]
    public string Title { get; set; }            // 标题
    
    [SugarColumn(Length = 128)]
    public string Path { get; set; }             // 路由地址
    
    [SugarColumn(Length = 64)]
    public string Name { get; set; }             // 路由名称
    
    [SugarColumn(Length = 128)]
    public string Component { get; set; }        // 组件路径
    
    [SugarColumn(Length = 64)]
    public string Icon { get; set; }             // 图标
    
    public MenuTypeEnum Type { get; set; }       // 菜单类型
    
    [SugarColumn(Length = 128)]
    public string Permission { get; set; }       // 权限标识
    
    public bool IsAffix { get; set; }            // 是否固定
    public bool IsKeepAlive { get; set; }        // 是否缓存
    public StatusEnum Status { get; set; }       // 状态
    
    // 导航属性
    [Navigate(NavigateType.OneToMany, nameof(Pid))]
    public List<SysMenu> Children { get; set; }
}
```

## 实体过滤器接口
```csharp
// 租户过滤
public interface ITenantIdFilter
{
    long? TenantId { get; set; }
}

// 数据权限过滤
public interface IOrgIdFilter
{
    long? CreateOrgId { get; set; }
}

// 软删除过滤
public interface IDeletedFilter
{
    bool IsDelete { get; set; }
}
```

---
*来源: Admin.NET.Core/Entity 目录分析*
