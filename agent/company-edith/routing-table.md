---
name: company-edith-routing-table
description: Layer 0 routing table. Always loaded. Maps services to one-line descriptions and key constraints.
layer: 0
---

# Service Routing Table

## Services

| Service | Role | Stack | Owner | Key Constraints |
|---------|------|-------|-------|-----------------|
| LiteMes | LiteMes (PCB Lightweight MES System) is a manufacturing execution system designed for PCB (Printed Circuit Board) factories. It provides master data management, production tracking, equipment management, and supply chain capabilities through a modern web application. |  | TBD |  |

## Quick-Ref Paths

| Service | Quick-Ref (Layer 1) | Full Distillates (Layer 2) |
|---------|---------------------|----------------------------|
| LiteMes | LiteMes/quick-ref.md | LiteMes/distillates/ |

## Loading Rules

- Layer 0 (this file): always loaded -- identify which services a task touches
- Layer 1 (quick-ref): load when task enters a specific service
- Layer 2 (distillate fragments): load specific fragment when implementing a detail