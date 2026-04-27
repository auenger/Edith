本分片覆盖 [API Contracts]。来自服务: jarvis-repo。

---
type: jarvis-distillate
target_service: "jarvis-repo"
sources:
  - "jarvis-repo/docs/api-endpoints.md"
created: "2026-04-27T13:52:41.963Z"
---

# jarvis-repo — API Contracts

# jarvis-repo - API Endpoints



## Detected Endpoints (0 endpoint files found)


No endpoint-related directories found (routes/, controllers/, handlers/, api/).

## Source Tree


```
JARVIS-e2e-pilot/
├── agent/
│   ├── company-jarvis/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── query.test.ts
│   │   │   └── route.test.ts
│   │   ├── tools/
│   │   │   ├── distill.ts
│   │   │   ├── route.ts
│   │   │   └── scan.ts
│   │   ├── config.ts
│   │   ├── e2e-pilot.ts
│   │   ├── extension.ts
│   │   ├── index.ts
│   │   └── query.ts
│   ├── jarvis.yaml
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── tsconfig.json
├── feature-workflow/
│   ├── templates/
│   │   ├── checklist.md
│   │   ├── project-context.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── config.yaml
│   └── queue.yaml
├── features/
│   ├── active-feat-tool-route/
│   │   └── task.md
│   ├── archive/
│   │   ├── done-feat-agent-scaffold-20260427/
│   │   │   ├── evidence/
│   │   │   ├── checklist.md
│   │   │   ├── spec.md
│   │   │   └── task.md
│   │   ├── done-feat-config-management-20260427/
│   │   │   ├── evidence/
│   │   │   ├── checklist.md
│   │   │   ├── spec.md
│   │   │   └── task.md
│   │   ├── done-feat-extension-core-20260427/
│   │   │   ├── evidence/
│   │   │   ├── checklist.md
│   │   │   ├── spec.md
│   │   │   └── task.md
│   │   ├── done-feat-tool-query-20260427/
│   │   │   ├── evidence/
│   │   │   ├── checklist.md
│   │   │   ├── spec.md
│   │   │   └── task.md
│   │   ├── done-feat-tool-scan-20260427/
│   │   │   ├── evidence/
│   │   │   ├── checklist.md
│   │   │   ├── spec.md
│   │   │   └── task.md
│   │   └── archive-log.yaml
│   ├── pending-feat-e2e-pilot/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── pending-feat-packaging/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── pending-feat-system-prompt/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── pending-feat-tool-distill/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── pending-feat-tool-route/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   ├── pending-feat-tui-branding/
│   │   ├── checklist.md
│   │   ├── spec.md
│   │   └── task.md
│   └── review-report-all.md
├── jarvis-skills/
│   ├── distillator/
│   │   ├── resources/
│   │   │   ├── compression-rules.md
│   │   │   ├── quick-ref-rules.md
│   │   │   └── splitting-strategy.md
│   │   ├── scripts/
│   │   │   └── analyze_sources.py
│   │   └── SKILL.md
│   ├── document-project/
│   │   ├── templates/
│   │   │   ├── api-contracts-template.md
│   │   │   ├── data-models-template.md
│   │   │   ├── deep-dive-template.md
│   │   │   └── index-template.md
│   │   └── SKILL.md
│   ├── requirement-router/
│   │   └── SKILL.md
│   ├── INTEGRATION.md
│   └── README.md
├── references/
│   ├── en/
│   │   ├── adoption-guide.md
│   │   ├── anti-patterns.md
│   │   ├── company-adaptation.md
│   │   ├── concrete-instance-topology.md
│   │   ├── detailed-maintenance-contracts.md
│   │   ├── example-pilot-shape.md
│   │   ├── instance-generation-contract.md
│   │   ├── instance-readiness.md
│   │   ├── positioning.md
│   │   ├── repo-skills.md
│   │   ├── rollout-and-ownership.md
│   │   ├── source-skills.md
│   │   ├── workflow-skills.md
│   │   └── write-contracts.md
│   └── zh/
│       ├── adoption-guide.md
│       ├── anti-patterns.md
│       ├── company-adaptation.md
│       ├── concrete-instance-topology.md
│       ├── detailed-maintenance-contracts.md
│       ├── example-pilot-shape.md
│       ├── instance-generation-contract.md
│       ├── instance-readiness.md
│       ├── positioning.md
│       ├── repo-skills.md
│       ├── rollout-and-ownership.md
│       ├── source-skills.md
│       ├── workflow-skills.md
│       └── write-contracts.md
├── templates/
│   ├── en/
│   │   ├── company-jarvis-skill-stub.md
│   │   ├── decisions.md
│   │   ├── instance-skeleton.md
│   │   ├── jarvis-build-brief.md
│   │   ├── known-issues.md
│   │   ├── maintenance.md
│   │   ├── module-interactions.md
│   │   ├── module-overview.md
│   │   ├── ownership-map.md
│   │   ├── quick-ref-card.md
│   │   ├── raw-exports-readme.md
│   │   ├── rejected-features.md
│   │   ├── repo-inventory.md
│   │   ├── repo-skill-stub.md
│   │   ├── rollout-confirmation-checklist.md
│   │   └── ... (12 more)
│   └── zh/
│       ├── company-jarvis-skill-stub.md
│       ├── decisions.md
│       ├── instance-skeleton.md
│       ├── jarvis-build-brief.md
│       ├── known-issues.md
│       ├── maintenance.md
│       ├── module-interactions.md
│       ├── module-overview.md
│       ├── ownership-map.md
│       ├── quick-ref-card.md
│       ├── raw-exports-readme.md
│       ├── rejected-features.md
│       ├── repo-inventory.md
│       ├── repo-skill-stub.md
│       ├── rollout-confirmation-checklist.md
│       └── ... (12 more)
├── CLAUDE.md
├── JARVIS-PRODUCT-DESIGN.md
├── project-context.md
├── README.md
├── README.zh.md
├── SCALABILITY-ANALYSIS.md
└── SKILL.md
```

