# Workflow Skills

Workflow skills help agents complete real delivery loops that span sources, repos, teams, or roles.

## When to create a workflow skill

Create or propose a workflow skill when the task:
- touches multiple repos,
- crosses role boundaries,
- requires handoffs or staged artifacts,
- or repeatedly follows the same closed loop.

Typical examples:
- PRD → SPEC → implementation → QA → docs
- bug intake → triage → fix → regression → release note
- incident → diagnosis → patch → postmortem → hardening

## What a workflow skill should define

A workflow skill should make these things explicit:
- trigger or start condition
- preconditions
- main stages
- required artifacts
- which sources and repos to use at each stage
- evidence needed to advance
- writeback expectations at the end
- known stop conditions or escalation paths

## Keep it high-leverage

A workflow skill should orchestrate. It should not become a copy of repo-local instructions.

Reference repo skills for repo-specific execution.
Reference source skills for source-specific retrieval.
Keep the workflow skill focused on the loop itself.

## Useful output pattern

A workflow skill is strong when another owner or agent can immediately see:
- what the loop is,
- why it exists,
- what order things happen in,
- where handoffs occur,
- and what counts as success.
