# Changelog

All notable changes to EDITH Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-27

### Added
- Initial EDITH Agent MVP release.
- Core Extension routing layer with 4 tools: `edith_scan`, `edith_distill`, `edith_route`, `edith_query`.
- Configuration management via `edith.yaml` with upward directory search.
- Interactive configuration wizard (`edith --init`).
- Arc Reactor branded TUI theme.
- Three-layer knowledge artifact system (routing-table / quick-ref / distillates).
- Pi Package packaging and distribution support.
- npm distribution via `@edith/agent` package.
- CLI entry point with `--version`, `--init`, and default startup.
- Post-install script for configuration detection.
- System prompt with language support (zh/en).

[0.1.0]: https://github.com/example/edith-agent/releases/tag/v0.1.0
