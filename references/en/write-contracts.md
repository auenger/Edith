# Write Contracts

Generated EDITH artifacts should be opinionated about what belongs where.

## Global contract

1. **Index, don’t dump.** Summaries, patterns, and routing clues are preferred over raw content duplication.
2. **One home per truth.** Route to the best source of truth instead of creating many half-truths.
3. **Separate method from company truth.** Reusable instructions and company-specific facts must be distinguishable.
4. **Prefer durable knowledge.** Capture knowledge that will help future agents and owners, not transient chatter.
5. **Write for continuation.** Another agent or owner should be able to continue without rediscovering basics.

## Artifact contracts

### Build brief
Should contain:
- business intent
- scope
- first valuable loop
- assumptions
- risks
- next step

Should not contain:
- a fake sense of finality
- exhaustive discovery for the entire company

### Source inventory
Should contain:
- important sources
- owners
- access paths
- candidate source skills
- relevance and priority

Should not contain:
- copied raw source content

### Repo inventory
Should contain:
- repo role
- owners
- entrypoints
- current source-of-truth locations
- candidate repo skills

Should not contain:
- deep repo-local procedures that belong with the repo skill

### Workflow inventory
Should contain:
- triggers
- repos and teams involved
- artifacts
- success evidence
- candidate workflow skills

Should not contain:
- step-by-step repo-local instructions for every repo involved

### Skill backlog
Should contain:
- layer
- target
- owner
- priority
- readiness
- notes

Should not contain:
- vague “someday” items with no rationale

### MAINTENANCE guide
Should contain:
- mission
- scope
- access paths
- write contracts
- update triggers
- ownership
- closed-loop maintenance rules

Should not contain:
- low-signal operational trivia with no effect on continuation
