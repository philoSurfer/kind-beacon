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
    performanceScore: data.performanceScore
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
 * Extracts metrics from a Lighthouse Result (LHR) object
 *
 * @param {Object} lhr - Lighthouse Result object
 * @returns {Object} - Metrics object
 */
export function extractMetricsFromLHR(lhr) {
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
  return {
    'Largest Contentful Paint (LCP)': `${(metrics.lcp / 1000).toFixed(2)}s (${metrics.lcpScore})`,
    'Interaction to Next Paint (INP)': `${metrics.inp}ms (${metrics.inpScore})`,
    'Cumulative Layout Shift (CLS)': `${metrics.cls.toFixed(3)} (${metrics.clsScore})`,
    'Time to First Byte (TTFB)': `${metrics.ttfb}ms (${metrics.ttfbScore})`,
    'Total Blocking Time (TBT)': `${metrics.tbt}ms`,
    'Performance Score': `${metrics.performanceScore}/100`
  };
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
      performanceScore: metrics.performanceScore
    }
  };
}
