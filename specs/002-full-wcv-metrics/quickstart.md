# Quickstart Guide: Full Web Core Vitals Metrics

**Feature**: 002-full-wcv-metrics
**Date**: 2025-10-22

## Overview

This guide demonstrates how to use the enhanced Core Web Vitals auditing tool with full Lighthouse metrics (accessibility, SEO, best practices) and timestamped reports.

---

## What's New

### Comprehensive Metrics

The tool now captures **four complete metric categories** for every audit:

1. **Performance & Core Web Vitals** (existing): LCP, INP, CLS, TTFB, TBT, Performance Score
2. **Accessibility** (new): WCAG compliance, color contrast, ARIA usage, alt text, and more
3. **SEO** (new): Meta tags, mobile-friendliness, structured data, crawlability
4. **Best Practices** (new): HTTPS usage, browser errors, library vulnerabilities, permissions

### Timestamped Reports

Report filenames now include **timestamps for chronological organization**:

**Before**: `example-com_mobile.html`
**After**: `example-com_2025-10-22-143052_mobile.html`

**Benefits**:
- ✅ Automatically sorted chronologically (newest first/last when sorted by name)
- ✅ Never overwrite previous reports
- ✅ Easy to track changes over time
- ✅ Human-readable dates at a glance

---

## Basic Usage

### Single URL Audit

Audit one website with full metrics:

```bash
kind-beacon audit https://example.com
```

**Output**:
```
📊 Auditing: https://example.com
✓ Performance: 95/100
✓ Accessibility: 88/100
✓ SEO: 92/100
✓ Best Practices: 85/100

Reports saved:
  📄 example-com_2025-10-22-143052_mobile.html
  📄 example-com_2025-10-22-143052_mobile.json
```

---

### Batch URL Audits

Audit multiple URLs from a CSV file:

**urls.csv**:
```csv
url
https://example.com
https://google.com
https://github.com
```

**Command**:
```bash
kind-beacon audit urls.csv
```

**Output**:
```
📊 Batch audit: 3 URLs
✓ example.com (1/3) - All metrics: ✓
✓ google.com (2/3) - All metrics: ✓
✓ github.com (3/3) - All metrics: ✓

Reports saved to: ./reports/2025-10-22/
  📄 example-com_2025-10-22-143105_mobile.html
  📄 google-com_2025-10-22-143132_mobile.html
  📄 github-com_2025-10-22-143159_mobile.html
```

**Note**: Each report includes a unique timestamp based on when the audit started.

---

## Understanding Reports

### HTML Report Structure

Reports now use an **accordion layout** with a summary dashboard:

```
╔═══════════════════════════════════════╗
║     AUDIT SUMMARY DASHBOARD           ║
║  ┌──────────┬──────────┬──────────┐   ║
║  │Perf: 95  │A11y: 88  │ SEO: 92  │   ║
║  │Best: 85  │Device:📱 │Date:10/22│   ║
║  └──────────┴──────────┴──────────┘   ║
╚═══════════════════════════════════════╝

▼ Performance (Expanded by default)
  ✓ Core Web Vitals
    • LCP: 2.1s (good)
    • INP: 150ms (good)
    • CLS: 0.08 (good)

  ⚠ Issues Found: 2
    • Total Blocking Time: 180ms
    • First Contentful Paint: 1.8s

▶ Accessibility (Click to expand)
  ⚠ Issues Found: 8
  ✓ Passed Checks: 32

▶ SEO (Click to expand)
  ⚠ Issues Found: 3
  ✓ Passed Checks: 12

▶ Best Practices (Click to expand)
  ⚠ Issues Found: 5
  ✓ Passed Checks: 18
```

**Key Features**:
- **Summary Dashboard**: See all four scores at a glance
- **Expandable Sections**: Click to see detailed findings
- **Issue Prioritization**: Failing audits shown first
- **Color Coding**:
  - 🟢 Green (90-100): Excellent
  - 🟡 Yellow (50-89): Needs improvement
  - 🔴 Red (0-49): Poor

---

### JSON Report Structure

JSON reports contain structured data for programmatic access:

```json
{
  "audit": {
    "url": "https://example.com",
    "timestamp": "2025-10-22T14:30:52.000Z",
    "domain": "example.com",
    "deviceMode": "mobile",
    "categories": {
      "performance": 95,
      "accessibility": 88,
      "seo": 92,
      "bestPractices": 85
    }
  },
  "metrics": {
    "lcp": 2100,
    "lcpScore": "good",
    "inp": 150,
    "inpScore": "good",
    "cls": 0.08,
    "clsScore": "good",
    "performanceScore": 95,
    "accessibilityScore": 88,
    "seoScore": 92,
    "bestPracticesScore": 85,
    "categoryDetails": {
      "accessibility": {
        "score": 88,
        "auditCount": { "passing": 32, "failing": 8 },
        "audits": [
          {
            "id": "color-contrast",
            "title": "Background and foreground colors have sufficient contrast",
            "score": 0.8,
            "weight": 7,
            "displayValue": "8 elements"
          }
        ]
      },
      "seo": { /* ... */ },
      "bestPractices": { /* ... */ }
    }
  }
}
```

---

## Report Organization

### File Naming Convention

**Format**: `{domain}_{timestamp}_{device}.{extension}`

**Components**:
- `domain`: example-com (dots → hyphens, special chars removed)
- `timestamp`: 2025-10-22-143052 (UTC, ISO 8601)
- `device`: mobile or desktop
- `extension`: html or json

**Examples**:
```
example-com_2025-10-22-143052_mobile.html
example-com_2025-10-22-143052_mobile.json
example-com_2025-10-23-091530_desktop.html
google-com_2025-10-22-143105_mobile.html
```

### Chronological Sorting

Files automatically sort chronologically when arranged alphabetically:

```bash
ls reports/2025-10-22/ | sort
```

**Output**:
```
example-com_2025-10-22-090000_mobile.html
example-com_2025-10-22-120000_mobile.html  ← Noon
example-com_2025-10-22-180000_mobile.html  ← Evening
google-com_2025-10-22-090530_mobile.html
```

**Tip**: Use `ls -t` or `ls -r` to reverse order (newest first).

---

## Common Workflows

### Track Performance Over Time

Run audits at regular intervals to track trends:

```bash
# Monday baseline
kind-beacon audit https://example.com

# After deployment (Wednesday)
kind-beacon audit https://example.com

# Week later
kind-beacon audit https://example.com
```

**Result**: Three timestamped reports for comparison
```
example-com_2025-10-22-100000_mobile.html  (Mon)
example-com_2025-10-24-143000_mobile.html  (Wed)
example-com_2025-10-29-100000_mobile.html  (Next Mon)
```

Open reports side-by-side to compare scores and identify regressions.

---

### Compare Mobile vs Desktop

Audit both device types:

```bash
kind-beacon audit https://example.com --device mobile
kind-beacon audit https://example.com --device desktop
```

**Result**: Two reports from the same time period
```
example-com_2025-10-22-143052_mobile.html
example-com_2025-10-22-143108_desktop.html
```

Compare how metrics differ between mobile and desktop experiences.

---

### Audit All Pages in Staging

Create a CSV with all important pages:

**staging-urls.csv**:
```csv
url
https://staging.example.com/
https://staging.example.com/products
https://staging.example.com/about
https://staging.example.com/contact
https://staging.example.com/pricing
```

```bash
kind-beacon audit staging-urls.csv --output ./reports/staging/
```

**Result**: Comprehensive site health snapshot
```
reports/staging/2025-10-22/
  ├── staging-example-com_2025-10-22-150000_mobile.html
  ├── staging-example-com-products_2025-10-22-150015_mobile.html
  ├── staging-example-com-about_2025-10-22-150030_mobile.html
  ├── staging-example-com-contact_2025-10-22-150045_mobile.html
  └── staging-example-com-pricing_2025-10-22-150100_mobile.html
```

---

## Interpreting Scores

### Score Ranges

| Range | Label | Meaning | Action |
|-------|-------|---------|--------|
| **90-100** | Excellent | Best practices followed | Maintain standards |
| **50-89** | Good | Minor issues | Address failing audits |
| **0-49** | Poor | Significant problems | Immediate attention needed |

### Category-Specific Guidance

#### Performance (Core Web Vitals)

**Focus Areas**:
- **LCP < 2.5s**: Optimize largest content element (images, hero sections)
- **INP < 200ms**: Reduce JavaScript execution time, optimize event handlers
- **CLS < 0.1**: Prevent layout shifts (reserve space for images, avoid inserting content above fold)

**Impact**: Directly affects Google search rankings and user experience.

#### Accessibility

**Focus Areas**:
- **Color Contrast**: Ensure text meets WCAG AA standards (4.5:1 ratio)
- **Alt Text**: Provide descriptive alt attributes for all images
- **ARIA Labels**: Use proper ARIA attributes for interactive elements
- **Keyboard Navigation**: Ensure all functionality accessible via keyboard

**Impact**: Legal compliance (ADA), reach more users, better SEO.

#### SEO

**Focus Areas**:
- **Meta Tags**: Unique title and description for every page
- **Mobile-Friendly**: Viewport meta tag, responsive design
- **Crawlability**: Allow search engine indexing (robots.txt, meta robots)
- **Structured Data**: Schema.org markup for rich results

**Impact**: Search engine visibility, click-through rates, rich snippets.

#### Best Practices

**Focus Areas**:
- **HTTPS**: Use secure connections for all resources
- **Console Errors**: Fix JavaScript errors that break functionality
- **Library Vulnerabilities**: Update dependencies with known security issues
- **Permissions**: Don't request geolocation/notifications on page load

**Impact**: Security, trust, user experience, browser compatibility.

---

## Advanced Usage

### Custom Output Directory

Save reports to a specific location:

```bash
kind-beacon audit urls.csv --output ./reports/2025-10-22/
```

**Result**: All reports saved to specified directory with timestamps
```
reports/2025-10-22/
  ├── example-com_2025-10-22-143052_mobile.html
  ├── example-com_2025-10-22-143052_mobile.json
  ├── google-com_2025-10-22-143105_mobile.html
  └── google-com_2025-10-22-143105_mobile.json
```

---

### Concurrent Batch Processing

Speed up batch audits with concurrency:

```bash
kind-beacon audit urls.csv --concurrent 3
```

Runs 3 audits in parallel. **Note**: Each audit still gets a unique timestamp.

---

### Filter by Score Threshold

Generate reports only for pages below a threshold:

```bash
kind-beacon audit urls.csv --min-score 80
```

Only saves reports for pages with any category score below 80. Useful for CI/CD pipelines.

---

## Troubleshooting

### Report Not Found

**Issue**: Old report filename format still in use

**Solution**: Check filename format. After this update, all new reports include timestamps:
- ✅ New: `example-com_2025-10-22-143052_mobile.html`
- ❌ Old: `example-com_mobile.html`

Old reports remain valid but won't include new categories (accessibility, SEO, best practices).

---

### Timestamp Confusion

**Issue**: Timestamps don't match local time

**Solution**: Timestamps are in UTC (Coordinated Universal Time). Convert to your timezone:
- `2025-10-22-143052` (UTC) = `2025-10-22 7:30:52 AM` (PDT, UTC-7)
- Use `date` command: `date -u -d "2025-10-22 14:30:52"`

**Why UTC**: Prevents ambiguity during DST transitions, consistent across timezones.

---

### Missing Category Data

**Issue**: Report shows performance but not accessibility/SEO/best practices

**Solution**:
1. Verify using latest version: `kind-beacon --version`
2. Check JSON report for `categoryDetails` field
3. If missing, re-run audit with updated tool

Old reports (before this feature) only contain performance metrics.

---

## Integration Examples

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Lighthouse Audit
on: [push]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install kind-beacon
        run: npm install -g kind-beacon
      - name: Run audit
        run: kind-beacon audit https://staging.example.com
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: lighthouse-reports-${{ github.sha }}
          path: reports/**/*.html
```

**Result**: Timestamped reports for every commit, stored as artifacts.

---

### Automated Regression Detection

```bash
#!/bin/bash
# Compare latest audit with baseline

BASELINE="example-com_2025-10-22-100000_mobile.json"
LATEST=$(ls -t example-com_*_mobile.json | head -1)

BASELINE_SCORE=$(jq '.audit.categories.performance' "$BASELINE")
LATEST_SCORE=$(jq '.audit.categories.performance' "$LATEST")

if (( $(echo "$LATEST_SCORE < $BASELINE_SCORE - 5" | bc -l) )); then
  echo "⚠ Performance regression detected!"
  echo "Baseline: $BASELINE_SCORE"
  echo "Latest: $LATEST_SCORE"
  exit 1
fi
```

**Result**: Automated alerts when scores drop more than 5 points.

---

## Best Practices

### Regular Audits

- **Pre-deployment**: Audit staging environment before production release
- **Post-deployment**: Verify production scores after deployment
- **Weekly/Monthly**: Track trends over time with regular snapshots

### Organize Reports

```
reports/
├── 2025-10-22/           # Daily folders
│   ├── example-com_2025-10-22-143052_mobile.html
│   └── example-com_2025-10-22-180000_mobile.html
├── 2025-10-23/
│   └── example-com_2025-10-23-090000_mobile.html
└── baselines/           # Reference audits
    └── example-com_production-v1_mobile.html
```

### Focus on Trends

- Single audit scores fluctuate (network conditions, server load)
- Look for consistent patterns across multiple audits
- Prioritize fixing issues that appear repeatedly

### Share Reports

- HTML reports are self-contained (no external dependencies)
- Share via email, Slack, or web hosting
- Use JSON reports for automated analysis and dashboards

---

## Next Steps

1. **Run Your First Audit**: `kind-beacon audit https://example.com`
2. **Compare Results**: Run again tomorrow, compare timestamps
3. **Fix Issues**: Use report findings to improve scores
4. **Automate**: Add audits to CI/CD pipeline
5. **Track Progress**: Build a library of timestamped reports over time

---

## Questions & Support

For issues or questions about this feature:
- GitHub Issues: https://github.com/kind-beacon/kind-beacon/issues
- Documentation: https://github.com/kind-beacon/kind-beacon#readme

---

**Happy Auditing!** 🚀
