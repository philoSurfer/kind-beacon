# Feature Specification: Core Web Vitals Reporter

**Feature Branch**: `001-cwv-reporter`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "I need to build a tool that can run locally on a mac that will pull a list of urls from a csv file, it will then run WebCoreVitals scoring using lighthouse and simulating a browser, and then provide a report that can be easily rendered in html format for each of the URLs.    It will be important to store report data points, in addition to time, top level domain, and url in the metadata so that a future tool can aggregate and trend these results.   Feel free to ask clarifying questions."

## Clarifications

### Session 2025-10-22

- Q: How should the tool handle URLs that exceed reasonable load times (timeouts)? → A: Configurable timeout (default 60 seconds) - users can adjust for slow sites
- Q: How should historical audit data files be organized on disk? → A: Flat structure with domain-first naming: `/data/example-com-2025-10-22-report.json`
- Q: Which device profile should Lighthouse use when running audits (mobile vs desktop)? → A: Configurable per-run - maximum flexibility for different audit scenarios
- Q: How should the tool handle network failures during an audit? → A: Retry once then fail - attempt one retry for network errors, then mark as failed and continue
- Q: How should the tool handle missing Lighthouse dependency? → A: Detect and offer to auto-install - check for Lighthouse, prompt to install via npm if missing

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Batch URL Auditing (Priority: P1)

As a performance engineer, I want to run Lighthouse Core Web Vitals audits on multiple URLs from a CSV file, so that I can assess the performance of multiple pages in a single operation without manual intervention.

**Why this priority**: This is the core functionality that delivers immediate value. Without batch processing, the tool would require manual URL entry for each audit, defeating the purpose of automation.

**Independent Test**: Can be fully tested by providing a CSV file with 3-5 URLs and verifying that Lighthouse successfully runs against each URL, collecting Core Web Vitals metrics (LCP, FID, CLS, TTFB, etc.).

**Acceptance Scenarios**:

1. **Given** a CSV file containing 5 valid URLs, **When** I run the tool with that CSV file, **Then** the tool processes all 5 URLs and collects Core Web Vitals scores for each
2. **Given** a CSV file with some invalid URLs (404s, malformed), **When** I run the tool, **Then** the tool logs errors for invalid URLs but continues processing remaining valid URLs
3. **Given** a CSV file with 50 URLs, **When** I run the tool, **Then** the tool shows progress indication (e.g., "Processing 10 of 50...") so I know it's working
4. **Given** no CSV file is provided, **When** I run the tool, **Then** the tool displays helpful usage instructions with CSV format requirements

---

### User Story 2 - HTML Report Generation (Priority: P2)

As a performance engineer, I want to view Core Web Vitals results in a formatted HTML report for each URL, so that I can easily share findings with stakeholders who need visual, human-readable reports.

**Why this priority**: While raw data is valuable, HTML reports make results accessible to non-technical stakeholders and provide a better review experience. This is essential for communication but can be added after basic auditing works.

**Independent Test**: Can be fully tested by running the tool on a single URL and verifying that an HTML report file is generated with clear Core Web Vitals scores, thresholds (good/needs improvement/poor), and a visual summary.

**Acceptance Scenarios**:

1. **Given** Lighthouse has completed scanning a URL, **When** report generation runs, **Then** an HTML file is created with the URL, all Core Web Vitals metrics, and visual indicators (green/yellow/red) for each metric
2. **Given** multiple URLs have been scanned, **When** report generation completes, **Then** each URL has its own separate HTML report file with a clear naming convention (e.g., `report-example-com-2025-10-22.html`)
3. **Given** an HTML report is generated, **When** I open it in a browser, **Then** the report displays without external dependencies (all CSS/JS embedded or self-contained)
4. **Given** a Lighthouse scan fails for a URL, **When** report generation runs, **Then** an HTML report is still created showing the error and partial data if available

---

### User Story 3 - Historical Data Storage (Priority: P3)

As a performance engineer, I want audit results stored with timestamps and metadata (URL, domain, date/time) in a structured format, so that a future tool can aggregate results and show performance trends over time.

**Why this priority**: Historical tracking enables trend analysis and regression detection, which is valuable for ongoing monitoring. However, this can be implemented after basic auditing and reporting are working, as initial audits are still useful without historical comparison.

**Independent Test**: Can be fully tested by running the tool multiple times on the same URL and verifying that each run creates a separate data record with timestamp, URL, top-level domain, and all Core Web Vitals metrics in a structured format (JSON or similar).

**Acceptance Scenarios**:

1. **Given** a Lighthouse audit completes successfully, **When** results are stored, **Then** a structured data file (JSON) is created containing timestamp, URL, top-level domain, and all Core Web Vitals metrics
2. **Given** multiple audits of the same URL at different times, **When** viewing stored data, **Then** each audit result is stored separately with unique timestamps, enabling historical comparison
3. **Given** stored audit data exists, **When** I examine the data structure, **Then** the format is consistent and documented, making it easy for future tools to parse and aggregate results
4. **Given** the tool runs daily for a month, **When** I review stored data, **Then** data files are organized in a flat structure with domain-first naming (e.g., `/data/example-com-2025-10-22-report.json`) for easy retrieval and filtering

---

### Edge Cases

- When a URL takes longer than the configured timeout (default 60 seconds), the audit fails with a timeout error, is logged, and processing continues with the next URL
- How does the system handle URLs that require authentication or are behind paywalls?
- What happens if the CSV file is extremely large (1000+ URLs) - does it run all at once or batch them?
- When network interruptions occur during a scan, the tool automatically retries the failed audit once; if the retry also fails, the URL is marked as failed with an error logged, and processing continues
- What happens when disk space is low and reports/data cannot be written?
- How does the system handle URLs with special characters or internationalized domain names?
- When Lighthouse is not installed or cannot be found, the tool detects this at startup, displays a clear error message, and offers to automatically install Lighthouse via npm with user confirmation

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST read URLs from a CSV file with at least one column containing URLs
- **FR-002**: System MUST support CSV files with or without headers (auto-detect or configurable)
- **FR-003**: System MUST run Lighthouse audits using a simulated browser environment for each URL in the CSV
- **FR-004**: System MUST collect Core Web Vitals metrics (LCP, FID, CLS, TTFB, INP/TBT) for each URL
- **FR-005**: System MUST generate an HTML report for each audited URL showing all Core Web Vitals scores
- **FR-006**: System MUST store audit results in a structured format (JSON or similar) with metadata: timestamp, URL, top-level domain, and all metrics
- **FR-006a**: System MUST save historical data files using domain-first naming convention in a flat directory: `{domain}-{YYYY-MM-DD}-report.json` (e.g., `example-com-2025-10-22-report.json`)
- **FR-007**: System MUST extract and store the top-level domain from each URL (e.g., "example.com" from "https://www.example.com/page")
- **FR-008**: System MUST log progress during batch processing (e.g., "Processing URL 5 of 20...")
- **FR-009**: System MUST handle failed audits gracefully (log error, continue with remaining URLs)
- **FR-010**: System MUST provide clear error messages when the CSV file is missing, malformed, or contains no valid URLs
- **FR-011**: System MUST run entirely locally on macOS without requiring external services or API calls (except for accessing the target URLs)
- **FR-012**: HTML reports MUST be self-contained and viewable offline without external dependencies
- **FR-013**: System MUST support concurrent processing of URLs with a configurable concurrency limit (default 3-5 URLs simultaneously) to balance performance and server load
- **FR-014**: System MUST allow users to configure the concurrency limit to control how many URLs are processed in parallel
- **FR-015**: System MUST support configurable timeout for Lighthouse audits (default 60 seconds) to handle slow-loading URLs while preventing indefinite hangs
- **FR-016**: System MUST allow users to configure device emulation mode (mobile or desktop) per audit run to capture device-specific performance characteristics
- **FR-017**: System MUST retry failed audits once when network errors occur; if the retry fails, mark the URL as failed, log the error, and continue processing
- **FR-018**: System MUST detect if Lighthouse is installed at startup; if not found, display a clear error message and offer to automatically install Lighthouse via npm with user confirmation

### Key Entities

- **URL Audit**: Represents a single Lighthouse audit run for one URL. Key attributes: target URL, timestamp, top-level domain, Lighthouse version used, audit duration, device emulation mode (mobile or desktop).
- **Core Web Vitals Metrics**: The performance measurements collected from Lighthouse. Key attributes: LCP (Largest Contentful Paint), FID/INP (First Input Delay / Interaction to Next Paint), CLS (Cumulative Layout Shift), TTFB (Time to First Byte), overall performance score, thresholds (good/needs improvement/poor for each metric).
- **CSV Input**: The list of URLs to audit. Key attributes: file path, number of valid URLs, number of invalid URLs, column mapping (which column contains URLs).
- **HTML Report**: Visual representation of audit results for one URL. Key attributes: URL audited, generation timestamp, all metrics with visual indicators, full Lighthouse report data.
- **Historical Data Record**: Stored audit result for trend analysis. Key attributes: matches URL Audit and Metrics, stored in structured format (JSON), saved in flat directory structure with domain-first naming pattern: `{domain}-{YYYY-MM-DD}-report.json`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can audit a batch of 20 URLs in under 5 minutes (assuming normal network conditions and responsive sites)
- **SC-002**: HTML reports are generated and viewable in any modern browser without errors or missing content
- **SC-003**: 100% of successful Lighthouse audits result in both an HTML report and a structured data file being created
- **SC-004**: The tool handles at least 100 URLs in a single batch run without crashing or requiring restarts
- **SC-005**: Error messages clearly identify which URL failed and why, allowing users to take corrective action
- **SC-006**: Stored data files can be parsed by future tools without requiring schema changes or data migration (stable format)
- **SC-007**: Users can locate and review reports for any URL within 30 seconds of completion (clear naming and organization)
- **SC-008**: The tool runs successfully on macOS without requiring users to manually configure browser binaries or system dependencies

### Assumptions

- **Assumption 1**: Users have Node.js and npm installed, as they are required to run and potentially auto-install Lighthouse; Lighthouse itself will be detected and can be auto-installed if missing
- **Assumption 2**: CSV files follow common formats (comma or semicolon delimited, with optional header row)
- **Assumption 3**: URLs in the CSV are accessible from the user's network (no VPN or authentication handling required initially)
- **Assumption 4**: Users have sufficient disk space for storing reports and historical data (approximately 1-2 MB per URL audit)
- **Assumption 5**: Users run the tool manually on-demand (not as a scheduled/automated service initially)
- **Assumption 6**: "Top-level domain" means the registered domain (e.g., "example.com" not "subdomain.example.com" and not ".com")
- **Assumption 7**: Default concurrency of 3-5 simultaneous URLs provides good balance between performance and avoiding server overload; users may need to adjust based on their specific use cases
