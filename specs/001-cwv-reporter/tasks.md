# Task List: Core Web Vitals Reporter

**Feature Branch**: `001-cwv-reporter` | **Created**: 2025-10-22 | **Status**: Ready for Implementation

## Overview

This task list implements Kind Beacon, a macOS CLI tool for Core Web Vitals auditing using Lighthouse. Tasks are organized by user story to enable independent implementation and incremental delivery.

**User Stories** (from spec.md):
- **P1 (MVP)**: User Story 1 - Batch URL Auditing
- **P2**: User Story 2 - HTML Report Generation
- **P3**: User Story 3 - Historical Data Storage

---

## Phase 1: Setup & Project Initialization

**Goal**: Bootstrap Node.js project with directory structure and core dependencies.

**Tasks**:

- [X] T001 Initialize Node.js project with package.json (ESM module, Node 18+ required)
- [X] T002 [P] Create project directory structure per plan.md (src/, tests/, data/, reports/)
- [X] T003 [P] Create .gitignore file (ignore node_modules/, data/, reports/)
- [X] T004 Install core dependencies: lighthouse, commander, papaparse, p-limit, p-retry, cosmiconfig
- [X] T005 [P] Create README.md with installation and usage instructions
- [X] T006 [P] Configure package.json bin field for 'kind-beacon' executable pointing to src/cli/index.js
- [X] T007 [P] Create placeholder files for all modules defined in plan.md project structure

**Completion Criteria**: `npm install` succeeds, directory structure matches plan.md, `kind-beacon --version` runs (even if just exits)

---

## Phase 2: Foundational Infrastructure

**Goal**: Build shared utilities and models needed by all user stories.

**Tasks**:

- [x] T008 [P] Implement domain extraction utility in src/lib/domain-extractor.js (handles subdomains, IPs, internationalized domains)
- [x] T009 [P] Implement file naming utility in src/lib/file-namer.js (format: `{domain}-{YYYY-MM-DD}-report.json`)
- [x] T010 [P] Implement logger utility in src/lib/logger.js (progress, errors, with ora spinner support)
- [x] T011 [P] Create Audit model in src/models/audit.js (URL Audit entity from data-model.md)
- [x] T012 [P] Create Metrics model in src/models/metrics.js (Core Web Vitals Metrics entity from data-model.md)
- [x] T013 [P] Create Config model in src/models/config.js (Configuration management with cosmiconfig)
- [x] T014 Implement dependency checker in src/lib/dependency-checker.js (FR-018: detect Lighthouse, offer auto-install)

**Completion Criteria**: All utilities export functions, models define validation logic, Lighthouse detection works

---

## Phase 3: User Story 1 - Batch URL Auditing (P1 - MVP)

**User Story Goal**: Run Lighthouse audits on multiple URLs from CSV file, process concurrently (3-5 URLs), handle errors gracefully with retry logic.

**Independent Test Criteria**:
- ✓ Given CSV with 5 URLs → tool processes all 5 and collects Core Web Vitals
- ✓ Given CSV with invalid URLs → tool logs errors but continues with valid URLs
- ✓ Given CSV with 50 URLs → tool shows progress indication
- ✓ Given no CSV provided → tool displays usage instructions

**Tasks**:

### CSV Parsing & Validation (US1)

- [X] T015 [P] [US1] Implement CSV reader service in src/services/csv-reader.js (PapaParse integration, header auto-detection per FR-002)
- [X] T016 [US1] Add URL validation to CSV reader (check HTTP/HTTPS, log invalid URLs per FR-010)
- [X] T017 [US1] Add CSV metadata extraction (total/valid/invalid counts, column mapping per CSV Input entity)

### Lighthouse Integration (US1)

- [X] T018 [US1] Create Lighthouse worker script in src/workers/lighthouse-worker.js (Worker Thread for parallel execution per research.md)
- [X] T019 [US1] Implement Lighthouse runner service in src/services/lighthouse-runner.js (programmatic Lighthouse API, device emulation per FR-016)
- [X] T020 [US1] Add timeout handling to Lighthouse runner (configurable timeout per FR-015, default 60s)
- [X] T021 [US1] Implement retry logic wrapper using p-retry (network errors only per FR-017, retry once then fail)
- [X] T022 [US1] Add metrics extraction from Lighthouse LHR object (LCP, INP, CLS, TTFB, TBT per Metrics model)

### Concurrency & Orchestration (US1)

- [X] T023 [US1] Implement concurrent audit orchestrator using p-limit (default concurrency 3-5 per FR-013)
- [X] T024 [US1] Add progress tracking and logging (e.g., "Processing 10 of 50..." per acceptance scenario 3)
- [X] T025 [US1] Implement graceful error handling (log errors, continue processing per FR-009)

### CLI Interface (US1)

- [X] T026 [US1] Implement CLI entry point in src/cli/index.js (Commander.js setup, version, help per contracts/cli-interface.md)
- [X] T027 [US1] Implement 'audit' command in src/cli/commands.js (parse CSV path, options: concurrency, timeout, device)
- [X] T028 [US1] Add CLI option validation (concurrency 1-10, timeout > 0, device mobile|desktop per contracts)
- [X] T029 [US1] Add dependency check at CLI startup (call dependency-checker, prompt for auto-install per FR-018)
- [X] T030 [US1] Wire CSV reader → concurrent orchestrator → Lighthouse runner in audit command

### Integration & Testing (US1)

- [X] T031 [US1] Create sample CSV fixtures in tests/fixtures/ (with-headers.csv, no-headers.csv, mixed-valid-invalid.csv)
- [X] T032 [US1] Test end-to-end flow: CSV → Lighthouse (mocked) → console output showing progress
- [X] T033 [US1] Verify all acceptance scenarios pass (5 URLs processed, invalid URLs skipped, progress shown, usage displayed)

**Phase 3 Completion Criteria**:
- ✓ `kind-beacon audit urls.csv` processes all URLs
- ✓ Progress displayed in console
- ✓ Invalid URLs logged but don't crash tool
- ✓ Concurrency working (3-5 simultaneous audits)
- ✓ Retry logic handles network failures
- ✓ Timeout handling works
- ✓ All US1 acceptance scenarios pass

**MVP Milestone**: This phase delivers a working batch auditing tool. User can run audits and see Core Web Vitals in console output.

---

## Phase 4: User Story 2 - HTML Report Generation (P2)

**User Story Goal**: Generate self-contained HTML reports for each audited URL showing Core Web Vitals with visual indicators.

**Independent Test Criteria**:
- ✓ Given completed audit → HTML file created with metrics and visual indicators
- ✓ Given multiple audits → each URL has separate HTML file with clear naming
- ✓ Given HTML report → opens in browser without external dependencies
- ✓ Given failed audit → HTML report shows error and partial data

**Tasks**:

- [x] T034 [P] [US2] Implement report generator service in src/services/report-generator.js (use Lighthouse ReportGenerator per research.md)
- [x] T035 [US2] Add HTML file naming logic using file-namer utility (format: `{domain}-{YYYY-MM-DD}-report.html`)
- [X] T036 [US2] Integrate report generation into audit workflow (generate HTML after each successful Lighthouse run)
- [x] T037 [US2] Add error report generation for failed audits (show error message, partial data if available per acceptance scenario 4)
- [x] T038 [P] [US2] Add reports directory creation if missing (default: ./reports/, configurable via --reports-dir)
- [X] T039 [US2] Update logger to display report file paths after completion (e.g., "Reports saved to: ./reports/")
- [x] T040 [US2] Test HTML report self-containment (open in browser, verify no external resources loaded)
- [x] T041 [US2] Verify all acceptance scenarios pass (HTML created, naming correct, self-contained, error handling)

**Phase 4 Completion Criteria**:
- ✓ HTML reports generated for each URL
- ✓ Reports are self-contained (CSS/JS embedded)
- ✓ Clear naming convention matches spec
- ✓ Failed audits get error reports
- ✓ All US2 acceptance scenarios pass

---

## Phase 5: User Story 3 - Historical Data Storage (P3)

**User Story Goal**: Store audit results as structured JSON with metadata (timestamp, domain, metrics) for future trend analysis.

**Independent Test Criteria**:
- ✓ Given successful audit → JSON file created with timestamp, URL, domain, all metrics
- ✓ Given multiple audits of same URL → each stored separately with unique timestamps
- ✓ Given stored data → format is consistent and documented
- ✓ Given tool runs daily for month → files organized in flat structure with domain-first naming

**Tasks**:

- [x] T042 [P] [US3] Implement data storage service in src/services/data-storage.js (write JSON files per Audit + Metrics models)
- [x] T043 [US3] Add JSON file naming using file-namer utility (format: `{domain}-{YYYY-MM-DD}-report.json`)
- [x] T044 [US3] Implement timestamp generation (ISO 8601 UTC format per Audit model)
- [X] T045 [US3] Integrate data storage into audit workflow (save JSON after each successful Lighthouse run)
- [x] T046 [P] [US3] Add data directory creation if missing (default: ./data/, configurable via --data-dir)
- [x] T047 [US3] Add domain extraction using domain-extractor utility (for file naming per FR-007)
- [x] T048 [US3] Test JSON structure matches data-model.md (validate all required fields present)
- [x] T049 [US3] Test multiple runs create separate files (verify unique timestamps, domain-first naming)
- [x] T050 [US3] Verify all acceptance scenarios pass (JSON created, separate timestamps, consistent format, flat structure)

**Phase 5 Completion Criteria**:
- ✓ JSON data files created for each audit
- ✓ Files follow naming convention: `{domain}-{YYYY-MM-DD}-report.json`
- ✓ JSON structure matches data-model.md
- ✓ Multiple runs create separate files
- ✓ All US3 acceptance scenarios pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Finalize configuration, improve UX, add documentation.

**Tasks**:

### Configuration & UX

- [ ] T051 [P] Add cosmiconfig support for .kindbeaconrc.json/.yaml/.js (search hierarchy per contracts)
- [ ] T052 [P] Add configuration file precedence logic (CLI args > config file > defaults)
- [ ] T053 [P] Add progress bar using cli-progress library (enhance progress indication beyond text)
- [ ] T054 [P] Improve error messages to match contracts/cli-interface.md examples (CSV not found, invalid concurrency, etc.)

### Exit Codes & Finalization

- [ ] T055 Implement exit codes per contracts (0: success, 1: partial failure, 2: invalid args, 3: file error, 4: dependency missing, 5: fatal)
- [ ] T056 Add summary output after audit completion (successful count, failed count, total time, report/data locations)
- [ ] T057 [P] Add --help extended documentation (show examples, all options per contracts)
- [ ] T058 [P] Add --version with Lighthouse and Node.js versions

### Documentation & Distribution

- [ ] T059 [P] Update README.md with complete usage guide (based on quickstart.md)
- [ ] T060 [P] Add example CSV files to repository (examples/ directory)
- [ ] T061 [P] Create CHANGELOG.md for v1.0.0 release notes
- [ ] T062 Finalize package.json (author, license, repository, keywords for npm publish)

**Phase 6 Completion Criteria**:
- ✓ Configuration files work (.kindbeaconrc.json)
- ✓ Progress bar shows during batch processing
- ✓ Error messages match contract specifications
- ✓ Exit codes correct for all scenarios
- ✓ Help and version commands complete
- ✓ README and documentation finalized

---

## Dependencies & Execution Order

### User Story Dependency Graph

```
Setup (Phase 1)
    ↓
Foundational (Phase 2) ← BLOCKING for all user stories
    ↓
    ├─→ [US1] Batch Auditing (Phase 3) ← MVP / MUST COMPLETE FIRST
    │       ↓
    │   ┌───┴───┐
    │   ↓       ↓
    │  [US2]   [US3]  ← Can be implemented in parallel after US1
    │  HTML    Data
    │  Reports Storage
    │   │       │
    │   └───┬───┘
    │       ↓
    └─→ Polish (Phase 6)
```

**Key Dependencies**:
- **Phase 2 (Foundational) blocks everything** - must complete utilities and models first
- **Phase 3 (US1) is MVP** - must complete before US2/US3 (they depend on audit infrastructure)
- **Phase 4 (US2) and Phase 5 (US3) are independent** - can be implemented in parallel after US1
- **Phase 6 (Polish) should wait** for US1/US2/US3 to stabilize

### Parallel Execution Opportunities

**Phase 1 (Setup)**: T002, T003, T005, T006, T007 can run in parallel

**Phase 2 (Foundational)**: T008, T009, T010, T011, T012, T013 can run in parallel

**Phase 3 (US1)**:
- T015-T017 (CSV) can be parallel
- T018-T022 (Lighthouse) can start after T018 worker script
- T026-T029 (CLI) can be parallel

**Phase 4 (US2)**: T034, T038 can be parallel

**Phase 5 (US3)**: T042, T046 can be parallel

**Phase 6 (Polish)**: T051-T054, T057-T061 can be parallel

---

## Testing Strategy (Optional per Constitution)

Testing is **optional** per constitution but recommended for data integrity. If implementing tests:

### Test Tasks (Insert after foundational phase)

- [ ] TX01 [P] Create test setup (package.json test script, node --test configuration)
- [ ] TX02 [P] Write domain-extractor tests (5-10 test cases: subdomains, IPs, internationalized domains)
- [ ] TX03 [P] Write file-namer tests (3-5 test cases: format correctness, date handling)
- [ ] TX04 [P] Write CSV reader tests with fixtures (headers, no-headers, quoted fields)
- [ ] TX05 Create Lighthouse mock for integration test (prevent real network calls in tests)
- [ ] TX06 Write integration smoke test (CSV → mocked Lighthouse → JSON + HTML output)

**Test Execution**: `npm test` (runs all tests in <1 second per research.md)

**Note**: Tests focus on high-ROI utilities (domain extraction, file naming, CSV parsing). Lighthouse execution and HTML rendering are NOT tested (trust Google's library, manual visual checks).

---

## Implementation Strategy

### Recommended Approach

1. **Start with MVP (Phases 1-3)**:
   - Complete Setup → Foundational → US1
   - Delivers working batch auditing tool
   - Users can run audits and see Core Web Vitals in console

2. **Add Value Incrementally (Phases 4-5)**:
   - Implement US2 (HTML Reports) OR US3 (Data Storage) based on user feedback
   - Both can be done in parallel if resources available
   - Each adds independent value

3. **Polish Last (Phase 6)**:
   - After core features stable
   - Add configuration, better UX, documentation

### Task Execution Tips

- **Follow [P] markers**: Parallelizable tasks can be done simultaneously
- **Respect user story labels**: Complete US1 tasks before US2/US3
- **Check completion criteria**: Each phase has clear success criteria
- **Test early**: Run acceptance scenarios as soon as code is complete

### File Path Reference

All tasks include exact file paths from plan.md:
- CLI: `src/cli/index.js`, `src/cli/commands.js`
- Services: `src/services/*.js`
- Models: `src/models/*.js`
- Lib: `src/lib/*.js`
- Tests: `tests/unit/*.test.js`, `tests/fixtures/*.csv`

---

## Task Summary

**Total Tasks**: 62 (plus 6 optional test tasks)

**By Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (US1 - MVP): 19 tasks
- Phase 4 (US2): 8 tasks
- Phase 5 (US3): 9 tasks
- Phase 6 (Polish): 12 tasks

**By User Story**:
- US1 (Batch Auditing): 19 tasks
- US2 (HTML Reports): 8 tasks
- US3 (Data Storage): 9 tasks
- Infrastructure: 26 tasks (Setup + Foundational + Polish)

**Parallel Opportunities**: 22 tasks marked [P] can run simultaneously with other [P] tasks

**MVP Scope** (Phases 1-3): 33 tasks → Working batch auditing tool

---

## Acceptance Criteria Checklist

### User Story 1 (P1)
- [X] Given CSV with 5 URLs → tool processes all 5 and collects Core Web Vitals
- [X] Given CSV with invalid URLs → tool logs errors but continues with valid URLs
- [X] Given CSV with 50 URLs → tool shows progress indication
- [X] Given no CSV provided → tool displays usage instructions

### User Story 2 (P2)
- [X] Given completed audit → HTML file created with metrics and visual indicators
- [X] Given multiple audits → each URL has separate HTML file with clear naming
- [X] Given HTML report → opens in browser without external dependencies
- [X] Given failed audit → HTML report shows error and partial data

### User Story 3 (P3)
- [X] Given successful audit → JSON file created with timestamp, URL, domain, all metrics
- [X] Given multiple audits of same URL → each stored separately with unique timestamps
- [X] Given stored data → format is consistent and documented
- [X] Given tool runs daily for month → files organized in flat structure with domain-first naming

---

**Tasks Status**: ✅ Ready for Implementation | **Next Step**: Begin Phase 1 (Setup) | **Estimated MVP**: 33 tasks (Phases 1-3)
