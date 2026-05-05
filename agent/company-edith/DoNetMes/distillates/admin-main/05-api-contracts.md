# DoNetMes API 契约

## API 路由规则
- 基础路径: `/api/`
- 自动生成: Service 名称去掉 `Service` 后缀，转 camelCase
- 示例: `SysUserService` → `/api/sysUser/`

## API 方法映射
| Service 方法 | HTTP方法 | API路径 |
|--------------|----------|---------|
| GetList | GET | /api/{module}/list |
| Page | GET | /api/{module}/page |
| GetDetail | GET | /api/{module}/detail |
| Add | POST | /api/{module}/add |
| Update | POST | /api/{module}/update |
| Delete | POST | /api/{module}/delete |

## 认证接口

### 登录
```
POST /api/sysAuth/login
Content-Type: application/json

Request:
{
  "account": "admin",           // 账号 (必填)
  "password": "123456",         // 密码 (必填)
  "tenantId": 0,                // 租户ID (默认0)
  "codeId": "uuid",             // 验证码ID
  "code": "1234"                // 验证码
}

Response:
{
  "success": true,
  "code": 200,
  "data": {
    "accessToken": "eyJhbG...",  // JWT Token
    "refreshToken": "...",        // 刷新Token
    "expireIn": 7200              // 过期时间(秒)
  }
}
```

### 退出登录
```
GET /api/sysAuth/logout
Authorization: Bearer {token}
```

## 用户接口

### 用户分页
```
GET /api/sysUser/page?page=1&pageSize=20&account=admin&realName=管理员
Authorization: Bearer {token}

Response:
{
  "data": {
    "items": [
      {
        "id": 1234567890,
        "account": "admin",
        "realName": "管理员",
        "phone": "13800138000",
        "email": "admin@example.com",
        "orgName": "总公司",
        "posName": "总经理",
        "roleName": "超级管理员",
        "status": 0,
        "createTime": "2024-01-01 00:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 新增用户
```
POST /api/sysUser/add
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "account": "zhangsan",          // 账号 (必填)
  "realName": "张三",             // 姓名 (必填)
  "password": "123456",           // 密码 (可选，有默认)
  "phone": "13800138001",         // 手机
  "email": "zhangsan@example.com",// 邮箱
  "orgId": 1234567890,            // 机构ID (必填)
  "posId": 1234567891,            // 职位ID
  "accountType": 3,               // 账号类型 (3=普通用户)
  "gender": 1,                    // 性别 (1=男)
  "roleIdList": [1, 2],           // 角色ID列表
  "extOrgIdList": [3, 4],         // 兼职机构ID列表
  "domainAccount": "zhangsan"     // 域账号
}

Response:
{
  "data": 1234567892  // 新增用户ID
}
```

## 角色接口

### 角色分页
```
GET /api/sysRole/page?page=1&pageSize=20&name=管理员
Authorization: Bearer {token}
```

### 授权菜单
```
POST /api/sysRole/grantMenu
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "id": 1234567890,               // 角色ID
  "menuIdList": [1, 2, 3, 4]     // 菜单ID列表
}
```

### 授权数据范围
```
POST /api/sysRole/grantDataScope
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "id": 1234567890,               // 角色ID
  "dataScope": 3,                 // 数据范围 (1=全部,2=自定义,3=本机构及以下,4=仅本机构,5=仅本人)
  "orgIdList": [1, 2]             // 自定义机构ID列表 (dataScope=2时使用)
}
```

## 机构接口

### 机构树
```
GET /api/sysOrg/list
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": 1234567890,
      "pid": 0,
      "name": "总公司",
      "code": "ROOT",
      "children": [
        {
          "id": 1234567891,
          "pid": 1234567890,
          "name": "技术部",
          "code": "TECH",
          "children": []
        }
      ]
    }
  ]
}
```

## 菜单接口

### 登录菜单树
```
GET /api/sysMenu/getLoginMenuTree
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": 1310000000101,
      "pid": 0,
      "title": "系统管理",
      "path": "/system",
      "name": "system",
      "component": "Layout",
      "icon": "ele-Setting",
      "type": 1,
      "children": [
        {
          "id": 1310000000111,
          "pid": 1310000000101,
          "title": "账号管理",
          "path": "/system/user",
          "name": "sysUser",
          "component": "/system/user/index",
          "icon": "ele-User",
          "type": 2,
          "children": []
        }
      ]
    }
  ]
}
```

## 租户接口

### 租户分页
```
GET /api/sysTenant/page?page=1&pageSize=20
Authorization: Bearer {token}
```

## 通用响应格式
```json
{
  "success": true,        // 是否成功
  "code": 200,            // 状态码
  "message": "操作成功",   // 消息
  "data": {},             // 数据
  "extras": {},           // 扩展数据
  "timestamps": 1234567890 // 时间戳
}
```

## 错误码规范
| 范围 | 说明 |
|------|------|
| D0001-D0999 | 认证授权错误 |
| D1000-D1999 | 用户相关错误 |
| D2000-D2999 | 角色相关错误 |
| D3000-D3999 | 机构相关错误 |
| D4000-D4999 | 菜单相关错误 |
| Z1000-Z1999 | 租户相关错误 |

## 分页参数
```json
{
  "page": 1,              // 页码
  "pageSize": 20,         // 每页条数
  "keyword": "",          // 搜索关键词
  "orderBy": "id",        // 排序字段
  "orderDir": "desc"      // 排序方向
}
```

---
*来源: Admin.NET.Core/Service API 分析*
