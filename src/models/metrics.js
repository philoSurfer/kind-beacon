/**
 * Metrics Model
 *
 * Represents Core Web Vitals metrics collected from Lighthouse.
 * Based on data-model.md "Core Web Vitals Metrics" entity.
 * Includes threshold calculation logic per Google's Core Web Vitals guidelines.
 */

/**
 * Threshold definitions per Google's Core Web Vitals
 */
export const Thresholds = {
  LCP: {
    GOOD: 2500,           // < 2500ms
    NEEDS_IMPROVEMENT: 4000  // 2500-4000ms, > 4000ms is poor
  },
  INP: {
    GOOD: 200,            // < 200ms
    NEEDS_IMPROVEMENT: 500   // 200-500ms, > 500ms is poor
  },
  CLS: {
    GOOD: 0.1,            // < 0.1
    NEEDS_IMPROVEMENT: 0.25  // 0.1-0.25, > 0.25 is poor
  },
  TTFB: {
    GOOD: 800,            // < 800ms
    NEEDS_IMPROVEMENT: 1800  // 800-1800ms, > 1800ms is poor
  }
};

/**
 * Score labels
 */
export const ScoreLabel = {
  GOOD: 'good',
  NEEDS_IMPROVEMENT: 'needs-improvement',
  POOR: 'poor'
};

/**
 * Calculates the score label for a metric based on thresholds
 *
 * @param {number} value - Metric value
 * @param {Object} threshold - Threshold object with GOOD and NEEDS_IMPROVEMENT values
 * @returns {string} - Score label ('good', 'needs-improvement', or 'poor')
 */
function calculateScore(value, threshold) {
  if (value < threshold.GOOD) {
    return ScoreLabel.GOOD;
  } else if (value < threshold.NEEDS_IMPROVEMENT) {
    return ScoreLabel.NEEDS_IMPROVEMENT;
  } else {
    return ScoreLabel.POOR;
  }
}

/**
 * Creates a Metrics object from raw metric values
 *
 * @param {Object} data - Metric values
 * @param {number} data.lcp - Largest Contentful Paint (milliseconds)
 * @param {number} [data.fid] - First Input Delay (milliseconds) - deprecated
 * @param {number} data.inp - Interaction to Next Paint (milliseconds)
 * @param {number} data.cls - Cumulative Layout Shift (unitless)
 * @param {number} data.ttfb - Time to First Byte (milliseconds)
 * @param {number} data.tbt - Total Blocking Time (milliseconds)
 * @param {number} data.performanceScore - Overall Lighthouse performance score (0-100)
 * @param {number} [data.accessibilityScore] - Accessibility score (0-100)
 * @param {number} [data.seoScore] - SEO score (0-100)
 * @param {number} [data.bestPracticesScore] - Best practices score (0-100)
 * @param {Object} [data.categoryDetails] - Detailed findings by category
 * @returns {Object} - Metrics object with calculated scores
 */
export function createMetrics(data) {
  const metrics = {
    lcp: data.lcp,
    lcpScore: calculateScore(data.lcp, Thresholds.LCP),
    fid: data.fid || null,
    inp: data.inp,
    inpScore: calculateScore(data.inp, Thresholds.INP),
    cls: data.cls,
    clsScore: calculateScore(data.cls, Thresholds.CLS),
    ttfb: data.ttfb,
    ttfbScore: calculateScore(data.ttfb, Thresholds.TTFB),
    tbt: data.tbt,
    performanceScore: data.performanceScore,
    // Extended metrics for full WCV support (feature 002)
    accessibilityScore: data.accessibilityScore,
    seoScore: data.seoScore,
    bestPracticesScore: data.bestPracticesScore,
    categoryDetails: data.categoryDetails
  };

  // Validate the metrics
  validateMetrics(metrics);

  return metrics;
}

/**
 * Validates a metrics object
 *
 * @param {Object} metrics - Metrics object to validate
 * @throws {Error} - If validation fails
 */
export function validateMetrics(metrics) {
  // Required fields
  const requiredFields = ['lcp', 'inp', 'cls', 'ttfb', 'tbt', 'performanceScore'];

  for (const field of requiredFields) {
    if (typeof metrics[field] !== 'number') {
      throw new Error(`${field} must be a number`);
    }

    if (metrics[field] < 0) {
      throw new Error(`${field} must be non-negative`);
    }
  }

  // Validate performance score range
  if (metrics.performanceScore < 0 || metrics.performanceScore > 100) {
    throw new Error('performanceScore must be between 0 and 100');
  }

  // Validate extended category scores (optional fields for feature 002)
  const categoryScoreFields = ['accessibilityScore', 'seoScore', 'bestPracticesScore'];
  for (const field of categoryScoreFields) {
    if (metrics[field] !== undefined && metrics[field] !== null) {
      if (typeof metrics[field] !== 'number') {
        throw new Error(`${field} must be a number`);
      }
      if (metrics[field] < 0 || metrics[field] > 100) {
        throw new Error(`${field} must be between 0 and 100`);
      }
    }
  }

  // Validate score labels
  const scoreFields = ['lcpScore', 'inpScore', 'clsScore', 'ttfbScore'];
  const validScores = Object.values(ScoreLabel);

  for (const field of scoreFields) {
    if (!validScores.includes(metrics[field])) {
      throw new Error(`${field} must be one of: ${validScores.join(', ')}`);
    }
  }
}

/**
 * Extracts category score from Lighthouse Result (LHR) categories object
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} categoryName - Category name ('accessibility', 'seo', 'best-practices')
 * @returns {number|undefined} - Category score (0-100) or undefined if not available
 */
export function extractCategoryScore(lhr, categoryName) {
  // HIGH FIX #6: Validate inputs
  if (!lhr || typeof lhr !== 'object') {
    throw new Error('extractCategoryScore: lhr must be a valid object');
  }
  if (!categoryName || typeof categoryName !== 'string') {
    throw new Error('extractCategoryScore: categoryName must be a non-empty string');
  }

  // Lighthouse stores category scores as 0-1, convert to 0-100
  const categoryScore = lhr.categories?.[categoryName]?.score;

  if (categoryScore === null || categoryScore === undefined) {
    return undefined;
  }

  return Math.round(categoryScore * 100);
}

/**
 * Gets audit references for a specific category from LHR
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} categoryName - Category name ('accessibility', 'seo', 'best-practices')
 * @returns {Array} - Array of audit reference objects with id and weight
 */
export function getCategoryAuditRefs(lhr, categoryName) {
  const category = lhr.categories?.[categoryName];

  if (!category || !category.auditRefs) {
    return [];
  }

  // Return audit refs (array of {id, weight, group} objects)
  return category.auditRefs;
}

/**
 * Validates a category details object
 *
 * @param {Object} categoryDetails - Category details object to validate
 * @param {string} categoryDetails.categoryName - Category name
 * @param {number} categoryDetails.score - Category score (0-100)
 * @param {Array} categoryDetails.audits - Array of audit objects
 * @throws {Error} - If validation fails
 */
export function validateCategoryDetails(categoryDetails) {
  if (!categoryDetails) {
    throw new Error('categoryDetails is required');
  }

  if (typeof categoryDetails !== 'object' || Array.isArray(categoryDetails)) {
    throw new Error('categoryDetails must be an object');
  }

  // Validate categoryName
  const validCategories = ['accessibility', 'seo', 'best-practices', 'performance'];
  if (!categoryDetails.categoryName || !validCategories.includes(categoryDetails.categoryName)) {
    throw new Error(`categoryName must be one of: ${validCategories.join(', ')}`);
  }

  // Validate score
  if (typeof categoryDetails.score !== 'number') {
    throw new Error('category score must be a number');
  }

  if (categoryDetails.score < 0 || categoryDetails.score > 100) {
    throw new Error('category score must be between 0 and 100');
  }

  // Validate audits array
  if (!Array.isArray(categoryDetails.audits)) {
    throw new Error('audits must be an array');
  }

  // Validate each audit object
  for (const audit of categoryDetails.audits) {
    if (!audit.id || typeof audit.id !== 'string') {
      throw new Error('audit.id is required and must be a string');
    }

    if (!audit.title || typeof audit.title !== 'string') {
      throw new Error('audit.title is required and must be a string');
    }

    if (audit.score !== null && audit.score !== undefined) {
      if (typeof audit.score !== 'number' || audit.score < 0 || audit.score > 1) {
        throw new Error('audit.score must be a number between 0 and 1');
      }
    }
  }
}

/**
 * Simplifies an audit object by extracting essential fields
 *
 * @param {Object} audit - Full Lighthouse audit object
 * @param {string} auditId - Audit identifier
 * @returns {Object} - Simplified audit object with essential fields
 */
export function simplifyAuditDetails(audit, auditId) {
  return {
    id: auditId,
    title: audit.title || '',
    description: audit.description || '',
    score: audit.score, // 0-1 scale (null for informational audits)
    scoreDisplayMode: audit.scoreDisplayMode || 'binary', // binary, numeric, informational, etc.
    displayValue: audit.displayValue || null,
    details: audit.details || null // Structured data (tables, lists, etc.)
  };
}

/**
 * Selects ALL audits for a category from LHR (no cap)
 * Per clarifications: extract ALL audits for comprehensive reporting (200+ audits total)
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {Array} auditRefs - Array of audit reference objects from category
 * @returns {Array} - Array of simplified audit objects
 */
export function selectAllAudits(lhr, auditRefs) {
  const audits = [];

  // Iterate through ALL audit refs (no 20-audit cap per clarifications)
  for (const ref of auditRefs) {
    const auditId = ref.id;
    const audit = lhr.audits?.[auditId];

    if (!audit) {
      continue;
    }

    // Simplify audit details for storage and display
    const simplifiedAudit = simplifyAuditDetails(audit, auditId);
    audits.push(simplifiedAudit);
  }

  return audits;
}

/**
 * Extracts category details (score + ALL audits) from LHR for a specific category
 * Per clarifications: extract ALL audits for comprehensive reporting (200+ audits total)
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} categoryName - Category name ('accessibility', 'seo', 'best-practices', 'performance')
 * @returns {Object|null} - Category details object or null if category not found
 */
export function extractCategoryDetailsFromLHR(lhr, categoryName) {
  // HIGH FIX #13: Validate inputs
  if (!lhr || typeof lhr !== 'object') {
    throw new Error('extractCategoryDetailsFromLHR: lhr must be a valid object');
  }
  if (!categoryName || typeof categoryName !== 'string') {
    throw new Error('extractCategoryDetailsFromLHR: categoryName must be a non-empty string');
  }

  const category = lhr.categories?.[categoryName];

  if (!category) {
    return null;
  }

  // Get category score (0-1 in LHR, convert to 0-100)
  const score = category.score !== null && category.score !== undefined
    ? Math.round(category.score * 100)
    : 0;

  // Get audit refs for this category
  const auditRefs = category.auditRefs || [];

  // Extract ALL audits (no cap, comprehensive reporting per clarifications)
  const audits = selectAllAudits(lhr, auditRefs);

  return {
    categoryName,
    score,
    audits
  };
}

/**
 * Extracts extended metrics (all four categories with ALL audit details) from LHR
 * Per clarifications: comprehensive reporting with ALL audits (200+ total)
 *
 * @param {Object} lhr - Lighthouse Result object
 * @returns {Object} - Extended metrics object with all category scores and details
 */
export function extractExtendedMetricsFromLHR(lhr) {
  // Extract category scores
  const accessibilityScore = extractCategoryScore(lhr, 'accessibility');
  const seoScore = extractCategoryScore(lhr, 'seo');
  const bestPracticesScore = extractCategoryScore(lhr, 'best-practices');

  // Extract category details (score + ALL audits)
  const categoryDetails = {
    accessibility: extractCategoryDetailsFromLHR(lhr, 'accessibility'),
    seo: extractCategoryDetailsFromLHR(lhr, 'seo'),
    'best-practices': extractCategoryDetailsFromLHR(lhr, 'best-practices')
  };

  // Remove null categories (in case some are missing)
  const filteredCategoryDetails = {};
  for (const [key, value] of Object.entries(categoryDetails)) {
    if (value !== null) {
      filteredCategoryDetails[key] = value;
    }
  }

  return {
    accessibilityScore,
    seoScore,
    bestPracticesScore,
    categoryDetails: filteredCategoryDetails
  };
}

/**
 * Extracts metrics from a Lighthouse Result (LHR) object
 *
 * @param {Object} lhr - Lighthouse Result object
 * @returns {Object} - Metrics object
 */
export function extractMetricsFromLHR(lhr) {
  // HIGH FIX #29: Validate that LHR has required structure
  if (!lhr || typeof lhr !== 'object') {
    throw new Error('extractMetricsFromLHR: lhr must be a valid object');
  }
  if (!lhr.audits || typeof lhr.audits !== 'object') {
    throw new Error('extractMetricsFromLHR: lhr.audits is missing or invalid');
  }

  const audits = lhr.audits;

  // Extract metric values from Lighthouse audits
  // Note: Lighthouse stores values in different formats, normalize to milliseconds
  const lcp = audits['largest-contentful-paint']?.numericValue || 0;
  const inp = audits['interaction-to-next-paint']?.numericValue ||
              audits['max-potential-fid']?.numericValue || 0; // Fallback for older Lighthouse versions
  const cls = audits['cumulative-layout-shift']?.numericValue || 0;
  const ttfb = audits['server-response-time']?.numericValue || 0;
  const tbt = audits['total-blocking-time']?.numericValue || 0;
  const fid = audits['first-input-delay']?.numericValue || null;

  // Extract performance score (0-1 in LHR, convert to 0-100)
  const performanceScore = Math.round((lhr.categories?.performance?.score || 0) * 100);

  return createMetrics({
    lcp,
    fid,
    inp,
    cls,
    ttfb,
    tbt,
    performanceScore
  });
}

/**
 * Converts metrics to a human-readable format
 *
 * @param {Object} metrics - Metrics object
 * @returns {Object} - Human-readable metrics
 */
export function metricsToHumanReadable(metrics) {
  const readable = {
    'Largest Contentful Paint (LCP)': `${(metrics.lcp / 1000).toFixed(2)}s (${metrics.lcpScore})`,
    'Interaction to Next Paint (INP)': `${metrics.inp}ms (${metrics.inpScore})`,
    'Cumulative Layout Shift (CLS)': `${metrics.cls.toFixed(3)} (${metrics.clsScore})`,
    'Time to First Byte (TTFB)': `${metrics.ttfb}ms (${metrics.ttfbScore})`,
    'Total Blocking Time (TBT)': `${metrics.tbt}ms`,
    'Performance Score': `${metrics.performanceScore}/100`
  };

  // Add extended category scores if present (feature 002)
  if (metrics.accessibilityScore !== undefined) {
    readable['Accessibility Score'] = `${metrics.accessibilityScore}/100`;
  }
  if (metrics.seoScore !== undefined) {
    readable['SEO Score'] = `${metrics.seoScore}/100`;
  }
  if (metrics.bestPracticesScore !== undefined) {
    readable['Best Practices Score'] = `${metrics.bestPracticesScore}/100`;
  }

  return readable;
}

/**
 * Checks if all Core Web Vitals metrics are "good"
 *
 * @param {Object} metrics - Metrics object
 * @returns {boolean} - True if all CWV metrics are good
 */
export function areMetricsGood(metrics) {
  return (
    metrics.lcpScore === ScoreLabel.GOOD &&
    metrics.inpScore === ScoreLabel.GOOD &&
    metrics.clsScore === ScoreLabel.GOOD
  );
}

/**
 * Counts how many metrics need improvement or are poor
 *
 * @param {Object} metrics - Metrics object
 * @returns {Object} - Count of good, needs-improvement, and poor metrics
 */
export function getMetricsCounts(metrics) {
  const scores = [
    metrics.lcpScore,
    metrics.inpScore,
    metrics.clsScore,
    metrics.ttfbScore
  ];

  return {
    good: scores.filter(s => s === ScoreLabel.GOOD).length,
    needsImprovement: scores.filter(s => s === ScoreLabel.NEEDS_IMPROVEMENT).length,
    poor: scores.filter(s => s === ScoreLabel.POOR).length
  };
}

/**
 * Converts metrics to JSON format for storage
 *
 * @param {Object} metrics - Metrics object
 * @returns {Object} - Metrics object ready for JSON serialization
 */
export function metricsToJSON(metrics) {
  return {
    metrics: {
      lcp: metrics.lcp,
      lcpScore: metrics.lcpScore,
      ...(metrics.fid !== null && { fid: metrics.fid }),
      inp: metrics.inp,
      inpScore: metrics.inpScore,
      cls: metrics.cls,
      clsScore: metrics.clsScore,
      ttfb: metrics.ttfb,
      ttfbScore: metrics.ttfbScore,
      tbt: metrics.tbt,
      performanceScore: metrics.performanceScore,
      // Extended metrics for full WCV support (feature 002)
      ...(metrics.accessibilityScore !== undefined && { accessibilityScore: metrics.accessibilityScore }),
      ...(metrics.seoScore !== undefined && { seoScore: metrics.seoScore }),
      ...(metrics.bestPracticesScore !== undefined && { bestPracticesScore: metrics.bestPracticesScore }),
      ...(metrics.categoryDetails !== undefined && { categoryDetails: metrics.categoryDetails })
    }
  };
}
