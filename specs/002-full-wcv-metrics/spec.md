# Feature Specification: Full Web Core Vitals Metrics Support

**Feature Branch**: `002-full-wcv-metrics`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "Need to support full WCV, including, accessibility, SEO, best practice. Report file names should include time stamps that will help logically and temporally sort in folders."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Performance and Quality Audit (Priority: P1)

A website owner or developer needs to run a comprehensive audit of their site to measure all Core Web Vitals metrics (LCP, FID, CLS), along with accessibility, SEO, and best practices scores. They want to understand the complete health picture of their website in a single audit run.

**Why this priority**: This is the core value proposition - providing complete visibility into all web quality metrics in one place. Without this, the tool cannot deliver comprehensive insights.

**Independent Test**: Can be fully tested by running an audit on any website and verifying that the output includes all metric categories (performance/Core Web Vitals, accessibility, SEO, best practices) with numeric scores and detailed findings.

**Acceptance Scenarios**:

1. **Given** a valid website URL, **When** the user runs an audit, **Then** the system collects and reports Core Web Vitals metrics (LCP, FID/INP, CLS)
2. **Given** a valid website URL, **When** the user runs an audit, **Then** the system collects and reports accessibility scores and issues
3. **Given** a valid website URL, **When** the user runs an audit, **Then** the system collects and reports SEO scores and recommendations
4. **Given** a valid website URL, **When** the user runs an audit, **Then** the system collects and reports best practices scores and findings
5. **Given** a completed audit, **When** viewing the report, **Then** all four categories (performance, accessibility, SEO, best practices) are clearly presented with scores
6. **Given** an audit fails on first attempt, **When** the system retries, **Then** a second attempt is made before generating an error report

---

### User Story 2 - Time-Stamped Report Organization (Priority: P2)

A developer running multiple audits over time needs report files that are automatically organized chronologically. They want to easily identify which report is newest, track changes over time, and maintain a historical record without manual file renaming.

**Why this priority**: Essential for tracking performance trends and regression detection over time. Enables users to compare reports chronologically and maintain organized audit history.

**Independent Test**: Can be fully tested by running multiple audits and verifying that report filenames include timestamps in a format that sorts both logically (human-readable) and temporally (chronological order when sorted alphabetically).

**Acceptance Scenarios**:

1. **Given** an audit is completed, **When** the report file is generated, **Then** the filename includes a timestamp in ISO 8601 format (YYYY-MM-DD-HHmmss or similar)
2. **Given** multiple reports in a folder, **When** sorted alphabetically by filename, **Then** they appear in chronological order from oldest to newest
3. **Given** a report filename with timestamp, **When** a user views the filename, **Then** they can immediately identify the date and time the audit was performed
4. **Given** multiple audits of the same URL, **When** viewing the reports folder, **Then** each report has a unique filename preventing overwrites

---

### User Story 3 - Batch Audit Processing (Priority: P3)

A QA engineer or site maintainer needs to audit multiple URLs from a list to assess the quality of several pages or sites at once. They want to run audits in batch mode and receive organized reports for each URL without manual intervention.

**Why this priority**: Improves efficiency for users managing multiple sites or pages. While valuable, single-URL auditing (P1) must work first before batch processing adds value.

**Independent Test**: Can be fully tested by providing a list of multiple URLs and verifying that separate, time-stamped reports are generated for each URL with all metrics included.

**Acceptance Scenarios**:

1. **Given** a CSV file with multiple URLs, **When** the batch audit runs, **Then** each URL is audited with full metrics (performance, accessibility, SEO, best practices)
2. **Given** a batch audit in progress, **When** one URL fails or is unreachable, **Then** the audit continues processing remaining URLs
3. **Given** a completed batch audit, **When** viewing the reports folder, **Then** each URL has its own time-stamped report file
4. **Given** batch audit reports, **When** examining filenames, **Then** each includes both the URL identifier and timestamp for clear identification

---

### Edge Cases

- **Unreachable websites**: System retries once, then generates error report with failure details
- **Audit timeouts**: System retries once, then generates error report if second attempt also times out
- **Rate limiting/blocking**: System retries once, then generates error report documenting the blocking
- **Report filename collisions**: Timestamps prevent same-name files (second-precision uniqueness)
- **Special URL characters**: System sanitizes special characters in filenames (query parameters, fragments removed or encoded)
- **Insufficient disk space**: System reports storage error and fails gracefully without corrupting existing reports

## Clarifications

### Session 2025-10-22

- Q: How many detailed audit findings should be included per category (accessibility, SEO, best practices) in reports? → A: All audits for all categories (comprehensive but large reports, 200+ audits)
- Q: When an audit fails (timeout, unreachable, blocked), should a report file still be generated? → A: Retry once, then generate error report if second attempt fails
- Q: Should the system generate both HTML and JSON report formats for every audit, or allow users to choose which format(s) to generate? → A: HTML only by default, JSON with --json flag

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST collect Core Web Vitals metrics including Largest Contentful Paint (LCP), First Input Delay/Interaction to Next Paint (FID/INP), and Cumulative Layout Shift (CLS)
- **FR-002**: System MUST collect accessibility audit data including WCAG compliance issues and accessibility scores
- **FR-003**: System MUST collect SEO audit data including meta tags, structured data, mobile-friendliness, and search engine optimization recommendations
- **FR-004**: System MUST collect best practices audit data including HTTPS usage, console errors, security headers, and modern web standards compliance
- **FR-005**: System MUST generate report filenames that include timestamps in a sortable format (ISO 8601 or similar: YYYY-MM-DD-HHmmss)
- **FR-006**: Report filenames MUST sort both chronologically and logically when arranged alphabetically
- **FR-007**: System MUST prevent report file overwrites by ensuring each filename is unique through timestamp inclusion
- **FR-008**: System MUST support processing single URLs for individual audits
- **FR-009**: System MUST support processing multiple URLs from CSV input for batch audits
- **FR-010**: System MUST continue batch processing when individual URLs fail, logging errors without stopping the entire batch
- **FR-011**: Reports MUST include numeric scores for each category (performance, accessibility, SEO, best practices) on a 0-100 scale
- **FR-012**: Reports MUST include ALL audit findings (200+ total) and recommendations for each category (accessibility, SEO, best practices), including all passing and failing audits with their detailed results
- **FR-013**: System MUST generate HTML format reports by default for all audits
- **FR-014**: System MUST support optional JSON format report generation when explicitly requested via command-line flag
- **FR-015**: System MUST handle URLs with special characters safely in filenames by sanitizing or encoding appropriately
- **FR-016**: System MUST retry failed audits once (timeout, unreachable, blocked) before considering them failed
- **FR-017**: System MUST generate error report files for failed audits (after retry) containing the error status, error message, timestamp, and attempted URL

### Key Entities

- **Audit Report**: Represents the complete assessment of a single URL, containing all collected metrics across four categories (performance/Core Web Vitals, accessibility, SEO, best practices), timestamp of audit execution, target URL, and any errors encountered
- **Metric Category**: Represents one of the four quality dimensions (Performance, Accessibility, SEO, Best Practices), each containing a numeric score (0-100), detailed findings, and specific recommendations
- **Core Web Vitals Data**: Represents the three key performance metrics (LCP, FID/INP, CLS) with their measured values, thresholds (good/needs improvement/poor), and contributing factors
- **Audit Batch**: Represents a collection of multiple URL audits executed together, tracking overall progress, individual audit statuses, and aggregated results

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Audit reports include complete data for all four categories (performance/Core Web Vitals, accessibility, SEO, best practices) with no missing metrics
- **SC-002**: 100% of generated report files include timestamps that allow chronological sorting when arranged alphabetically
- **SC-003**: Users can identify the audit date and time from the filename without opening the file
- **SC-004**: Batch audits successfully complete processing of all reachable URLs even when some individual URLs fail (minimum 95% completion rate for valid URLs)
- **SC-005**: All Core Web Vitals metrics (LCP, FID/INP, CLS) are captured and reported with their measured values and rating classifications (good/needs improvement/poor)
- **SC-006**: Accessibility scores accurately reflect WCAG compliance level and include actionable issue descriptions
- **SC-007**: SEO scores include at least 10 distinct checks covering meta tags, mobile-friendliness, and search optimization
- **SC-008**: Reports are generated within 60 seconds per URL for typical websites under normal network conditions

## Assumptions *(optional)*

- Users have network access to the URLs they want to audit
- The auditing engine (assumed to be Lighthouse based on existing project context) is already installed and configured
- Users are familiar with Core Web Vitals concepts and understand the four metric categories
- Report storage location is writable and has sufficient disk space for comprehensive reports (HTML reports may be 1-5MB each with all audit details)
- CSV input files for batch processing follow standard CSV format with a header row and URL column
- Timestamp format will use ISO 8601 or similar standard (YYYY-MM-DD-HHmmss) to ensure cross-platform compatibility
- Users value comprehensive audit data over minimal report file sizes
- Primary use case is human review of HTML reports, with JSON format used for automation and programmatic access when needed

## Dependencies *(optional)*

- Existing Lighthouse integration for Core Web Vitals collection (from feature 001-cwv-reporter)
- File system access for writing timestamped reports to designated output folders
- CSV parsing capability for batch URL processing
- Existing URL validation and sanitization logic

## Out of Scope

- Historical trending dashboards or visualization of metrics over time (reports provide raw data, but no built-in charting)
- Automated scheduling of recurring audits (audits are run on-demand only)
- Comparison views between different audit runs (users can manually compare timestamped reports)
- Custom scoring thresholds or weighting of different metric categories
- Integration with third-party monitoring or alerting systems
- Authentication or access control for viewing reports (reports are local files)
