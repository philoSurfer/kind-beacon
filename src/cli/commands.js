/**
 * Command Implementations
 *
 * Contains the implementation for the 'audit' command and other CLI commands.
 * Orchestrates the workflow: CSV reading -> Lighthouse execution -> Report generation.
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { readCsv } from '../services/csv-reader.js';
import { runLighthouseAudit } from '../services/lighthouse-runner.js';
import { orchestrateAudits, validateUrls } from '../services/audit-orchestrator.js';
import { logInfo, logWarning, logSummary } from '../lib/logger.js';

/**
 * Validates CLI options
 *
 * @param {Object} options - CLI options to validate
 * @throws {Error} - If validation fails
 */
function validateOptions(options) {
  // Parse string values to numbers
  const concurrency = parseInt(options.concurrency, 10);
  const timeout = parseInt(options.timeout, 10);

  // Validate concurrency (1-10)
  if (isNaN(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new Error(
      `Concurrency must be between 1 and 10 (got: ${options.concurrency})\n\n` +
      `Use: kind-beacon audit urls.csv --concurrency 5`
    );
  }

  // Validate timeout (> 0)
  if (isNaN(timeout) || timeout <= 0) {
    throw new Error(
      `Timeout must be greater than 0 (got: ${options.timeout})\n\n` +
      `Use: kind-beacon audit urls.csv --timeout 60`
    );
  }

  // Validate device (mobile or desktop)
  const device = options.device.toLowerCase();
  if (device !== 'mobile' && device !== 'desktop') {
    throw new Error(
      `Device must be 'mobile' or 'desktop' (got: ${options.device})\n\n` +
      `Use: kind-beacon audit urls.csv --device mobile`
    );
  }

  return {
    ...options,
    concurrency,
    timeout,
    device
  };
}

/**
 * Audit command implementation
 *
 * @param {string} csvPath - Path to CSV file
 * @param {Object} options - Command options
 */
export async function auditCommand(csvPath, options) {
  try {
    // Validate options
    const validatedOptions = validateOptions(options);

    // Check if CSV file exists
    const absoluteCsvPath = resolve(csvPath);
    if (!existsSync(absoluteCsvPath)) {
      console.error(`\nError: CSV file not found: ${csvPath}`);
      console.error('\nUsage: kind-beacon audit <csv-file>');
      console.error('\nMake sure the file exists and the path is correct.\n');
      process.exit(3); // Exit code 3: CSV file not found
    }

    logInfo(`Reading URLs from ${csvPath}...`);

    // Read CSV file
    const csvResult = await readCsv(absoluteCsvPath);

    if (!csvResult.urls || csvResult.urls.length === 0) {
      console.error('\nError: No valid URLs found in CSV file.');
      console.error('Make sure the CSV contains URLs starting with http:// or https://\n');
      process.exit(3); // Exit code 3: Invalid input file
    }

    // Validate URLs
    const { valid, invalid } = validateUrls(csvResult.urls);

    // Log invalid URLs as warnings
    if (invalid.length > 0) {
      invalid.forEach(({ url, reason }) => {
        logWarning(`Skipping invalid URL: ${url} - ${reason}`);
      });
    }

    if (valid.length === 0) {
      console.error('\nError: No valid URLs to audit after validation.\n');
      process.exit(3);
    }

    logInfo(`Found ${valid.length} valid URL${valid.length > 1 ? 's' : ''} to audit`);

    // Run audits with orchestrator
    const results = await orchestrateAudits(
      valid,
      runLighthouseAudit,
      validatedOptions
    );

    // Log summary
    logSummary(results.summary);

    // Set exit code based on results
    if (results.summary.failed > 0) {
      process.exit(1); // Exit code 1: Some audits failed
    } else {
      process.exit(0); // Exit code 0: All successful
    }

  } catch (error) {
    // Re-throw validation errors and other errors to be caught by CLI
    throw error;
  }
}
