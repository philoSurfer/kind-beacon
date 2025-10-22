# Data Model: Core Web Vitals Reporter

**Feature**: Core Web Vitals Reporter | **Date**: 2025-10-22 | **Status**: Complete

## Overview

This document defines the data structures for Kind Beacon, a CLI tool that audits URLs for Core Web Vitals performance using Lighthouse. The data model focuses on three main entities: audit metadata, performance metrics, and configuration.

---

## Entities

### 1. URL Audit

Represents a single Lighthouse audit run for one URL.

**Purpose**: Track metadata about when, where, and how an audit was performed.

**Attributes**:

| Attribute | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `url` | string | Yes | The URL that was audited (final URL after redirects) | `"https://example.com"` |
| `requestedUrl` | string | Yes | The original URL from CSV (may differ from final URL) | `"http://example.com"` |
| `timestamp` | string (ISO 8601) | Yes | When the audit was performed (UTC) | `"2025-10-22T14:30:00.000Z"` |
| `domain` | string | Yes | Top-level domain extracted from URL (for file naming) | `"example.com"` |
| `lighthouseVersion` | string | Yes | Version of Lighthouse used for audit | `"11.3.0"` |
| `deviceMode` | enum | Yes | Device emulation used: `"mobile"` or `"desktop"` | `"mobile"` |
| `auditDuration` | number | Yes | Time taken to complete audit (milliseconds) | `45230` |
| `status` | enum | Yes | Audit outcome: `"success"`, `"failed"`, `"timeout"` | `"success"` |
| `error` | string | No | Error message if status is `"failed"` or `"timeout"` | `"Network timeout after 60s"` |
| `retryAttempt` | number | Yes | Whether this was a retry (0 = first attempt, 1 = retried once) | `0` |

**Validation Rules**:
- `url` and `requestedUrl` must be valid HTTP/HTTPS URLs
- `timestamp` must be valid ISO 8601 format
- `domain` must match extracted domain from `url`
- `deviceMode` must be either `"mobile"` or `"desktop"`
- `status` must be one of: `"success"`, `"failed"`, `"timeout"`
- `auditDuration` must be positive number
- `retryAttempt` must be 0 or 1 (per spec: retry once)
- `error` required if `status` is not `"success"`

**Relationships**:
- One URL Audit has exactly one set of Core Web Vitals Metrics (if successful)
- One URL Audit relates to one CSV Input row

---

### 2. Core Web Vitals Metrics

The performance measurements collected from Lighthouse.

**Purpose**: Store Core Web Vitals scores and thresholds for trend analysis.

**Attributes**:

| Attribute | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lcp` | number | Yes | Largest Contentful Paint (milliseconds) | `1800` |
| `lcpScore` | enum | Yes | LCP threshold: `"good"`, `"needs-improvement"`, `"poor"` | `"good"` |
| `fid` | number | No | First Input Delay (milliseconds) - deprecated, may not be available | `85` |
| `inp` | number | Yes | Interaction to Next Paint (milliseconds) - replaces FID | `150` |
| `inpScore` | enum | Yes | INP threshold: `"good"`, `"needs-improvement"`, `"poor"` | `"good"` |
| `cls` | number | Yes | Cumulative Layout Shift (unitless score) | `0.05` |
| `clsScore` | enum | Yes | CLS threshold: `"good"`, `"needs-improvement"`, `"poor"` | `"good"` |
| `ttfb` | number | Yes | Time to First Byte (milliseconds) | `200` |
| `ttfbScore` | enum | Yes | TTFB threshold: `"good"`, `"needs-improvement"`, `"poor"` | `"good"` |
| `tbt` | number | Yes | Total Blocking Time (milliseconds) | `150` |
| `performanceScore` | number | Yes | Overall Lighthouse performance score (0-100) | `92` |

**Validation Rules**:
- All metric values must be non-negative numbers
- Threshold scores must be one of: `"good"`, `"needs-improvement"`, `"poor"`
- `performanceScore` must be between 0 and 100
- `cls` typically ranges from 0 to ~0.5 (higher indicates more layout shift)
- `lcp`, `inp`, `ttfb`, `tbt` measured in milliseconds

**Threshold Definitions** (per Google's Core Web Vitals):
- **LCP**: Good < 2500ms, Needs Improvement 2500-4000ms, Poor > 4000ms
- **INP**: Good < 200ms, Needs Improvement 200-500ms, Poor > 500ms
- **CLS**: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
- **TTFB**: Good < 800ms, Needs Improvement 800-1800ms, Poor > 1800ms

**Relationships**:
- One Metrics object belongs to exactly one URL Audit
- Embedded within URL Audit in stored JSON

---

### 3. CSV Input

Represents the list of URLs to audit from a CSV file.

**Purpose**: Track source CSV metadata for audit provenance.

**Attributes**:

| Attribute | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `filePath` | string | Yes | Path to the CSV file | `"/Users/me/urls.csv"` |
| `totalUrls` | number | Yes | Total number of URLs found in CSV | `50` |
| `validUrls` | number | Yes | Number of valid HTTP/HTTPS URLs | `48` |
| `invalidUrls` | number | Yes | Number of malformed or invalid URLs | `2` |
| `hasHeaders` | boolean | Yes | Whether CSV file had column headers | `true` |
| `urlColumn` | string | No | Name of column containing URLs (if headers present) | `"url"` |

**Validation Rules**:
- `filePath` must be valid file system path
- `totalUrls` = `validUrls` + `invalidUrls`
- All counts must be non-negative integers
- `urlColumn` only present if `hasHeaders` is `true`

**Relationships**:
- One CSV Input results in multiple URL Audits
- CSV Input metadata stored separately from individual audit results

---

### 4. Configuration

User-configurable settings for audit execution.

**Purpose**: Persist user preferences across runs; allow CLI argument overrides.

**Attributes**:

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concurrency` | number | No | `3` | Max simultaneous Lighthouse audits |
| `timeout` | number | No | `60` | Audit timeout in seconds |
| `device` | enum | No | `"mobile"` | Device emulation: `"mobile"` or `"desktop"` |
| `dataDir` | string | No | `"./data"` | Output directory for JSON data files |
| `reportsDir` | string | No | `"./reports"` | Output directory for HTML reports |

**Validation Rules**:
- `concurrency` must be positive integer (1-10 recommended)
- `timeout` must be positive integer (seconds)
- `device` must be `"mobile"` or `"desktop"`
- Directory paths must be valid file system paths

**Source Hierarchy** (highest to lowest precedence):
1. CLI arguments (e.g., `--concurrency 5`)
2. Config file (e.g., `.kindbeaconrc.json`)
3. Default values

---

## File Formats

### Stored JSON Data File

Each audit results in one JSON file saved with naming pattern: `{domain}-{YYYY-MM-DD}-report.json`

**File Structure**:
```json
{
  "audit": {
    "url": "https://example.com",
    "requestedUrl": "http://example.com",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "domain": "example.com",
    "lighthouseVersion": "11.3.0",
    "deviceMode": "mobile",
    "auditDuration": 45230,
    "status": "success",
    "retryAttempt": 0
  },
  "metrics": {
    "lcp": 1800,
    "lcpScore": "good",
    "inp": 150,
    "inpScore": "good",
    "cls": 0.05,
    "clsScore": "good",
    "ttfb": 200,
    "ttfbScore": "good",
    "tbt": 150,
    "performanceScore": 92
  }
}
```

**File Naming Examples**:
- `example-com-2025-10-22-report.json`
- `subdomain-example-org-2025-10-23-report.json`
- `192-168-1-1-2025-10-24-report.json` (for IP addresses)

**Storage Location**: `{dataDir}/{filename}` (default: `./data/{filename}`)

### HTML Report File

Generated by Lighthouse's built-in HTML generator.

**File Naming**: Same pattern as JSON: `{domain}-{YYYY-MM-DD}-report.html`

**File Structure**: Self-contained HTML (2-3 MB) with embedded CSS/JS/assets

**Storage Location**: `{reportsDir}/{filename}` (default: `./reports/{filename}`)

---

## Data Flow

```
CSV File
  ↓
CSV Parser → Extract URLs
  ↓
URL Queue (with concurrency limit)
  ↓
Lighthouse Audit (per URL)
  ↓
Extract Metrics from LHR
  ↓
Store JSON Data (with audit metadata + metrics)
  ↓
Generate HTML Report
  ↓
Save to file system
```

**Concurrency**: Up to 3-5 URLs processed in parallel (configurable)

**Retry Logic**: If network error, retry once; if timeout or invalid URL, fail immediately

---

## State Transitions

### URL Audit Lifecycle

```
Pending
  ↓
Running (attempt 1)
  ↓
Success → Store JSON + Generate HTML → Complete
  OR
Failure (network error) → Retry (attempt 2)
  ↓
Success → Store JSON + Generate HTML → Complete
  OR
Failure (timeout/invalid/network) → Log Error → Complete
```

**Terminal States**:
- `success`: JSON and HTML files created
- `failed`: Error logged, no files created (or partial data)
- `timeout`: Timeout error logged, no files created

---

## Schema Evolution

### Version 1.0.0 (Initial)

Current schema as documented above.

### Future Considerations

Potential additions (not in current spec):
- Additional Lighthouse metrics (Speed Index, Accessibility score)
- Screenshot/filmstrip data
- Network request waterfall data
- Historical comparison (delta from previous audit)

**Migration Strategy**: Add new optional fields; maintain backward compatibility for parsing tools.

---

## Example Data Scenarios

### Scenario 1: Successful Mobile Audit

```json
{
  "audit": {
    "url": "https://www.example.com/",
    "requestedUrl": "https://www.example.com",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "domain": "example.com",
    "lighthouseVersion": "11.3.0",
    "deviceMode": "mobile",
    "auditDuration": 45230,
    "status": "success",
    "retryAttempt": 0
  },
  "metrics": {
    "lcp": 1800,
    "lcpScore": "good",
    "inp": 150,
    "inpScore": "good",
    "cls": 0.05,
    "clsScore": "good",
    "ttfb": 200,
    "ttfbScore": "good",
    "tbt": 150,
    "performanceScore": 92
  }
}
```

### Scenario 2: Failed Audit (Network Timeout After Retry)

```json
{
  "audit": {
    "url": null,
    "requestedUrl": "https://slow-site.example.com",
    "timestamp": "2025-10-22T14:35:00.000Z",
    "domain": "slow-site.example.com",
    "lighthouseVersion": "11.3.0",
    "deviceMode": "mobile",
    "auditDuration": 120500,
    "status": "timeout",
    "error": "Network timeout after 60 seconds (retry attempt failed)",
    "retryAttempt": 1
  },
  "metrics": null
}
```

### Scenario 3: Desktop Audit with Mixed Scores

```json
{
  "audit": {
    "url": "https://heavy-page.example.com/",
    "requestedUrl": "https://heavy-page.example.com",
    "timestamp": "2025-10-22T14:40:00.000Z",
    "domain": "heavy-page.example.com",
    "lighthouseVersion": "11.3.0",
    "deviceMode": "desktop",
    "auditDuration": 52100,
    "status": "success",
    "retryAttempt": 0
  },
  "metrics": {
    "lcp": 3200,
    "lcpScore": "needs-improvement",
    "inp": 450,
    "inpScore": "needs-improvement",
    "cls": 0.15,
    "clsScore": "needs-improvement",
    "ttfb": 1200,
    "ttfbScore": "needs-improvement",
    "tbt": 580,
    "performanceScore": 58
  }
}
```

---

## References

- **Core Web Vitals**: https://web.dev/vitals/
- **Lighthouse Report (LHR) Format**: https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
- **ISO 8601 Timestamps**: https://en.wikipedia.org/wiki/ISO_8601

---

**Data Model Status**: Complete | **Next Step**: CLI Contracts | **Date**: 2025-10-22
