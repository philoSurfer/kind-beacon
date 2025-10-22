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
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Failed - ${audit.requestedUrl}</title>
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
    <div class="url">${audit.requestedUrl}</div>

    <div class="error-details">
      <strong>Error:</strong>
      <p>${audit.error || 'Unknown error'}</p>
    </div>

    <div class="metadata">
      <dl>
        <dt>Status:</dt>
        <dd>${audit.status}</dd>
      </dl>
      <dl>
        <dt>Timestamp:</dt>
        <dd>${audit.timestamp}</dd>
      </dl>
      <dl>
        <dt>Domain:</dt>
        <dd>${audit.domain}</dd>
      </dl>
      <dl>
        <dt>Device Mode:</dt>
        <dd>${audit.deviceMode}</dd>
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
        <dd>${audit.lighthouseVersion}</dd>
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
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Build full path
  const filePath = path.join(outputDir, filename);

  // Write HTML to file
  await fs.writeFile(filePath, html, 'utf-8');

  return filePath;
}

/**
 * Generates and saves an HTML report for a successful audit
 *
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} requestedUrl - Original URL that was audited
 * @param {string} outputDir - Directory to save the report
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await generateAndSaveReport(lhr, 'https://example.com', './reports');
 */
export async function generateAndSaveReport(lhr, requestedUrl, outputDir, date = new Date()) {
  const html = await generateHtmlReport(lhr);
  const filename = generateReportFilename(requestedUrl, date);
  return await saveReport(html, outputDir, filename);
}

/**
 * Generates and saves an error report for a failed audit
 *
 * @param {Object} audit - Failed audit object
 * @param {string} outputDir - Directory to save the report
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await generateAndSaveErrorReport(audit, './reports');
 */
export async function generateAndSaveErrorReport(audit, outputDir, date = new Date()) {
  const html = generateErrorReport(audit);
  const filename = generateReportFilename(audit.requestedUrl, date);
  return await saveReport(html, outputDir, filename);
}
