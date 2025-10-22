/**
 * Report Generator Service
 *
 * Generates self-contained HTML reports from Lighthouse results.
 * Uses Lighthouse's built-in ReportGenerator to create HTML with
 * embedded CSS and JavaScript for standalone viewing.
 */

import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js';
import fs from 'fs/promises';
import path from 'path';
import { generateReportFilename } from '../lib/file-namer.js';

/**
 * CRITICAL FIX #3: Validates output path to prevent path traversal attacks
 * Ensures the resolved path is within the current working directory
 *
 * @param {string} outputPath - Path to validate
 * @returns {string} - Validated absolute path
 * @throws {Error} - If path is outside current directory
 */
function validateOutputPath(outputPath) {
  const resolved = path.resolve(outputPath);
  const cwd = process.cwd();

  // Normalize paths for comparison (handles trailing slashes, etc.)
  const normalizedResolved = path.normalize(resolved);
  const normalizedCwd = path.normalize(cwd);

  // Check if resolved path starts with current directory
  if (!normalizedResolved.startsWith(normalizedCwd + path.sep) &&
      normalizedResolved !== normalizedCwd) {
    throw new Error(
      `Security error: Output path must be within current directory.\n` +
      `Attempted path: ${outputPath}\n` +
      `Resolved to: ${resolved}\n` +
      `Current directory: ${cwd}`
    );
  }

  return resolved;
}

/**
 * HIGH FIX #17: Escapes HTML special characters to prevent XSS
 *
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);
}

/**
 * Generates an HTML report from a Lighthouse Result (LHR) object
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {Object} options - Options for report generation
 * @returns {string} - HTML report content (self-contained with embedded CSS/JS)
 *
 * @example
 * const html = await generateHtmlReport(lhr);
 * // returns: '<!DOCTYPE html><html>...' (2-3 MB self-contained HTML)
 */
export async function generateHtmlReport(lhr, options = {}) {
  // Use Lighthouse's built-in ReportGenerator
  // This generates a self-contained HTML file with all CSS/JS embedded
  const html = ReportGenerator.generateReport(lhr, 'html');
  return html;
}

/**
 * Generates an HTML error report for failed audits
 *
 * @param {Object} audit - Failed audit object from audit model
 * @returns {string} - HTML error report
 *
 * @example
 * const html = generateErrorReport({ requestedUrl: 'https://example.com', error: 'Timeout', status: 'timeout' });
 */
export function generateErrorReport(audit) {
  // HIGH FIX #17: Escape user-provided content to prevent XSS
  const escapedUrl = escapeHtml(audit.requestedUrl);
  const escapedError = escapeHtml(audit.error || 'Unknown error');
  const escapedDomain = escapeHtml(audit.domain);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Failed - ${escapedUrl}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .error-container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .error-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 20px;
    }
    h1 {
      color: #d32f2f;
      text-align: center;
      margin-bottom: 10px;
    }
    .url {
      color: #666;
      text-align: center;
      margin-bottom: 30px;
      word-break: break-all;
    }
    .error-details {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .error-details strong {
      display: block;
      margin-bottom: 5px;
      color: #856404;
    }
    .metadata {
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .metadata dt {
      font-weight: 600;
      display: inline-block;
      width: 150px;
    }
    .metadata dd {
      display: inline;
      margin: 0;
    }
    .metadata dl {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Audit Failed</h1>
    <div class="url">${escapedUrl}</div>

    <div class="error-details">
      <strong>Error:</strong>
      <p>${escapedError}</p>
    </div>

    <div class="metadata">
      <dl>
        <dt>Status:</dt>
        <dd>${escapeHtml(audit.status)}</dd>
      </dl>
      <dl>
        <dt>Timestamp:</dt>
        <dd>${escapeHtml(audit.timestamp)}</dd>
      </dl>
      <dl>
        <dt>Domain:</dt>
        <dd>${escapedDomain}</dd>
      </dl>
      <dl>
        <dt>Device Mode:</dt>
        <dd>${escapeHtml(audit.deviceMode)}</dd>
      </dl>
      <dl>
        <dt>Audit Duration:</dt>
        <dd>${Math.round(audit.auditDuration / 1000)}s</dd>
      </dl>
      ${audit.retryAttempt > 0 ? `
      <dl>
        <dt>Retry Attempt:</dt>
        <dd>${audit.retryAttempt}</dd>
      </dl>
      ` : ''}
      <dl>
        <dt>Lighthouse Version:</dt>
        <dd>${escapeHtml(audit.lighthouseVersion)}</dd>
      </dl>
    </div>
  </div>
</body>
</html>
  `;

  return html.trim();
}

/**
 * Saves an HTML report to the file system
 *
 * @param {string} html - HTML content to save
 * @param {string} outputDir - Directory to save the report (e.g., './reports')
 * @param {string} filename - Filename for the report
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await saveReport(html, './reports', 'example.com-2025-10-22-report.html');
 * // returns: '/absolute/path/to/reports/example.com-2025-10-22-report.html'
 */
export async function saveReport(html, outputDir, filename) {
  // CRITICAL FIX #3: Validate output path to prevent path traversal
  const validatedDir = validateOutputPath(outputDir);

  // Ensure output directory exists
  await fs.mkdir(validatedDir, { recursive: true });

  // Build full path
  const filePath = path.join(validatedDir, filename);

  // Write HTML to file
  await fs.writeFile(filePath, html, 'utf-8');

  return filePath;
}

/**
 * T028: Generates and saves an HTML report with timestamped filename (Feature 002)
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} requestedUrl - Original URL that was audited
 * @param {string} outputDir - Directory to save the report
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await generateAndSaveReport(lhr, 'https://example.com', './reports', 'mobile');
 */
export async function generateAndSaveReport(lhr, requestedUrl, outputDir, device = 'mobile', date = new Date()) {
  const html = await generateHtmlReport(lhr);
  const filename = generateReportFilename(requestedUrl, device, date);
  return await saveReport(html, outputDir, filename);
}

/**
 * T030: Generates and saves an error report with timestamped filename (Feature 002)
 *
 * @param {Object} audit - Failed audit object
 * @param {string} outputDir - Directory to save the report
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await generateAndSaveErrorReport(audit, './reports', 'mobile');
 */
export async function generateAndSaveErrorReport(audit, outputDir, device = 'mobile', date = new Date()) {
  const html = generateErrorReport(audit);
  const filename = generateReportFilename(audit.requestedUrl, device, date);
  return await saveReport(html, outputDir, filename);
}
