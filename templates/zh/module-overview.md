# [Domain / Module] 概览

## 在业务中的角色

用 2-4 句话说明：
- 这个领域或 module 是做什么的，
- 谁依赖它，
- 它为什么在更大的系统里重要。

## Source-of-truth 位置

| Kind | Location | Notes |
|---|---|---|
| code | `<repo/path>` | `<notes>` |
| docs | `<source>` | `<notes>` |
| issues | `<tracker/query>` | `<notes>` |
| tests | `<repo/path>` | `<notes>` |

## 关键概念

- **`<concept>`** — `<explanation>`
- **`<concept>`** — `<explanation>`

## Interfaces 与 touchpoints

- API / contract: `<endpoint/schema/event>`
- UI / route: `<route/surface>`
- Upstream dependency: `<dependency>`
- Downstream dependency: `<dependency>`

## Operational clues

- likely owners: `<owners>`
- common failure areas: `<areas>`
- related workflow(s): `<workflow>`

## Notes

- 保持高信号、偏路由导向。
- 深层 bug patterns 应放在 `known-issues.md`。
- 持久选择应放在 `decisions.md`。
