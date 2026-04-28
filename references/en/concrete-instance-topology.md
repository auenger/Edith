# Concrete Instance Topology

A mature company-specific EDITH instance usually needs more than a root README and a maintenance file.

## Recommended topology

```text
<company>-edith/
├── README.md
├── MAINTENANCE.md
├── modules/
│   └── <module>/
│       ├── overview.md
│       ├── known-issues.md
│       ├── decisions.md
│       ├── rejected-features.md
│       └── test-coverage.md
├── sources/
│   └── <source>/
│       └── README.md
├── cross-cutting/
│   ├── module-interactions.md
│   └── version-changelog.md
├── tools/
│   └── <tooling-docs-or-scripts>
├── skills/
│   └── <company-edith>/
│       └── SKILL.md
└── _raw/ or _exports/
    └── <optional snapshots or exports>
```

## Why each area exists

### `modules/`
Use for business domains or durable capability areas.

Each module should help an agent answer:
- what this area is for,
- what usually goes wrong,
- why it is shaped this way,
- and what has already been rejected.

### `sources/`
Use for source routing, not business capability modeling.

A source directory should tell an agent:
- what this source is,
- how to access it,
- when to use it,
- and what not to confuse it with.

### `cross-cutting/`
Use for knowledge that spans multiple modules.

Typical cross-cutting topics:
- version changes,
- module interactions,
- architecture-wide patterns,
- and system-wide constraints.

### `tools/`
Use when the EDITH instance needs reusable scripts or operating manuals.

Keep only high-signal tools here.
Do not turn this into a generic utility bucket.

### `skills/`
Use for the EDITH entry skill and, where needed, additional company-specific skills that help agents route into the knowledge base.

### `_raw/` or `_exports/`
Optional. Use only when raw snapshots or exports must be preserved for traceability or offline use.
Do not confuse this with the main EDITH knowledge layer.

## Topology principle

A mature EDITH instance is usually a combination of:
- central routing,
- durable business memory,
- source routing,
- cross-cutting synthesis,
- and skill entrypoints.

If one of those layers is missing, the instance may still be useful, but it is not fully mature.
