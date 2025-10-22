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
 * Saves audit data to a JSON file
 *
 * @param {Object} audit - Audit object from audit model
 * @param {Object|null} metrics - Metrics object from metrics model (null if audit failed)
 * @param {string} outputDir - Directory to save the data file (e.g., './data')
 * @param {Date} [date] - Date to use for filename (defaults to now)
 * @returns {Promise<string>} - Full path to the saved file
 *
 * @example
 * const filePath = await saveAuditData(audit, metrics, './data');
 * // returns: '/absolute/path/to/data/example.com-2025-10-22-report.json'
 */
export async function saveAuditData(audit, metrics, outputDir, date = new Date()) {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Build JSON structure per data-model.md
  const auditJson = auditToJSON(audit);
  const data = {
    ...auditJson,
    metrics: metrics ? metricsToJSON(metrics).metrics : null
  };

  // Generate filename
  const filename = generateDataFilename(audit.requestedUrl, date);
  const filePath = path.join(outputDir, filename);

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
    if (error.code === 'ENOENT') {
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
    // Filter for JSON files matching the naming pattern
    return files.filter(file => file.endsWith('-report.json'));
  } catch (error) {
    if (error.code === 'ENOENT') {
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
