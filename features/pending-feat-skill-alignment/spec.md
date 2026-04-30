# Feature: feat-skill-alignment Skill 能力对齐

## Basic Information

* **ID**: feat-skill-alignment

* **Name**: Skill 能力对齐（agent/ 内置实现 → edith-skills/ 完整设计）

* **Priority**: 90

* **Size**: L

* **Dependencies**: []

* **Parent**: null

* **Children**:

  * feat-skill-align-scan

  * feat-skill-align-distill

  * feat-skill-align-route

* **Created**: 2026-04-29

## Description

将 agent/src/tools/ 中的内置 skill 实现（scan/distill/route）对齐到 edith-skills/ 目录中的完整版 SKILL.md 设计能力。当前 agent 中的工具是 MVP 阶段的简化实现，缺失大量核心分析能力。

## User Value Points

1. **深度代码考古**：scan 从"文件计数器"升级为真正的代码考古器，能提取 API 契约、数据模型、业务逻辑

2. **高质量知识蒸馏**：distill 从基础过滤升级为无损压缩引擎，支持冲突检测、跨文档分析、往返验证

3. **精准需求路由**：route 从基础关键词匹配升级为多维度信号分析引擎

## Context Analysis

### Gap Summary

| Skill         | 差距级别      | 主要缺失能力                                                 |
| ------------- | --------- | ------------------------------------------------------ |
| edith_scan    | **MAJOR** | 项目类型检测、架构模式识别、API 契约提取、数据模型分析、业务逻辑发现、模块 Deep Dive、增量扫描 |
| edith_distill | **MAJOR** | 无损压缩、源文档冲突检测、跨文档分析、往返验证、自动分组                           |
| edith_route   | MINOR     | 复杂度分析、multi-service 独立策略、紧急事件特殊处理                      |

### Reference Code

* agent/src/tools/scan.ts — 当前 scan 实现（~837 行）

* agent/src/tools/distill.ts — 当前 distill 实现（~1095 行）

* agent/src/tools/route.ts — 当前 route 实现（~903 行）

* edith-skills/document-project/SKILL.md — scan 完整设计

* edith-skills/distillator/SKILL.md — distill 完整设计

* edith-skills/requirement-router/SKILL.md — route 完整设计

### Related Documents

* edith-skills/document-project/templates/ — 4 个输出模板

* edith-skills/distillator/resources/ — 压缩规则 + 分片策略 + quick-ref 规则

* edith-skills/INTEGRATION.md — Skill 融合方案

### Related Features

* feat-tool-scan (completed) — 初版 scan 实现

* feat-tool-distill (completed) — 初版 distill 实现

* feat-tool-route (completed) — 初版 route 实现

## Technical Solution

按子 feature 分别实现，详见各子 feature spec。

## Acceptance Criteria (Gherkin)

### User Story

作为 EDITH 用户，我希望 agent 中的 skill 能力与完整设计对齐，以便生成更高质量的知识产物。

### Scenarios (Given/When/Then)

#### Scenario 1: Scan 深度分析

* Given 一个 Spring Boot 项目

* When 用户执行 edith_scan

* Then 输出包含：项目类型、架构模式、API 端点详情（method/path/purpose）、数据模型定义、业务流程、带注解的源码树、开发指南

#### Scenario 2: Distill 无损压缩

* Given 一个已扫描的服务（含多个源文档）

* When 用户执行 edith_distill

* Then 蒸馏产物保留所有事实信息，压缩比 >= 3:1，无冲突或冲突已标注

#### Scenario 3: Route 精准路由

* Given 一个跨服务需求

* When 用户执行 edith_route

* Then 返回 multi-service 策略，包含复杂度分析和每个服务的加载建议

### General Checklist

* [ ] 所有子 feature 完成
* [ ] 现有测试不回归
* [ ] 端到端流程验证通过

⠀