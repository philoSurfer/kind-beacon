/**
 * Logger Utility
 *
 * Simple console-based logging with support for:
 * - Progress logging (e.g., "[1/50] Auditing https://example.com...")
 * - Progress bar for batch processing
 * - Error logging to stderr
 * - Support for ora spinner integration (can be added later)
 */

import cliProgress from 'cli-progress';

/**
 * Logs a progress message for an audit
 *
 * @param {number} current - Current item number (1-indexed)
 * @param {number} total - Total number of items
 * @param {string} url - URL being audited
 * @param {string} [status='processing'] - Status of the audit
 *
 * @example
 * logProgress(1, 50, 'https://example.com')
 * // outputs: [1/50] Auditing https://example.com...
 */
export function logProgress(current, total, url, status = 'processing') {
  const prefix = `[${current}/${total}]`;
  const message = status === 'processing'
    ? `${prefix} Auditing ${url}...`
    : `${prefix} ${url} - ${status}`;

  console.log(message);
}

/**
 * Logs a successful audit completion with metrics
 *
 * @param {number} current - Current item number (1-indexed)
 * @param {number} total - Total number of items
 * @param {string} url - URL that was audited
 * @param {Object} metrics - Metrics object with LCP, INP, CLS
 * @param {number} duration - Audit duration in milliseconds
 *
 * @example
 * logSuccess(1, 50, 'https://example.com', { lcp: 1800, inp: 150, cls: 0.05 }, 45230)
 * // outputs: [1/50] Auditing https://example.com... ✓ (LCP: 1.8s, INP: 150ms, CLS: 0.05) - 45s
 */
export function logSuccess(current, total, url, metrics, duration) {
  const prefix = `[${current}/${total}]`;
  const lcpSeconds = (metrics.lcp / 1000).toFixed(1);
  const durationSeconds = Math.round(duration / 1000);

  const metricsStr = `(LCP: ${lcpSeconds}s, INP: ${metrics.inp}ms, CLS: ${metrics.cls.toFixed(2)})`;
  const message = `${prefix} Auditing ${url}... ✓ ${metricsStr} - ${durationSeconds}s`;

  console.log(message);
}

/**
 * Logs an error to stderr
 *
 * @param {string} url - URL that failed
 * @param {string} error - Error message
 *
 * @example
 * logError('https://example.com', 'Network timeout after 60s')
 * // outputs to stderr: [ERROR] https://example.com - Network timeout after 60s
 */
export function logError(url, error) {
  const message = `[ERROR] ${url} - ${error}`;
  console.error(message);
}

/**
 * Logs a warning message
 *
 * @param {string} message - Warning message
 *
 * @example
 * logWarning('Invalid URL skipped: not-a-url')
 * // outputs: [WARNING] Invalid URL skipped: not-a-url
 */
export function logWarning(message) {
  console.warn(`[WARNING] ${message}`);
}

/**
 * Logs an informational message
 *
 * @param {string} message - Info message
 *
 * @example
 * logInfo('Starting audit process...')
 * // outputs: [INFO] Starting audit process...
 */
export function logInfo(message) {
  console.log(`[INFO] ${message}`);
}

/**
 * Logs a summary after all audits complete
 *
 * @param {Object} summary - Summary object
 * @param {number} summary.successful - Number of successful audits
 * @param {number} summary.failed - Number of failed audits
 * @param {number} summary.duration - Total duration in milliseconds
 * @param {string} summary.reportsDir - Directory where reports were saved
 * @param {string} summary.dataDir - Directory where data was saved
 *
 * @example
 * logSummary({ successful: 48, failed: 2, duration: 512000, reportsDir: './reports', dataDir: './data' })
 */
export function logSummary(summary) {
  console.log('\nSummary:');
  console.log(`✓ ${summary.successful} successful audits`);

  if (summary.failed > 0) {
    console.log(`✗ ${summary.failed} failed audits`);
  }

  const totalMinutes = Math.floor(summary.duration / 60000);
  const totalSeconds = Math.floor((summary.duration % 60000) / 1000);
  console.log(`⏱  Total time: ${totalMinutes}m ${totalSeconds}s`);

  if (summary.reportsDir) {
    console.log(`📊 Reports saved to: ${summary.reportsDir}`);
  }

  if (summary.dataDir) {
    console.log(`💾 Data saved to: ${summary.dataDir}`);
  }
}

/**
 * Creates a simple text-based progress indicator
 * Can be enhanced later with ora spinner integration
 *
 * @param {string} message - Message to display
 * @returns {Object} - Progress indicator object with update and stop methods
 *
 * @example
 * const spinner = createSpinner('Processing...');
 * // Do work...
 * spinner.stop('Done!');
 */
export function createSpinner(message) {
  console.log(message);

  return {
    update: (newMessage) => {
      console.log(newMessage);
    },
    stop: (finalMessage) => {
      if (finalMessage) {
        console.log(finalMessage);
      }
    },
    succeed: (successMessage) => {
      console.log(`✓ ${successMessage}`);
    },
    fail: (failMessage) => {
      console.error(`✗ ${failMessage}`);
    }
  };
}

/**
 * Clears the current line (useful for progress updates)
 * Note: This is a simple implementation; can be enhanced with ANSI escape codes
 */
export function clearLine() {
  // Simple newline for now
  // Can be enhanced with: process.stdout.clearLine(); process.stdout.cursorTo(0);
}

/**
 * Creates a progress bar for batch processing
 *
 * @param {number} total - Total number of items to process
 * @returns {Object} - Progress bar instance with update, increment, and stop methods
 *
 * @example
 * const progressBar = createProgressBar(50);
 * progressBar.start();
 * for (let i = 0; i < 50; i++) {
 *   // Do work...
 *   progressBar.increment({ url: 'https://example.com' });
 * }
 * progressBar.stop();
 */
export function createProgressBar(total) {
  const bar = new cliProgress.SingleBar({
    format: 'Progress: [{bar}] {percentage}% | {value}/{total} | ETA: {eta_formatted}\n  {url}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true,
    forceRedraw: true,
    autopadding: true,
    barsize: 30
  });

  return {
    start: () => bar.start(total, 0, { url: '' }),
    update: (current, payload = {}) => bar.update(current, payload),
    increment: (payload = {}) => bar.increment(payload),
    stop: () => bar.stop()
  };
}
