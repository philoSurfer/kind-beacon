# Implementation Plan: Core Web Vitals Reporter

**Branch**: `001-cwv-reporter` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cwv-reporter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Kind Beacon is a macOS CLI tool that automates Core Web Vitals performance auditing using Lighthouse. It reads URLs from CSV files, runs concurrent audits with configurable device emulation (mobile/desktop), generates self-contained HTML reports, and stores structured historical data for trend analysis. The tool emphasizes user experience through auto-detection of dependencies, progress logging, and graceful error handling with automatic retries.

## Technical Context

**Language/Version**: Node.js 18+ (LTS) - Required for Lighthouse compatibility and modern ESM support
**Primary Dependencies**: Lighthouse (Google's auditing tool), CSV parser library, HTML templating for reports
**Storage**: File system (JSON for structured data, HTML for reports) - Flat directory structure with domain-first naming
**Testing**: Node.js Native Test Runner (`node:test`) - Minimal test suite (12-20 tests) for critical utilities; optional per constitution but recommended for data integrity
**Target Platform**: macOS (Darwin) - Local execution only, no server deployment
**Project Type**: Single project (CLI tool) - Command-line interface with library structure
**Performance Goals**: Process 20 URLs in under 5 minutes; handle 100+ URLs without crashes; configurable concurrency (3-5 simultaneous audits default)
**Constraints**: 60-second default timeout per audit (configurable); macOS-only; requires Node.js and npm; approximately 1-2 MB storage per audit
**Scale/Scope**: Single-user CLI tool; batch processing up to 100+ URLs; historical data accumulation over time (daily/weekly runs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Specification-First Development
✅ **PASS** - Complete specification created via `/speckit.specify` with measurable success criteria and user scenarios

### Principle II: User Story Independence
✅ **PASS** - Three prioritized user stories (P1: Batch Auditing, P2: HTML Reports, P3: Historical Storage) each independently testable and deliverable

### Principle III: Clear Documentation
✅ **PASS** - Specification complete; plan.md in progress; research.md, data-model.md, contracts/, and quickstart.md will be generated in Phase 0-1

### Principle IV: Simplicity & YAGNI
✅ **PASS** - Single Node.js CLI project; flat file storage; no database; no web server; minimal dependencies (Lighthouse + CSV parser + HTML generation)

**Gate Status**: ✅ **ALL GATES PASS** - Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/001-cwv-reporter/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── cli-interface.md # CLI command structure and options
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

###Source Code (repository root)

```text
src/
├── cli/
│   ├── index.js         # CLI entry point, argument parsing
│   └── commands.js      # Command implementations
├── services/
│   ├── csv-reader.js    # CSV parsing and validation
│   ├── lighthouse-runner.js # Lighthouse audit execution
│   ├── report-generator.js  # HTML report generation
│   └── data-storage.js  # JSON data file management
├── models/
│   ├── audit.js         # URL Audit entity
│   ├── metrics.js       # Core Web Vitals Metrics entity
│   └── config.js        # Configuration management
└── lib/
    ├── domain-extractor.js  # Top-level domain parsing
    ├── file-namer.js        # File naming conventions
    └── logger.js            # Progress and error logging

data/                    # Historical audit data (JSON files)
reports/                 # Generated HTML reports
tests/                   # Tests (if testing approach defined)
├── fixtures/            # Sample CSV files, test URLs
└── unit/                # Unit tests for services

package.json             # Node.js project configuration
README.md                # Usage instructions
.gitignore              # Ignore data/ and reports/ directories
```

**Structure Decision**: Single project structure selected because this is a standalone CLI tool with no frontend/backend separation or mobile components. All functionality is contained in a single Node.js application with clear separation of concerns: CLI interface, services (business logic), models (data structures), and lib (utilities).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations - this section intentionally left empty. All constitution principles are satisfied.*
