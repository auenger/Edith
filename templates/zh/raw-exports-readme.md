# 原始导出边界

这个目录是可选的，应该谨慎使用。

## Purpose

仅当原始快照或导出物对以下目标有必要时，才使用 `_raw/` 或 `_exports/`：
- 可追溯性
- 离线分析
- 受监管场景下的证据保留
- 保存难以重新获取的 source material

## Boundary rules

- 把这里视为存储层，而不是主知识层
- 不要把原始导出物与 EDITH summaries 或 routing docs 混淆
- 保持主 EDITH 文件轻量且偏综合
- 在可能时记录 provenance：source、日期、方法、owner

## 需要捕获的最小元数据

| Field | Value |
|---|---|
| source | `<source>` |
| export date | `<date>` |
| export method | `<tool / command>` |
| owner | `<owner>` |
| caveats | `<notes>` |
