# Changelog

All notable changes to Kind Beacon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/kind-beacon/kind-beacon/releases/tag/v1.0.0
