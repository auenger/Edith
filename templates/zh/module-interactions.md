# 模块交互

| Module A | Module B | Relationship | Typical impact or failure shape | Notes |
|---|---|---|---|---|
| `<module-a>` | `<module-b>` | `<depends on / feeds / configures / renders / gates>` | `<impact>` | `<notes>` |

## Notes

- 这个文件用于记录跨 module 的因果关系，而不是重复 module overviews。
- 优先记录稳定的依赖关系与 blast-radius 线索，而不是临时实现细节。
