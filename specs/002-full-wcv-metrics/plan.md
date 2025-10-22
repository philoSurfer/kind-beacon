# Implementation Plan: Full Web Core Vitals Metrics Support

**Branch**: `002-full-wcv-metrics` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-full-wcv-metrics/spec.md`

## Summary

Extend the existing Core Web Vitals auditing tool to capture and report the full suite of Lighthouse metrics including accessibility, SEO, and best practices scores (in addition to existing performance/CWV metrics). Add timestamp-based filenames for report organization and chronological sorting. Support both single-URL and batch CSV audits with comprehensive error handling and retry logic.

**Technical Approach**: Enhance the existing Lighthouse integration to extract all four metric categories from the LHR (Lighthouse Result) object, extend the data models to include new metric categories with **ALL audit findings** (clarified: comprehensive 200+ audits per category), update the report generator to include all metrics, and modify the file naming utility to include ISO 8601 timestamps. Implement retry logic for failed audits and support optional JSON format generation.

**Key Clarifications** (from /speckit.clarify session):
1. **Audit Detail Coverage**: Reports include ALL audits for all categories (comprehensive reporting with 200+ audits)
2. **Failure Handling**: Retry failed audits once, then generate error report if second attempt fails
3. **Report Format**: HTML by default, JSON with optional --json flag

## Technical Context

**Language/Version**: Node.js 18+ (ESM modules)
**Primary Dependencies**: Lighthouse 13.0.0, papaparse 5.5.3 (CSV), commander 14.0.1 (CLI), chrome-launcher 1.2.1
**Storage**: File system (JSON and HTML reports written to output directories)
**Testing**: Node.js built-in test runner (`node --test`)
**Target Platform**: macOS (primary), cross-platform Node.js environments
**Project Type**: Single project (CLI tool with library modules)
**Performance Goals**: 60 seconds per URL audit under normal network conditions, support concurrent batch audits
**Constraints**: Must maintain backward compatibility with existing report format, timestamps must sort chronologically when arranged alphabetically, comprehensive audit details (200+ audits) result in larger report files (1-5MB HTML)
**Scale/Scope**: Designed for batch processing of 10-1000 URLs per run, individual report files (1-5MB HTML, 30-50KB JSON), single-threaded Lighthouse execution per URL

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Specification-First Development ✅

- **Status**: PASS
- **Evidence**: Feature spec completed in `spec.md` with clear requirements, success criteria, and clarifications before planning
- **Action**: None required

### II. User Story Independence ✅

- **Status**: PASS
- **Evidence**: Three prioritized user stories (P1: Complete metrics, P2: Timestamped reports, P3: Batch processing) are independently testable and deliverable
- **Action**: Tasks will be organized by user story in Phase 2 (`/speckit.tasks`)

### III. Clear Documentation ✅

- **Status**: PASS
- **Evidence**: spec.md defines WHAT/WHY with clarifications, plan.md (this file) defines HOW
- **Action**: Research.md, data-model.md, quickstart.md already generated

### IV. Simplicity & YAGNI ✅

- **Status**: PASS
- **Evidence**:
  - Leveraging existing Lighthouse integration (no new audit engine)
  - Extending existing data models rather than rewriting
  - Using standard ISO 8601 timestamps (no custom date formats)
  - No premature optimization (file-based storage, no database)
  - Clarified: HTML default, JSON optional (user choice, not forced dual generation)
- **Action**: None required - design follows simplest approach

## Project Structure

### Documentation (this feature)

```text
specs/002-full-wcv-metrics/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - decisions on timestamp format, metric extraction
├── data-model.md        # Phase 1 output - extended entities for new metrics
├── quickstart.md        # Phase 1 output - usage examples
├── contracts/           # Phase 1 output - N/A (no API contracts, CLI tool)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── audit.js         # [EXTEND] Add category scores to audit model
│   ├── metrics.js       # [EXTEND] Add accessibility, SEO, best practices, ALL audits
│   └── config.js        # [NO CHANGE] Configuration model
├── services/
│   ├── csv-reader.js    # [NO CHANGE] CSV parsing service
│   ├── lighthouse-runner.js  # [EXTEND] Extract all categories from LHR, add retry logic
│   ├── report-generator.js   # [EXTEND] Include all metrics in reports, conditional JSON
│   ├── data-storage.js       # [EXTEND] Support JSON flag, error report generation
│   └── audit-orchestrator.js # [NO CHANGE] Batch orchestration
├── workers/
│   └── lighthouse-worker.js  # [NO CHANGE] Lighthouse execution worker
├── lib/
│   ├── file-namer.js    # [EXTEND] Add timestamp to filename generation
│   ├── domain-extractor.js   # [NO CHANGE] Domain extraction
│   ├── logger.js        # [NO CHANGE] Logging utility
│   └── dependency-checker.js # [NO CHANGE] Dependency validation
└── cli/
    ├── index.js         # [NO CHANGE] CLI entry point
    └── commands.js      # [EXTEND] Add --json flag support

tests/
├── unit/
│   ├── test-metrics-extended.js      # [NEW] Test new metric categories
│   ├── test-timestamp-formatting.js  # [NEW] Test timestamp generation
│   ├── test-file-namer.js            # [EXTEND] Test timestamped filenames
│   └── test-retry-logic.js           # [NEW] Test audit retry behavior
├── integration/
│   └── test-lighthouse-integration.js # [EXTEND] Verify all categories extracted
└── manual-test-services.js           # [EXTEND] Manual test for full metrics
```

**Structure Decision**: Using existing single-project structure. This feature extends the current CLI tool without requiring new projects or architectural changes. All modifications are incremental enhancements to existing modules following the established patterns.

## Complexity Tracking

> **No violations - table left empty**

All constitution principles are satisfied without requiring additional complexity justification.

**Note**: Comprehensive audit detail (ALL audits vs. top 20) increases report file size but was explicitly clarified by user as desired - users value comprehensive data over minimal file sizes.

---

## Phase 0: Research & Decisions (COMPLETE)

See [research.md](./research.md) for detailed findings and decisions.

**Note**: Research decisions made before clarifications assumed selective audit filtering (top 20 audits per category). This research guidance has been **superseded by clarification session** which requires ALL audits (200+ total). Tasks.md correctly implements ALL audits extraction - ignore the 20-audit cap from research.md.

---

## Phase 1: Design & Contracts (COMPLETE)

### Data Model Extensions

See [data-model.md](./data-model.md) for complete entity definitions.

**Summary of Changes** (Updated with clarifications):

1. **Metrics Model** (`src/models/metrics.js`):
   - Add `accessibilityScore` (0-100)
   - Add `seoScore` (0-100)
   - Add `bestPracticesScore` (0-100)
   - Add `categoryDetails` object containing **ALL audit findings** for each category (no 20-audit cap)

2. **Audit Model** (`src/models/audit.js`):
   - Add optional `categories` field to store category scores
   - Add optional `retryAttempt` tracking
   - Extend `auditToJSON()` to include category data

3. **Updated: Category Details Entity**:
   - `categoryName`: string (accessibility | seo | best-practices)
   - `score`: number (0-100)
   - `audits`: array of **ALL audit objects** (no cap, typically 40-80 per category)
     - `id`: string (audit identifier)
     - `title`: string (human-readable title)
     - `description`: string (what was tested)
     - `score`: number (0-1, where 1 is passing)
     - `displayValue`: string (summary value if applicable)
     - `details`: object (structured data like tables, lists)

### API Contracts

**N/A for this feature** - This is a CLI tool with no REST/GraphQL APIs. All interfaces are:
- CLI commands (existing `kind-beacon audit` command with new --json flag)
- File-based input (CSV files)
- File-based output (HTML by default, JSON optional)

### File Naming Convention

**New Standard**: `{domain}_{timestamp}_{device}.{extension}`

**Examples**:
- `example-com_2025-10-22-143052_mobile.html` (default)
- `example-com_2025-10-22-143052_mobile.json` (with --json flag)

**Components**:
- `domain`: Sanitized domain name (dots replaced with hyphens, special chars removed)
- `timestamp`: ISO 8601 format `YYYY-MM-DD-HHmmss` (UTC timezone)
- `device`: `mobile` or `desktop`
- `extension`: `html` (default) or `json` (with flag)

**Rationale** (from research.md):
- ISO 8601 YYYY-MM-DD ensures alphabetical = chronological sort
- HHmmss (no colons) avoids Windows filename restrictions
- Second precision sufficient (Lighthouse audits take >5 seconds each)
- UTC timezone prevents ambiguity during DST transitions

### Implementation Sequence (Updated with Clarifications)

**P1: Complete Performance and Quality Audit**
1. Extend `extractMetricsFromLHR()` in `src/models/metrics.js` to extract all four category scores
2. Add category details extraction function to parse **ALL audits** from LHR (remove 20-audit cap from research)
3. Update `lighthouse-runner.js` to:
   - Capture and pass through category data
   - Implement retry logic (retry once on failure)
4. Extend report generator to:
   - Render all four categories in HTML output
   - Support conditional JSON generation (--json flag)
5. Update JSON serialization to include new fields
6. Implement error report generation for failed audits (after retry)

**P2: Time-Stamped Report Organization**
1. Add timestamp generation utility to `src/lib/file-namer.js`
2. Update filename generation to include timestamp in specified format
3. Ensure timestamp uses UTC and follows ISO 8601 format
4. Update `data-storage.js` to use timestamped filenames
5. Add tests for filename sorting and uniqueness

**P3: Batch Audit Processing**
1. Verify existing batch processing handles errors gracefully with retry logic
2. Test that timestamped filenames work correctly in batch mode
3. Add logging for batch progress with per-URL timestamps
4. Verify --json flag works in batch mode

### Quickstart Guide

See [quickstart.md](./quickstart.md) for user-facing documentation.

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Lighthouse LHR structure changes between versions | Low | Medium | Pin Lighthouse version, add version checks in extraction code |
| Timestamp collisions in high-speed batch processing | Low | Low | Second precision sufficient (Lighthouse audits take 5-30s each) |
| Report file size increases significantly (1-5MB HTML) | **High** | **Low** | **Clarified: Users value comprehensive data, 1-5MB acceptable** |
| Existing reports break due to model changes | Low | High | Maintain backward compatibility, make new fields optional |
| Retry logic adds latency for failed audits | Medium | Low | Acceptable tradeoff for reliability (60s + retry = ~120s max) |

### Delivery Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| P1 takes longer due to ALL audits extraction | Medium | Medium | Expected given clarification, break into smaller tasks |
| Testing all four categories with full audits requires extensive test data | Medium | Low | Use real websites for integration tests, mock LHR for unit tests |

### Mitigation Status

- All identified risks have mitigation strategies
- Report size increase clarified as acceptable by user
- No blockers identified
- Can proceed to task generation

---

## Success Metrics

From spec.md Success Criteria (validated against clarifications):

1. **SC-001**: Reports include complete data for all four categories with **ALL audits** ✓
2. **SC-002**: 100% of filenames include sortable timestamps ✓
3. **SC-003**: Timestamps are human-readable in filenames ✓
4. **SC-004**: Batch processing continues despite individual failures (with retry) ✓
5. **SC-005**: All CWV metrics captured with ratings ✓ (already implemented, extending)
6. **SC-006**: Accessibility scores reflect WCAG compliance ✓
7. **SC-007**: SEO scores include 10+ distinct checks ✓
8. **SC-008**: Reports generated within 60 seconds per URL ✓ (existing performance maintained, +retry)

---

## Next Steps

1. ✅ **Phase 0 Complete**: research.md generated (note: needs adjustment for ALL audits clarification)
2. ✅ **Phase 1 Complete**: data-model.md and quickstart.md generated (note: needs adjustment for ALL audits clarification)
3. **Phase 2 (Next)**: Run `/speckit.tasks` to generate dependency-ordered task list incorporating clarifications
4. **Phase 3 (Next)**: Run `/speckit.implement` to execute implementation by user story priority

---

## Notes

- This feature is a natural extension of existing feature 001-cwv-reporter
- Maintains full backward compatibility with existing reports
- No breaking changes to CLI interface or data models
- All new fields are additive and optional
- **Clarifications Impact**:
  - ALL audits extraction increases report size to 1-5MB HTML (acceptable per user)
  - Retry logic adds robustness with minimal latency impact
  - HTML-first approach with optional JSON reduces unnecessary file generation
