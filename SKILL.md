# Create EDITH Skill

Build a company-specific EDITH as an agent operating system, not as a document dump.

**This&#x20;**`SKILL.md`**&#x20;is the golden path.**\
Use `references/en/` only to support a specific step here. Use `templates/en/` only to produce the artifacts required by a step here.\
Chinese materials under `references/zh/` and `templates/zh/` are human-facing mirrors and helpers; they do not replace this main route.

## What success looks like

A successful first pass does **not** mean "the whole company is mapped".\
It means:

* one real business loop is chosen,

* the sources, repos, and workflows for that loop are mapped,

* a company-specific EDITH skeleton exists,

* the right source / repo / workflow skill stubs exist,

* humans have confirmed the truth-bearing fields,

* and the result is ready for a real pilot.

## The Golden Path

Do the phases in order.\
Do not skip the stop conditions.\
Do not present scaffolding as mature knowledge.

```text
1. CLARIFY
2. INVENTORY
3. CLASSIFY
4. SCAFFOLD
5. BOOTSTRAP SKILLS
6. CONFIRM
7. PILOT-READY HANDOFF
8. GROW BY WRITEBACK
```

***

## Phase 1 — CLARIFY

### Goal

Define why this company needs EDITH and which first closed loop is worth proving.

### Output

Create:

* `templates/en/edith-build-brief.md`

The build brief must state:

* business intent

* target users

* first valuable loop

* success signal

* current rollout scope

### Must confirm with humans

* why EDITH is being built now

* which first workflow to prove

* what success looks like

* what is explicitly out of scope for now

### Stop if

* the first valuable loop is still vague

* success is described as “better knowledge” with no concrete operating scenario

* the scope is drifting toward “map the whole company” before a pilot exists

### Read only if needed

* `references/en/positioning.md`

* `references/en/adoption-guide.md`

* `references/en/example-pilot-shape.md`

***

## Phase 2 — INVENTORY

### Goal

Map only the real operating surface needed for the first loop.

### Output

Create:

* `templates/en/source-inventory.md`

* `templates/en/repo-inventory.md`

* `templates/en/workflow-inventory.md`

Capture only the sources, repos, and workflows required for the pilot.

### Must confirm with humans

* source names and owners

* repo roles and maintainers

* source-of-truth locations

* workflow boundaries and handoffs

* access constraints that affect execution

### Stop if

* owners are guessed

* repo roles are inferred but unconfirmed

* workflow boundaries are still generic software lore rather than company reality

### Read only if needed

* `references/en/company-adaptation.md`

* `references/en/repo-skills.md`

* `references/en/source-skills.md`

* `references/en/workflow-skills.md`

***

## Phase 3 — CLASSIFY

### Goal

Separate what may be scaffolded now from what requires human confirmation and what must grow later through real use.

### Output

Classify intended artifacts into three buckets:

1. safe to scaffold automatically

2. requires human confirmation

3. must emerge through real START → WORK → END writeback

Use this to decide what the generator is allowed to produce in the next phases.

### Must confirm with humans

* any truth-bearing field that the agent is about to freeze into documents

* any ownership assignment

* any workflow or routing rule that affects real operations

### Stop if

* you are about to generate fake historical content

* you are about to treat placeholders as settled truth

* you are about to create detailed known issues / decisions / rejected features from speculation

### Read

* `references/en/instance-generation-contract.md`

* `references/en/instance-readiness.md`

***

## Phase 4 — SCAFFOLD

### Goal

Generate the minimum company-specific EDITH structure needed to support the pilot.

### Output

Generate the core skeleton as needed for the pilot:

* root README

* MAINTENANCE guide

* module skeletons

* source routing skeletons

* cross-cutting skeletons

* tools index skeleton

* optional raw/export boundary notes

* company EDITH entry skill stub

Typical templates:

* `templates/en/root-readme.md`

* `templates/en/maintenance.md`

* `templates/en/module-overview.md`

* `templates/en/source-readme.md`

* `templates/en/module-interactions.md`

* `templates/en/version-changelog.md`

* `templates/en/tools-readme.md`

* `templates/en/raw-exports-readme.md`

* `templates/en/company-edith-skill-stub.md`

* `templates/en/instance-skeleton.md`

### Must confirm with humans

* whether the proposed topology matches the company’s real shape

* whether `_raw/` / `_exports/` is actually needed

* whether a proposed module split matches the company’s mental model

### Stop if

* the skeleton is turning into a content dump

* the scaffold is pretending to contain real historical memory

* module boundaries are being invented without confirmation

### Read only if needed

* `references/en/concrete-instance-topology.md`

* `references/en/detailed-maintenance-contracts.md`

* `references/en/write-contracts.md`

***

## Phase 5 — BOOTSTRAP SKILLS

### Goal

Generate the smallest skill set that lets agents operate inside the pilot loop.

### Output

Generate only the high-leverage stubs needed now:

* source skill stubs

* repo skill stubs

* workflow skill stubs

* company EDITH entry skill stub

Templates:

* `templates/en/source-skill-stub.md`

* `templates/en/repo-skill-stub.md`

* `templates/en/workflow-skill-stub.md`

* `templates/en/company-edith-skill-stub.md`

Also create:

* `templates/en/skill-backlog.md`

* `templates/en/ownership-map.md`

* `templates/en/rollout-plan.md`

### Must confirm with humans

* which skills are truly needed for the pilot

* where repo-local truth should live

* which workflow should be explicit vs left for later

* ownership of each skill backlog item

### Stop if

* you are creating skills “just in case”

* you are centralizing repo-local truth that should live with repos

* the skill backlog has vague entries with no owner or outcome

### Read only if needed

* `references/en/source-skills.md`

* `references/en/repo-skills.md`

* `references/en/workflow-skills.md`

* `references/en/rollout-and-ownership.md`

***

## Phase 6 — CONFIRM

### Goal

Force a human confirmation pass before calling the result pilot-ready.

### Output

Run and complete:

* `templates/en/rollout-confirmation-checklist.md`

Review:

* build brief

* inventories

* generated skeleton

* skill stubs

* ownership map

* rollout plan

### Must confirm with humans

* business intent

* first loop

* included sources, repos, workflows

* source-of-truth locations

* owner assignments

* security / compliance-sensitive paths

### Stop if

* any truth-bearing field is still guessed

* placeholders are still ambiguous

* the pilot scope is still company-wide in disguise

### Read only if needed

* `references/en/company-adaptation.md`

* `references/en/instance-readiness.md`

***

## Phase 7 — PILOT-READY HANDOFF

### Goal

Declare the instance ready for a real pilot, not mature.

### Output

A pilot-ready result should include:

* confirmed build brief

* confirmed inventories for the pilot scope

* a usable root structure

* a usable company EDITH entry skill

* the minimum source / repo / workflow skill stubs

* a skill backlog

* an ownership map

* a rollout plan

* a completed confirmation checklist

### Must say explicitly

* this is pilot-ready, not mature

* historical knowledge is still shallow unless it came from real work

* maturity must come from continued writeback

### Stop if

* you are tempted to describe the instance as complete or mature

* you are treating scaffolding as operational memory

### Read only if needed

* `references/en/instance-readiness.md`

***

## Phase 8 — GROW BY WRITEBACK

### Goal

Turn the pilot scaffold into a real EDITH instance through actual use.

### Output

Only now should these files begin to accumulate real value:

* `known-issues.md`

* `decisions.md`

* `rejected-features.md`

* `test-coverage.md`

* `cross-cutting/module-interactions.md`

* `cross-cutting/version-changelog.md`

### Writeback rules

* promote repeated truths, not one-off chat residue

* record durable patterns, not chronological logs

* keep repo-local truth with the repo when appropriate

* update EDITH after real START → WORK → END loops

### Must confirm with humans when needed

* whether a pattern is durable enough to promote

* whether a decision is real and lasting

* whether a rejection belongs in long-term memory

### Stop if

* you are writing speculative history

* you are copying raw source material instead of extracting patterns

* you are bloating overview files with operational noise

### Read only if needed

* `references/en/detailed-maintenance-contracts.md`

* `references/en/write-contracts.md`

* `references/en/anti-patterns.md`

***

## Common Rationalizations

| Rationalization                                                          | Reality                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| “Let’s just generate the EDITH repo first.”                             | A repo without a confirmed first loop is just a shell.          |
| “We should inventory the whole company now.”                             | Pilot scope beats fake completeness.                            |
| “We can fill in the owners later.”                                       | Ownership is a truth-bearing field, not decoration.             |
| “We already know what the workflow probably is.”                         | Probable is not confirmed. Ask.                                 |
| “We can generate known issues and decisions now and improve them later.” | Fake history poisons trust. Grow it from real work.             |
| “We should create every possible skill while we’re here.”                | Only bootstrap the skills needed for the first loop.            |
| “These placeholders are obvious enough.”                                 | If they can be mistaken for truth, they are not obvious enough. |

## Red Flags

* `SKILL.md` is not being treated as the main route

* references are driving the process instead of supporting it

* inventories are broader than the pilot scope

* owners, boundaries, or source-of-truth locations are guessed

* history files contain generated content with no real evidence

* repo-local truth is being centralized for convenience

* the output is described as mature before real writeback exists

## Verification

Before finishing, confirm:

* [ ] A first valuable loop is explicitly named and confirmed.
* [ ] Pilot-scope sources, repos, and workflows are inventoried.
* [ ] Intended artifacts were classified into scaffold / confirm / grow-later.
* [ ] The generated structure is company-specific enough to support a pilot.
* [ ] Only the minimum high-leverage skills were bootstrapped.
* [ ] A human confirmation pass was completed.
* [ ] The result is described as pilot-ready rather than mature.
* [ ] The path from pilot to real writeback-based growth is explicit.

⠀