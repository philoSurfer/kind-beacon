# Research: Kind Beacon - Node.js CLI Best Practices & Testing

**Feature**: Core Web Vitals Reporter | **Date**: 2025-10-22 | **Status**: Complete

## Executive Summary

This research consolidates technology decisions and best practices for Kind Beacon, a Node.js CLI tool for Core Web Vitals auditing using Lighthouse. It addresses two key areas:

1. **Technology Stack** - CLI frameworks, libraries, and integration approaches
2. **Testing Strategy** - Minimal viable testing aligned with constitutional principles

**Key Decisions**:
- **Testing**: Node.js Native Test Runner (`node:test`) - Resolved "NEEDS CLARIFICATION" from Technical Context
- **CLI Framework**: Commander.js for argument parsing
- **Concurrency**: p-limit for controlled parallel Lighthouse execution
- **CSV Parsing**: PapaParse for robust delimiter detection

---

# PART 1: Technology Stack & Best Practices

## 1. CLI Framework

### Decision: Commander.js

**Rationale**:
- 219M weekly downloads (industry standard)
- Simplest API for straightforward CLI tools
- Lightweight (174 KB vs Yargs 290 KB)
- Excellent documentation and TypeScript support

**Usage Pattern**:
```javascript
import { Command } from 'commander';

const program = new Command();

program
  .name('kind-beacon')
  .description('Core Web Vitals auditing tool using Lighthouse')
  .version('1.0.0');

program
  .command('audit')
  .description('Run Core Web Vitals audit on URLs from CSV file')
  .argument('<csv-file>', 'path to CSV file containing URLs')
  .option('-c, --concurrency <number>', 'concurrent audits (default: 3)', '3')
  .option('-t, --timeout <seconds>', 'audit timeout in seconds (default: 60)', '60')
  .option('-d, --device <type>', 'device emulation: mobile or desktop (default: mobile)', 'mobile')
  .option('--data-dir <path>', 'output directory for JSON data (default: ./data)', './data')
  .option('--reports-dir <path>', 'output directory for HTML reports (default: ./reports)', './reports')
  .action(async (csvFile, options) => {
    // Implementation
  });

program.parse();
```

**Alternatives Considered**:
- **Yargs**: More complex API, larger bundle, excessive for simple CLI
- **oclif**: Enterprise framework (Heroku/Salesforce), overkill for single-command tool

---

## 2. CSV Parsing

### Decision: PapaParse

**Rationale**:
- Fastest for quoted CSVs (5.5s for 1M rows in benchmarks)
- Excellent header auto-detection with `header: true`
- Auto-detects delimiters (comma, semicolon, tab)
- Stream support for large files (100+ URLs)

**Usage Pattern**:
```javascript
import Papa from 'papaparse';
import fs from 'fs';

export function parseCSV(filePath) {
  const file = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    const urls = [];

    Papa.parse(file, {
      header: true,  // Auto-detect headers
      skipEmptyLines: true,
      step: (row) => {
        // Extract URL from first column or 'url' field
        const url = row.data.url || row.data[Object.keys(row.data)[0]];
        if (url?.startsWith('http')) {
          urls.push(url);
        }
      },
      complete: () => resolve(urls),
      error: reject
    });
  });
}
```

**Alternatives Considered**:
- **csv-parse** (node-csv): Good for streaming, but PapaParse has better auto-detection
- **fast-csv**: Similar performance, less intuitive API

---

## 3. Lighthouse Integration

### Decision: Programmatic npm Package (lighthouse)

**Rationale**:
- Direct API access vs CLI wrapper approach
- Better error handling and configuration control
- Access to full Lighthouse Report (LHR) object for data extraction

**Critical Finding**: Lighthouse only supports **one audit per Node.js process**. For concurrent audits (3-5 simultaneous), use:
- **Worker Threads** (recommended), or
- **Child Processes**

**Usage Pattern**:
```javascript
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';  // Or use chrome-launcher

export async function runAudit(url, options = {}) {
  const browser = await chromium.launch();

  const result = await lighthouse(url, {
    port: browser.port,
    formFactor: options.device || 'mobile',  // 'mobile' or 'desktop'
    screenEmulation: {
      mobile: options.device === 'mobile',
      width: options.device === 'mobile' ? 375 : 1350,
      height: options.device === 'mobile' ? 667 : 940
    },
    maxWaitForLoad: (options.timeout || 60) * 1000,
    onlyCategories: ['performance']
  });

  await browser.close();
  return result.lhr;  // Lighthouse Result object
}
```

**Alternatives Considered**:
- **CLI wrapper**: Simpler but less control; harder error handling; no programmatic access to LHR

---

## 4. Concurrency Control

### Decision: p-limit

**Rationale**:
- 19M weekly downloads (most popular concurrency library)
- Simple Promise-based API
- Perfect for limiting parallel Lighthouse worker threads

**Usage Pattern**:
```javascript
import pLimit from 'p-limit';
import { Worker } from 'worker_threads';

const limit = pLimit(3);  // Max 3 concurrent audits

const results = await Promise.all(
  urls.map(url => limit(() => runLighthouseInWorker(url)))
);

function runLighthouseInWorker(url) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./lighthouse-worker.js', {
      workerData: { url, options }
    });

    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

**Alternatives Considered**:
- **p-queue**: More features (priority, pause/resume) but overkill
- **async.queue**: Callback-based, less modern

---

## 5. HTML Report Generation

### Decision: Lighthouse Built-in HTML Generator

**Rationale**:
- Lighthouse already generates production-ready self-contained HTML (2-3 MB per report)
- All CSS/JS/assets embedded inline
- No additional dependencies needed
- Optional: Add simple summary index page

**Usage Pattern**:
```javascript
import lighthouse from 'lighthouse';
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js';
import fs from 'fs/promises';

const result = await lighthouse(url, options);

// Generate Lighthouse HTML report
const html = ReportGenerator.generateReport(result.lhr, 'html');

// Save to file
const filename = `${domain}-${date}-report.html`;
await fs.writeFile(`./reports/${filename}`, html);
```

**Optional Enhancement**: Summary index page
```javascript
// Simple template literal for index.html listing all reports
const indexHTML = `
<!DOCTYPE html>
<html>
<head><title>Kind Beacon Reports</title></head>
<body>
  <h1>Core Web Vitals Reports</h1>
  <ul>
    ${reports.map(r => `<li><a href="${r.file}">${r.url} - ${r.date}</a></li>`).join('\n')}
  </ul>
</body>
</html>
`;
```

**Alternatives Considered**:
- **Custom HTML with template engine** (Handlebars/EJS): Over-engineering; Lighthouse HTML is sufficient

---

## 6. Configuration Management

### Decision: cosmiconfig + CLI Arguments

**Rationale**:
- Industry standard (used by Prettier, ESLint, Stylelint)
- Supports `.json`, `.yaml`, `.js`, `package.json` config files
- CLI arguments override config file (clear precedence)

**Usage Pattern**:
```javascript
import { cosmiconfigSync } from 'cosmiconfig';

const explorer = cosmiconfigSync('kindbeacon');
const configFile = explorer.search();

const config = {
  concurrency: 3,
  timeout: 60,
  device: 'mobile',
  dataDir: './data',
  reportsDir: './reports',
  ...configFile?.config,  // Config file overrides defaults
  ...cliOptions           // CLI args override config file
};
```

**Config File Example** (`.kindbeaconrc.json`):
```json
{
  "concurrency": 5,
  "timeout": 90,
  "device": "desktop",
  "dataDir": "/Users/me/beacon-data",
  "reportsDir": "/Users/me/beacon-reports"
}
```

**Alternatives Considered**:
- **CLI args only**: Simple but no persistent config
- **Environment variables**: Less discoverable than config files

---

## 7. Dependency Detection & Auto-Install

### Decision: require.resolve() Check + Bundled Dependencies

**Rationale**:
- List Lighthouse in `package.json` dependencies (standard practice)
- Use `require.resolve()` at startup to verify availability
- Provide clear error message with installation command
- **Note**: npm programmatic API deprecated in npm 8+

**Usage Pattern**:
```javascript
export function checkLighthouse() {
  try {
    require.resolve('lighthouse');
    return true;
  } catch (e) {
    console.error('Lighthouse not found. Install it with:\n\n  npm install lighthouse\n');
    process.exit(1);
  }
}

// At CLI startup
checkLighthouse();
```

**Spec Requirement (FR-018)**: Offer auto-install
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function autoInstallLighthouse() {
  console.log('Lighthouse not found. Install now? (y/n)');

  const answer = await getUserInput();
  if (answer.toLowerCase() === 'y') {
    console.log('Installing lighthouse...');
    await execAsync('npm install lighthouse');
    console.log('Installation complete!');
  } else {
    process.exit(1);
  }
}
```

**Alternatives Considered**:
- **Bundle Lighthouse**: Increases distribution size significantly (200+ MB)
- **npm programmatic API**: Deprecated in npm 8+; avoid

---

## 8. Retry Logic & Error Handling

### Decision: p-retry

**Rationale**:
- 19M weekly downloads
- Exponential backoff built-in
- Clean async/await integration
- AbortError support for non-retryable errors
- Per spec (FR-017): Retry network errors once, fail others immediately

**Usage Pattern**:
```javascript
import pRetry, { AbortError } from 'p-retry';

export async function runAuditWithRetry(url, options) {
  return pRetry(
    async () => {
      try {
        return await runLighthouseAudit(url, options);
      } catch (error) {
        // Don't retry non-network errors
        if (error.code === 'INVALID_URL' || error.code === 'TIMEOUT') {
          throw new AbortError(error.message);
        }

        // Retry network errors
        throw error;
      }
    },
    {
      retries: 1,  // Per spec: retry once
      onFailedAttempt: (error) => {
        console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    }
  );
}
```

**Alternatives Considered**:
- **Manual retry**: Re-inventing the wheel; p-retry handles edge cases
- **async-retry**: Similar but less downloads/adoption

---

## 9. Additional Recommendations

### Progress Indicators

**ora** (spinners) + **cli-progress** (progress bars)

```javascript
import ora from 'ora';
import cliProgress from 'cli-progress';

const spinner = ora('Starting audit...').start();
// ... work ...
spinner.succeed('Audit complete!');

const bar = new cliProgress.SingleBar({});
bar.start(urls.length, 0);

for (let i = 0; i < urls.length; i++) {
  await processURL(urls[i]);
  bar.update(i + 1);
}

bar.stop();
```

### Logging

Start with `console.log`; add **winston** if structured logging needed

### URL Validation

Built-in `URL` constructor (no library needed)

```javascript
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
```

### Domain Extraction

Built-in URL parser or **psl** (Public Suffix List) for complex cases

```javascript
import { URL } from 'url';

export function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    // Remove www. prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
```

For registered domain extraction (e.g., "example.com" from "subdomain.example.com"):
```javascript
import psl from 'psl';

export function extractRegisteredDomain(urlString) {
  const url = new URL(urlString);
  const parsed = psl.parse(url.hostname);
  return parsed.domain;  // "example.com"
}
```

---

## 10. Implementation Priority (Based on User Stories)

### Phase 1 (P1 - Batch Auditing)
- Commander.js (CLI framework)
- PapaParse (CSV parsing)
- Lighthouse (programmatic API)
- p-limit (concurrency control)
- p-retry (retry logic)
- Worker Threads (parallel Lighthouse execution)

### Phase 2 (P2 - HTML Reports)
- Lighthouse ReportGenerator (built-in HTML)

### Phase 3 (P3 - Historical Data)
- File system operations (built-in fs/promises)
- Domain extraction utility
- File naming utility

---

# PART 2: Testing Strategy

## Executive Summary

Given that testing is **not a constitutional requirement** (explicitly removed per CONSTITUTION.md), this analysis identifies a **minimal viable testing approach** that provides value without overhead.

**Recommendation**: Use Node.js Native Test Runner (`node:test`) for critical utilities and basic integration tests.

---

## 1. Testing Framework

### Decision: Node.js Native Test Runner (node:test)

**Rationale**:
- **Zero dependencies** (Constitutional Principle IV: Simplicity & YAGNI)
- Stable since Node 20; built-in mocking, assertions, watch mode
- Sufficient for simple CLI tool
- Fast startup; no configuration overhead

**Alternatives Considered**:
- **Jest**: 1000+ dependencies, slower, overkill
- **Vitest**: Requires Vite, too heavy for simple project

---

## 2. Testing Scope: What to Test

### HIGH VALUE - Recommend Testing

1. **Domain Extraction** (5-10 tests)
   - Critical for file naming and historical data
   - Edge cases: internationalized domains, IP addresses, subdomains

2. **File Naming** (3-5 tests)
   - Format: `{domain}-{YYYY-MM-DD}-report.json`
   - Critical for historical data retrieval

3. **CSV Parsing** (3 tests)
   - Headers vs. no headers, quoted fields, mixed valid/invalid URLs

4. **Integration Smoke Test** (1 test, optional)
   - Mocked end-to-end: CSV → Lighthouse → JSON + HTML

**Total**: 12-20 tests, <1 second execution

### LOW VALUE - Do NOT Test

- Lighthouse execution (trust Google's library)
- HTML rendering (manual visual checks)
- File I/O (trust Node.js APIs)
- CLI argument parsing (use tested library)
- Network error handling (covered by Lighthouse)

---

## 3. Mocking Strategy

Mock Lighthouse itself:

```javascript
import { mock } from 'node:test';

const mockLighthouse = mock.fn(() => Promise.resolve({
  lhr: {
    finalUrl: 'https://example.com',
    fetchTime: '2025-10-22T10:00:00.000Z',
    categories: { performance: { score: 0.92 } },
    audits: {
      'largest-contentful-paint': { numericValue: 1800 },
      'cumulative-layout-shift': { numericValue: 0.05 }
    }
  }
}));
```

**Never run real Lighthouse in automated tests** - slow, flaky, unnecessary.

---

## 4. Test Implementation

### package.json
```json
{
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "test:watch": "node --test --watch tests/**/*.test.js"
  }
}
```

### Example Test
```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { extractDomain } from '../src/lib/domain-extractor.js';

test('extracts domain from full URL', () => {
  assert.strictEqual(extractDomain('https://www.example.com/page?q=1'), 'example.com');
});

test('handles subdomains correctly', () => {
  assert.strictEqual(extractDomain('https://subdomain.example.com'), 'example.com');
});
```

---

## 5. Final Testing Recommendation

### Implement Testing IF:
- Historical data integrity deemed critical
- CSV parsing complexity increases
- Team wants regression protection

### Use Manual Testing IF:
- Development velocity is top priority
- Team confident in manual validation
- Data corruption risk acceptable

### Estimated Effort
- **Setup**: 30 minutes
- **Test writing**: 2-3 hours
- **Maintenance**: <1 hour/month
- **Execution**: <1 second

---

## Resolution: NEEDS CLARIFICATION

**Testing** entry in Technical Context is now **RESOLVED**:

**Decision**: Node.js Native Test Runner (`node:test`) with minimal test suite (12-20 tests) covering critical utilities (domain extraction, file naming, CSV parsing). Testing is **optional** per constitutional principles but recommended for data integrity.

---

## References

- Node.js CLI Best Practices: [lirantal/nodejs-cli-apps-best-practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- JavaScript Testing Best Practices: [goldbergyoni/javascript-testing-best-practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- Lighthouse Documentation: [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse)
- Commander.js: [tj/commander.js](https://github.com/tj/commander.js)
- PapaParse: [mholt/PapaParse](https://github.com/mholt/PapaParse)
- p-limit: [sindresorhus/p-limit](https://github.com/sindresorhus/p-limit)
- p-retry: [sindresorhus/p-retry](https://github.com/sindresorhus/p-retry)

---

**Research Status**: Complete | **Next Step**: Phase 1 Design (data-model.md, contracts/) | **Date**: 2025-10-22
