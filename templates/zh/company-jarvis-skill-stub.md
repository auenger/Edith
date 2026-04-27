---
name: <company-jarvis>
description: 面向 <company/product> JARVIS instance 的统一入口 skill。当 agent 需要查询公司知识、路由到正确的 module 或 source、遵循 cross-cutting guidance，或维护 JARVIS instance 本身时使用。
---

# <Company / Product> JARVIS

## 先使用正确的入口

- 业务领域问题 → `modules/<module>/overview.md`
- source-specific 问题 → `sources/<source>/README.md`
- 跨领域影响 → `cross-cutting/*.md`
- 操作辅助工具 → `tools/*`

当稳定入口存在时，不要随机猜。

## 默认查询路径

```text
user task
→ 识别 module / source / cross-cutting topic
→ 阅读稳定入口
→ 如有需要，阅读 issue / decision / rejection patterns
→ 路由到 repo-local 或 source 内事实
```

## 工作闭环

### START
- 先阅读相关的 JARVIS 入口
- 识别 权威来源 locations

### WORK
- 在真实的 source、repo 或 workflow surface 中完成工作

### END
- 把可持续复用的知识写回正确的 JARVIS 文件
- 遵循 maintenance guide，不要临时发明 回写 规则

## 维护

当维护 JARVIS instance 本身时，以根目录的 `MAINTENANCE.md` 作为 权威来源。
