# Feature: feat-phase3 EDITH Phase 3 知识生态

## Basic Information
- **ID**: feat-phase3
- **Name**: EDITH Phase 3 知识生态（治理 + Board 闭环）
- **Priority**: 85
- **Size**: L
- **Dependencies**: []
- **Parent**: null
- **Children**: [feat-p3-obsidian-vault, feat-p3-governance-engine, feat-p3-board-ecosystem]
- **Created**: 2026-05-05

## Description
将 EDITH 从"知识生产工具"升级为"知识生态飞轮"。以已完成的 Obsidian Vault 为基础，构建 Agent 治理引擎 + Board 生态可视化，形成"Agent 生产 → Vault 存储 → 治理追踪 → Board 可视化 → 人类决策 → Agent 更好上下文"的自增强闭环。

## 生态飞轮

```text
                    ┌──────────────┐
                    │  EDITH Agent │ ← 更好的上下文
                    │  (Producer)  │
                    └──────┬───────┘
                           │ edith_scan / edith_distill
                           ▼
                    ┌──────────────┐
                    │  Knowledge   │ ← 三层产物 + Frontmatter
                    │  Base (Vault)│
                    └──────┬───────┘
                           │ 状态追踪 + 健康评估
                           ▼
                    ┌──────────────┐
                    │  Governance  │ ← 生命周期 + 矛盾检测
                    │  Engine      │
                    └──────┬───────┘
                           │ 治理数据 API
                           ▼
                    ┌──────────────┐
                    │  EDITH Board │ ← 健康度面板 + 状态标签
                    │  (Visualizer)│
                    └──────┬───────┘
                           │ 可视化驱动决策
                           ▼
                    ┌──────────────┐
                    │  Human       │ ← 审阅 + 确认 + 决策
                    │  (Decider)   │
                    └──────┬───────┘
                           │ 确认/修正/决策
                           └──────→ Agent (更好的上下文)
```

## Children Overview

### 1. feat-p3-obsidian-vault (已完成 ✓)
**角色**: 知识持久化基础层
**产出**: vault-structure.ts / frontmatter.ts / wikilinks.ts / edit-detector.ts / obsidian.ts

### 2. feat-p3-governance-engine (新设计)
**角色**: Agent 侧治理引擎
**范围**: 知识生命周期状态机 + 矛盾检测 + 健康度评分 + CLI 命令
**依赖**: feat-p3-obsidian-vault (已完成)
**详见**: features/pending-feat-p3-knowledge-governance/spec.md

### 3. feat-p3-board-ecosystem (新设计)
**角色**: Board 生态可视化 + 飞轮闭环
**范围**: Dashboard 治理面板 + Explorer Vault 视图 + 治理 API + WebSocket 推送
**依赖**: feat-p3-governance-engine + feat-board-redesign
**详见**: features/pending-feat-p3-board-ecosystem/spec.md

## 生态数据流

```text
Agent 侧:
  edith distill → frontmatter.ts 注入状态 → vault-structure.ts 写入 Vault
  edith distill --refresh → edit-detector.ts 检测变更 → governance 判断状态转换
  edith governance status → 生命周期统计 → 健康度评分

Board 侧:
  GET /api/governance/health → 健康度面板
  GET /api/governance/lifecycle → 生命周期分布
  GET /api/vault/tree → Vault 目录浏览（治理状态标签）
  WS governance:update → 实时治理事件推送

飞轮闭环:
  Board 显示 stale 片段 → 人类决定 re-scan → Agent 执行 edith scan → 新产物进入 scaffold → Board 显示待审阅
```
