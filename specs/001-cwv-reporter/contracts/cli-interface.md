# CLI Interface Contract: Kind Beacon

**Feature**: Core Web Vitals Reporter | **Date**: 2025-10-22 | **Status**: Complete

## Overview

This document defines the command-line interface for Kind Beacon, including commands, arguments, options, exit codes, and output formats.

---

## Command Structure

```bash
kind-beacon <command> [arguments] [options]
```

---

## Commands

### `audit`

Run Core Web Vitals audits on URLs from a CSV file.

**Usage**:
```bash
kind-beacon audit <csv-file> [options]
```

**Arguments**:

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<csv-file>` | path | Yes | Path to CSV file containing URLs |

**Options**:

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--concurrency <number>` | `-c` | integer | `3` | Max simultaneous audits (1-10) |
| `--timeout <seconds>` | `-t` | integer | `60` | Audit timeout in seconds |
| `--device <type>` | `-d` | enum | `mobile` | Device emulation: `mobile` or `desktop` |
| `--data-dir <path>` | | path | `./data` | Output directory for JSON data files |
| `--reports-dir <path>` | | path | `./reports` | Output directory for HTML reports |
| `--config <file>` | | path | | Path to config file (overrides default search) |
| `--help` | `-h` | flag | | Show help message |
| `--version` | `-v` | flag | | Show version number |

**Examples**:

```bash
# Basic usage with defaults (mobile, concurrency 3, timeout 60s)
kind-beacon audit urls.csv

# Desktop audits with higher concurrency
kind-beacon audit urls.csv --device desktop --concurrency 5

# Custom timeout and output directories
kind-beacon audit urls.csv -t 90 --data-dir /Users/me/audits/data --reports-dir /Users/me/audits/reports

# Short form options
kind-beacon audit urls.csv -c 5 -t 90 -d desktop
```

**Output**:

**Console (stdout)**:
```
[1/50] Auditing https://example.com... ✓ (LCP: 1.8s, INP: 150ms, CLS: 0.05) - 45s
[2/50] Auditing https://example.org... ✓ (LCP: 2.2s, INP: 180ms, CLS: 0.08) - 42s
[3/50] Auditing https://slow-site.com... ✗ Timeout after 60s (retried)
...
[50/50] Auditing https://last-url.com... ✓ (LCP: 1.5s, INP: 120ms, CLS: 0.03) - 38s

Summary:
✓ 48 successful audits
✗ 2 failed audits
⏱  Total time: 8m 32s
📊 Reports saved to: ./reports/
💾 Data saved to: ./data/
```

**Console (stderr)** (errors only):
```
[ERROR] https://invalid-url.com - Invalid URL format
[ERROR] https://timeout-site.com - Network timeout after 60s (retry failed)
```

**Exit Codes**:
- `0`: All audits successful
- `1`: Some audits failed (but process completed)
- `2`: Invalid arguments or options
- `3`: CSV file not found or unreadable
- `4`: Lighthouse dependency missing (with prompt to install)
- `5`: Fatal error (e.g., disk full, permissions error)

---

### `version`

Show Kind Beacon version.

**Usage**:
```bash
kind-beacon --version
kind-beacon -v
```

**Output**:
```
kind-beacon v1.0.0
Lighthouse v11.3.0
Node.js v18.18.0
```

**Exit Code**: `0`

---

### `help`

Show help message with usage instructions.

**Usage**:
```bash
kind-beacon --help
kind-beacon -h
kind-beacon audit --help
```

**Output**:
```
Kind Beacon - Core Web Vitals Auditing Tool

Usage: kind-beacon <command> [options]

Commands:
  audit <csv-file>    Run Lighthouse audits on URLs from CSV file

Options:
  -c, --concurrency <number>   Max simultaneous audits (default: 3)
  -t, --timeout <seconds>      Audit timeout in seconds (default: 60)
  -d, --device <type>          Device emulation: mobile|desktop (default: mobile)
  --data-dir <path>            Output directory for JSON data (default: ./data)
  --reports-dir <path>         Output directory for HTML reports (default: ./reports)
  --config <file>              Path to config file
  -h, --help                   Show help message
  -v, --version                Show version number

Examples:
  kind-beacon audit urls.csv
  kind-beacon audit urls.csv --device desktop --concurrency 5
  kind-beacon audit urls.csv -c 3 -t 90 -d mobile

For more information: https://github.com/kind-beacon/kind-beacon
```

**Exit Code**: `0`

---

## CSV File Format

### Supported Formats

**With Headers**:
```csv
url,description
https://example.com,Homepage
https://example.com/about,About Page
https://example.org,Another Site
```

**Without Headers** (plain list):
```csv
https://example.com
https://example.com/about
https://example.org
```

**Auto-Detection**:
- Tool automatically detects presence of headers
- If first row contains "url", "URL", or "link" column, treats as headers
- Otherwise, treats each row as a plain URL

### URL Column Mapping

If headers present, tool searches for URL column in this order:
1. Column named `url` (case-insensitive)
2. Column named `URL`
3. Column named `link`
4. First column

### Validation

- **Valid URLs**: Must start with `http://` or `https://`
- **Invalid URLs**: Logged to stderr, skipped during processing
- **Empty Lines**: Ignored
- **Comments**: Not supported (lines starting with # will fail validation)

---

## Configuration File

### Locations Searched (in order)

1. Path specified by `--config` option
2. `.kindbeaconrc.json`
3. `.kindbeaconrc.yaml`
4. `.kindbeaconrc.js`
5. `kindbeacon` property in `package.json`

### Format

**JSON** (`.kindbeaconrc.json`):
```json
{
  "concurrency": 5,
  "timeout": 90,
  "device": "desktop",
  "dataDir": "/Users/me/beacon-data",
  "reportsDir": "/Users/me/beacon-reports"
}
```

**YAML** (`.kindbeaconrc.yaml`):
```yaml
concurrency: 5
timeout: 90
device: desktop
dataDir: /Users/me/beacon-data
reportsDir: /Users/me/beacon-reports
```

**JavaScript** (`.kindbeaconrc.js`):
```javascript
module.exports = {
  concurrency: 5,
  timeout: 90,
  device: 'desktop',
  dataDir: '/Users/me/beacon-data',
  reportsDir: '/Users/me/beacon-reports'
};
```

### Precedence

Highest to lowest:
1. CLI arguments
2. Config file
3. Default values

---

## Progress Indicators

### Spinner (for single URL processing)

```
⠋ Auditing https://example.com...
```

### Progress Bar (for batch processing)

```
Auditing URLs... ████████████████████░░░░░░░░  68% (34/50) - ETA: 2m 15s
```

### Status Icons

- `✓` Success
- `✗` Failure
- `⏭` Skipped (invalid URL)
- `⟳` Retrying

---

## Error Messages

### User-Friendly Errors

**CSV File Not Found**:
```
Error: CSV file not found: urls.csv

Usage: kind-beacon audit <csv-file>

Make sure the file exists and the path is correct.
```

**Invalid Concurrency Value**:
```
Error: Concurrency must be between 1 and 10 (got: 15)

Use: kind-beacon audit urls.csv --concurrency 5
```

**Lighthouse Not Installed**:
```
Error: Lighthouse not found.

Kind Beacon requires Lighthouse to run audits.

Install now? (y/n)
> y

Installing lighthouse...
✓ Lighthouse installed successfully!

Run your audit again: kind-beacon audit urls.csv
```

**Disk Space Low**:
```
Error: Insufficient disk space to save reports.

Available: 120 MB
Required: ~200 MB (for 100 URLs)

Free up space or reduce the number of URLs.
```

---

## Exit Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success - all audits completed successfully | All 50 URLs audited without errors |
| `1` | Partial failure - some audits failed but process completed | 48/50 successful, 2 timeouts |
| `2` | Invalid arguments | `kind-beacon audit --concurrency abc` |
| `3` | Input file error | CSV file missing or unreadable |
| `4` | Dependency missing | Lighthouse not installed |
| `5` | Fatal error | Disk full, permissions denied |

---

## Integration with Other Tools

### Shell Scripts

```bash
#!/bin/bash

# Run audit and check exit code
kind-beacon audit urls.csv -c 5 -d mobile

if [ $? -eq 0 ]; then
  echo "All audits successful!"
  # Upload reports to S3, send notification, etc.
else
  echo "Some audits failed. Check logs."
fi
```

### CI/CD Pipelines

```yaml
# GitHub Actions example
- name: Run Kind Beacon Audits
  run: |
    npm install -g kind-beacon
    kind-beacon audit urls.csv --device mobile --concurrency 3
  continue-on-error: true  # Don't fail CI if some URLs timeout

- name: Upload Reports
  uses: actions/upload-artifact@v2
  with:
    name: lighthouse-reports
    path: reports/
```

### Cron Jobs

```cron
# Daily audits at 2 AM
0 2 * * * /usr/local/bin/kind-beacon audit /home/user/urls.csv -c 5 >> /var/log/kind-beacon.log 2>&1
```

---

## Future Extensions (Not in v1.0)

Potential CLI enhancements:

- `kind-beacon compare <report1> <report2>` - Compare two audit reports
- `kind-beacon trend <domain>` - Show performance trends for a domain
- `kind-beacon watch <url>` - Continuous monitoring mode
- `--format json` - Output results in JSON format (in addition to human-readable)
- `--quiet` - Suppress progress output (useful for automation)
- `--only-failures` - Only log failed audits

---

## References

- Commander.js Documentation: https://github.com/tj/commander.js
- CLI Best Practices: https://clig.dev/
- Exit Code Conventions: https://tldp.org/LDP/abs/html/exitcodes.html

---

**Contract Status**: Complete | **Next Step**: Quickstart Guide | **Date**: 2025-10-22
