# Research & Technical Decisions: Full Web Core Vitals Metrics Support

**Feature**: 002-full-wcv-metrics
**Date**: 2025-10-22
**Status**: Complete

## Overview

This document captures research findings and technical decisions for extending the Core Web Vitals auditing tool to support full Lighthouse metrics (accessibility, SEO, best practices) and timestamped report filenames.

---

## Research Topic 1: Lighthouse LHR Category Structure

### Question

How do we extract accessibility, SEO, and best practices scores and detailed findings from the Lighthouse Result (LHR) object?

### Findings

**LHR Structure** (Lighthouse 13.0.0):

```javascript
{
  categories: {
    performance: { score: 0.95, title: "Performance" },
    accessibility: { score: 0.88, title: "Accessibility" },
    seo: { score: 0.92, title: "SEO" },
    "best-practices": { score: 0.85, title: "Best Practices" }
  },
  audits: {
    "audit-id": {
      id: "audit-id",
      title: "Human-readable title",
      description: "What this audit tests",
      score: 0.0-1.0,  // 1.0 = passing, 0.0 = failing, null = not applicable
      scoreDisplayMode: "binary" | "numeric" | "informative" | "notApplicable",
      displayValue: "Optional summary value",
      details: { /* structured data: tables, lists, etc. */ }
    }
  },
  categoryGroups: {
    // Groups audits by theme within each category
  }
}
```

**Category Score Extraction**:
- Located at `lhr.categories[categoryName].score`
- Scores are 0-1 scale (convert to 0-100 by multiplying by 100)
- All four categories always present in Lighthouse 13.0.0+

**Audit Details Extraction**:
- Each category references audit IDs via `lhr.categories[categoryName].auditRefs`
- Full audit data in `lhr.audits[auditId]`
- `auditRefs` includes weight (importance) for each audit in the category

**Key Audits by Category**:

**Accessibility** (high-impact audits):
- `color-contrast`: Text has sufficient contrast
- `image-alt`: Images have alt attributes
- `aria-*`: ARIA attributes used correctly
- `button-name`: Buttons have accessible names
- `link-name`: Links have discernible text

**SEO** (high-impact audits):
- `viewport`: Has a viewport meta tag
- `document-title`: Document has a title
- `meta-description`: Document has a meta description
- `http-status-code`: Page has successful HTTP status code
- `link-text`: Links have descriptive text
- `is-crawlable`: Page isn't blocked from indexing
- `robots-txt`: robots.txt is valid
- `hreflang`: Document has valid hreflang
- `canonical`: Document has valid canonical URL

**Best Practices** (high-impact audits):
- `uses-https`: Uses HTTPS
- `is-on-https`: All resources use HTTPS
- `geolocation-on-start`: Avoids requesting geolocation on page load
- `notification-on-start`: Avoids requesting notification permission on page load
- `no-vulnerable-libraries`: Avoids front-end JavaScript libraries with known vulnerabilities
- `errors-in-console`: No browser errors logged to the console
- `image-aspect-ratio`: Images displayed with correct aspect ratio

### Decision

**Extract all four categories with selective audit details**:

1. **Category Scores**: Extract all four category scores (0-100) for every audit
2. **Audit Details**: For each category, extract:
   - All audits with `score < 1.0` (failing or needs improvement)
   - Top 5 most impactful audits (by weight) regardless of pass/fail
   - Limit to max 20 audits per category to prevent overwhelming reports
3. **Audit Data Structure**: Store audit ID, title, description, score, displayValue, and simplified details

**Rationale**:
- Provides complete overview with category scores
- Focuses detailed reporting on actionable issues (failing audits)
- Includes high-impact audits even if passing (for context)
- 20 audit limit per category prevents multi-MB reports while covering all meaningful issues

**Implementation Location**:
- `src/models/metrics.js`: Add `extractCategoryDetailsFromLHR(lhr, categoryName)` function
- Returns structured object with score and filtered audit array

### Alternatives Considered

**Alternative 1: Extract all audits for all categories**
- **Rejected**: Would create very large report files (>10MB for complex sites)
- HTML reports would be overwhelming and hard to navigate
- Most audits are passing and don't need detailed reporting

**Alternative 2: Extract only failing audits**
- **Rejected**: Doesn't provide context on what was tested
- Users can't see which checks passed
- No visibility into audit coverage

---

## Research Topic 2: Timestamp Format for Sortability

### Question

What timestamp format ensures alphabetical sorting matches chronological order while remaining human-readable and cross-platform compatible?

### Findings

**ISO 8601 Format Options**:

| Format | Example | Alphabetical Sort | Human Readable | Windows Compatible |
|--------|---------|-------------------|----------------|-------------------|
| `YYYY-MM-DD-HHmmss` | `2025-10-22-143052` | ✅ Yes | ✅ Yes | ✅ Yes |
| `YYYY-MM-DDTHH-mm-ss` | `2025-10-22T14-30-52` | ✅ Yes | ⚠️ Moderate | ✅ Yes |
| `YYYYMMDDTHHmmss` | `20251022T143052` | ✅ Yes | ❌ No | ✅ Yes |
| `YYYY-MM-DD_HH:mm:ss` | `2025-10-22_14:30:52` | ✅ Yes | ✅ Yes | ❌ No (colons) |

**Timezone Considerations**:
- **UTC**: Unambiguous, no DST complications, consistent across machines
- **Local Time**: Easier for manual inspection, but problematic for multi-timezone teams

**Filename Length**:
- `YYYY-MM-DD-HHmmss` = 17 characters (reasonable overhead)
- Combined filename example: `example-com_2025-10-22-143052_mobile.html` = 46 chars

**Cross-Platform Restrictions**:
- **Windows**: No colons `:` in filenames
- **macOS/Linux**: More permissive, but avoid `/` and `\`
- Hyphens `-` and underscores `_` safe everywhere

### Decision

**Use `YYYY-MM-DD-HHmmss` format in UTC timezone**

**Full filename format**: `{domain}_{timestamp}_{device}.{extension}`

**Example**: `example-com_2025-10-22-143052_mobile.html`

**Rationale**:
- ✅ **Alphabetical = Chronological**: Year-first ensures correct sort order
- ✅ **Human Readable**: Dashes separate date components, clear at a glance
- ✅ **Cross-Platform**: No restricted characters (no colons)
- ✅ **ISO 8601 Compliant**: Standard format with minor modification (no colons in time)
- ✅ **Unambiguous**: UTC eliminates timezone confusion
- ✅ **Collision Resistant**: Second precision sufficient (audits take 5-30 seconds)

**Implementation**:
```javascript
function generateTimestamp() {
  return new Date().toISOString()
    .replace(/T/, '-')           // Replace T with dash
    .replace(/:/g, '')           // Remove colons
    .replace(/\..+/, '');        // Remove milliseconds and Z
  // Result: 2025-10-22-143052
}
```

### Alternatives Considered

**Alternative 1: Unix timestamp (seconds since epoch)**
- **Example**: `example-com_1729603852_mobile.html`
- **Rejected**: Not human-readable, can't determine date without conversion

**Alternative 2: Local time with timezone indicator**
- **Example**: `example-com_2025-10-22-143052-PDT_mobile.html`
- **Rejected**: Longer filenames, DST complications, timezone parsing complexity

**Alternative 3: Date only (no time component)**
- **Example**: `example-com_2025-10-22_mobile.html`
- **Rejected**: Multiple audits on same day would collide, need sequence numbers

---

## Research Topic 3: Filename Collision Prevention

### Question

Is second-precision timestamping sufficient to prevent filename collisions in batch processing?

### Findings

**Lighthouse Audit Duration Analysis**:
- Typical audit: 5-15 seconds per URL
- Fast audit (simple page): 3-5 seconds
- Slow audit (complex page): 20-30 seconds
- Network latency adds 1-5 seconds

**Batch Processing Behavior** (from existing code review):
- Sequential processing per URL (not parallel for same URL)
- Even with concurrency (`p-limit`), each URL processed once
- Timestamp captured at audit start time

**Collision Scenarios**:

| Scenario | Possible? | Mitigation |
|----------|-----------|-----------|
| Same URL audited twice in same second | ❌ No | Sequential processing prevents this |
| Different URLs completed in same second | ✅ Yes | Different domains in filename differentiate |
| Retry within same second | ❌ No | Retry takes >1 second (Chrome restart) |
| Manual re-run within same second | ⚠️ Unlikely | User would need to trigger within 1 second |

**Storage Analysis**:
- Reports saved to dated subdirectories (existing behavior)
- Within same directory: `{domain}_{timestamp}_{device}.{extension}`
- Collision only if: same domain + same timestamp + same device

### Decision

**Second-precision timestamps are sufficient without additional collision handling**

**Rationale**:
- ✅ **Sequential Processing**: Existing architecture prevents same-URL rapid re-runs
- ✅ **Domain Differentiation**: Different domains have different filenames
- ✅ **Audit Duration**: Physical constraint (5-30s per audit) prevents sub-second completion
- ✅ **Device Mode**: `mobile` vs `desktop` provides additional differentiation
- ⚠️ **Edge Case**: Manual rapid re-run of same URL possible but extremely rare

**Recommended Enhancement** (optional, post-MVP):
- If collision detected during file write, append `-2`, `-3`, etc.
- Implementation: Check `fs.existsSync()` before write, increment suffix if needed
- **Decision**: Not implementing initially (YAGNI principle), add only if collision reports occur

### Alternatives Considered

**Alternative 1: Millisecond precision**
- **Example**: `2025-10-22-143052-837`
- **Rejected**: Overkill for use case, adds 4 characters to every filename, no real benefit

**Alternative 2: UUID suffix**
- **Example**: `example-com_2025-10-22-143052_a3f7b2e1_mobile.html`
- **Rejected**: Defeats human-readable purpose, adds 8+ characters

**Alternative 3: Sequence numbers**
- **Example**: `example-com_001_2025-10-22-143052_mobile.html`
- **Rejected**: Requires global state tracking across concurrent audits, complex

---

## Research Topic 4: Lighthouse Audit Details Structure

### Question

How should we extract and structure audit findings for meaningful reporting?

### Findings

**Audit Object Structure**:
```javascript
{
  id: "color-contrast",
  title: "Background and foreground colors have sufficient contrast",
  description: "Low-contrast text is difficult to read...",
  score: 0.8,                    // 0-1 scale (1 = passing)
  scoreDisplayMode: "binary",    // How to interpret score
  displayValue: "8 elements",    // Summary metric
  details: {
    type: "table",               // or "list", "opportunity", "debugdata"
    headings: [...],
    items: [...]                 // Actual failing elements or metrics
  },
  numericValue: 1234,            // Optional metric value
  numericUnit: "millisecond"     // Optional unit
}
```

**Score Display Modes**:
- `binary`: Pass/fail (score is 1 or 0)
- `numeric`: Continuous score (0-1)
- `informative`: FYI only, no scoring
- `notApplicable`: N/A for this page

**Details Types**:
- `table`: Structured tabular data (most common)
- `list`: Simple list of items
- `opportunity`: Performance opportunity with savings estimate
- `debugdata`: Technical debugging info

**Audit Weight/Importance**:
- Stored in `lhr.categories[category].auditRefs`
- Each audit has a `weight` (0-10, higher = more important)
- Use weight to prioritize which audits to show in detail

### Decision

**Extract structured audit data with smart filtering**:

**Audit Selection Criteria** (per category):
1. **All failing audits** (`score < 1.0`) up to 15 audits
2. **Top 5 high-weight audits** regardless of pass/fail (weight > 5)
3. **Cap at 20 audits total** per category

**Extracted Fields**:
- `id`: Audit identifier (kebab-case string)
- `title`: Human-readable title
- `description`: What was tested (first 200 chars + ellipsis if longer)
- `score`: Normalized 0-1 score
- `scoreDisplayMode`: How to interpret score
- `displayValue`: Summary metric if present (optional)
- `weight`: Importance score from category auditRefs
- `details`: **Simplified** details (not raw LHR details):
  - For tables: Include only first 10 rows
  - For lists: Include only first 10 items
  - Omit debugdata type entirely

**Data Structure**:
```javascript
{
  categoryName: "accessibility",
  score: 88,  // 0-100
  audits: [
    {
      id: "color-contrast",
      title: "Background and foreground colors have sufficient contrast",
      description: "Low-contrast text is difficult to read...",
      score: 0.8,
      scoreDisplayMode: "binary",
      displayValue: "8 elements",
      weight: 7,
      details: { /* simplified */ }
    },
    // ... more audits
  ]
}
```

**Rationale**:
- ✅ **Actionable Focus**: Prioritizes failing audits (what needs fixing)
- ✅ **Context Awareness**: Includes high-importance audits for visibility
- ✅ **Report Size Control**: 20 audit cap prevents bloat
- ✅ **Performance**: Simplified details reduce processing and storage
- ✅ **Usability**: Users see most relevant information first

### Alternatives Considered

**Alternative 1: Extract all audits with full details**
- **Rejected**: Report files would be 5-10MB each, HTML rendering slow

**Alternative 2: Extract only failing audits**
- **Rejected**: No visibility into what was tested and passed

**Alternative 3: Extract category score only (no audit details)**
- **Rejected**: Not actionable, users can't fix issues without details

---

## Research Topic 5: Report Format Extension

### Question

How should we present all four metric categories in HTML reports without overwhelming users?

### Findings

**Current Report Structure** (from existing code):
- Single HTML page with embedded CSS
- Performance metrics prominently displayed at top
- Core Web Vitals scores with color-coded badges (good/needs-improvement/poor)
- Summary table of metrics

**UI Pattern Options**:

| Pattern | Pros | Cons |
|---------|------|------|
| **Tabbed Interface** | Clear separation, focused view | Requires JavaScript, hidden content |
| **Accordion Sections** | Progressive disclosure, scannable | More clicks to see everything |
| **Single Scroll Page** | No interaction needed, printable | Long page, potential overwhelm |
| **Dashboard Cards** | Visual hierarchy, modern | Requires more CSS, limited detail space |

**Information Hierarchy Needs**:
1. **Top Priority**: Overall health summary (all 4 category scores)
2. **High Priority**: Core Web Vitals (existing priority)
3. **Medium Priority**: Failing audits across all categories
4. **Low Priority**: Passing audits and technical details

### Decision

**Use accordion sections with summary dashboard**

**Report Structure**:

```
┌─────────────────────────────────────┐
│  OVERALL SUMMARY DASHBOARD          │
│  [Performance: 95] [A11y: 88]       │
│  [SEO: 92] [Best Practices: 85]     │
└─────────────────────────────────────┘

▼ Performance (Expanded by default)
  • Core Web Vitals: [LCP][INP][CLS]
  • Other metrics: TTFB, TBT, etc.
  • Failing audits: [list]

▶ Accessibility (Collapsed by default)
▶ SEO (Collapsed by default)
▶ Best Practices (Collapsed by default)
```

**Implementation Details**:
- Pure HTML/CSS (no JavaScript required for basic functionality)
- Use `<details>` and `<summary>` HTML5 elements for accordions
- Performance section open by default (maintains backward compat with current focus)
- Color-coded score badges (green 90-100, yellow 50-89, red 0-49)
- Each section shows:
  - Category score badge
  - Count of failing audits
  - List of failing audits with details
  - Collapsible "Passed audits" subsection (for reference)

**Rationale**:
- ✅ **Progressive Disclosure**: Users see summary first, drill down as needed
- ✅ **No JavaScript**: Works everywhere, printable, accessible
- ✅ **Backward Compatible**: Performance remains prominent
- ✅ **Scannable**: Dashboard gives instant health overview
- ✅ **Actionable**: Failing audits emphasized in each section

### Alternatives Considered

**Alternative 1: Tabbed interface with JavaScript**
- **Rejected**: Requires JavaScript, breaks printing, accessibility concerns

**Alternative 2: Four separate HTML files (one per category)**
- **Rejected**: Fragmented view, hard to compare categories, more file management

**Alternative 3: Single long scrolling page (no sections)**
- **Rejected**: Overwhelming for pages with many issues, hard to navigate

---

## Summary of Decisions

| Research Topic | Decision | Key Rationale |
|----------------|----------|---------------|
| **LHR Category Structure** | Extract all 4 category scores + top 20 audits per category (failing + high-weight) | Comprehensive yet manageable report size |
| **Timestamp Format** | `YYYY-MM-DD-HHmmss` UTC | Human-readable + chronologically sortable + cross-platform |
| **Collision Prevention** | Second precision sufficient (no additional handling) | Audit duration (5-30s) prevents collisions |
| **Audit Details** | Simplified structure with capped rows/items | Performance + usability balance |
| **Report Format** | Accordion sections with summary dashboard | Progressive disclosure without JavaScript |

---

## Implementation Priorities

**Phase 0 Complete**: All research topics resolved

**Phase 1 (Data Model)**:
1. Create `CategoryDetails` entity structure
2. Extend `Metrics` model with category scores and details array
3. Add extraction functions for LHR categories

**Phase 2 (File Naming)**:
1. Add timestamp generation to `file-namer.js`
2. Update filename format with timestamp
3. Add tests for sorting and format

**Phase 3 (Reporting)**:
1. Update report generator HTML template with accordion structure
2. Add category-specific rendering logic
3. Update CSS for new layout

---

## Open Questions

**None** - All research topics resolved and ready for implementation.

---

## References

- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [HTML Details Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
- [Google Core Web Vitals](https://web.dev/vitals/)
