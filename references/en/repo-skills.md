# Repo Skills

Repo skills help agents operate inside specific repositories.

## Core principle

Repo-local truth should usually live with the repo.

JARVIS can index, summarize, and route to repo skills, but it should not absorb all repo-local operating detail by default.

## When a repo skill is needed

Create or propose a repo skill when agents need repeated help with:
- project structure
- build / test / lint commands
- runtime entrypoints
- verification flow
- environment assumptions
- repo-specific conventions
- common bugfix patterns
- safe writeback locations

## What JARVIS should keep centrally

JARVIS should usually keep:
- the map of which repos exist,
- what role each repo plays,
- which repo skill to use,
- how repos connect inside broader workflows,
- and what company-wide constraints shape repo work.

## What should stay repo-local

Repo-local skills should usually own:
- source-of-truth code paths
- build / run / test guidance
- runtime and testability entrypoints
- repo-specific constraints and anti-patterns
- detailed local workflows

## Handoff rule

If a task becomes repo-specific, route to the repo skill.

Do not keep expanding central JARVIS docs with increasingly detailed repo instructions when that guidance belongs inside the repo.

## Quality bar

A strong repo skill lets an agent enter a repo and quickly answer:
- where am I?
- what is this repo for?
- how do I validate changes here?
- what local rules matter?
- what should I read next?
