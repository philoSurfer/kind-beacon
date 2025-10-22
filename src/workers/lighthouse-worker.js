/**
 * Lighthouse Worker Script
 *
 * Worker Thread script for parallel Lighthouse audit execution.
 * Isolates Lighthouse execution to prevent blocking the main thread.
 * Enables concurrent processing of multiple URLs.
 *
 * This file is executed as a Worker Thread, not imported directly.
 */

import { parentPort, workerData } from 'worker_threads';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { extractMetricsFromLHR, extractExtendedMetricsFromLHR } from '../models/metrics.js';

/**
 * Executes a Lighthouse audit in a worker thread
 * Receives URL and options via workerData
 * Posts result back to parent thread
 */
async function runAuditInWorker() {
  const { url, options = {} } = workerData;
  let chrome = null;

  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });

    // Configure Lighthouse options
    const lighthouseOptions = {
      port: chrome.port,
      // Feature 002: Extract all four categories for full WCV support
      onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
      formFactor: options.device || 'mobile',
      screenEmulation: {
        mobile: options.device !== 'desktop',
        width: options.device === 'desktop' ? 1350 : 375,
        height: options.device === 'desktop' ? 940 : 667,
        deviceScaleFactor: options.device === 'desktop' ? 1 : 2.625,
        disabled: false
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: options.device === 'desktop' ? 1 : 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      // Timeout configuration (T020)
      maxWaitForLoad: (options.timeout || 60) * 1000
    };

    const startTime = Date.now();

    // Run Lighthouse audit
    const result = await lighthouse(url, lighthouseOptions);

    const endTime = Date.now();
    const auditDuration = endTime - startTime;

    // Extract core metrics from LHR
    const coreMetrics = extractMetricsFromLHR(result.lhr);

    // Extract extended metrics (all four categories) from LHR (Feature 002)
    const extendedMetrics = extractExtendedMetricsFromLHR(result.lhr);

    // Merge core and extended metrics
    const metrics = {
      ...coreMetrics,
      ...extendedMetrics
    };

    // Post successful result back to parent
    parentPort.postMessage({
      success: true,
      url: result.lhr.finalUrl || url,
      requestedUrl: url,
      lhr: result.lhr,
      metrics,
      auditDuration,
      lighthouseVersion: result.lhr.lighthouseVersion
    });

  } catch (error) {
    // Post error back to parent
    parentPort.postMessage({
      success: false,
      url,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack
      }
    });
  } finally {
    // Always close Chrome
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Execute the audit when worker starts
runAuditInWorker();
