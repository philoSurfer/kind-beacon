/**
 * Audit Orchestrator Service
 *
 * Manages concurrent execution of Lighthouse audits using p-limit.
 * Implements progress tracking, error handling, and result aggregation.
 *
 * Key features:
 * - Default concurrency 3-5 per FR-013
 * - Progress tracking with logger utility
 * - Graceful error handling - continues on failure per FR-009
 * - Tracks successful vs failed audits
 */

import pLimit from 'p-limit';
import { logProgress, logSuccess, logError, logInfo, createProgressBar } from '../lib/logger.js';

/**
 * Orchestrates concurrent audits for multiple URLs
 *
 * @param {Array<string>} urls - Array of URLs to audit
 * @param {Function} auditFunction - Function that performs single audit (url, options) => Promise<result>
 * @param {Object} options - Orchestration options
 * @param {number} [options.concurrency=3] - Maximum concurrent audits (1-10)
 * @param {number} [options.timeout=60] - Timeout per audit in seconds
 * @param {string} [options.device='mobile'] - Device emulation (mobile/desktop)
 * @param {string} [options.dataDir='./data'] - Data output directory
 * @param {string} [options.reportsDir='./reports'] - Reports output directory
 *
 * @returns {Promise<Object>} - Results object with successful, failed, and summary
 *
 * @example
 * const results = await orchestrateAudits(
 *   ['https://example.com', 'https://example.org'],
 *   runLighthouseAudit,
 *   { concurrency: 3, timeout: 60, device: 'mobile' }
 * );
 * // => { successful: [...], failed: [...], summary: { ... } }
 */
export async function orchestrateAudits(urls, auditFunction, options = {}) {
  // HIGH FIX #15: Validate options at the very start before any other operations
  const concurrency = options.concurrency || 3;
  if (concurrency < 1 || concurrency > 10) {
    throw new Error(`Concurrency must be between 1 and 10 (got: ${concurrency})`);
  }

  const {
    timeout = 60,
    device = 'mobile',
    dataDir = './data',
    reportsDir = './reports',
    json = false  // T033: Support --json flag in batch mode
  } = options;

  const startTime = Date.now();
  const total = urls.length;
  const results = {
    successful: [],
    failed: [],
    summary: {
      successful: 0,
      failed: 0,
      duration: 0,
      reportsDir,
      dataDir
    }
  };

  if (total === 0) {
    logInfo('No URLs to audit');
    return results;
  }

  logInfo(`Starting audit of ${total} URL${total > 1 ? 's' : ''} with concurrency ${concurrency}`);

  // Create concurrency limiter using p-limit
  const limit = pLimit(concurrency);
  let completed = 0;

  // Create audit tasks with progress tracking
  const auditTasks = urls.map((url, index) => {
    return limit(async () => {
      const auditStartTime = Date.now();

      try {
        // Log start with clean console output
        console.log(`[${completed + 1}/${total}] Starting audit: ${url}`);

        // CRITICAL FIX #4: Wrap audit function in Promise.resolve to catch synchronous throws
        const result = await Promise.resolve(
          auditFunction(url, {
            timeout,
            device,
            dataDir,
            reportsDir,
            json  // Pass through json flag
          })
        );

        const duration = Date.now() - auditStartTime;
        completed++;

        // Log completion with clean console output
        const durationSec = Math.round(duration / 1000);
        console.log(`[${completed}/${total}] ✓ Completed: ${url} (${durationSec}s)`);

        results.successful.push({
          url,
          ...result,
          duration
        });
        results.summary.successful++;

      } catch (error) {
        completed++;

        // Log error with clean console output
        console.log(`[${completed}/${total}] ✗ Failed: ${url} - ${error.message}`);

        results.failed.push({
          url,
          error: error.message || String(error),
          timestamp: new Date().toISOString()
        });
        results.summary.failed++;
      }
    });
  });

  // Execute all audits with concurrency limit
  await Promise.all(auditTasks);

  // Calculate total duration
  results.summary.duration = Date.now() - startTime;

  return results;
}

/**
 * Validates URLs before auditing
 * Filters out invalid URLs and returns validation results
 *
 * @param {Array<string>} urls - Array of URLs to validate
 * @returns {Object} - Validation results with valid and invalid arrays
 *
 * @example
 * const { valid, invalid } = validateUrls(['https://example.com', 'not-a-url']);
 * // => { valid: ['https://example.com'], invalid: [{ url: 'not-a-url', reason: '...' }] }
 */
export function validateUrls(urls) {
  const valid = [];
  const invalid = [];

  for (const url of urls) {
    // Check if URL is empty or not a string
    if (!url || typeof url !== 'string') {
      invalid.push({
        url: url || '(empty)',
        reason: 'Empty or invalid URL'
      });
      continue;
    }

    // Check if URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      invalid.push({
        url,
        reason: 'URL must start with http:// or https://'
      });
      continue;
    }

    // Try to parse URL
    try {
      new URL(url);
      valid.push(url);
    } catch (error) {
      invalid.push({
        url,
        reason: 'Invalid URL format'
      });
    }
  }

  return { valid, invalid };
}

/**
 * Creates a summary report after all audits complete
 *
 * @param {Object} results - Results object from orchestrateAudits
 * @returns {Object} - Formatted summary
 */
export function createSummary(results) {
  const { successful, failed, summary } = results;

  // HIGH FIX #7: Prevent division by zero
  const total = successful.length + failed.length;
  const successRate = total > 0 ? (successful.length / total * 100) : 0;

  return {
    totalAudits: total,
    successful: successful.length,
    failed: failed.length,
    duration: summary.duration,
    successRate,
    reportsDir: summary.reportsDir,
    dataDir: summary.dataDir
  };
}
