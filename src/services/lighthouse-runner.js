/**
 * Lighthouse Runner Service
 *
 * Executes Lighthouse audits programmatically using the Lighthouse Node API.
 * Handles device emulation (mobile/desktop), timeout configuration,
 * and extraction of Core Web Vitals metrics from Lighthouse results.
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pRetry, { AbortError } from 'p-retry';
import { logError } from '../lib/logger.js';
import { generateAndSaveReport, generateAndSaveErrorReport } from './report-generator.js';
import { saveAuditData } from './data-storage.js';
import { createAuditFromLighthouseResult, createFailedAudit } from '../models/audit.js';
import lighthouse from 'lighthouse';

// Get current directory for worker path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Runs Lighthouse audit in a worker thread
 * This allows parallel execution of multiple audits
 *
 * @param {string} url - URL to audit
 * @param {Object} options - Audit options
 * @param {string} [options.device='mobile'] - Device type: 'mobile' or 'desktop'
 * @param {number} [options.timeout=60] - Timeout in seconds
 * @returns {Promise<Object>} - Audit result with metrics and LHR
 */
function runLighthouseInWorker(url, options = {}) {
  return new Promise((resolve, reject) => {
    const workerPath = join(__dirname, '../workers/lighthouse-worker.js');

    const worker = new Worker(workerPath, {
      workerData: { url, options }
    });

    // Set a timeout slightly longer than Lighthouse's internal timeout
    // to allow Lighthouse to timeout gracefully first
    const workerTimeout = ((options.timeout || 60) + 10) * 1000;
    const timeoutId = setTimeout(() => {
      worker.terminate();
      reject(new AbortError(`Worker timeout after ${options.timeout || 60}s`));
    }, workerTimeout);

    worker.on('message', (result) => {
      clearTimeout(timeoutId);
      worker.terminate();

      if (result.success) {
        resolve(result);
      } else {
        // Determine if error is retryable
        const error = new Error(result.error.message);
        error.code = result.error.code;

        // Network errors are retryable
        const networkErrorCodes = [
          'ECONNREFUSED',
          'ENOTFOUND',
          'ETIMEDOUT',
          'ECONNRESET',
          'ENETUNREACH',
          'PROTOCOL_TIMEOUT'
        ];

        if (networkErrorCodes.includes(error.code)) {
          reject(error); // Will be retried by p-retry
        } else {
          // Non-network errors should not be retried
          reject(new AbortError(error.message));
        }
      }
    });

    worker.on('error', (error) => {
      clearTimeout(timeoutId);
      worker.terminate();

      // Worker errors are typically fatal
      reject(new AbortError(`Worker error: ${error.message}`));
    });

    worker.on('exit', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        reject(new AbortError(`Worker exited with code ${code}`));
      }
    });
  });
}

/**
 * Runs a Lighthouse audit with retry logic
 * Retries network errors once, fails immediately for other errors
 *
 * @param {string} url - URL to audit
 * @param {Object} options - Audit options
 * @param {string} [options.device='mobile'] - Device type: 'mobile' or 'desktop'
 * @param {number} [options.timeout=60] - Timeout in seconds
 * @returns {Promise<Object>} - Audit result
 */
export async function runLighthouseAudit(url, options = {}) {
  const { reportsDir = './reports', dataDir = './data', device = 'mobile' } = options;
  const startTime = Date.now();

  try {
    // T021: Implement retry logic using p-retry
    // Retry network errors once, fail immediately for other errors
    const result = await pRetry(
      async () => {
        return await runLighthouseInWorker(url, options);
      },
      {
        retries: 1,  // Per spec: retry once
        onFailedAttempt: (error) => {
          if (error.retriesLeft > 0) {
            logError(url, `Attempt ${error.attemptNumber} failed: ${error.message}. Retrying...`);
          }
        }
      }
    );

    // T036: Generate and save HTML report for successful audit
    // T045: Save audit data to JSON
    const auditDuration = Date.now() - startTime;

    // Create audit object
    const audit = createAuditFromLighthouseResult(
      result.requestedUrl,
      result.lhr,
      device,
      auditDuration,
      result.retryAttempt || 0
    );

    // Generate and save report + data (in parallel for efficiency)
    // Handle errors gracefully - log but don't crash if save fails
    await Promise.allSettled([
      generateAndSaveReport(result.lhr, result.requestedUrl, reportsDir)
        .catch(err => logError(url, `Failed to save report: ${err.message}`)),
      saveAuditData(audit, result.metrics, dataDir)
        .catch(err => logError(url, `Failed to save data: ${err.message}`))
    ]);

    return {
      success: true,
      url: result.url,
      requestedUrl: result.requestedUrl,
      metrics: result.metrics,
      lhr: result.lhr,
      auditDuration,
      lighthouseVersion: result.lighthouseVersion,
      retryAttempt: result.retryAttempt || 0
    };

  } catch (error) {
    // T036: Generate and save error report for failed audit
    // T045: Save failed audit data to JSON
    const auditDuration = Date.now() - startTime;

    // Determine status based on error
    const isTimeout = error.message.includes('timeout') || error.message.includes('Timeout');
    const status = isTimeout ? 'timeout' : 'failed';

    // Get Lighthouse version (fallback to package.json version)
    const lighthouseVersion = lighthouse.default?.version || '11.0.0';

    // Create failed audit object
    const failedAudit = createFailedAudit(
      url,
      error.message,
      device,
      auditDuration,
      lighthouseVersion,
      error.attemptNumber || 1,
      status
    );

    // Generate and save error report + data (in parallel)
    // Handle errors gracefully - log but don't crash if save fails
    await Promise.allSettled([
      generateAndSaveErrorReport(failedAudit, reportsDir)
        .catch(err => logError(url, `Failed to save error report: ${err.message}`)),
      saveAuditData(failedAudit, null, dataDir)
        .catch(err => logError(url, `Failed to save error data: ${err.message}`))
    ]);

    // Return error result instead of throwing
    // This allows the orchestrator to continue processing other URLs
    return {
      success: false,
      url: null,
      requestedUrl: url,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      retryAttempt: error.attemptNumber || 1
    };
  }
}

/**
 * Validates audit options
 *
 * @param {Object} options - Options to validate
 * @returns {Object} - Validated options with defaults
 */
export function validateAuditOptions(options = {}) {
  const validated = {
    device: options.device || 'mobile',
    timeout: options.timeout || 60
  };

  // Validate device
  if (!['mobile', 'desktop'].includes(validated.device)) {
    throw new Error('Device must be "mobile" or "desktop"');
  }

  // Validate timeout
  if (typeof validated.timeout !== 'number' || validated.timeout <= 0) {
    throw new Error('Timeout must be a positive number');
  }

  return validated;
}
