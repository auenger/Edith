# Checklist: feat-excavate-code-deep

## Completion Checklist

### Development
- [x] 代码阅读策略增强
- [x] 签名提取器实现（多语言）
- [x] 依赖图构建器实现
- [x] 模式识别器实现

### Code Quality
- [x] 多语言支持覆盖 TS/Go/Python/Java
- [x] 大文件分批处理不溢出上下文
- [x] 签名提取不遗漏 public API

### Testing
- [x] TypeScript 项目签名提取验证
- [x] 依赖图准确性验证
- [x] 模式识别验证
- [x] 与 MD 挖掘合并验证

### Documentation
- [x] spec.md technical solution filled
- [x] SKILL.md Step 3 和 Step 4 更新

## Verification Record

| Timestamp | Status | Details |
|-----------|--------|---------|
| 2026-04-30T14:00 | PASS | TypeScript 编译通过，3/3 Gherkin 场景通过代码分析验证 |

### Gherkin Scenario Results

| Scenario | Status | Evidence |
|----------|--------|----------|
| 接口签名提取 | PASS | extractTsSignatures + extractGoSignatures + extractPySignatures + extractJavaSignatures |
| 依赖图构建 | PASS | buildDependencyGraph → edges + nodes, inDegree sorting, resolveImport |
| 错误处理模式提取 | PASS | detectErrorPatterns: XxxError class/throw counting, detectDesignPatterns |

### Code Quality
- TypeScript: 0 errors
- Files changed: 2 (scan.ts, SKILL.md)
- New exports: extractSignatures, buildDependencyGraph, detectCodePatterns, FunctionSignature, TypeDefinition, DependencyEdge, DependencyNode, CodePattern
- Languages: TypeScript/JS, Go, Python, Java
