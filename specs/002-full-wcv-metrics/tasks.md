# Tasks: Full Web Core Vitals Metrics Support

**Input**: Design documents from `/specs/002-full-wcv-metrics/`
**Prerequisites**: plan.md (tech stack, structure), spec.md (user stories), research.md (decisions), data-model.md (entities)

**Tests**: Not explicitly requested in specification - tasks focus on implementation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- All paths shown below use absolute paths from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Status**: ✅ COMPLETE - Project already exists with necessary structure

No tasks required - leveraging existing project structure from feature 001-cwv-reporter.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model extensions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Extend Metrics model with category score fields in src/models/metrics.js
- [ ] T002 [P] Extend Audit model with categories field in src/models/audit.js
- [ ] T003 Add extractCategoryScore function to src/models/metrics.js
- [ ] T004 [P] Add getCategoryAuditRefs function to src/models/metrics.js
- [ ] T005 [P] Add validation functions for extended metrics in src/models/metrics.js

**Note**: FR-015 (URL sanitization) is inherited from existing feature 001-cwv-reporter and doesn't require new tasks. Existing `domain-extractor.js` handles special character sanitization.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Complete Performance and Quality Audit (Priority: P1) 🎯 MVP

**Goal**: Enable comprehensive audits that capture all four metric categories (performance, accessibility, SEO, best practices) with ALL audit findings (200+ audits) and generate HTML reports with retry logic for failed audits

**Independent Test**: Run audit on any website and verify output includes all four categories with numeric scores and complete audit details for accessibility, SEO, and best practices

**Clarifications Applied**:
- Extract ALL audits for all categories (no 20-audit cap)
- Retry failed audits once before generating error report
- Generate HTML by default, JSON with --json flag

### Implementation for User Story 1

#### Category Extraction (Core Functionality)

- [ ] T006 [P] [US1] Implement extractCategoryDetailsFromLHR function in src/models/metrics.js
- [ ] T007 [P] [US1] Implement selectAllAudits function (no cap) in src/models/metrics.js
- [ ] T008 [P] [US1] Implement simplifyAuditDetails function in src/models/metrics.js
- [ ] T009 [US1] Implement extractExtendedMetricsFromLHR function in src/models/metrics.js
- [ ] T010 [US1] Update auditToJSON method to include category data in src/models/audit.js

#### Lighthouse Integration with Retry Logic

- [ ] T011 [US1] Add retry logic wrapper function in src/services/lighthouse-runner.js
- [ ] T012 [US1] Update lighthouse-runner to extract all four categories in src/services/lighthouse-runner.js
- [ ] T013 [US1] Add error report generation for failed audits in src/services/lighthouse-runner.js
- [ ] T014 [US1] Update audit status tracking to include retry attempt in src/services/lighthouse-runner.js

#### Report Generation (HTML Primary, JSON Optional)

- [ ] T015 [P] [US1] Create HTML template for category summary dashboard in src/services/report-generator.js
- [ ] T016 [P] [US1] Implement renderCategorySection for accessibility in src/services/report-generator.js
- [ ] T017 [P] [US1] Implement renderCategorySection for SEO in src/services/report-generator.js
- [ ] T018 [P] [US1] Implement renderCategorySection for best practices in src/services/report-generator.js
- [ ] T019 [US1] Update HTML report generator to include all category sections in src/services/report-generator.js
- [ ] T020 [US1] Add conditional JSON report generation based on flag in src/services/report-generator.js
- [ ] T021 [US1] Update report CSS for accordion sections and color-coded badges in src/services/report-generator.js

#### CLI and Storage Updates

- [ ] T022 [US1] Add --json flag to audit command in src/cli/commands.js
- [ ] T023 [US1] Update data-storage to handle conditional JSON generation in src/services/data-storage.js
- [ ] T024 [US1] Add backward compatibility check for old report formats in src/services/report-generator.js

**Checkpoint**: At this point, User Story 1 should be fully functional - audits generate comprehensive HTML reports with all four categories and ALL audit details, with retry logic and optional JSON output

---

## Phase 4: User Story 2 - Time-Stamped Report Organization (Priority: P2)

**Goal**: Add ISO 8601 timestamps to report filenames for automatic chronological sorting

**Independent Test**: Run multiple audits and verify filenames include timestamps that sort chronologically when arranged alphabetically (format: `{domain}_{YYYY-MM-DD-HHmmss}_{device}.{extension}`)

**Dependencies**: Extends US1 report generation with timestamped filenames

### Implementation for User Story 2

- [ ] T025 [P] [US2] Implement generateTimestamp function in src/lib/file-namer.js
- [ ] T026 [P] [US2] Update generateFilename to include timestamp parameter in src/lib/file-namer.js
- [ ] T027 [US2] Update filename format to include timestamp in src/lib/file-namer.js
- [ ] T028 [US2] Update data-storage to use timestamped filenames in src/services/data-storage.js
- [ ] T029 [US2] Add filename collision handling (optional suffix) in src/lib/file-namer.js
- [ ] T030 [US2] Update error report filenames to include timestamps in src/services/lighthouse-runner.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - reports generated with timestamped filenames that sort chronologically

---

## Phase 5: User Story 3 - Batch Audit Processing (Priority: P3)

**Goal**: Verify batch processing works correctly with all new features (timestamped reports, retry logic, comprehensive metrics)

**Independent Test**: Run batch audit with CSV containing multiple URLs and verify each URL gets separate timestamped reports with all metrics, and failed URLs generate error reports after retry

**Dependencies**: Verifies US1 and US2 work together in batch mode

### Implementation for User Story 3

- [ ] T031 [US3] Verify batch orchestrator handles timestamped filenames in src/services/audit-orchestrator.js
- [ ] T032 [US3] Add batch progress logging with timestamps in src/services/audit-orchestrator.js
- [ ] T033 [US3] Verify --json flag works in batch mode in src/services/audit-orchestrator.js
- [ ] T034 [US3] Verify retry logic works correctly in batch processing in src/services/audit-orchestrator.js
- [ ] T035 [US3] Test error report generation in batch mode in src/services/audit-orchestrator.js

**Checkpoint**: All user stories should now be independently functional - batch audits generate timestamped reports with comprehensive metrics

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, and quality improvements across all stories

- [ ] T036 [P] Create unit test for timestamp generation in tests/unit/test-timestamp-formatting.js
- [ ] T037 [P] Create unit test for filename sorting in tests/unit/test-file-namer.js
- [ ] T038 [P] Create unit test for category extraction in tests/unit/test-metrics-extended.js
- [ ] T039 [P] Create unit test for retry logic in tests/unit/test-retry-logic.js
- [ ] T040 [P] Update integration test for all categories in tests/integration/test-lighthouse-integration.js
- [ ] T041 [P] Create manual test script for full metrics in tests/manual-test-services.js
- [ ] T042 [P] Update quickstart.md with new features (already exists, verify accuracy)
- [ ] T043 Code cleanup and refactoring for category extraction
- [ ] T044 Performance profiling for ALL audits extraction (ensure <60s target)
- [ ] T045 Run full integration test with real websites
- [ ] T046 Validate backward compatibility with old reports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ COMPLETE - No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - Can proceed in parallel if multiple developers available
  - Or sequentially in priority order: P1 → P2 → P3 (recommended)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
    ↓
    ├─→ User Story 1 (P1) ← Independent (MVP)
    │       ↓
    ├─→ User Story 2 (P2) ← Extends US1 (timestamped filenames for US1 reports)
    │       ↓
    └─→ User Story 3 (P3) ← Verifies US1 + US2 work together in batch mode
```

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Extends US1 - adds timestamps to filenames generated by US1
- **User Story 3 (P3)**: Integration verification - tests US1 + US2 working together in batch mode

### Within Each User Story

- Models before services (foundational phase handles this)
- Services before report generation
- Core implementation before CLI integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 2 (Foundational)**: All tasks marked [P] can run simultaneously
- T001 (Metrics model), T002 (Audit model), T004 (audit refs), T005 (validation)

**Phase 3 (User Story 1)**: Multiple parallel opportunities
- T006-T008 (category extraction functions) can run in parallel
- T015-T018 (HTML rendering for each category) can run in parallel

**Phase 4 (User Story 2)**: Multiple parallel opportunities
- T025-T027 (filename utilities) can run in parallel

**Phase 6 (Polish)**: All test creation tasks (T036-T041) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all category extraction functions together:
Task: "Implement extractCategoryDetailsFromLHR function in src/models/metrics.js"
Task: "Implement selectAllAudits function (no cap) in src/models/metrics.js"
Task: "Implement simplifyAuditDetails function in src/models/metrics.js"

# Launch all category rendering together:
Task: "Implement renderCategorySection for accessibility in src/services/report-generator.js"
Task: "Implement renderCategorySection for SEO in src/services/report-generator.js"
Task: "Implement renderCategorySection for best practices in src/services/report-generator.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (5 tasks, ~2-4 hours)
2. Complete Phase 3: User Story 1 (19 tasks, ~12-16 hours)
3. **STOP and VALIDATE**:
   - Test audit on real website
   - Verify all 4 categories present
   - Verify ALL audits included (200+ audits)
   - Verify retry logic works
   - Verify HTML report renders correctly
   - Verify --json flag generates JSON
4. Deploy/demo if ready - **Core functionality complete!**

**MVP Deliverable**: Comprehensive Web Core Vitals auditing tool with all four metric categories and ALL audit details

### Incremental Delivery

1. Complete Foundational → Foundation ready (~2-4 hours)
2. Add User Story 1 → Test independently → **MVP deployed!** (~12-16 hours)
3. Add User Story 2 → Test independently → **Timestamped reports deployed!** (~3-5 hours)
4. Add User Story 3 → Test independently → **Batch processing verified!** (~2-3 hours)
5. Add Polish tasks → **Production ready!** (~4-6 hours)

**Total Estimated Time**: 23-34 hours for complete feature

### Parallel Team Strategy

With 2-3 developers:

1. Team completes Foundational together (~2-4 hours)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (core functionality) - 19 tasks
   - **Developer B**: User Story 2 (timestamps) - 6 tasks
   - **Developer C**: Polish tasks (tests, docs) - 11 tasks
3. Stories integrate naturally (US2 extends US1, US3 verifies both)

---

## Task Summary

- **Total Tasks**: 46
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (User Story 1 - P1)**: 19 tasks 🎯 **MVP**
- **Phase 4 (User Story 2 - P2)**: 6 tasks
- **Phase 5 (User Story 3 - P3)**: 5 tasks
- **Phase 6 (Polish)**: 11 tasks
- **Parallel Tasks**: 20 tasks marked [P]

---

## Critical Success Factors

1. **ALL Audits Extraction**: Ensure no 20-audit cap - extract ALL audits per category (200+ total)
2. **Retry Logic**: Implement retry wrapper correctly - one retry before error report
3. **HTML Default**: Generate HTML by default, JSON only with --json flag
4. **Backward Compatibility**: Maintain compatibility with existing reports
5. **Performance**: Ensure ALL audits extraction completes within 60s per URL
6. **Timestamps**: Use UTC timezone, ISO 8601 format (YYYY-MM-DD-HHmmss)

---

## Clarifications Reference

From `/speckit.clarify` session:

1. **Q**: How many detailed audit findings per category?
   **A**: All audits for all categories (comprehensive, 200+ audits)

2. **Q**: Generate report for failed audits?
   **A**: Retry once, then generate error report if second attempt fails

3. **Q**: Generate both HTML and JSON?
   **A**: HTML only by default, JSON with --json flag

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Tests are optional per template - not explicitly requested in spec
- Focus on implementation quality and comprehensive audit coverage
