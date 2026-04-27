# Raw Exports Boundary

This directory is optional and should be used carefully.

## Purpose

Use `_raw/` or `_exports/` only when raw snapshots or exports are needed for:
- traceability
- offline analysis
- regulated evidence retention
- preserving source material that is hard to re-fetch

## Boundary rules

- treat this as storage, not the main knowledge layer
- do not confuse raw exports with JARVIS summaries or routing docs
- keep the main JARVIS files lightweight and synthesis-oriented
- store provenance when possible: source, date, method, owner

## Minimal metadata to capture

| Field | Value |
|---|---|
| source | `<source>` |
| export date | `<date>` |
| export method | `<tool / command>` |
| owner | `<owner>` |
| caveats | `<notes>` |
