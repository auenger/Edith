---
name: <company-edith>
description: The unified entry skill for the <company/product> EDITH instance. Use when an agent needs to query company knowledge, route into the right module or source, follow cross-cutting guidance, or maintain the EDITH instance itself.
---

# <Company / Product> EDITH

## Use the right entrypoint first

- business domain questions → `modules/<module>/overview.md`
- source-specific questions → `sources/<source>/README.md`
- cross-domain effects → `cross-cutting/*.md`
- operational helpers → `tools/*`

Do not guess randomly when a stable entrypoint exists.

## Default query path

```text
user task
→ identify module / source / cross-cutting topic
→ read the stable entrypoint
→ read issue / decision / rejection patterns if needed
→ route to repo-local or source-local truth
```

## Work loop

### START
- read the relevant EDITH entrypoint first
- identify source-of-truth locations

### WORK
- do the work in the real source, repo, or workflow surface

### END
- write back durable knowledge to the correct EDITH file
- follow the maintenance guide instead of inventing writeback rules ad hoc

## Maintenance

When maintaining the EDITH instance itself, use the root `MAINTENANCE.md` as the source of truth.
