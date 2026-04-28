# Detailed Maintenance Contracts

Use this file when the generic write contracts are too abstract and you need file-by-file guidance for a company EDITH instance.

## `overview.md`

### Purpose
Provide the stable entrypoint for a business module.

### Should contain
- what this module does
- what it does not do
- where source of truth lives
- what code / docs / issue / test locations matter
- common next hops for investigation

### Should not contain
- bugfix logs
- copied source documents
- large implementation narratives
- rejected-feature rationale that belongs elsewhere

## `known-issues.md`

### Purpose
Capture recurring failure patterns, not chronological ticket history.

### Should contain
- trigger or symptom patterns
- likely root causes
- impact hints
- investigation entrypoints
- representative references when needed

### Should not contain
- daily logs
- ticket body dumps
- full comment threads
- large copied diffs

## `decisions.md`

### Purpose
Capture durable product or engineering choices and why they were made.

### Should contain
- decision summary
- context
- tradeoff or boundary
- rationale
- lasting implications

### Should not contain
- transient implementation details
- raw MR history
- exploratory notes that never became a real decision

## `rejected-features.md`

### Purpose
Preserve why certain directions were declined.

### Should contain
- proposal summary
- rejection rationale
- boundary or principle behind the rejection
- useful alternative guidance if applicable

### Should not contain
- vague “won’t do” labels without explanation
- full issue-thread copies

## `test-coverage.md`

### Purpose
Describe what kinds of behavior are protected and where meaningful gaps remain.

### Should contain
- important covered behaviors
- meaningful gaps
- boundary conditions already protected

### Should not contain
- test run logs
- copied test code
- mechanical per-MR test diary entries

## `sources/<source>/README.md`

### Purpose
Provide the stable routing doc for a source.

### Should contain
- what the source is
- how to access it
- when to use it
- how to search or navigate it
- important caveats

### Should not contain
- a full mirror of the source content

## `cross-cutting/module-interactions.md`

### Purpose
Show how modules affect one another.

### Should contain
- dependency patterns
- shared boundary rules
- likely blast radius clues

### Should not contain
- redundant module detail already owned by module docs

## `cross-cutting/version-changelog.md`

### Purpose
Point agents toward version-level change understanding.

### Should contain
- release or version index entries
- routing links or references to the deeper source of truth
- concise summaries when useful

### Should not contain
- bloated release-note copies if a better source already exists

## `skills/<company-edith>/SKILL.md`

### Purpose
Act as the main agent entrypoint into the EDITH instance.

### Should contain
- where to look first
- how to choose between modules, sources, cross-cutting docs, and tools
- when to route outward to repo-local truth
- how to handle writeback

### Should not contain
- the full maintenance manual
- duplicated content from every module or source
