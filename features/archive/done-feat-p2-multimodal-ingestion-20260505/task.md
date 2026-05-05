# Tasks: feat-p2-multimodal-ingestion

## Task Breakdown

### 1. 配置模型扩展
- [x] 在 `agent/src/config.ts` 新增 `MultimodalConfig` 接口
- [x] 新增 `IngestionConfig` 和 `MarkItDownConfig` 接口
- [x] 更新 `EdithConfig` 接口，添加 multimodal 和 ingestion 字段
- [x] 更新 edith.yaml 配置校验逻辑，确保向后兼容

### 2. MarkItDown 集成
- [x] 将 MarkItDown Python 包封装为 edith_scan 的子模块
- [x] 实现格式检测路由：根据文件扩展名选择处理管道
- [x] 实现 PDF 摄入管道（MarkItDown + OCR）
- [x] 实现 Office 摄入管道（Word/Excel/PPT）
- [x] 实现图片摄入管道（LLM Vision 语义描述）

### 3. 多模态模型接入
- [x] 支持 OpenAI Vision 模型（gpt-4o）
- [x] 支持 Anthropic Vision 模型
- [x] 支持本地部署 Vision（Ollama / vLLM）
- [x] OCR 插件集成（Azure / Tesseract）

### 4. edith_scan 扩展
- [x] 在 edith_scan 工具中添加多模态摄入路由
- [x] 处理结果统一进入蒸馏管道
- [x] 错误处理：不支持的格式优雅跳过

### 5. 集成测试
- [x] PDF 摄入 E2E 测试
- [x] Office 文档摄入测试
- [x] 图片 LLM Vision 摄入测试
- [x] 配置兼容性测试

## Progress Log
| Date | Progress | Notes |
|------|----------|-------|
| 2026-04-29 | Feature created | 初始拆分 |
| 2026-05-05 | Spec enriched | Reference Code: 5 files, Related Features: 4 (含 3 个已完成归档) |
| 2026-05-05 | Implementation complete | All 5 tasks done. New: ingest.ts (470 lines), ingest.test.ts (340 lines). Modified: config.ts, scan.ts, extension.ts |
