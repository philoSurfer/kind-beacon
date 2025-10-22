/**
 * Data Storage Service
 *
 * Manages JSON data file persistence for historical audit tracking.
 * Writes structured audit results with metadata (timestamp, URL, domain, metrics)
 * following the naming convention: {domain}-{YYYY-MM-DD}-report.json
 */

import fs from 'fs/promises';
import path from 'path';
import { generateDataFilename } from '../lib/file-namer.js';
import { auditToJSON } from '../models/audit.js';
import { metricsToJSON } from '../models/metrics.js';

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
 * T028: Saves audit data to a JSON file with timestamped filename (Feature 002)
 *
 * @param {Object} audit - Audit object from audit model
 * @param {Object|null} metrics - Metrics object from metrics model (null if audit failed)
 * @param {string} outputDir - Directory to save the data file (e.g., './data')
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await saveAuditData(audit, metrics, './data', 'mobile');
 * // returns: '/absolute/path/to/data/example-com_2025-10-22-143052_mobile.json'
 */
export async function saveAuditData(audit, metrics, outputDir, device = 'mobile', date = new Date()) {
  // CRITICAL FIX #3: Validate output path to prevent path traversal
  const validatedDir = validateOutputPath(outputDir);

  // Ensure output directory exists
  await fs.mkdir(validatedDir, { recursive: true });

  // Build JSON structure per data-model.md
  const auditJson = auditToJSON(audit);
  const data = {
    ...auditJson,
    metrics: metrics ? metricsToJSON(metrics).metrics : null
  };

  // T028: Generate filename with timestamp and device
  const filename = generateDataFilename(audit.requestedUrl, device, date);
  const filePath = path.join(validatedDir, filename);

  // Write JSON to file with pretty formatting
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return filePath;
}

/**
 * Loads audit data from a JSON file
 *
 * @param {string} filePath - Full path to the JSON file
 * @returns {Promise<Object|null>} - Parsed audit data or null if file doesn't exist
 *
 * @example
 * const data = await loadAuditData('./data/example.com-2025-10-22-report.json');
 * // returns: { audit: {...}, metrics: {...} }
 */
export async function loadAuditData(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // HIGH FIX #12: Use optional chaining for error code check
    if (error?.code === 'ENOENT') {
      // File doesn't exist
      return null;
    }
    throw error;
  }
}

/**
 * Lists all audit data files in a directory
 *
 * @param {string} dataDir - Directory containing audit data files
 * @returns {Promise<string[]>} - Array of filenames
 *
 * @example
 * const files = await listAuditDataFiles('./data');
 * // returns: ['example.com-2025-10-22-report.json', 'another.com-2025-10-22-report.json']
 */
export async function listAuditDataFiles(dataDir) {
  try {
    const files = await fs.readdir(dataDir);
    // HIGH FIX #28: Update filter to match both old and new naming patterns
    // Old: example.com-2025-10-22-report.json
    // New: example-com_2025-10-22-143052_mobile.json
    return files.filter(file =>
      file.endsWith('-report.json') || // Old format
      file.match(/_\d{4}-\d{2}-\d{2}-\d{6}_(mobile|desktop)\.json$/) // New format
    );
  } catch (error) {
    // HIGH FIX #12: Use optional chaining for error code check
    if (error?.code === 'ENOENT') {
      // Directory doesn't exist
      return [];
    }
    throw error;
  }
}

/**
 * Loads multiple audit data files from a directory
 *
 * @param {string} dataDir - Directory containing audit data files
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.domain] - Filter by domain
 * @param {string} [filters.startDate] - Filter by start date (YYYY-MM-DD)
 * @param {string} [filters.endDate] - Filter by end date (YYYY-MM-DD)
 * @returns {Promise<Object[]>} - Array of parsed audit data
 *
 * @example
 * const audits = await loadAuditDataBatch('./data', { domain: 'example.com' });
 */
export async function loadAuditDataBatch(dataDir, filters = {}) {
  const files = await listAuditDataFiles(dataDir);

  // Apply filters
  let filteredFiles = files;
  if (filters.domain) {
    filteredFiles = filteredFiles.filter(file => file.startsWith(filters.domain));
  }
  if (filters.startDate) {
    filteredFiles = filteredFiles.filter(file => {
      const match = file.match(/(\d{4}-\d{2}-\d{2})/);
      return match && match[1] >= filters.startDate;
    });
  }
  if (filters.endDate) {
    filteredFiles = filteredFiles.filter(file => {
      const match = file.match(/(\d{4}-\d{2}-\d{2})/);
      return match && match[1] <= filters.endDate;
    });
  }

  // Load all files
  const results = await Promise.all(
    filteredFiles.map(file => loadAuditData(path.join(dataDir, file)))
  );

  // Filter out null results (files that couldn't be loaded)
  return results.filter(result => result !== null);
}

/**
 * Checks if a data file exists for a given URL and date
 *
 * @param {string} url - URL to check
 * @param {string} dataDir - Directory containing audit data files
 * @param {Date} [date] - Date to check (defaults to today)
 * @returns {Promise<boolean>} - True if file exists
 *
 * @example
 * const exists = await auditDataExists('https://example.com', './data');
 */
export async function auditDataExists(url, dataDir, date = new Date()) {
  const filename = generateDataFilename(url, date);
  const filePath = path.join(dataDir, filename);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
