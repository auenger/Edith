# Instance Generation Contract

Use this contract to decide what a JARVIS-building agent may generate directly, what must be confirmed by humans, and what can only become real through continued use and writeback.

## The core principle

Do not present scaffolding as truth.

Every generated artifact should fall into one of three classes:
1. **safe to scaffold automatically**
2. **requires human confirmation before being treated as truth**
3. **cannot be honestly generated up front and must emerge from real work**

---

## 1. Safe to scaffold automatically

These artifacts are usually safe to generate as first-pass structure:

- JARVIS root README skeleton
- MAINTENANCE guide skeleton
- source inventory skeleton
- repo inventory skeleton
- workflow inventory skeleton
- skill backlog
- ownership map structure
- rollout plan skeleton
- company JARVIS entry skill stub
- source skill stubs
- repo skill stubs
- workflow skill stubs
- module overview skeletons
- source README skeletons
- cross-cutting skeletons such as module interactions and version changelog indexes
- tools index skeleton
- raw export boundary notes

These are structure and method artifacts. They should be generated with visible placeholders and explicit adaptation notes.

---

## 2. Requires human confirmation

These items should not be treated as settled truth until a human owner confirms them:

- the business intent for JARVIS
- the first valuable workflow to prove
- module boundaries
- source names and source owners
- repo roles and maintainers
- source-of-truth locations
- workflow boundaries and handoffs
- security or compliance-sensitive access paths
- ownership assignments
- writeback destinations
- what is explicitly out of scope for the current rollout

Agents may propose these items. Humans should ratify them.

---

## 3. Must emerge from real use

These items cannot be honestly generated from zero and should grow through START → WORK → END loops:

- real known-issue patterns
- real decisions with rationale
- real rejected-feature memory
- meaningful test coverage summaries
- trustworthy cross-module interaction knowledge
- durable version-change understanding
- useful operational tools born from repeated need
- mature repo-local operating guidance
- mature workflow evidence and handoff rules

The agent can create placeholders for these files, but not credible final content.

---

## 4. Generation sequence

### Step 1 — Define the first loop
Choose one real business loop and name its success signal.

### Step 2 — Classify outputs by generation boundary
For each intended artifact, decide whether it is:
- scaffoldable now,
- requires human confirmation,
- or must emerge later.

### Step 3 — Generate only the scaffoldable layer
Create the initial structure with clear placeholders and contracts.

### Step 4 — Get humans to confirm truth-bearing fields
Do not silently lock in business truth, ownership, or operating boundaries.

### Step 5 — Run a real pilot
Use the generated structure to support real work.

### Step 6 — Write back only durable learnings
Promote repeated truths, not one-off chatter.

---

## 5. Failure modes

### Bad
- auto-generating detailed known issues with no evidence
- inventing owners or maintainers
- guessing workflow stages from generic software lore
- presenting placeholder histories as if they were real institutional memory

### Better
- generating the container
- marking unknowns explicitly
- routing truth to humans or future writeback
- growing the memory layer only from actual work

---

## 6. Acceptance criteria for a responsible generator

A responsible JARVIS generator:
- [ ] separates structure from truth
- [ ] labels placeholders clearly
- [ ] requests confirmation for truth-bearing fields
- [ ] does not fake historical knowledge
- [ ] makes writeback the path to maturity rather than pretending maturity exists at setup time
