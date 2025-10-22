/**
 * File Naming Utility
 *
 * Generates standardized filenames for reports and data files.
 * Format: {domain}-{YYYY-MM-DD}-report.json or .html
 * Uses domain from domain-extractor and ISO date format.
 */

import { extractDomain } from './domain-extractor.js';

/**
 * Generates a filename for a report or data file
 *
 * @param {string} url - The URL that was audited
 * @param {string} extension - File extension (e.g., 'json', 'html')
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}-{YYYY-MM-DD}-report.{extension}
 *
 * @example
 * generateFilename('https://example.com', 'json')
 * // returns 'example.com-2025-10-22-report.json'
 *
 * generateFilename('https://192.168.1.1', 'html')
 * // returns '192-168-1-1-2025-10-22-report.html'
 */
export function generateFilename(url, extension, date = new Date()) {
  const domain = extractDomain(url);

  if (!domain) {
    throw new Error(`Invalid URL: ${url}`);
  }

  const dateString = formatDateForFilename(date);

  // Remove leading dot from extension if present
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;

  return `${domain}-${dateString}-report.${ext}`;
}

/**
 * Formats a date as YYYY-MM-DD for filenames
 *
 * @param {Date} date - Date to format
 * @returns {string} - Date in YYYY-MM-DD format
 *
 * @example
 * formatDateForFilename(new Date('2025-10-22'))
 * // returns '2025-10-22'
 */
export function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Generates a JSON data filename for a given URL
 *
 * @param {string} url - The URL that was audited
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}-{YYYY-MM-DD}-report.json
 *
 * @example
 * generateDataFilename('https://example.com')
 * // returns 'example.com-2025-10-22-report.json'
 */
export function generateDataFilename(url, date = new Date()) {
  return generateFilename(url, 'json', date);
}

/**
 * Generates an HTML report filename for a given URL
 *
 * @param {string} url - The URL that was audited
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}-{YYYY-MM-DD}-report.html
 *
 * @example
 * generateReportFilename('https://example.com')
 * // returns 'example.com-2025-10-22-report.html'
 */
export function generateReportFilename(url, date = new Date()) {
  return generateFilename(url, 'html', date);
}

/**
 * Parses a report filename to extract metadata
 *
 * @param {string} filename - Filename to parse
 * @returns {Object|null} - Object with domain, date, and extension, or null if invalid
 *
 * @example
 * parseFilename('example.com-2025-10-22-report.json')
 * // returns { domain: 'example.com', date: '2025-10-22', extension: 'json' }
 */
export function parseFilename(filename) {
  // Pattern: {domain}-{YYYY-MM-DD}-report.{extension}
  const pattern = /^(.+)-(\d{4}-\d{2}-\d{2})-report\.(\w+)$/;
  const match = filename.match(pattern);

  if (!match) {
    return null;
  }

  return {
    domain: match[1],
    date: match[2],
    extension: match[3]
  };
}
