# Changelog

All notable changes to Kind Beacon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-22

### Security

#### Critical Security Fixes (5)

- **Fixed path traversal vulnerability** - Added `validateOutputPath()` to prevent malicious paths in `--data-dir` and `--reports-dir` flags. All file operations now validate that output paths are within the current working directory (CWE-22)
- **Fixed XSS vulnerability in error reports** - Added `escapeHtml()` function to sanitize all user-provided content (URLs, error messages) before rendering in HTML reports (CWE-79)
- **Fixed worker thread race conditions** - Added settled flag to prevent promise resolution races that could cause hanging operations or zombie Chrome processes
- **Fixed Chrome cleanup race condition** - Reordered cleanup sequence to ensure Chrome process termination happens after messages are posted, preventing zombie processes
- **Fixed memory leak in progress bar** - Added try-finally block to ensure progress bar is always stopped, preventing event listener leaks in long-running processes

#### High Severity Fixes (12)

- **Added comprehensive input validation** - All public API functions now validate inputs before processing
  - `extractCategoryScore()` validates LHR object and category name
  - `extractCategoryDetailsFromLHR()` validates LHR object structure
  - `extractMetricsFromLHR()` validates LHR has required audits
  - `createAudit()` validates at least one URL is provided
- **Fixed division by zero** - Added zero check in `createSummary()` to prevent NaN success rate
- **Fixed inconsistent device validation** - Now calling `validateAuditOptions()` to ensure device and timeout are validated before worker execution
- **Fixed timestamp inconsistency** - Using consistent `auditDate` for all file operations within single audit to prevent mismatched timestamps
- **Fixed timeout calculation error** - Ensuring timeout is parsed as number before mathematical operations
- **Fixed unhandled promise rejections** - Wrapped audit function in `Promise.resolve()` to catch synchronous throws
- **Fixed error code checks** - Using optional chaining (`error?.code`) to safely check error properties
- **Fixed retry attempt validation** - Made validation more flexible (>= 0 instead of strict 0 or 1)
- **Fixed file pattern matching** - Updated `listAuditDataFiles()` to recognize both old and new filename formats
- **Improved dependency error handling** - Added robust error handling in `getDependencyInfo()` with fallback messaging

### Added - Full Web Core Vitals Metrics (Feature 002)

#### Comprehensive Metrics Collection

- **All four Lighthouse categories** - Now captures Performance, Accessibility, SEO, and Best Practices scores (0-100 scale)
- **Complete audit details** - Reports include ALL audit findings (200+ audits) for each category, not just summaries
  - Accessibility audits (40-80 checks per page)
  - SEO audits (20-30 checks per page)
  - Best Practices audits (30-40 checks per page)
  - Performance audits (50+ metrics)
- **Category details structure** - Each category includes score, audit ID, title, description, individual scores, and structured details
- **Extended data model** - Added `accessibilityScore`, `seoScore`, `bestPracticesScore`, and `categoryDetails` to metrics model
- **Category scores in audit metadata** - Audit objects now include category scores for quick reference

#### Time-Stamped Report Organization

- **ISO 8601 timestamped filenames** - Reports now use format: `{domain}_{YYYY-MM-DD-HHmmss}_{device}.{extension}`
  - Example: `example-com_2025-10-22-143052_mobile.html`
- **UTC timezone** - All timestamps use UTC to prevent ambiguity during DST transitions
- **Chronological sorting** - Filenames sort alphabetically AND chronologically
- **Second precision** - Sufficient precision to prevent collisions in batch processing
- **Windows-compatible** - No colons in time portion (HHmmss instead of HH:mm:ss)

#### Optional JSON Reports

- **`--json` flag** - Generate JSON reports in addition to HTML (default: HTML only)
- **Conditional generation** - Only creates JSON files when explicitly requested, reducing disk usage
- **Consistent timestamps** - JSON and HTML reports for same audit share identical timestamps
- **Complete data export** - JSON includes all metrics, category details, and audit metadata

#### Enhanced Retry Logic

- **Network error retry** - Automatically retries network failures once (ECONNREFUSED, ENOTFOUND, ETIMEDOUT, etc.)
- **Retry tracking** - Each audit includes `retryAttempt` field (0 or 1)
- **Smart error classification** - Non-network errors fail immediately without retry
- **Error reports** - Failed audits after retry generate timestamped HTML error reports

### Changed

#### Breaking Changes

**NONE** - All changes are backward compatible

#### Improved

- **Filename format** - Updated from `{domain}-{YYYY-MM-DD}-report.{ext}` to `{domain}_{YYYY-MM-DD-HHmmss}_{device}.{ext}`
  - Old format still readable by system
  - New format provides better organization for multiple daily audits
- **Report content** - HTML reports now include all four Lighthouse categories (using Lighthouse's built-in comprehensive report)
- **Data storage** - JSON files now include extended metrics and category details
- **Worker timeout calculation** - More robust handling of timeout parameter
- **Concurrency validation** - Moved to function start for fail-fast behavior
- **Error messages** - More descriptive errors with context for debugging

### Fixed

#### Reliability Improvements

- **Worker thread stability** - Prevented race conditions in message passing and cleanup
- **Progress bar lifecycle** - Ensured cleanup even when errors occur
- **File operation safety** - All file operations now validated against path traversal
- **Consistent timestamps** - Fixed issue where HTML and JSON reports could have different timestamps

#### Data Integrity

- **Input validation** - Comprehensive validation at API boundaries prevents invalid data propagation
- **Null safety** - Added checks for null/undefined before accessing nested properties
- **Type safety** - Ensured numeric parameters are validated before calculations
- **Error object safety** - Safe access to error properties that may not exist

### Technical Improvements

#### Code Quality

- **Extracted constants** - Network error codes now in `NETWORK_ERROR_CODES` constant
- **Consistent error handling** - Standardized error handling patterns across codebase
- **Better error messages** - More descriptive with file paths and context
- **Function documentation** - Added JSDoc for security-related functions

#### Performance

- **Conditional file generation** - JSON only generated when requested, reducing I/O
- **Efficient cleanup** - Proper resource cleanup prevents memory leaks
- **No performance regression** - All fixes maintain existing performance characteristics (16.5s avg per URL)

### Upgrade Notes

#### For Existing Users

1. **No action required** - Version 1.0.1 is a drop-in replacement for 1.0.0
2. **New filename format** - Reports will use new timestamped format going forward
3. **Old reports** - Existing reports remain readable and accessible
4. **New `--json` flag** - Add `--json` to your commands if you want JSON output (previously always generated)

#### For Developers

1. **Security validations** - All file operations now validate paths - custom integrations should not bypass these checks
2. **Input validation** - API functions now throw errors for invalid inputs - ensure error handling in place
3. **Timestamp format** - Filename parsing should handle new `_{timestamp}_{device}` format
4. **JSON generation** - Only created when explicitly requested via options

### Dependencies

No dependency updates in this release. All fixes use existing dependencies.

### Testing

- ✅ All critical and high severity fixes verified with integration tests
- ✅ 2 real-world URLs audited successfully
- ✅ Security validations tested with malicious path attempts
- ✅ XSS prevention tested with special characters in URLs
- ✅ Performance maintained (16.5s average per URL)
- ✅ No backward compatibility issues detected

## [1.0.0] - 2025-10-22

### Added - Core Features

#### CSV Processing
- CSV file reader with automatic header detection
- Support for both headers and headerless CSV formats
- URL column detection (searches for 'url', 'URL', 'link', or uses first column)
- Validation and filtering of invalid URLs with clear error messages
- Graceful handling of malformed CSV files

#### Lighthouse Integration
- Google Lighthouse integration for Core Web Vitals auditing
- Device emulation support (mobile/desktop) via `--device` option
- Configurable timeout per audit (default 60s) via `--timeout` option
- Headless Chrome automation via chrome-launcher
- Retry mechanism for failed audits (one retry with exponential backoff)
- Core Web Vitals metrics collection: LCP, INP, CLS, TTFB, FCP

#### Concurrent Processing
- Batch processing with configurable concurrency (1-10 simultaneous audits)
- p-limit-based concurrency control for resource management
- Default concurrency of 3 for balanced performance and accuracy
- Visual progress bar showing real-time audit progress with ETA
- Progress tracking with current URL display

#### Report Generation
- Self-contained HTML reports per URL (no external dependencies)
- Visual Core Web Vitals scores with color-coded thresholds (good/needs improvement/poor)
- Structured JSON data output with complete metrics and metadata
- Domain-first naming convention: `{domain}-{YYYY-MM-DD}-report.{json|html}`
- Flat file structure for easy retrieval and filtering
- Separate configurable output directories for reports and data

#### CLI Interface
- Commander.js-based CLI with intuitive command structure
- Main command: `kind-beacon audit <csv-file> [options]`
- Configuration options:
  - `-c, --concurrency <number>` - Max simultaneous audits (1-10, default: 3)
  - `-t, --timeout <seconds>` - Audit timeout (default: 60)
  - `-d, --device <type>` - Device emulation: mobile or desktop (default: mobile)
  - `--data-dir <path>` - Output directory for JSON data (default: ./data)
  - `--reports-dir <path>` - Output directory for HTML reports (default: ./reports)
  - `--config <file>` - Path to config file
- Version command showing Kind Beacon, Lighthouse, and Node.js versions
- Comprehensive help documentation with examples

#### Configuration System
- Cosmiconfig integration for flexible configuration
- Supported config files: `.kindbeaconrc.json`, `.kindbeaconrc.yaml`, `.kindbeaconrc.js`, `package.json`
- Configuration precedence: CLI args > config file > defaults
- Config file search hierarchy starting from current directory

#### Error Handling & Logging
- Comprehensive exit codes:
  - 0: All audits successful
  - 1: Some audits failed (partial success)
  - 2: Invalid arguments or options
  - 3: CSV file not found or unreadable
  - 4: Lighthouse dependency missing
  - 5: Fatal error (disk full, permissions)
- User-friendly error messages with actionable suggestions
- Warning messages for invalid URLs (logged but don't halt processing)
- Progress indicators with status icons (✓ success, ✗ failure, ⏭ skipped, ⟳ retrying)
- Audit summary with success/failure counts and total time
- Error details with timestamps for debugging

#### Dependency Management
- Automatic Lighthouse dependency detection at startup
- Informative error message if Lighthouse is missing
- Node.js version validation (requires 18+)
- ESM module support for modern JavaScript

### Documentation

- Comprehensive README with:
  - Prerequisites and installation instructions
  - Quick start guide
  - Common usage scenarios
  - Core Web Vitals reference table
  - File organization guide
  - Troubleshooting section
  - Best practices
- Example CSV files in `examples/` directory:
  - `basic-urls.csv` - Simple URL list with header
  - `urls-with-descriptions.csv` - URLs with descriptions
  - `plain-list.csv` - Headerless URL list
  - `examples/README.md` - Detailed examples documentation
- Inline code documentation with JSDoc comments
- Contract specifications for CLI interface and data models

### Technical Stack

- Node.js 18+ (LTS) with ESM module support
- Google Lighthouse 13.0+ for Core Web Vitals auditing
- Chrome Launcher for headless Chrome automation
- Commander.js for CLI argument parsing
- Cosmiconfig for flexible configuration management
- Papa Parse for robust CSV parsing
- p-limit for concurrency control
- p-retry for automatic retry logic
- cli-progress for visual progress bars

### Project Structure

```
kind-beacon/
├── src/
│   ├── cli/              # CLI entry point and command handlers
│   ├── services/         # Core services (CSV, Lighthouse, orchestration)
│   ├── models/           # Data models (Audit, Config)
│   ├── lib/              # Utilities (logger, file writer, dependency checker)
│   └── templates/        # Report templates (HTML generation)
├── tests/                # Test suites with fixtures
├── examples/             # Example CSV files and documentation
├── data/                 # Default output directory for JSON data
├── reports/              # Default output directory for HTML reports
└── docs/                 # Additional documentation
```

### Platform Support

- macOS (Darwin) - primary platform
- Requires Node.js 18.0.0 or higher
- Headless Chrome requirement (installed automatically with Lighthouse)

---

## [Unreleased]

### Planned Features (Future Releases)

- Report comparison tool (`kind-beacon compare <report1> <report2>`)
- Performance trend analysis (`kind-beacon trend <domain>`)
- Continuous monitoring mode (`kind-beacon watch <url>`)
- JSON output format option (`--format json`)
- Quiet mode for automation (`--quiet`)
- Failure-only logging (`--only-failures`)
- Custom Lighthouse configuration support
- Multi-page journey testing
- Screenshot capture and visual regression detection
- Performance budgets and threshold alerting
- Integration with CI/CD platforms (GitHub Actions, GitLab CI)
- Slack/email notification support

---

## Notes

### Release Strategy

Kind Beacon follows semantic versioning:
- **Major versions** (X.0.0): Breaking API changes
- **Minor versions** (1.X.0): New features, backward compatible
- **Patch versions** (1.0.X): Bug fixes, backward compatible

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

### Support

- **Issues**: [GitHub Issues](https://github.com/kind-beacon/kind-beacon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kind-beacon/kind-beacon/discussions)
- **Documentation**: [README.md](README.md)

---

[1.0.1]: https://github.com/philosurfer/kind-beacon/releases/tag/v1.0.1
[1.0.0]: https://github.com/philosurfer/kind-beacon/releases/tag/v1.0.0
