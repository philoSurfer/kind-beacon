# Quickstart Guide: Kind Beacon

**Feature**: Core Web Vitals Reporter | **Date**: 2025-10-22 | **Status**: Complete

## Overview

Kind Beacon is a macOS CLI tool that automates Core Web Vitals performance auditing using Google Lighthouse. This guide helps you get started quickly with basic usage and common scenarios.

---

## Prerequisites

- **macOS** (Darwin)
- **Node.js 18+** (LTS)
- **npm** (comes with Node.js)

**Check if you have Node.js**:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**Install Node.js** (if needed):
```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/
```

---

## Installation

### Option 1: npm Global Install (Recommended)

```bash
npm install -g kind-beacon
```

**Verify installation**:
```bash
kind-beacon --version
# Output: kind-beacon v1.0.0
```

### Option 2: npx (No Installation)

Run directly without installing:
```bash
npx kind-beacon audit urls.csv
```

### Option 3: Local Development

Clone and link for development:
```bash
git clone https://github.com/your-org/kind-beacon.git
cd kind-beacon
npm install
npm link
```

---

## Quick Start (3 Steps)

### 1. Create a CSV File with URLs

Create `urls.csv`:
```csv
url
https://example.com
https://google.com
https://github.com
```

**Or** a plain list (no headers):
```csv
https://example.com
https://google.com
https://github.com
```

### 2. Run Your First Audit

```bash
kind-beacon audit urls.csv
```

**Expected output**:
```
[1/3] Auditing https://example.com... ✓ (LCP: 1.8s, INP: 150ms, CLS: 0.05) - 45s
[2/3] Auditing https://google.com... ✓ (LCP: 0.9s, INP: 80ms, CLS: 0.01) - 38s
[3/3] Auditing https://github.com... ✓ (LCP: 1.2s, INP: 110ms, CLS: 0.03) - 42s

Summary:
✓ 3 successful audits
✗ 0 failed audits
⏱  Total time: 2m 5s
📊 Reports saved to: ./reports/
💾 Data saved to: ./data/
```

### 3. View Your Results

**HTML Reports** (open in browser):
```bash
open reports/example-com-2025-10-22-report.html
```

**JSON Data** (for analysis):
```bash
cat data/example-com-2025-10-22-report.json
```

---

## Common Usage Scenarios

### Scenario 1: Desktop Performance Audit

Test how your site performs on desktop:

```bash
kind-beacon audit urls.csv --device desktop
```

**Use case**: Compare mobile vs. desktop performance

### Scenario 2: High-Concurrency Batch Audit

Process 100 URLs faster with higher concurrency:

```bash
kind-beacon audit large-urls.csv --concurrency 5
```

**Use case**: Weekly site-wide performance audits

### Scenario 3: Slow Sites with Extended Timeout

Audit sites that take longer to load:

```bash
kind-beacon audit slow-sites.csv --timeout 120
```

**Use case**: Auditing sites with heavy media or slow servers

### Scenario 4: Custom Output Directories

Organize reports by date or project:

```bash
kind-beacon audit urls.csv \
  --data-dir /Users/me/audits/$(date +%Y-%m-%d)/data \
  --reports-dir /Users/me/audits/$(date +%Y-%m-%d)/reports
```

**Use case**: Archiving audit results by date

### Scenario 5: Configuration File for Consistent Settings

Create `.kindbeaconrc.json`:
```json
{
  "concurrency": 5,
  "timeout": 90,
  "device": "mobile",
  "dataDir": "/Users/me/beacon-audits/data",
  "reportsDir": "/Users/me/beacon-audits/reports"
}
```

Then run:
```bash
kind-beacon audit urls.csv
```

**Use case**: Team-wide consistent audit configuration

---

## Understanding the Output

### Console Progress

```
[12/50] Auditing https://example.com... ✓ (LCP: 1.8s, INP: 150ms, CLS: 0.05) - 45s
 │       │                                 │  └─ Audit duration
 │       │                                 └─ Core Web Vitals scores
 │       └─ URL being audited
 └─ Progress (current/total)
```

### Status Icons

| Icon | Meaning | Description |
|------|---------|-------------|
| ✓ | Success | Audit completed successfully |
| ✗ | Failure | Audit failed (timeout or error) |
| ⏭ | Skipped | Invalid URL, not audited |
| ⟳ | Retrying | First attempt failed, retrying once |

### Core Web Vitals Quick Reference

| Metric | Good | Needs Improvement | Poor | What It Measures |
|--------|------|-------------------|------|------------------|
| **LCP** | < 2.5s | 2.5-4.0s | > 4.0s | Time to render largest content |
| **INP** | < 200ms | 200-500ms | > 500ms | Interaction responsiveness |
| **CLS** | < 0.1 | 0.1-0.25 | > 0.25 | Visual stability (layout shift) |
| **TTFB** | < 0.8s | 0.8-1.8s | > 1.8s | Server response time |

---

## File Organization

After running audits, your directory structure looks like this:

```
.
├── urls.csv                                    # Your input CSV
├── .kindbeaconrc.json                          # Config file (optional)
├── data/                                       # JSON data files
│   ├── example-com-2025-10-22-report.json
│   ├── google-com-2025-10-22-report.json
│   └── github-com-2025-10-22-report.json
└── reports/                                    # HTML reports
    ├── example-com-2025-10-22-report.html
    ├── google-com-2025-10-22-report.html
    └── github-com-2025-10-22-report.html
```

**Note**: Add `data/` and `reports/` to `.gitignore` to avoid committing large files.

---

## Troubleshooting

### Problem: "Lighthouse not found"

**Solution**: Install Lighthouse
```bash
npm install -g lighthouse

# Or let Kind Beacon install it
kind-beacon audit urls.csv
# Follow the prompt to auto-install
```

### Problem: "Some audits are timing out"

**Solution**: Increase timeout
```bash
kind-beacon audit urls.csv --timeout 120
```

**Or**: Check if URLs are accessible
```bash
curl -I https://your-slow-site.com
```

### Problem: "Process is slow with 100+ URLs"

**Solution**: Increase concurrency (carefully)
```bash
kind-beacon audit urls.csv --concurrency 5
```

**Warning**: Don't set concurrency too high (> 10) as it may:
- Overwhelm target servers (rate limiting)
- Consume excessive CPU/memory
- Reduce audit accuracy

### Problem: "Disk space full" error

**Solution**: Check available space
```bash
df -h .
```

**Estimate**: ~2-3 MB per URL (HTML report + JSON data)
- 100 URLs = ~250 MB
- 1000 URLs = ~2.5 GB

### Problem: "Permission denied" writing reports

**Solution**: Check directory permissions
```bash
mkdir -p ./data ./reports
chmod 755 ./data ./reports
```

**Or**: Use custom directories you have access to
```bash
kind-beacon audit urls.csv --data-dir ~/audits/data --reports-dir ~/audits/reports
```

---

## Best Practices

### 1. Start Small

Test with 3-5 URLs first to verify everything works:
```bash
kind-beacon audit sample.csv
```

### 2. Use Concurrency Wisely

- **3-5 concurrent audits**: Safe default for most use cases
- **1-2 concurrent**: For slow servers or rate-limited sites
- **5-10 concurrent**: For fast, unrestricted bulk audits

### 3. Regular Audits with Cron

Set up daily audits:
```bash
crontab -e

# Add this line (audit at 2 AM daily)
0 2 * * * /usr/local/bin/kind-beacon audit /path/to/urls.csv >> /var/log/beacon.log 2>&1
```

### 4. Track Trends Over Time

Keep historical data organized:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
kind-beacon audit urls.csv \
  --data-dir ./history/$DATE/data \
  --reports-dir ./history/$DATE/reports
```

Then analyze trends:
```bash
# Compare LCP scores over time
jq '.metrics.lcp' history/*/data/example-com-*.json
```

### 5. Share Reports with Stakeholders

HTML reports are self-contained and shareable:
```bash
# Email report
mail -s "Performance Audit: $(date)" team@example.com < reports/example-com-2025-10-22-report.html

# Upload to cloud storage
aws s3 cp reports/ s3://your-bucket/lighthouse-reports/ --recursive
```

---

## Next Steps

### Analyze Historical Data

Use `jq` to extract metrics from JSON files:

```bash
# Get all LCP scores for a domain
jq '.metrics.lcp' data/example-com-*.json

# Find audits with poor CLS
jq 'select(.metrics.clsScore == "poor") | .audit.url' data/*.json

# Average performance score
jq -s '[.[].metrics.performanceScore] | add / length' data/*.json
```

### Build Trend Dashboards

Future tool idea (not in v1.0):
```bash
kind-beacon trend example.com --days 30
```

Expected output:
```
example.com - 30-day performance trend

LCP:  ▂▃▄▄▃▂▂▁▁▂▃▄ (avg: 1.8s)
INP:  ▂▂▃▃▂▂▁▁▂▂▃▃ (avg: 150ms)
CLS:  ▁▁▂▁▁▁▁▁▁▁▁▁ (avg: 0.05)
Score: 85 → 92 (+7 points)
```

### Integration Examples

**Slack Notifications**:
```bash
#!/bin/bash
kind-beacon audit urls.csv -c 5

if [ $? -ne 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Some Lighthouse audits failed! Check reports."}' \
    $SLACK_WEBHOOK_URL
fi
```

**Performance Budgets**:
```javascript
// Check if LCP exceeds budget
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/example-com-2025-10-22-report.json'));

if (data.metrics.lcp > 2500) {
  console.error(`LCP budget exceeded: ${data.metrics.lcp}ms > 2500ms`);
  process.exit(1);
}
```

---

## Help & Support

### Get Help

```bash
kind-beacon --help
kind-beacon audit --help
```

### Report Issues

GitHub: https://github.com/your-org/kind-beacon/issues

### Community

- Discussions: https://github.com/your-org/kind-beacon/discussions
- Twitter: @kindbeacon

---

## Advanced Configuration

### Environment Variables

```bash
export KINDBEACON_CONCURRENCY=5
export KINDBEACON_DEVICE=desktop

kind-beacon audit urls.csv
```

### Programmatic Usage (Node.js API)

```javascript
import { runAudit } from 'kind-beacon';

const results = await runAudit('urls.csv', {
  concurrency: 5,
  device: 'mobile',
  timeout: 60
});

console.log(results);
```

---

## Summary

**Quick Reference**:

```bash
# Basic usage
kind-beacon audit urls.csv

# Desktop with higher concurrency
kind-beacon audit urls.csv -d desktop -c 5

# Extended timeout for slow sites
kind-beacon audit urls.csv -t 120

# Custom output directories
kind-beacon audit urls.csv --data-dir ~/audits/data --reports-dir ~/audits/reports

# Use config file
echo '{"concurrency": 5, "device": "desktop"}' > .kindbeaconrc.json
kind-beacon audit urls.csv
```

**Key Takeaways**:
- ✓ Start with small CSV (3-5 URLs) to test
- ✓ Use default concurrency (3) unless needed
- ✓ Increase timeout (--timeout) for slow sites
- ✓ Save historical data for trend analysis
- ✓ Share HTML reports with stakeholders

---

**Quickstart Status**: Complete | **Ready for Implementation** | **Date**: 2025-10-22
