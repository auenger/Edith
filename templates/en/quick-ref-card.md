---
type: edith-quick-ref
layer: 1
target_service: "<service-name>"
sources:
  - "<relative/path/to/source1.md>"
  - "<relative/path/to/source2.md>"
created: "<date>"
token_budget: 2000
---

# <Service Name> Quick-Ref

## Verify

- Build: `<exact build command>`
- Test: `<exact test command>`
- Run: `<exact run command>`
- Lint: `<exact lint command>`

## Key Constraints

- <constraint 1 — what breaks if violated>
- <constraint 2>
- <constraint 3>
- <constraint 4>
- <constraint 5>

## Pitfalls

- <symptom> — <root cause>
- <symptom> — <root cause>
- <symptom> — <root cause>
- <symptom> — <root cause>
- <symptom> — <root cause>

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/<resource> | <one-line description> |
| POST | /api/v1/<resource> | <one-line description> |
| PUT | /api/v1/<resource>/:id | <one-line description> |
| DELETE | /api/v1/<resource>/:id | <one-line description> |

## Data Models

- <ModelA>: <purpose>. Key fields: <field1>, <field2>, <field3>
- <ModelB>: <purpose>. Key fields: <field1>, <field2>
- <ModelC>: <purpose>. Key fields: <field1>, <field2>

## Deep Dive

- API contracts: `distillates/<service>/02-api-contracts.md`
- Data models: `distillates/<service>/03-data-models.md`
- Business logic: `distillates/<service>/04-business-logic.md`
- Architecture: `distillates/<service>/01-overview.md`

## Notes

- This card covers ~80% of daily development tasks
- For detailed schemas, design decisions, or rejected alternatives, load the relevant Deep Dive fragment
- This file must stay under 2000 tokens
- Regenerate with: `distillator --quick-ref --edith-mode=repo-skill <source-docs>`
