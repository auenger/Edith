# Company Adaptation

Every generated output must distinguish reusable method from company-specific truth.

## What must always be adapted

### 1. Business language
Replace generic nouns with the company’s real:
- product names
- team names
- business domains
- user types
- module names
- release terminology

### 2. Ownership
Identify real owners for:
- key digital assets
- repos
- workflows
- maintenance and governance

Do not leave ownership implied.

### 3. System access
Replace placeholders with real:
- URLs
- CLI access paths
- auth methods
- permissions boundaries
- environments
- operational constraints

### 4. Source of truth
Clarify where truth actually lives for:
- product decisions
- bug history
- backlog and roadmap
- repo-specific operating guidance
- runbooks and incident records

### 5. Workflow boundaries
Adapt to the company’s real delivery flow:
- which teams are involved
- which repos are touched
- what artifacts are produced
- what evidence counts as done
- where writeback should happen

### 6. Compliance and sensitivity
Mark anything that requires special handling:
- customer data
- regulated systems
- security-sensitive repositories
- restricted documents
- approval-only workflows

## Questions to force adaptation

Ask explicitly:
- Which sources matter first, and why?
- Which repos are the real execution surfaces?
- Which workflow should be proven first?
- What must remain repo-local?
- What can be summarized centrally?
- Who is responsible for maintaining each layer?
- What cannot be inferred and must be supplied by humans?

## Placeholder policy

Generated placeholders should be:
- obvious,
- minimal,
- and easy to replace.

Never make a placeholder look like validated company truth.

## Good adaptation outcome

A good adapted output makes it easy for the next owner or agent to tell:
- what is method,
- what is company truth,
- what is still unknown,
- and what should happen next.
