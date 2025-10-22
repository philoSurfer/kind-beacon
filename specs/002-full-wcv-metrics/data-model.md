# Data Model: Full Web Core Vitals Metrics Support

**Feature**: 002-full-wcv-metrics
**Date**: 2025-10-22
**Status**: Complete

## Overview

This document defines the data structures for extending the Core Web Vitals auditing tool to support full Lighthouse metrics (accessibility, SEO, best practices) with timestamped reporting.

---

## Entity Diagram

```
┌─────────────┐
│   Audit     │
│  (extends)  │
└──────┬──────┘
       │
       │ has
       ▼
┌─────────────┐         ┌──────────────────┐
│   Metrics   │────────>│ CategoryDetails  │
│  (extends)  │  has 3  │      (new)       │
└─────────────┘         └──────────────────┘
                               │
                               │ contains
                               ▼
                        ┌──────────────┐
                        │ AuditDetail  │
                        │    (new)     │
                        └──────────────┘
```

---

## Core Entities

### 1. Audit (Extended)

**Purpose**: Represents metadata about a single Lighthouse audit run for one URL

**Location**: `src/models/audit.js`

**Changes**: Add optional category scores field

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `url` | string | No | Final URL after redirects | Valid URL format |
| `requestedUrl` | string | Yes | Original URL from input | Valid URL format |
| `timestamp` | string | Yes | ISO 8601 timestamp | Valid ISO 8601 |
| `domain` | string | Yes | Extracted domain | Non-empty string |
| `lighthouseVersion` | string | Yes | Lighthouse version used | Semver format |
| `deviceMode` | string | Yes | Device emulation mode | 'mobile' or 'desktop' |
| `auditDuration` | number | Yes | Duration in milliseconds | Positive number |
| `status` | string | Yes | Audit status | 'success', 'failed', 'timeout' |
| `error` | string | No | Error message if failed | Non-empty if status != success |
| `retryAttempt` | number | Yes | Retry attempt count | 0 or 1 |
| **`categories`** | object | **No** | **Category scores** | **See CategoryScores** |

**New Field Details - `categories`**:

```javascript
{
  performance: 95,      // 0-100
  accessibility: 88,    // 0-100
  seo: 92,             // 0-100
  bestPractices: 85    // 0-100
}
```

**Backward Compatibility**: Field is optional. Existing audits without this field remain valid.

---

### 2. Metrics (Extended)

**Purpose**: Represents comprehensive performance and quality metrics from Lighthouse

**Location**: `src/models/metrics.js`

**Changes**: Add category scores and category details

**Existing Fields** (unchanged):

| Field | Type | Description |
|-------|------|-------------|
| `lcp` | number | Largest Contentful Paint (ms) |
| `lcpScore` | string | 'good', 'needs-improvement', 'poor' |
| `fid` | number \| null | First Input Delay (ms) - deprecated |
| `inp` | number | Interaction to Next Paint (ms) |
| `inpScore` | string | 'good', 'needs-improvement', 'poor' |
| `cls` | number | Cumulative Layout Shift (unitless) |
| `clsScore` | string | 'good', 'needs-improvement', 'poor' |
| `ttfb` | number | Time to First Byte (ms) |
| `ttfbScore` | string | 'good', 'needs-improvement', 'poor' |
| `tbt` | number | Total Blocking Time (ms) |
| `performanceScore` | number | Overall performance score (0-100) |

**New Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| **`accessibilityScore`** | number | Yes | Accessibility score | 0-100 |
| **`seoScore`** | number | Yes | SEO score | 0-100 |
| **`bestPracticesScore`** | number | Yes | Best practices score | 0-100 |
| **`categoryDetails`** | object | Yes | Detailed findings by category | See CategoryDetails |

**New Field Structure - `categoryDetails`**:

```javascript
{
  accessibility: CategoryDetails,    // See CategoryDetails entity
  seo: CategoryDetails,              // See CategoryDetails entity
  bestPractices: CategoryDetails     // See CategoryDetails entity
  // Note: Performance category details omitted (CWV metrics serve this role)
}
```

---

### 3. CategoryDetails (New)

**Purpose**: Contains detailed audit findings for a specific Lighthouse category (accessibility, SEO, or best practices)

**Location**: `src/models/metrics.js` (new exported type/interface)

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `categoryName` | string | Yes | Category identifier | 'accessibility', 'seo', 'best-practices' |
| `score` | number | Yes | Category score | 0-100 |
| `auditCount` | object | Yes | Audit counts by status | `{ passing: N, failing: N, total: N }` |
| `audits` | array | Yes | Array of audit details | Max 20 items, see AuditDetail |

**Structure**:

```javascript
{
  categoryName: "accessibility",
  score: 88,
  auditCount: {
    passing: 32,
    failing: 8,
    total: 40
  },
  audits: [
    AuditDetail,  // See AuditDetail entity
    // ... up to 20 audits
  ]
}
```

**Selection Logic** (per research.md):
1. All failing audits (`score < 1.0`) up to 15 audits
2. Top 5 high-weight audits regardless of pass/fail
3. Cap at 20 audits total per category

---

### 4. AuditDetail (New)

**Purpose**: Represents a single Lighthouse audit finding within a category

**Location**: `src/models/metrics.js` (new exported type/interface)

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Audit identifier | Kebab-case string |
| `title` | string | Yes | Human-readable title | Non-empty string |
| `description` | string | Yes | What was tested | Max 200 chars (truncated) |
| `score` | number | Yes | Audit score | 0-1 (1 = passing) |
| `scoreDisplayMode` | string | Yes | How to interpret score | 'binary', 'numeric', 'informative', 'notApplicable' |
| `displayValue` | string | No | Summary metric | Optional string |
| `weight` | number | Yes | Importance in category | 0-10 |
| `details` | object | No | Simplified structured data | See Details structure |

**Structure**:

```javascript
{
  id: "color-contrast",
  title: "Background and foreground colors have sufficient contrast",
  description: "Low-contrast text is difficult to read for users with visual impairments...",
  score: 0.8,
  scoreDisplayMode: "binary",
  displayValue: "8 elements",
  weight: 7,
  details: {
    type: "table",     // or "list"
    items: [           // First 10 items only
      { /* item data */ }
    ]
  }
}
```

**Details Simplification** (from research.md):
- Tables: Include only first 10 rows
- Lists: Include only first 10 items
- Omit `debugdata` type entirely
- Omit `headings` for tables (use standard rendering)

---

## Relationships

```
Audit 1──────1 Metrics
              ├── accessibilityScore
              ├── seoScore
              ├── bestPracticesScore
              └── categoryDetails
                   ├── accessibility: CategoryDetails
                   │    └── audits: [AuditDetail, ...]
                   ├── seo: CategoryDetails
                   │    └── audits: [AuditDetail, ...]
                   └── bestPractices: CategoryDetails
                        └── audits: [AuditDetail, ...]
```

---

## New Functions

### `src/models/metrics.js`

**Extract Extended Metrics from LHR**:

```javascript
/**
 * Extracts comprehensive metrics including all four categories from LHR
 * @param {Object} lhr - Lighthouse Result object
 * @returns {Object} - Extended metrics object
 */
export function extractExtendedMetricsFromLHR(lhr)
```

**Extract Category Details**:

```javascript
/**
 * Extracts detailed audit findings for a specific category
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} categoryName - 'accessibility' | 'seo' | 'best-practices'
 * @returns {Object} - CategoryDetails object
 */
export function extractCategoryDetailsFromLHR(lhr, categoryName)
```

**Get Category Score**:

```javascript
/**
 * Extracts category score from LHR
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} categoryName - Category identifier
 * @returns {number} - Score 0-100
 */
export function getCategoryScore(lhr, categoryName)
```

**Select Priority Audits**:

```javascript
/**
 * Selects priority audits for a category based on failure status and weight
 * @param {Object} lhr - Lighthouse Result object
 * @param {Object} categoryRef - Category reference from LHR
 * @returns {Array} - Array of AuditDetail objects (max 20)
 */
function selectPriorityAudits(lhr, categoryRef)
```

**Simplify Audit Details**:

```javascript
/**
 * Simplifies audit details for storage and reporting
 * @param {Object} auditDetails - Raw audit details from LHR
 * @returns {Object} - Simplified details object
 */
function simplifyAuditDetails(auditDetails)
```

---

## File Naming

**Not a data entity**, but crucial for feature requirements.

**Location**: `src/lib/file-namer.js`

**New Function**:

```javascript
/**
 * Generates ISO 8601 timestamp for filename
 * @returns {string} - Timestamp in format YYYY-MM-DD-HHmmss (UTC)
 */
export function generateTimestamp()
```

**Updated Function**:

```javascript
/**
 * Generates filename with timestamp
 * @param {string} domain - Domain name
 * @param {string} timestamp - ISO timestamp
 * @param {string} deviceMode - 'mobile' or 'desktop'
 * @param {string} extension - 'html' or 'json'
 * @returns {string} - Formatted filename
 */
export function generateFilename(domain, timestamp, deviceMode, extension)
```

**Format**: `{domain}_{timestamp}_{device}.{extension}`

**Example**: `example-com_2025-10-22-143052_mobile.html`

---

## Storage Format

### JSON Report Structure

```json
{
  "audit": {
    "url": "https://example.com",
    "requestedUrl": "https://example.com",
    "timestamp": "2025-10-22T14:30:52.000Z",
    "domain": "example.com",
    "lighthouseVersion": "13.0.0",
    "deviceMode": "mobile",
    "auditDuration": 12543,
    "status": "success",
    "retryAttempt": 0,
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
    "ttfb": 650,
    "ttfbScore": "good",
    "tbt": 180,
    "performanceScore": 95,
    "accessibilityScore": 88,
    "seoScore": 92,
    "bestPracticesScore": 85,
    "categoryDetails": {
      "accessibility": {
        "categoryName": "accessibility",
        "score": 88,
        "auditCount": {
          "passing": 32,
          "failing": 8,
          "total": 40
        },
        "audits": [
          {
            "id": "color-contrast",
            "title": "Background and foreground colors have sufficient contrast",
            "description": "Low-contrast text is difficult to read...",
            "score": 0.8,
            "scoreDisplayMode": "binary",
            "displayValue": "8 elements",
            "weight": 7,
            "details": {
              "type": "table",
              "items": [ /* up to 10 items */ ]
            }
          }
          // ... more audits (max 20)
        ]
      },
      "seo": { /* CategoryDetails structure */ },
      "bestPractices": { /* CategoryDetails structure */ }
    }
  }
}
```

---

## Validation Rules

### Metrics Validation (Extended)

**Existing Validations** (unchanged):
- All Core Web Vitals metrics must be non-negative numbers
- Performance score must be 0-100
- Score labels must be 'good', 'needs-improvement', or 'poor'

**New Validations**:

```javascript
export function validateExtendedMetrics(metrics) {
  // Existing validations...

  // Category scores
  const categoryScores = [
    'accessibilityScore',
    'seoScore',
    'bestPracticesScore'
  ];

  for (const field of categoryScores) {
    if (typeof metrics[field] !== 'number') {
      throw new Error(`${field} must be a number`);
    }
    if (metrics[field] < 0 || metrics[field] > 100) {
      throw new Error(`${field} must be between 0 and 100`);
    }
  }

  // CategoryDetails structure
  if (!metrics.categoryDetails || typeof metrics.categoryDetails !== 'object') {
    throw new Error('categoryDetails is required');
  }

  const requiredCategories = ['accessibility', 'seo', 'bestPractices'];
  for (const category of requiredCategories) {
    if (!metrics.categoryDetails[category]) {
      throw new Error(`categoryDetails.${category} is required`);
    }
    validateCategoryDetails(metrics.categoryDetails[category]);
  }
}

export function validateCategoryDetails(categoryDetails) {
  // Validate structure
  if (!categoryDetails.categoryName) {
    throw new Error('categoryName is required');
  }
  if (typeof categoryDetails.score !== 'number' ||
      categoryDetails.score < 0 ||
      categoryDetails.score > 100) {
    throw new Error('score must be a number between 0 and 100');
  }
  if (!Array.isArray(categoryDetails.audits)) {
    throw new Error('audits must be an array');
  }
  if (categoryDetails.audits.length > 20) {
    throw new Error('audits array cannot exceed 20 items');
  }

  // Validate each audit
  for (const audit of categoryDetails.audits) {
    validateAuditDetail(audit);
  }
}

export function validateAuditDetail(audit) {
  const requiredFields = ['id', 'title', 'description', 'score', 'scoreDisplayMode', 'weight'];

  for (const field of requiredFields) {
    if (audit[field] === undefined || audit[field] === null) {
      throw new Error(`${field} is required in AuditDetail`);
    }
  }

  if (typeof audit.score !== 'number' || audit.score < 0 || audit.score > 1) {
    throw new Error('audit score must be between 0 and 1');
  }

  const validDisplayModes = ['binary', 'numeric', 'informative', 'notApplicable'];
  if (!validDisplayModes.includes(audit.scoreDisplayMode)) {
    throw new Error(`scoreDisplayMode must be one of: ${validDisplayModes.join(', ')}`);
  }

  if (typeof audit.weight !== 'number' || audit.weight < 0 || audit.weight > 10) {
    throw new Error('weight must be a number between 0 and 10');
  }
}
```

---

## Migration Strategy

### Backward Compatibility

**Goal**: Existing reports and code continue working without changes

**Approach**:

1. **All new fields are optional** in Audit model (`categories` field)
2. **Metrics model extends without breaking**: New fields added, existing fields unchanged
3. **Existing reports remain valid**: Old JSON structure is subset of new structure
4. **Graceful degradation**: Report generator checks for new fields before rendering

**Example Migration Check**:

```javascript
// In report generator
function renderCategorySection(metrics) {
  if (!metrics.categoryDetails) {
    // Old format - skip category sections
    return '';
  }
  // New format - render all categories
  return renderAllCategories(metrics.categoryDetails);
}
```

### Data Version Indicator

**Not implementing** (YAGNI principle):
- File structure itself indicates version (presence of new fields)
- No breaking changes to warrant explicit versioning
- Can add later if multi-version support becomes necessary

---

## Testing Considerations

### Unit Tests

**New Test Files**:
- `tests/unit/test-metrics-extended.js`: Test category extraction and validation
- `tests/unit/test-timestamp-formatting.js`: Test timestamp generation and sorting
- `tests/unit/test-category-details.js`: Test audit selection and simplification

**Extended Test Files**:
- `tests/unit/test-file-namer.js`: Add tests for timestamped filenames

### Integration Tests

**Extended Test Files**:
- `tests/integration/test-lighthouse-integration.js`: Verify all categories extracted from real LHR

### Test Data

**Mock LHR Objects**:
- Need representative LHR objects with all four categories
- Include various audit states (passing, failing, informative, N/A)
- Test edge cases (empty categories, missing audits)

**Timestamp Tests**:
- Verify chronological sorting with multiple timestamps
- Test edge cases (year boundary, leap seconds)
- Verify UTC timezone consistency

---

## Performance Considerations

### Memory

**Impact**: Extended metrics increase per-audit memory footprint

**Before**: ~2KB per audit (performance metrics only)
**After**: ~15-25KB per audit (all categories + 60 audit details max)

**Mitigation**:
- 20 audit cap per category (60 audits max vs potentially 200+)
- Simplified details (first 10 rows/items only)
- No impact on batch processing (audits processed sequentially)

### Storage

**Impact**: Report files increase in size

**Before**: HTML ~50KB, JSON ~5KB
**After**: HTML ~200-300KB, JSON ~30-50KB

**Mitigation**:
- Acceptable for file-based storage (no database limits)
- Users benefit from comprehensive data
- Can add compression later if needed (gzip reduces by 70-80%)

### Processing Time

**Impact**: Additional category extraction adds ~50-100ms per audit

**Mitigation**:
- Negligible compared to Lighthouse execution (5-30s per audit)
- <1% overhead on total audit time
- No impact on user experience

---

## Future Enhancements

**Out of scope for this feature** (documented for future reference):

1. **Diff/Comparison Support**: Compare audit results over time
   - Would require: Historical data store, diff algorithm, comparison UI

2. **Custom Audit Selection**: User-configurable audit prioritization
   - Would require: Configuration schema, audit filtering logic

3. **Audit Details Expansion**: Full details on-demand
   - Would require: Separate detail storage, lazy loading mechanism

4. **Category Scoring Trends**: Track score changes over time
   - Would require: Time-series data structure, trend calculation

---

## Summary

**Extended Entities**:
- `Audit`: +1 optional field (`categories`)
- `Metrics`: +4 required fields (3 scores + `categoryDetails`)

**New Entities**:
- `CategoryDetails`: Category score and audit array
- `AuditDetail`: Individual audit finding

**New Functions**:
- 5 new extraction/validation functions in `src/models/metrics.js`
- 2 new filename functions in `src/lib/file-namer.js`

**Storage Impact**:
- JSON reports: 5KB → 30-50KB
- HTML reports: 50KB → 200-300KB
- Fully backward compatible

**Ready for Phase 2**: Task generation (`/speckit.tasks`)
